/**
 * 应用管理服务
 *
 * 该模块提供了应用的基本管理功能，包括：
 * - 应用的创建、删除、复制
 * - 应用列表的分页查询
 * - 应用基本信息的获取和更新
 * - 应用配置的管理
 * - 应用对话摘要的获取和更新
 * - 应用调试聊天功能
 */

import { randomUUID } from 'node:crypto';
import { BadRequestException, NotFoundException } from '@/exceptions';
import {
  type AgentThought,
  QueueEvent,
  createAgentConfig,
} from '@/lib/agent/entity';
import {
  createEventProcessor,
  wrapEmitWithPing,
} from '@/lib/agent/event-processor';
import { createFunctionCallAgent } from '@/lib/agent/function-call-agent';
import {
  clearTaskBelongCache,
  doTaskBelongCheck,
  setStopFlag,
  setTaskBelongCache,
} from '@/lib/agent/helper';
import { db } from '@/lib/db';
import {
  app,
  appConfig,
  appConfigVersion,
  conversation,
  message,
} from '@/lib/db/schema';
import {
  AppConfigType,
  AppStatus,
  DEFAULT_APP_CONFIG,
  InvokeFrom,
  MessageStatus,
  type ModelConfig,
  RetrievalSource,
} from '@/lib/entity';
import { log } from '@/lib/logger';
import { createTokenBufferMemory } from '@/lib/memory/token-buffer-memory';
import { calculatePagination, paginationResult } from '@/lib/paginator';
import { createLangchainToolForDataset } from '@/lib/retriever';
import type { CreateAppReq, UpdateAppReq } from '@/schemas/app-schema';
import type { SearchPageReq } from '@/schemas/common-schema';
import {
  getDraftAppConfig,
  getDraftAppConfigFromDBOrThrow,
  getLangchainToolsByToolConfig,
} from '@/services/app-config';
import {
  getOrCreateDebugConversation,
  saveAgentThoughts,
} from '@/services/conversation';
import { HumanMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { and, count, desc, eq, inArray, like, sum } from 'drizzle-orm';

/**
 * 获取应用记录，如果不存在则抛出异常
 *
 * 这是一个内部辅助函数，用于验证应用是否存在并返回应用记录。
 * 如果应用不存在或不属于指定用户，将抛出 NotFoundException。
 *
 * @param appId - 应用ID
 * @param userId - 用户ID，用于验证应用所有权
 * @returns 应用记录对象
 * @throws NotFoundException 当应用不存在或不属于指定用户时
 */
export const getAppOrThrow = async (appId: string, userId: string) => {
  // 查询应用记录，确保应用存在且属于指定用户
  const appRecords = await db
    .select()
    .from(app)
    .where(and(eq(app.id, appId), eq(app.userId, userId)));

  if (appRecords.length === 0) {
    throw new NotFoundException('应用不存在');
  }

  return appRecords[0];
};

/**
 * 获取应用的基本信息
 *
 * 如果应用没有草稿配置，会自动创建一个默认的草稿配置。
 * 返回应用的基本信息，包括ID、名称、图标、描述、状态等。
 *
 * @param appId - 应用ID
 * @param userId - 用户ID
 * @returns 应用的基本信息对象，包含：
 *   - id: 应用ID
 *   - debugConversationId: 调试对话ID
 *   - name: 应用名称
 *   - icon: 应用图标
 *   - description: 应用描述
 *   - status: 应用状态
 *   - draftUpdatedAt: 草稿配置更新时间戳
 *   - updatedAt: 应用更新时间戳
 *   - createdAt: 应用创建时间戳
 * @throws NotFoundException 当应用不存在时
 */
export const getAppBasicInfo = async (appId: string, userId: string) => {
  const appRecord = await getAppOrThrow(appId, userId);

  const draftAppConfigId = appRecord.draftAppConfigId;
  let draftAppConfigRecord: typeof appConfigVersion.$inferSelect | null = null;

  // 如果存在草稿配置ID，尝试获取草稿配置
  if (draftAppConfigId) {
    const appConfigVersionRecords = await db
      .select()
      .from(appConfigVersion)
      .where(
        and(
          eq(appConfigVersion.id, draftAppConfigId),
          eq(appConfigVersion.configType, AppConfigType.DRAFT),
        ),
      );
    draftAppConfigRecord =
      appConfigVersionRecords.length === 0 ? null : appConfigVersionRecords[0];
  }

  // 如果没有草稿配置，创建一个新的默认配置
  if (draftAppConfigRecord === null) {
    log.info('App %s has no draft app config, start to create one', appId);
    draftAppConfigRecord = await db.transaction(async (tx) => {
      // 创建新的草稿配置
      const draftAppConfigRecords = await tx
        .insert(appConfigVersion)
        .values({
          appId,
          version: 0,
          configType: AppConfigType.DRAFT,
          ...DEFAULT_APP_CONFIG,
        })
        .returning();

      // 更新应用的草稿配置ID
      await tx
        .update(app)
        .set({
          draftAppConfigId: draftAppConfigRecords[0].id,
        })
        .where(eq(app.id, appId));

      return draftAppConfigRecords[0];
    });
  }

  return {
    id: appRecord.id,
    debugConversationId: appRecord.debugConversationId,
    name: appRecord.name,
    icon: appRecord.icon,
    description: appRecord.description,
    status: appRecord.status,
    draftUpdatedAt: draftAppConfigRecord.updatedAt.getTime(),
    updatedAt: appRecord.updatedAt.getTime(),
    createdAt: appRecord.createdAt.getTime(),
  };
};

/**
 * 创建新应用
 *
 * 创建应用时会同时创建一个初始的草稿配置。
 * 新创建的应用默认状态为 DRAFT。
 *
 * @param userId - 用户ID
 * @param req - 创建应用的请求参数，包含名称、图标、描述
 * @returns 新创建的应用ID
 */
export const createApp = async (userId: string, req: CreateAppReq) => {
  return await db.transaction(async (tx) => {
    // 创建应用记录
    const appRecords = await tx
      .insert(app)
      .values({
        userId,
        name: req.name,
        icon: req.icon,
        description: req.description ?? '',
        status: AppStatus.DRAFT,
      })
      .returning();

    const appRecord = appRecords[0];

    // 创建初始的草稿配置
    const appConfigVersionRecords = await tx
      .insert(appConfigVersion)
      .values({
        appId: appRecord.id,
        version: 0,
        configType: AppConfigType.DRAFT,
        ...DEFAULT_APP_CONFIG,
      })
      .returning();

    // 将草稿配置ID关联到应用
    await tx
      .update(app)
      .set({
        draftAppConfigId: appConfigVersionRecords[0].id,
      })
      .where(eq(app.id, appRecord.id));

    return appRecord.id;
  });
};

/**
 * 删除应用
 *
 * 删除应用及其相关的所有数据。这是一个不可逆操作。
 *
 * @param appId - 应用ID
 * @param userId - 用户ID，用于验证应用所有权
 * @throws NotFoundException 当应用不存在时
 */
export const deleteApp = async (appId: string, userId: string) => {
  await getAppOrThrow(appId, userId);
  await db.delete(app).where(eq(app.id, appId));
};

/**
 * 分页获取应用列表
 *
 * 支持按应用名称搜索，返回分页后的应用列表和总数。
 * 应用按创建时间倒序排列。
 *
 * @param userId - 用户ID
 * @param pageReq - 分页和搜索参数
 * @returns 分页后的应用列表和总数，包含：
 *   - list: 应用列表，每个应用包含基本信息、预设提示、模型配置等
 *   - total: 总记录数
 *   - page: 当前页码
 *   - pageSize: 每页大小
 */
export const listAppsByPage = async (
  userId: string,
  pageReq: SearchPageReq,
) => {
  // 构建查询条件
  const conditions = [eq(app.userId, userId)];
  if (pageReq.searchWord) {
    conditions.push(like(app.name, `%${pageReq.searchWord}%`));
  }

  const where = and(...conditions);

  const { offset, limit } = calculatePagination(pageReq);

  // 查询应用列表
  const listQuery = db
    .select()
    .from(app)
    .where(where)
    .orderBy(desc(app.createdAt))
    .limit(limit)
    .offset(offset);

  // 查询总数
  const totalQuery = db.select({ count: count() }).from(app).where(where);

  const [list, total] = await Promise.all([listQuery, totalQuery]);

  // 收集所有配置ID，分别处理已发布和草稿状态的应用
  const appConfigIds = list
    .filter((item) => item.status === AppStatus.PUBLISHED)
    .map((item) => item.appConfigId)
    .filter((item) => item !== null);

  const draftAppConfigIds = list
    .filter((item) => item.status === AppStatus.DRAFT && item.draftAppConfigId)
    .map((item) => item.draftAppConfigId)
    .filter((item) => item !== null);

  // 批量查询配置信息，提高数据库查询效率
  const appConfigQuery = db
    .select()
    .from(appConfig)
    .where(inArray(appConfig.id, appConfigIds));

  const draftAppConfigQuery = db
    .select()
    .from(appConfigVersion)
    .where(inArray(appConfigVersion.id, draftAppConfigIds));

  const [appConfigRecords, draftAppConfigRecords] = await Promise.all([
    appConfigQuery,
    draftAppConfigQuery,
  ]);

  // 创建配置映射表，提高查询效率
  // 使用Map结构可以O(1)时间复杂度查找配置
  const appConfigMap = new Map(appConfigRecords.map((item) => [item.id, item]));
  const draftAppConfigMap = new Map(
    draftAppConfigRecords.map((item) => [item.id, item]),
  );

  // 根据应用状态获取对应的配置
  // 已发布的应用使用appConfig，草稿状态的应用使用draftAppConfig
  const getConfig = (appRecord: typeof app.$inferSelect) => {
    if (appRecord.appConfigId && appRecord.status === AppStatus.PUBLISHED) {
      return appConfigMap.get(appRecord.appConfigId);
    }
    return draftAppConfigMap.get(appRecord.draftAppConfigId ?? '');
  };

  // 格式化返回结果，统一时间戳格式为毫秒时间戳
  const formattedList = list.map((item) => ({
    id: item.id,
    name: item.name,
    icon: item.icon,
    description: item.description,
    presetPrompt: getConfig(item)?.presetPrompt,
    modelConfig: {
      provider: (getConfig(item)?.modelConfig as ModelConfig)?.provider,
      model: (getConfig(item)?.modelConfig as ModelConfig)?.model,
    },
    status: item.status,
    createdAt: item.createdAt.getTime(),
    updatedAt: item.updatedAt.getTime(),
  }));

  return paginationResult(formattedList, total[0].count, pageReq);
};

/**
 * 复制应用
 *
 * 创建一个新应用，复制原应用的所有配置。
 * 新应用的名称为原应用名称加上"副本"后缀。
 *
 * @param userId - 用户ID
 * @param appId - 要复制的应用ID
 * @returns 新创建的应用ID
 * @throws NotFoundException 当原应用或配置不存在时
 */
export const copyApp = async (userId: string, appId: string) => {
  const appRecord = await getAppOrThrow(appId, userId);

  // 获取原应用的草稿配置
  const appConfigVersionRecords = await db
    .select()
    .from(appConfigVersion)
    .where(eq(appConfigVersion.id, appRecord.draftAppConfigId ?? ''));

  if (appConfigVersionRecords.length === 0) {
    throw new NotFoundException('应用配置不存在');
  }

  const draftAppConfig = appConfigVersionRecords[0];

  return await db.transaction(async (tx) => {
    // 创建新应用，名称添加"副本"后缀以区分
    const newAppRecords = await tx
      .insert(app)
      .values({
        userId,
        name: `${appRecord.name} 副本`,
        icon: appRecord.icon,
        description: appRecord.description,
        status: AppStatus.DRAFT, // 新应用默认为草稿状态
      })
      .returning();

    const newApp = newAppRecords[0];

    // 复制原应用的所有配置到新应用
    // 包括模型配置、对话轮数、预设提示、工具、工作流、数据集等
    const newAppConfigVersionRecords = await tx
      .insert(appConfigVersion)
      .values({
        appId: newApp.id,
        modelConfig: draftAppConfig.modelConfig, // 复制模型配置
        dialogRound: draftAppConfig.dialogRound, // 复制对话轮数限制
        presetPrompt: draftAppConfig.presetPrompt, // 复制预设提示
        tools: draftAppConfig.tools, // 复制工具配置
        workflows: draftAppConfig.workflows, // 复制工作流配置
        datasets: draftAppConfig.datasets, // 复制数据集配置
        retrievalConfig: draftAppConfig.retrievalConfig, // 复制检索配置
        longTermMemory: draftAppConfig.longTermMemory, // 复制长期记忆配置
        openingStatement: draftAppConfig.openingStatement, // 复制开场白
        openingQuestions: draftAppConfig.openingQuestions, // 复制开场问题
        speechToText: draftAppConfig.speechToText, // 复制语音转文字配置
        textToSpeech: draftAppConfig.textToSpeech, // 复制文字转语音配置
        suggestedAfterAnswer: draftAppConfig.suggestedAfterAnswer, // 复制建议问题配置
        reviewConfig: draftAppConfig.reviewConfig, // 复制审核配置
        version: 0, // 新配置版本从0开始
        configType: AppConfigType.DRAFT, // 新配置为草稿类型
      })
      .returning();

    // 关联新应用的草稿配置ID
    await tx
      .update(app)
      .set({
        draftAppConfigId: newAppConfigVersionRecords[0].id,
      })
      .where(eq(app.id, newApp.id));

    return newApp.id;
  });
};

/**
 * 更新应用的基本信息
 *
 * 更新应用的名称、图标和描述信息。
 *
 * @param appId - 应用ID
 * @param userId - 用户ID，用于验证应用所有权
 * @param req - 更新应用的请求参数
 * @throws NotFoundException 当应用不存在时
 */
export const updateAppBasicInfo = async (
  appId: string,
  userId: string,
  req: UpdateAppReq,
) => {
  await getAppOrThrow(appId, userId);
  await db
    .update(app)
    .set({
      name: req.name,
      icon: req.icon,
      description: req.description ?? '',
    })
    .where(eq(app.id, appId));
};

/**
 * 获取应用的对话摘要
 *
 * 该功能需要应用配置中启用长期记忆功能。
 * 返回应用的调试对话摘要，用于长期记忆功能。
 *
 * @param appId - 应用ID
 * @param userId - 用户ID
 * @returns 应用的对话摘要内容
 * @throws BadRequestException 当应用未启用长期记忆功能时
 * @throws NotFoundException 当应用不存在时
 */
export const getAppSummary = async (appId: string, userId: string) => {
  const appRecord = await getAppOrThrow(appId, userId);
  const draftAppConfig = await getDraftAppConfigFromDBOrThrow(appRecord);

  // 检查是否启用了长期记忆功能
  if (!draftAppConfig.longTermMemory.enable) {
    throw new BadRequestException('应用配置中未启用长期记忆');
  }

  const debugConversationId = appRecord.debugConversationId;
  const conversationRecord = await getOrCreateDebugConversation(
    debugConversationId,
    appId,
    userId,
  );

  return conversationRecord.summary;
};

/**
 * 更新应用的对话摘要
 *
 * 更新应用的调试对话摘要内容。
 *
 * @param appId - 应用ID
 * @param userId - 用户ID
 * @param summary - 新的对话摘要内容
 * @throws NotFoundException 当应用不存在时
 */
export const updateAppSummary = async (
  appId: string,
  userId: string,
  summary: string,
) => {
  const appRecord = await getAppOrThrow(appId, userId);
  const conversationRecord = await getOrCreateDebugConversation(
    appRecord.debugConversationId,
    appId,
    userId,
  );

  // 更新对话摘要
  await db
    .update(conversation)
    .set({ summary })
    .where(eq(conversation.id, conversationRecord.id));
};

/**
 * 应用调试聊天功能
 *
 * 为应用提供调试聊天功能，支持实时流式响应。
 * 该功能会创建一个AI代理来处理用户查询，并通过Server-Sent Events (SSE) 返回响应。
 *
 * @param appId - 应用ID
 * @param userId - 用户ID
 * @param query - 用户查询内容
 * @param writer - 用于写入SSE响应的流写入器
 */
export const debugChat = async (
  appId: string,
  userId: string,
  query: string,
  writer: WritableStreamDefaultWriter,
) => {
  // 创建事件处理器和任务ID
  const eventProcessor = createEventProcessor();
  const taskId = randomUUID();

  // 包装事件发射器，添加ping功能以保持连接
  const pingEmitter = wrapEmitWithPing(
    (event: AgentThought) => eventProcessor.emit(event),
    taskId,
  );

  try {
    // 并行获取应用记录和草稿配置
    const [appRecord, draftAppConfig] = await Promise.all([
      getAppOrThrow(appId, userId),
      getDraftAppConfig(appId, userId),
    ]);

    // 获取或创建调试对话
    const conversationRecord = await getOrCreateDebugConversation(
      appRecord.debugConversationId,
      appId,
      userId,
    );

    // 创建消息记录
    const messageRecord = await db
      .insert(message)
      .values({
        appId,
        conversationId: conversationRecord.id,
        invokeFrom: InvokeFrom.DEBUGGER,
        createdBy: userId,
        query,
        status: MessageStatus.NORMAL,
      })
      .returning();

    // 创建LLM实例
    const llm = new ChatOpenAI({
      model: draftAppConfig.modelConfig.model,
      ...draftAppConfig.modelConfig.parameters,
      apiKey: process.env.OPENAI_API_KEY,
      configuration: {
        baseURL: process.env.OPENAI_API_URL,
      },
    });

    // 创建token缓冲区内存管理器
    const tokenBufferMemory = createTokenBufferMemory(conversationRecord, llm);
    const history = await tokenBufferMemory.getHistoryPromptMessages(
      2000, // 最大token数
      draftAppConfig.dialogRound, // 对话轮数限制
    );

    // 获取工具配置，包括内置工具和API工具
    const tools = await getLangchainToolsByToolConfig(
      draftAppConfig.tools,
      userId,
    );

    // 如果配置了数据集，添加数据集检索工具
    // 数据集检索工具允许代理从配置的数据集中检索相关信息
    if (draftAppConfig.datasets.length > 0) {
      const datasetRetrievalTool = createLangchainToolForDataset(
        draftAppConfig.datasets.map((dataset) => dataset.id), // 提取所有数据集ID
        userId,
        {
          ...draftAppConfig.retrievalConfig, // 使用应用的检索配置
          retrievalSource: RetrievalSource.APP, // 标记检索来源为应用级别
        },
      );
      tools.push(datasetRetrievalTool);
    }

    // 创建函数调用代理，配置LLM、工具和代理参数
    const agent = createFunctionCallAgent({
      llm, // 语言模型实例
      agentConfig: createAgentConfig({
        userId, // 用户ID用于权限控制
        invokeFrom: InvokeFrom.DEBUGGER, // 标记调用来源为调试器
        reviewConfig: draftAppConfig.reviewConfig, // 审核配置
        enableLongTermMemory: draftAppConfig.longTermMemory.enable, // 是否启用长期记忆
        tools, // 可用工具列表
      }),
    });

    // 用于存储代理思考过程的映射表
    const agentThoughts = new Map<string, AgentThought>();

    // 设置事件处理器，处理代理的思考过程
    eventProcessor.use(async (agentThought) => {
      const eventId = agentThought.id;

      // 跳过ping事件，ping事件仅用于保持连接活跃
      if (agentThought.event !== QueueEvent.PING) {
        if (agentThought.event === QueueEvent.AGENT_MESSAGE) {
          // 对于代理消息事件，需要合并连续的思考内容
          // 这是因为代理可能会分多次发送同一个消息的内容
          if (!agentThoughts.has(eventId)) {
            agentThoughts.set(eventId, agentThought);
          } else {
            let tempAgentThought = agentThoughts.get(eventId);
            if (!tempAgentThought) {
              log.error('Agent thought not found, eventId={%s}', eventId);
              return;
            }
            // 合并思考内容和答案，确保流式响应的完整性
            tempAgentThought = {
              ...tempAgentThought,
              thought: `${tempAgentThought.thought}${agentThought.thought}`,
              answer: `${tempAgentThought.answer}${agentThought.answer}`,
              latency: agentThought.latency, // 使用最新的延迟时间
            };
            agentThoughts.set(eventId, tempAgentThought);
          }
        } else {
          // 对于其他事件（如工具调用、观察等），直接存储
          agentThoughts.set(eventId, agentThought);
        }
      }

      // 构建事件数据，包含所有必要的调试信息
      const data = {
        id: eventId,
        conversationId: conversationRecord.id,
        messageId: messageRecord[0].id,
        taskId: agentThought.taskId,
        event: agentThought.event,
        thought: agentThought.thought,
        observation: agentThought.observation,
        tool: agentThought.tool,
        toolInput: agentThought.toolInput,
        answer: agentThought.answer,
        latency: agentThought.latency,
      };

      // 记录日志并发送SSE事件到客户端
      log.info('Agent thought: %s', JSON.stringify(data));
      writer.write(
        `event: ${agentThought.event}\ndata: ${JSON.stringify(data)}\n\n`,
      );
    });

    // 设置任务归属缓存
    await setTaskBelongCache(taskId, InvokeFrom.DEBUGGER, userId);
    // 调用代理处理用户查询，传入历史对话和长期记忆
    await agent.invoke({
      messages: [new HumanMessage(query)], // 当前用户查询
      history, // 历史对话上下文
      longTermMemory: conversationRecord.summary, // 长期记忆摘要
      taskId, // 任务ID用于追踪
      iterationCount: 0, // 迭代计数
      emit: pingEmitter, // 事件发射器
      stop: false, // 不停止代理
    });

    // 保存代理思考过程到数据库，用于后续分析和调试
    await saveAgentThoughts(
      userId,
      appId,
      draftAppConfig.longTermMemory.enable, // 是否启用长期记忆
      conversationRecord.id,
      messageRecord[0].id,
      Array.from(agentThoughts.values()), // 转换为数组
    );
  } finally {
    // 清理资源：停止ping发射器, 关闭写入流, 清除任务归属缓存
    log.info('Agent stop');
    pingEmitter.stop();
    writer.close();
    await clearTaskBelongCache(taskId);
  }
};

export const stopConversationTask = async (
  appId: string,
  taskId: string,
  userId: string,
) => {
  await getAppOrThrow(appId, userId);
  const isBelong = await doTaskBelongCheck(taskId, InvokeFrom.DEBUGGER, userId);
  if (!isBelong) {
    throw new BadRequestException('任务不属于当前用户');
  }
  await setStopFlag(taskId);
};
