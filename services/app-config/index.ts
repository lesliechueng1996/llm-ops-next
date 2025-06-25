/**
 * 应用配置服务模块
 *
 * 该模块负责处理应用配置相关的功能，包括：
 * - 验证和处理工具配置（内置工具和API工具）
 * - 验证和处理数据集配置
 * - 获取和更新草稿应用配置
 * - 配置数据的转换和验证
 * - 将工具配置转换为LangChain工具实例
 */

import { NotFoundException } from '@/exceptions';
import { db } from '@/lib/db';
import {
  apiTool,
  apiToolProvider,
  app,
  appConfig,
  appConfigVersion,
  appDatasetJoin,
  dataset,
} from '@/lib/db/schema';
import {
  AppConfigType,
  AppStatus,
  type DraftAppConfig,
  type ModelConfig,
} from '@/lib/entity';
import { log } from '@/lib/logger';
import { calculatePagination, paginationResult } from '@/lib/paginator';
import { getBuiltinTool, getBuiltinToolProvider } from '@/lib/tools';
import { createApiTool } from '@/lib/tools/api-tool';
import type {
  GetAppPublishHistoriesReq,
  UpdateDraftAppConfigReq,
} from '@/schemas/app-schema';
import { getAppOrThrow } from '@/services/app';
import type { StructuredTool } from '@langchain/core/tools';
import { and, count, desc, eq, inArray, max } from 'drizzle-orm';
import { isEqual } from 'es-toolkit';

/**
 * 验证和处理工具配置
 *
 * 该函数处理应用配置中的工具列表，包括内置工具和API工具：
 * - 验证工具提供者和工具是否存在
 * - 验证工具参数是否匹配
 * - 为缺失的参数设置默认值
 * - 返回验证后的工具配置和详细的工具信息
 *
 * @param originalTools - 原始工具配置列表，包含工具类型、提供者ID、工具ID和参数
 * @returns 包含验证工具列表和工具详情列表的对象
 *   - validateTools: 验证后的工具配置，用于数据库存储
 *   - tools: 详细的工具信息，包含提供者和工具的完整信息
 */
const processValidateTools = async (originalTools: DraftAppConfig['tools']) => {
  const validateTools = [];
  const tools = [];
  log.info('Start to process validate tools');

  // 遍历每个工具配置进行验证
  for (const tool of originalTools) {
    log.info(
      `Start to process tool: ${tool.type} ${tool.providerId} ${tool.toolId}`,
    );

    // 处理内置工具
    if (tool.type === 'builtin_tool') {
      // 验证内置工具提供者是否存在
      const toolProvider = getBuiltinToolProvider(tool.providerId);
      if (!toolProvider) {
        log.warn(`Builtin tool provider not found: ${tool.providerId}`);
        continue;
      }

      // 验证内置工具是否存在
      const toolEntity = getBuiltinTool(toolProvider, tool.toolId);
      if (!toolEntity) {
        log.warn(`Builtin tool not found: ${tool.toolId}`);
        continue;
      }

      // 验证工具参数是否匹配
      const toolParamNames = new Set(
        toolEntity.params.map((param) => param.name),
      );
      const inputToolParamNames = new Set(Object.keys(tool.params));
      const diff = inputToolParamNames.difference(toolParamNames);

      let params = tool.params;
      // 如果参数不匹配，使用默认参数
      if (diff.size > 0) {
        log.warn(`Builtin tool params not match: ${tool.toolId} ${diff.size}`);
        params = toolEntity.params.reduce(
          (pre, curr) => {
            if (curr.default !== null && curr.default !== undefined) {
              return Object.assign({}, pre, {
                [curr.name]: curr.default,
              });
            }
            return pre;
          },
          {} as Record<string, unknown>,
        );
      }

      // 添加到验证工具列表
      validateTools.push({
        ...tool,
        params,
      });

      // 添加到详细工具信息列表
      tools.push({
        type: 'builtin_tool',
        provider: {
          id: toolProvider.name,
          name: toolProvider.name,
          label: toolProvider.label,
          icon: toolProvider.icon,
          description: toolProvider.description,
        },
        tool: {
          id: toolEntity.name,
          name: toolEntity.name,
          label: toolEntity.label,
          description: toolEntity.description,
          params,
        },
      });
    }

    // 处理API工具
    if (tool.type === 'api_tool') {
      log.info(`Start to process api tool: ${tool.providerId} ${tool.toolId}`);

      // 从数据库查询API工具记录
      const toolRecords = await db
        .select()
        .from(apiTool)
        .where(
          and(
            eq(apiTool.providerId, tool.providerId),
            eq(apiTool.id, tool.toolId),
          ),
        );

      if (toolRecords.length === 0) {
        log.warn(`Api tool not found: ${tool.toolId}`);
        continue;
      }

      const toolEntity = toolRecords[0];

      // 从数据库查询API工具提供者记录
      const toolProviderRecords = await db
        .select()
        .from(apiToolProvider)
        .where(eq(apiToolProvider.id, toolEntity.providerId));

      if (toolProviderRecords.length === 0) {
        log.warn(`Api tool provider not found: ${tool.providerId}`);
        continue;
      }

      const toolProvider = toolProviderRecords[0];

      // 添加到验证工具列表
      validateTools.push(tool);

      // 添加到详细工具信息列表
      tools.push({
        type: 'api_tool',
        provider: {
          id: toolProvider.id,
          name: toolProvider.name,
          label: toolProvider.name,
          icon: toolProvider.icon,
          description: toolProvider.description,
        },
        tool: {
          id: toolEntity.id,
          name: toolEntity.name,
          label: toolEntity.name,
          description: toolEntity.description,
          params: {},
        },
      });
    }
  }

  return {
    validateTools,
    tools,
  };
};

/**
 * 验证和处理数据集配置
 *
 * 该函数验证应用配置中的数据集ID列表：
 * - 检查数据集是否存在于数据库中
 * - 过滤掉不存在的数据集ID
 * - 返回验证后的数据集ID列表和详细的数据集信息
 *
 * @param originalDatasets - 原始数据集ID列表
 * @returns 包含验证数据集ID列表和数据集详情列表的对象
 *   - validateDatasets: 验证后的数据集ID列表
 *   - datasets: 详细的数据集信息，包含ID、名称、图标和描述
 */
const processValidateDatasets = async (
  originalDatasets: DraftAppConfig['datasets'],
) => {
  const datasets = [];
  log.info('Start to process validate datasets');

  // 从数据库批量查询数据集记录
  const datasetRecords = await db
    .select()
    .from(dataset)
    .where(inArray(dataset.id, originalDatasets));

  // 创建数据集ID集合用于快速查找
  const datasetIdSet = new Set(datasetRecords.map((record) => record.id));

  // 过滤出存在的数据集ID
  const validateDatasets = originalDatasets.filter((datasetId) =>
    datasetIdSet.has(datasetId),
  );

  // 构建详细的数据集信息列表
  for (const datasetId of validateDatasets) {
    const datasetRecord = datasetRecords.find(
      (record) => record.id === datasetId,
    );
    if (!datasetRecord) {
      log.warn(`Dataset not found: ${datasetId}`);
      continue;
    }
    datasets.push({
      id: datasetRecord.id,
      name: datasetRecord.name,
      icon: datasetRecord.icon,
      description: datasetRecord.description,
    });
  }

  return {
    validateDatasets,
    datasets,
  };
};

/**
 * 转换应用配置数据格式
 *
 * 该函数将数据库中的应用配置版本记录转换为前端可用的格式：
 * - 合并工具、数据集和工作流信息
 * - 转换时间戳格式
 * - 返回完整的应用配置对象
 *
 * @param appConfig - 应用配置版本记录，来自数据库
 * @param tools - 处理后的工具详情列表
 * @param datasets - 处理后的数据集详情列表
 * @param workflows - 工作流配置
 * @returns 转换后的应用配置对象，包含所有配置信息和时间戳
 */
const processTransformAppConfig = (
  appConfig: typeof appConfigVersion.$inferSelect,
  tools: Awaited<ReturnType<typeof processValidateTools>>['tools'],
  datasets: Awaited<ReturnType<typeof processValidateDatasets>>['datasets'],
  workflows: unknown,
) => {
  return {
    id: appConfig.id,
    modelConfig: appConfig.modelConfig,
    dialogRound: appConfig.dialogRound,
    presetPrompt: appConfig.presetPrompt,
    tools: tools,
    datasets: datasets,
    workflows: workflows,
    retrievalConfig: appConfig.retrievalConfig,
    longTermMemory: appConfig.longTermMemory,
    openingStatement: appConfig.openingStatement,
    openingQuestions: appConfig.openingQuestions,
    speechToText: appConfig.speechToText,
    textToSpeech: appConfig.textToSpeech,
    suggestedAfterAnswer: appConfig.suggestedAfterAnswer,
    reviewConfig: appConfig.reviewConfig,
    createdAt: appConfig.createdAt.getTime(),
    updatedAt: appConfig.updatedAt.getTime(),
  } as Omit<DraftAppConfig, 'tools' | 'datasets' | 'workflows'> & {
    id: string;
    tools: typeof tools;
    datasets: typeof datasets;
    workflows: typeof workflows;
    createdAt: number;
    updatedAt: number;
  };
};

/**
 * 从数据库获取草稿应用配置，如果不存在则抛出异常
 *
 * 该函数根据应用记录获取对应的草稿配置：
 * - 检查应用是否有草稿配置ID
 * - 从数据库查询草稿配置记录
 * - 验证配置类型是否为草稿类型
 *
 * @param appRecord - 应用记录，包含草稿配置ID
 * @throws {NotFoundException} 当草稿配置不存在时抛出异常
 * @returns 草稿应用配置记录
 */
export const getDraftAppConfigFromDBOrThrow = async (
  appRecord: typeof app.$inferSelect,
) => {
  const draftAppConfigId = appRecord.draftAppConfigId;
  if (!draftAppConfigId) {
    throw new NotFoundException('草稿应用配置不存在');
  }

  // 查询草稿配置记录
  const appConfigVersionRecords = await db
    .select()
    .from(appConfigVersion)
    .where(
      and(
        eq(appConfigVersion.id, draftAppConfigId),
        eq(appConfigVersion.configType, AppConfigType.DRAFT),
      ),
    );

  if (appConfigVersionRecords.length === 0) {
    throw new NotFoundException('草稿应用配置不存在');
  }

  return appConfigVersionRecords[0] as typeof appConfigVersion.$inferSelect &
    DraftAppConfig;
};

/**
 * 获取应用草稿配置
 *
 * 该函数获取应用的草稿配置并进行验证：
 * - 验证应用权限
 * - 获取草稿配置记录
 * - 验证工具和数据集配置
 * - 如果验证结果与存储的配置不一致，则更新数据库
 * - 返回处理后的完整配置
 *
 * @param appId - 应用ID
 * @param userId - 用户ID，用于权限验证
 * @returns 处理后的应用草稿配置，包含验证后的工具和数据集信息
 */
export const getDraftAppConfig = async (appId: string, userId: string) => {
  // 获取应用记录并验证权限
  const appRecord = await getAppOrThrow(appId, userId);
  const draftAppConfig = await getDraftAppConfigFromDBOrThrow(appRecord);

  // 验证工具配置
  const { validateTools, tools } = await processValidateTools(
    draftAppConfig.tools,
  );

  // 如果验证结果与存储的配置不一致，更新数据库
  if (!isEqual(validateTools, draftAppConfig.tools)) {
    log.warn('Validate tools not match');
    await db
      .update(appConfigVersion)
      .set({
        tools: validateTools,
      })
      .where(eq(appConfigVersion.id, draftAppConfig.id));
  }

  // 验证数据集配置
  const { validateDatasets, datasets } = await processValidateDatasets(
    draftAppConfig.datasets,
  );

  // 如果验证结果与存储的配置不一致，更新数据库
  if (!isEqual(validateDatasets, draftAppConfig.datasets)) {
    log.warn('Validate datasets not match');
    await db
      .update(appConfigVersion)
      .set({
        datasets: validateDatasets,
      })
      .where(eq(appConfigVersion.id, draftAppConfig.id));
  }

  // TODO: validate workflows

  // 返回转换后的完整配置
  return processTransformAppConfig(
    draftAppConfig,
    tools,
    datasets,
    draftAppConfig.workflows,
  );
};

/**
 * 验证草稿应用配置
 *
 * 该函数对草稿应用配置进行全面的验证和清理：
 * - 并行验证工具配置，确保所有工具都存在且参数正确
 * - 并行验证数据集配置，过滤掉不存在的数据集
 * - 记录验证过程的详细日志信息
 * - 返回验证后的完整配置对象
 *
 * @param config - 待验证的草稿应用配置
 * @returns 验证后的草稿应用配置，包含清理后的工具和数据集列表
 */
export const validateDraftAppConfig = async (config: DraftAppConfig) => {
  // 并行验证工具和数据集配置以提高性能
  const [{ validateTools }, { validateDatasets }] = await Promise.all([
    processValidateTools(config.tools),
    processValidateDatasets(config.datasets),
  ]);

  log.info('Validate tools: %o', validateTools);
  log.info('Validate datasets: %o', validateDatasets);
  // TODO: validate workflows

  // 构建新的草稿配置对象，使用验证后的数据
  const newDraftAppConfig: DraftAppConfig = {
    ...config,
    tools: validateTools,
    datasets: validateDatasets,
    // TODO: Zod issue https://github.com/colinhacks/zod/issues/3730
    modelConfig: config.modelConfig as ModelConfig,
    workflows: config.workflows,
  };
  log.info('New draft app config: %o', newDraftAppConfig);

  return newDraftAppConfig;
};

/**
 * 更新应用草稿配置
 *
 * 该函数更新应用的草稿配置：
 * - 验证应用权限
 * - 验证工具和数据集配置
 * - 更新数据库中的草稿配置
 *
 * @param appId - 应用ID
 * @param userId - 用户ID，用于权限验证
 * @param req - 更新请求数据，包含新的配置信息
 * @throws {NotFoundException} 当草稿配置不存在时抛出异常
 */
export const updateDraftAppConfig = async (
  appId: string,
  userId: string,
  req: UpdateDraftAppConfigReq,
) => {
  // 获取应用记录并验证权限
  const appRecord = await getAppOrThrow(appId, userId);
  const draftAppConfigId = appRecord.draftAppConfigId;

  if (!draftAppConfigId) {
    log.warn('Draft app config not found');
    throw new NotFoundException('草稿应用配置不存在');
  }

  // TODO: Zod issue https://github.com/colinhacks/zod/issues/3730
  const newDraftAppConfig = await validateDraftAppConfig({
    ...req,
    modelConfig: req.modelConfig as ModelConfig,
    workflows: req.workflows,
  });
  // 更新数据库中的草稿配置
  await db
    .update(appConfigVersion)
    .set({
      ...newDraftAppConfig,
    })
    .where(eq(appConfigVersion.id, draftAppConfigId));
};

/**
 * 根据工具配置获取LangChain工具实例
 *
 * 该函数将应用配置中的工具配置转换为LangChain可用的工具实例：
 * - 处理内置工具：获取工具函数并传入参数
 * - 处理API工具：从数据库获取工具信息并创建API工具实例
 * - 返回LangChain工具数组，可直接用于AI对话
 *
 * @param toolConfig - 工具配置列表，包含工具类型、提供者、工具和参数信息
 * @param userId - 用户ID，用于查询用户特定的API工具
 * @returns LangChain工具数组，可直接用于AI对话系统
 */
export const getLangchainToolsByToolConfig = async (
  toolConfig: ReturnType<typeof processTransformAppConfig>['tools'],
  userId: string,
) => {
  const tools: StructuredTool[] = [];

  // 遍历每个工具配置
  for (const tool of toolConfig) {
    // 处理内置工具
    if (tool.type === 'builtin_tool') {
      // 获取内置工具提供者
      const toolProvider = getBuiltinToolProvider(tool.provider.id);
      if (!toolProvider) {
        log.warn(`Builtin tool provider not found: ${tool.provider.id}`);
        continue;
      }

      // 获取内置工具实体
      const toolEntity = getBuiltinTool(toolProvider, tool.tool.id);
      if (!toolEntity) {
        log.warn(`Builtin tool not found: ${tool.tool.id}`);
        continue;
      }

      // 创建工具函数实例并添加到工具列表
      const toolFn = toolEntity.fn;
      tools.push(toolFn(tool.tool.params));
    }

    // 处理API工具
    if (tool.type === 'api_tool') {
      // 并行查询API工具和提供者记录
      const apiToolQuery = db
        .select()
        .from(apiTool)
        .where(and(eq(apiTool.userId, userId), eq(apiTool.id, tool.tool.id)));

      const apiToolProviderQuery = db
        .select()
        .from(apiToolProvider)
        .where(eq(apiToolProvider.id, tool.provider.id));

      const [apiToolRecords, apiToolProviderRecords] = await Promise.all([
        apiToolQuery,
        apiToolProviderQuery,
      ]);

      // 验证API工具和提供者是否存在
      if (apiToolRecords.length === 0) {
        log.warn(`Api tool not found: ${tool.tool.id}`);
        continue;
      }
      if (apiToolProviderRecords.length === 0) {
        log.warn(`Api tool provider not found: ${tool.provider.id}`);
        continue;
      }

      // 创建API工具实例并添加到工具列表
      const apiToolRecord = apiToolRecords[0];
      const apiToolProviderRecord = apiToolProviderRecords[0];
      const toolFn = createApiTool(apiToolRecord, apiToolProviderRecord);
      tools.push(toolFn);
    }
  }

  return tools;
};

/**
 * 发布应用配置
 *
 * 该函数将草稿配置发布为正式配置，涉及复杂的数据库事务操作：
 * - 获取并验证草稿配置
 * - 在事务中创建新的应用配置记录
 * - 更新应用状态为已发布
 * - 清理并重新建立应用与数据集的关联关系
 * - 创建新的配置版本记录，版本号自动递增
 *
 * @param appId - 应用ID
 * @param userId - 用户ID，用于权限验证
 * @throws {NotFoundException} 当草稿配置不存在时抛出异常
 */
export const publishAppConfig = async (appId: string, userId: string) => {
  // 获取并验证草稿配置
  const draftAppConfig = await getDraftAppConfig(appId, userId);

  // 使用数据库事务确保数据一致性
  await db.transaction(async (tx) => {
    // 创建新的应用配置记录
    const appConfigRecords = await tx
      .insert(appConfig)
      .values({
        appId,
        modelConfig: draftAppConfig.modelConfig,
        dialogRound: draftAppConfig.dialogRound,
        presetPrompt: draftAppConfig.presetPrompt,
        // 转换工具配置格式以适配数据库结构
        tools: draftAppConfig.tools.map((toolItem) => ({
          type: toolItem.type,
          providerId: toolItem.provider.id,
          toolId: toolItem.tool.id,
          params: toolItem.tool.params,
        })),
        workflows: draftAppConfig.workflows,
        retrievalConfig: draftAppConfig.retrievalConfig,
        longTermMemory: draftAppConfig.longTermMemory,
        openingStatement: draftAppConfig.openingStatement,
        openingQuestions: draftAppConfig.openingQuestions,
        speechToText: draftAppConfig.speechToText,
        textToSpeech: draftAppConfig.textToSpeech,
        suggestedAfterAnswer: draftAppConfig.suggestedAfterAnswer,
        reviewConfig: draftAppConfig.reviewConfig,
      })
      .returning();
    const appConfigRecord = appConfigRecords[0];

    // 更新应用状态为已发布
    await tx
      .update(app)
      .set({
        appConfigId: appConfigRecord.id,
        status: AppStatus.PUBLISHED,
      })
      .where(eq(app.id, appId));

    // 清理并重新建立应用与数据集的关联关系
    await tx.delete(appDatasetJoin).where(eq(appDatasetJoin.appId, appId));
    await tx.insert(appDatasetJoin).values(
      draftAppConfig.datasets.map((datasetItem) => ({
        appId,
        datasetId: datasetItem.id,
      })),
    );

    // 获取草稿配置的详细信息用于创建版本记录
    const dbDraftAppConfigs = await tx
      .select()
      .from(appConfigVersion)
      .where(eq(appConfigVersion.id, draftAppConfig.id));

    // 查询当前最大版本号，新版本号 = 最大版本号 + 1
    const maxVersionRecords = await tx
      .select({
        maxVersion: max(appConfigVersion.version),
      })
      .from(appConfigVersion)
      .where(
        and(
          eq(appConfigVersion.appId, appId),
          eq(appConfigVersion.configType, AppConfigType.PUBLISHED),
        ),
      );

    const maxVersion = maxVersionRecords[0]?.maxVersion ?? 0;

    // 创建新的配置版本记录
    await tx.insert(appConfigVersion).values({
      appId,
      modelConfig: dbDraftAppConfigs[0].modelConfig,
      dialogRound: dbDraftAppConfigs[0].dialogRound,
      presetPrompt: dbDraftAppConfigs[0].presetPrompt,
      tools: dbDraftAppConfigs[0].tools,
      datasets: dbDraftAppConfigs[0].datasets,
      workflows: dbDraftAppConfigs[0].workflows,
      retrievalConfig: dbDraftAppConfigs[0].retrievalConfig,
      longTermMemory: dbDraftAppConfigs[0].longTermMemory,
      openingStatement: dbDraftAppConfigs[0].openingStatement,
      openingQuestions: dbDraftAppConfigs[0].openingQuestions,
      speechToText: dbDraftAppConfigs[0].speechToText,
      textToSpeech: dbDraftAppConfigs[0].textToSpeech,
      suggestedAfterAnswer: dbDraftAppConfigs[0].suggestedAfterAnswer,
      reviewConfig: dbDraftAppConfigs[0].reviewConfig,
      version: maxVersion + 1,
      configType: AppConfigType.PUBLISHED,
    });
  });
};

/**
 * 分页获取应用发布历史
 *
 * 该函数提供应用配置发布历史的分页查询功能：
 * - 验证用户对应用的访问权限
 * - 查询已发布的配置版本记录
 * - 按版本号降序排列，最新版本在前
 * - 支持分页查询，返回总数和当前页数据
 * - 格式化返回数据，包含版本信息和创建时间
 *
 * @param appId - 应用ID
 * @param userId - 用户ID，用于权限验证
 * @param query - 分页查询参数，包含页码和每页数量
 * @returns 分页结果，包含发布历史列表和总数信息
 */
export const getAppPublishHistoriesByPage = async (
  appId: string,
  userId: string,
  query: GetAppPublishHistoriesReq,
) => {
  // 验证用户对应用的访问权限
  await getAppOrThrow(appId, userId);
  const { offset, limit } = calculatePagination(query);

  // 构建列表查询：获取已发布的配置版本记录
  const listQuery = db
    .select()
    .from(appConfigVersion)
    .where(
      and(
        eq(appConfigVersion.appId, appId),
        eq(appConfigVersion.configType, AppConfigType.PUBLISHED),
      ),
    )
    .orderBy(desc(appConfigVersion.version)) // 按版本号降序排列
    .limit(limit)
    .offset(offset);

  // 构建计数查询：获取总记录数
  const countQuery = db
    .select({
      count: count(),
    })
    .from(appConfigVersion)
    .where(
      and(
        eq(appConfigVersion.appId, appId),
        eq(appConfigVersion.configType, AppConfigType.PUBLISHED),
      ),
    );

  // 并行执行列表查询和计数查询
  const [list, historyCount] = await Promise.all([listQuery, countQuery]);

  // 格式化返回数据，只包含必要的字段
  const formattedList = list.map((item) => ({
    id: item.id,
    version: item.version,
    createdAt: item.createdAt,
  }));

  return paginationResult(formattedList, historyCount[0].count, query);
};

/**
 * 回滚应用配置到指定版本
 *
 * 该函数允许将应用的草稿配置回滚到指定的已发布版本：
 * - 验证用户权限和草稿配置的存在性
 * - 查询指定的配置版本记录
 * - 验证版本记录的有效性和权限
 * - 将指定版本的内容复制到草稿配置中
 * - 对回滚的配置进行验证和清理
 *
 * @param appId - 应用ID
 * @param userId - 用户ID，用于权限验证
 * @param appConfigVersionId - 要回滚到的配置版本ID
 * @throws {NotFoundException} 当草稿配置或指定版本不存在时抛出异常
 */
export const fallbackAppConfig = async (
  appId: string,
  userId: string,
  appConfigVersionId: string,
) => {
  // 验证用户权限和草稿配置的存在性
  const appRecord = await getAppOrThrow(appId, userId);

  if (!appRecord.draftAppConfigId) {
    throw new NotFoundException('草稿应用配置不存在');
  }

  // 查询指定的配置版本记录，确保版本存在且属于当前应用
  const appConfigVersionRecords = await db
    .select()
    .from(appConfigVersion)
    .where(
      and(
        eq(appConfigVersion.id, appConfigVersionId),
        eq(appConfigVersion.appId, appId),
        eq(appConfigVersion.configType, AppConfigType.PUBLISHED),
      ),
    );

  if (appConfigVersionRecords.length === 0) {
    throw new NotFoundException('应用配置版本不存在');
  }

  // 将指定版本的内容复制到草稿配置中，并进行验证
  const appConfigVersionRecord = appConfigVersionRecords[0];
  const newDraftAppConfig = await validateDraftAppConfig(
    appConfigVersionRecord as DraftAppConfig,
  );

  // 更新草稿配置记录
  await db
    .update(appConfigVersion)
    .set({
      ...newDraftAppConfig,
    })
    .where(eq(appConfigVersion.id, appRecord.draftAppConfigId));
};
