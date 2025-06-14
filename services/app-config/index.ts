/**
 * 应用配置服务模块
 *
 * 该模块负责处理应用配置相关的功能，包括：
 * - 验证和处理工具配置（内置工具和API工具）
 * - 验证和处理数据集配置
 * - 获取和更新草稿应用配置
 * - 配置数据的转换和验证
 */

import { NotFoundException } from '@/exceptions';
import { db } from '@/lib/db';
import {
  apiTool,
  apiToolProvider,
  type app,
  appConfigVersion,
  dataset,
} from '@/lib/db/schema';
import { AppConfigType, type DraftAppConfig } from '@/lib/entity';
import { log } from '@/lib/logger';
import { getBuiltinTool, getBuiltinToolProvider } from '@/lib/tools';
import type { UpdateDraftAppConfigReq } from '@/schemas/app-schema';
import { getAppOrThrow } from '@/services/app';
import { and, eq, inArray } from 'drizzle-orm';
import { isEqual } from 'es-toolkit';

/**
 * 验证和处理工具配置
 * @param originalTools - 原始工具配置列表
 * @returns 处理后的验证工具列表和工具详情列表
 */
const processValidateTools = async (originalTools: DraftAppConfig['tools']) => {
  const validateTools = [];
  const tools = [];
  log.info('Start to process validate tools');
  for (const tool of originalTools) {
    log.info(
      `Start to process tool: ${tool.type} ${tool.providerId} ${tool.toolId}`,
    );
    if (tool.type === 'builtin_tool') {
      const toolProvider = getBuiltinToolProvider(tool.providerId);
      if (!toolProvider) {
        log.warn(`Builtin tool provider not found: ${tool.providerId}`);
        continue;
      }
      const toolEntity = getBuiltinTool(toolProvider, tool.toolId);
      if (!toolEntity) {
        log.warn(`Builtin tool not found: ${tool.toolId}`);
        continue;
      }
      const toolParamNames = new Set(
        toolEntity.params.map((param) => param.name),
      );
      const inputToolParamNames = new Set(Object.keys(tool.params));
      const diff = inputToolParamNames.difference(toolParamNames);
      let params = tool.params;
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
      validateTools.push({
        ...tool,
        params,
      });
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
    if (tool.type === 'api_tool') {
      log.info(`Start to process api tool: ${tool.providerId} ${tool.toolId}`);
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
      const toolProviderRecords = await db
        .select()
        .from(apiToolProvider)
        .where(eq(apiToolProvider.id, toolEntity.providerId));

      if (toolProviderRecords.length === 0) {
        log.warn(`Api tool provider not found: ${tool.providerId}`);
        continue;
      }
      const toolProvider = toolProviderRecords[0];
      validateTools.push(tool);
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
 * @param originalDatasets - 原始数据集ID列表
 * @returns 处理后的验证数据集ID列表和数据集详情列表
 */
const processValidateDatasets = async (
  originalDatasets: DraftAppConfig['datasets'],
) => {
  const datasets = [];
  log.info('Start to process validate datasets');
  const datasetRecords = await db
    .select()
    .from(dataset)
    .where(inArray(dataset.id, originalDatasets));
  const datasetIdSet = new Set(datasetRecords.map((record) => record.id));
  const validateDatasets = originalDatasets.filter((datasetId) =>
    datasetIdSet.has(datasetId),
  );

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
 * @param appConfig - 应用配置版本记录
 * @param tools - 处理后的工具详情列表
 * @param datasets - 处理后的数据集详情列表
 * @param workflows - 工作流配置
 * @returns 转换后的应用配置对象
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
 * @param appRecord - 应用记录
 * @throws {NotFoundException} 当草稿配置不存在时抛出
 * @returns 草稿应用配置记录
 */
export const getDraftAppConfigFromDBOrThrow = async (
  appRecord: typeof app.$inferSelect,
) => {
  const draftAppConfigId = appRecord.draftAppConfigId;
  if (!draftAppConfigId) {
    throw new NotFoundException('草稿应用配置不存在');
  }
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
 * @param appId - 应用ID
 * @param userId - 用户ID
 * @returns 处理后的应用草稿配置
 */
export const getDraftAppConfig = async (appId: string, userId: string) => {
  const appRecord = await getAppOrThrow(appId, userId);
  const draftAppConfig = await getDraftAppConfigFromDBOrThrow(appRecord);
  const { validateTools, tools } = await processValidateTools(
    draftAppConfig.tools,
  );
  if (!isEqual(validateTools, draftAppConfig.tools)) {
    log.warn('Validate tools not match');
    await db
      .update(appConfigVersion)
      .set({
        tools: validateTools,
      })
      .where(eq(appConfigVersion.id, draftAppConfig.id));
  }

  const { validateDatasets, datasets } = await processValidateDatasets(
    draftAppConfig.datasets,
  );
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

  return processTransformAppConfig(
    draftAppConfig,
    tools,
    datasets,
    draftAppConfig.workflows,
  );
};

/**
 * 更新应用草稿配置
 * @param appId - 应用ID
 * @param userId - 用户ID
 * @param req - 更新请求数据
 * @throws {NotFoundException} 当草稿配置不存在时抛出
 */
export const updateDraftAppConfig = async (
  appId: string,
  userId: string,
  req: UpdateDraftAppConfigReq,
) => {
  const appRecord = await getAppOrThrow(appId, userId);
  const draftAppConfigId = appRecord.draftAppConfigId;
  if (!draftAppConfigId) {
    throw new NotFoundException('草稿应用配置不存在');
  }

  const [{ validateTools }, { validateDatasets }] = await Promise.all([
    processValidateTools(req.tools),
    processValidateDatasets(req.datasets),
  ]);
  // TODO: validate workflows

  const newDraftAppConfig: DraftAppConfig = {
    ...req,
    tools: validateTools,
    datasets: validateDatasets,
    // TODO: Zod issue https://github.com/colinhacks/zod/issues/3730
    modelConfig: req.modelConfig,
    workflows: req.workflows,
  };

  await db
    .update(appConfigVersion)
    .set({
      ...newDraftAppConfig,
    })
    .where(eq(appConfigVersion.id, draftAppConfigId));
};
