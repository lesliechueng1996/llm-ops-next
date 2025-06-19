/**
 * 对话服务模块
 * 提供对话相关的核心功能，包括创建和管理调试对话
 *
 * 主要功能：
 * - 获取或创建调试对话
 * - 生成对话名称
 * - 生成对话摘要
 * - 保存代理思考过程
 *
 * @module conversation
 */

import { QueueEvent, type AgentThought } from '@/lib/agent/entity';
import { db } from '@/lib/db';
import {
  app,
  conversation,
  message,
  messageAgentThought,
} from '@/lib/db/schema';
import { InvokeFrom } from '@/lib/entity';
import { log } from '@/lib/logger';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

/**
 * 对话摘要生成模板
 * 用于逐步总结对话内容，确保摘要长度不超过2000字符
 */
const SUMMARIZER_TEMPLATE = `逐步总结提供的对话内容，在之前的总结基础上继续添加并返回一个新的总结，并确保新总结的长度不要超过2000个字符，必要的时候可以删除一些信息，尽可能简洁。

EXAMPLE
当前总结:
人类询问 AI 对人工智能的看法。AI 认为人工智能是一股向善的力量。

新的会话:
Human: 为什么你认为人工智能是一股向善的力量？
AI: 因为人工智能将帮助人类发挥他们全部的潜力。

新的总结:
人类询问AI对人工智能的看法，AI认为人工智能是一股向善的力量，因为它将帮助人类发挥全部潜力。
END OF EXAMPLE

当前总结:
{summary}

新的会话:
{newLines}

新的总结:`;

/**
 * 对话名称生成模板
 * 用于从用户输入中提取对话主题
 */
const CONVERSATION_NAME_TEMPLATE = '请从用户传递的内容中提取出对应的主题';

/**
 * 对话信息模式定义
 * 用于结构化输出对话的语言类型、推理过程和主题
 */
const conversationInfoSchema = z
  .object({
    languageType: z.string().describe('用户输入语言的语言类型声明'),
    reasoning: z
      .string()
      .describe('对用户输入的文本进行语言判断的推理过程，类型为字符串'),
    subject: z
      .string()
      .describe(
        '对用户的输入进行简短的总结，提取输入的"意图"和"主题"，输出语言必须和输入语言保持一致，尽可能简单明了，尤其是用户问题针对模型本身时，可以通过适当的方式加入趣味性。',
      ),
  })
  .describe(`你需要将用户的输入分解为"主题"和"意图"，以便准确识别用户输入的类型。
    注意：用户的语言可能是多样性的，可以是英文、中文、日语、法语等。
    确保你的输出与用户的语言尽可能一致并简短！

    示例1：
    用户输入: hi, my name is LiHua.
    {
        "language_type": "用户的输入是纯英文",
        "reasoning": "输出语言必须是英文",
        "subject": "Users greet me"
    }

    示例2:
    用户输入: hello
    {
        "language_type": "用户的输入是纯英文",
        "reasoning": "输出语言必须是英文",
        "subject": "Greeting myself"
    }

    示例3:
    用户输入: www.imooc.com讲了什么
    {
        "language_type": "用户输入是中英文混合",
        "reasoning": "英文部分是URL，主要意图还是使用中文表达的，所以输出语言必须是中文",
        "subject": "询问网站www.imooc.com"
    }

    示例4:
    用户输入: why小红的年龄is老than小明?
    {
        "language_type": "用户输入是中英文混合",
        "reasoning": "英文部分是口语化输入，主要意图是中文，且中文占据更大的实际意义，所以输出语言必须是中文",
        "subject": "询问小红和小明的年龄"
    }

    示例5:
    用户输入: yo, 你今天怎么样?
    {
        "language_type": "用户输入是中英文混合",
        "reasoning": "英文部分是口语化输入，主要意图是中文，所以输出语言必须是中文",
        "subject": "询问我今天的状态"
    }`);

/**
 * 获取或创建调试对话
 *
 * 如果提供了debugConversationId，则尝试获取现有对话
 * 如果对话不存在或未提供ID，则创建新的调试对话
 *
 * 创建新对话时会：
 * 1. 在conversation表中插入新记录
 * 2. 更新app表中的debugConversationId字段
 *
 * @param debugConversationId - 调试对话ID，可为null
 * @param appId - 应用ID
 * @param userId - 用户ID
 * @returns 返回对话记录
 * @throws 如果数据库操作失败
 */
export const getOrCreateDebugConversation = async (
  debugConversationId: string | null,
  appId: string,
  userId: string,
) => {
  // 如果提供了debugConversationId，尝试获取现有对话
  if (debugConversationId) {
    const conversationRecords = await db
      .select()
      .from(conversation)
      .where(
        and(
          eq(conversation.id, debugConversationId),
          eq(conversation.appId, appId),
        ),
      );
    if (conversationRecords.length !== 0) {
      return conversationRecords[0];
    }
  }

  // 创建新的调试对话
  const newConversationRecord = await db.transaction(async (tx) => {
    // 插入新的对话记录
    const conversationRecord = await tx
      .insert(conversation)
      .values({
        appId,
        name: 'New Conversation',
        invokeFrom: InvokeFrom.DEBUGGER,
        createdBy: userId,
      })
      .returning();

    // 更新应用的debugConversationId
    await tx
      .update(app)
      .set({
        debugConversationId: conversationRecord[0].id,
      })
      .where(eq(app.id, appId));

    return conversationRecord[0];
  });

  return newConversationRecord;
};

/**
 * 生成对话名称
 *
 * 使用AI模型从用户查询中提取对话主题作为对话名称
 * 如果查询过长会进行截断处理
 * 生成的名称长度限制在75字符以内
 *
 * @param query - 用户查询内容
 * @returns 生成的对话名称
 * @throws 如果AI调用失败
 */
export const generateConversationName = async (query: string) => {
  const prompt = ChatPromptTemplate.fromMessages([
    ['system', CONVERSATION_NAME_TEMPLATE],
    ['human', '{query}'],
  ]);

  const llm = new ChatOpenAI({
    model: 'gpt-4o-mini',
    apiKey: process.env.OPENAI_API_KEY,
    configuration: {
      baseURL: process.env.OPENAI_API_URL,
    },
    temperature: 0,
  }).withStructuredOutput(conversationInfoSchema);

  const chain = prompt.pipe(llm);

  // 处理过长的查询，进行截断
  let newQuery = query;
  if (query.length > 2000) {
    newQuery = `${query.slice(0, 300)}...[TRUNCATED]...${query.slice(-300)}`;
  }
  newQuery = newQuery.replace(/\n/g, ' ');

  const conversationInfo = await chain.invoke({
    query: newQuery,
  });

  let name = '新的对话';
  try {
    if (conversationInfo.subject) {
      name = conversationInfo.subject;
    }
  } catch (error) {
    log.error(
      'Failed to generate conversation name, query={%s}, conversationInfo: %o',
      query,
      conversationInfo,
    );
  }

  // 限制名称长度
  if (name.length > 75) {
    name = `${name.slice(0, 75)}...`;
  }
  return name;
};

/**
 * 生成对话摘要
 *
 * 基于现有摘要和新的对话内容生成更新的摘要
 * 使用AI模型确保摘要简洁且不超过2000字符
 *
 * @param humanMessage - 用户消息
 * @param aiMessage - AI回复消息
 * @param oldSummary - 现有摘要
 * @returns 新的摘要内容
 * @throws 如果AI调用失败
 */
export const summary = async (
  humanMessage: string,
  aiMessage: string,
  oldSummary: string,
) => {
  const prompt = ChatPromptTemplate.fromTemplate(SUMMARIZER_TEMPLATE);

  const llm = new ChatOpenAI({
    model: 'gpt-4o-mini',
    apiKey: process.env.OPENAI_API_KEY,
    configuration: {
      baseURL: process.env.OPENAI_API_URL,
    },
    temperature: 0.5,
  });

  const summaryChain = prompt.pipe(llm).pipe(new StringOutputParser());

  const newSummary = await summaryChain.invoke({
    summary: oldSummary,
    newLines: `Human: ${humanMessage}\nAI: ${aiMessage}`,
  });

  return newSummary;
};

/**
 * 检查是否为新对话
 *
 * 通过统计消息数量判断对话是否为新创建的
 * 消息数量小于等于1时认为是新对话
 *
 * @param conversationId - 对话ID
 * @returns 是否为新对话
 */
const isNewConversation = async (conversationId: string) => {
  const messageCount = await db.$count(
    message,
    eq(message.conversationId, conversationId),
  );
  return messageCount <= 1;
};

/**
 * 保存代理思考过程
 *
 * 将AI代理的思考过程保存到数据库中，包括：
 * - 各种事件类型的思考记录
 * - 工具调用信息
 * - 消息更新
 * - 对话摘要更新
 * - 对话名称生成
 *
 * 支持的事件类型：
 * - LONG_TERM_MEMORY_RECALL: 长期记忆召回
 * - AGENT_THOUGHT: 代理思考
 * - AGENT_MESSAGE: 代理消息
 * - AGENT_ACTION: 代理行动
 * - DATASET_RETRIEVAL: 数据集检索
 * - STOP/TIMEOUT/ERROR: 结束状态
 *
 * @param userId - 用户ID
 * @param appId - 应用ID
 * @param isLongTermMemoryEnabled - 是否启用长期记忆
 * @param conversationId - 对话ID
 * @param messageId - 消息ID
 * @param agentThoughts - 代理思考过程数组
 * @throws 如果对话或消息不存在
 */
export const saveAgentThoughts = async (
  userId: string,
  appId: string,
  isLongTermMemoryEnabled: boolean,
  conversationId: string,
  messageId: string,
  agentThoughts: AgentThought[],
) => {
  // 初始化位置和延迟计数器
  let position = 0;
  let latency = 0;

  // 并行查询对话和消息记录
  const conversationQuery = db
    .select()
    .from(conversation)
    .where(eq(conversation.id, conversationId));

  const messageQuery = db
    .select()
    .from(message)
    .where(eq(message.id, messageId));

  const [conversationRecords, messageRecords] = await Promise.all([
    conversationQuery,
    messageQuery,
  ]);

  // 验证对话和消息是否存在
  if (conversationRecords.length === 0 || messageRecords.length === 0) {
    log.error(
      'Conversation or message not found, conversationId={%s}, messageId={%s}',
      conversationId,
      messageId,
    );
    return;
  }

  const conversationRecord = conversationRecords[0];
  const messageRecord = messageRecords[0];

  // 准备要插入的代理思考记录
  const messageAgentThoughts: Array<typeof messageAgentThought.$inferInsert> =
    [];

  // 遍历所有代理思考过程
  for (const agentThought of agentThoughts) {
    // 处理需要保存的思考事件
    if (
      [
        QueueEvent.LONG_TERM_MEMORY_RECALL,
        QueueEvent.AGENT_THOUGHT,
        QueueEvent.AGENT_MESSAGE,
        QueueEvent.AGENT_ACTION,
        QueueEvent.DATASET_RETRIEVAL,
      ].includes(agentThought.event)
    ) {
      position += 1;
      latency += agentThought.latency;

      // 构建思考记录
      messageAgentThoughts.push({
        appId,
        conversationId,
        messageId,
        invokeFrom: InvokeFrom.DEBUGGER,
        createdBy: userId,
        position,
        event: agentThought.event,
        thought: agentThought.thought,
        observation: agentThought.observation,
        tool: agentThought.tool,
        toolInput: agentThought.toolInput,
        message: agentThought.message,
        answer: agentThought.answer,
        latency: agentThought.latency,
      });
    }

    // 处理代理消息事件
    if (agentThought.event === QueueEvent.AGENT_MESSAGE) {
      // 更新消息内容
      await db
        .update(message)
        .set({
          message: agentThought.message,
          answer: agentThought.answer,
          latency,
        })
        .where(eq(message.id, messageId));

      // 如果启用长期记忆，更新对话摘要
      if (isLongTermMemoryEnabled) {
        const newSummary = await summary(
          messageRecord.query,
          agentThought.answer,
          conversationRecord.summary,
        );
        log.info(
          'Update conversation summary, conversationId={%s}, newSummary={%s}',
          conversationId,
          newSummary,
        );
        await db
          .update(conversation)
          .set({ summary: newSummary })
          .where(eq(conversation.id, conversationId));
      }

      // 如果是新对话，生成对话名称
      const isNew = await isNewConversation(conversationId);
      if (isNew) {
        const name = await generateConversationName(messageRecord.query);
        log.info(
          'Update conversation name, conversationId={%s}, name={%s}',
          conversationId,
          name,
        );
        await db
          .update(conversation)
          .set({ name })
          .where(eq(conversation.id, conversationId));
      }
    }

    // 处理结束状态事件
    if (
      [QueueEvent.STOP, QueueEvent.TIMEOUT, QueueEvent.ERROR].includes(
        agentThought.event,
      )
    ) {
      log.info(
        'Update message status, messageId={%s}, status={%s}, error={%s}',
        messageId,
        agentThought.event,
        agentThought.observation,
      );
      await db
        .update(message)
        .set({
          status: agentThought.event,
          error: agentThought.observation,
        })
        .where(eq(message.id, messageId));
      break; // 遇到结束状态后停止处理
    }
  }

  // 批量插入代理思考记录
  if (messageAgentThoughts.length > 0) {
    log.info(
      'Save agent thoughts, conversationId={%s}, messageId={%s}, agentThoughtsCount={%d}',
      conversationId,
      messageId,
      messageAgentThoughts.length,
    );
    await db.insert(messageAgentThought).values(messageAgentThoughts);
  }
};
