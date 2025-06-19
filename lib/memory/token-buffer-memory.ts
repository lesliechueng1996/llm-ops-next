import { type conversation, message } from '@/lib/db/schema';
import type { BaseLanguageModel } from '@langchain/core/language_models/base';
import {
  AIMessage,
  HumanMessage,
  getBufferString,
  trimMessages,
} from '@langchain/core/messages';
import { and, desc, eq, inArray, ne } from 'drizzle-orm';
import { db } from '../db';
import { MessageStatus } from '../entity';

/**
 * 创建基于 token 缓冲区的记忆管理器
 *
 * 这个函数创建一个记忆管理器，用于从数据库中检索对话历史记录，
 * 并根据 token 限制和消息数量限制来优化历史记录的大小。
 *
 * @param conversationRecord - 对话记录对象，包含对话的基本信息
 * @param modelInstance - 语言模型实例，用于计算 token 数量
 * @returns 包含获取历史记录方法的对象
 */
export const createTokenBufferMemory = (
  conversationRecord: typeof conversation.$inferSelect,
  modelInstance: BaseLanguageModel,
) => {
  /**
   * 获取历史对话消息列表
   *
   * 从数据库中检索指定对话的历史消息，并根据 token 限制和消息数量限制进行优化。
   * 只返回有效的消息（非空答案、未删除、状态正常）。
   *
   * @param maxTokenLimit - 最大 token 限制，默认为 200
   * @param maxMessageLimit - 最大消息数量限制，默认为 10
   * @returns 优化后的消息数组，包含 HumanMessage 和 AIMessage
   */
  const getHistoryPromptMessages = async (
    // TODO: 确认最大 token 限制是 200 还是 2000
    maxTokenLimit = 200,
    maxMessageLimit = 10,
  ) => {
    // 从数据库查询消息记录
    // 条件：属于指定对话、答案非空、未删除、状态为正常/停止/超时
    const messageRecords = await db
      .select()
      .from(message)
      .where(
        and(
          eq(message.conversationId, conversationRecord.id),
          ne(message.answer, ''), // 排除空答案的消息
          eq(message.isDeleted, false), // 排除已删除的消息
          inArray(message.status, [
            MessageStatus.NORMAL,
            MessageStatus.STOP,
            MessageStatus.TIMEOUT,
          ]), // 只包含有效状态的消息
        ),
      )
      .orderBy(desc(message.createdAt)) // 按创建时间倒序排列
      .limit(maxMessageLimit); // 限制返回的消息数量

    // 将数据库记录转换为 LangChain 消息对象
    const messages = [];
    for (const messageRecord of messageRecords.reverse()) {
      // 注意：reverse() 是为了按时间正序排列消息
      messages.push(new HumanMessage(messageRecord.query));
      messages.push(new AIMessage(messageRecord.answer));
    }

    // 根据 token 限制优化消息列表
    // 策略：保留最后的消息，从人类消息开始，以 AI 消息结束
    return await trimMessages(messages, {
      maxTokens: maxTokenLimit,
      tokenCounter: modelInstance,
      strategy: 'last', // 保留最后的消息
      startOn: 'human', // 从人类消息开始
      endOn: 'ai', // 以 AI 消息结束
    });
  };

  /**
   * 获取历史对话的文本格式
   *
   * 将历史消息转换为文本格式，便于在提示词中使用。
   *
   * @param maxTokenLimit - 最大 token 限制，默认为 2000
   * @param maxMessageLimit - 最大消息数量限制，默认为 10
   * @param humanPrefix - 人类消息的前缀，默认为 'Human: '
   * @param aiPrefix - AI 消息的前缀，默认为 'AI: '
   * @returns 格式化的历史对话文本
   */
  const getHistoryPromptText = async (
    maxTokenLimit = 2000,
    maxMessageLimit = 10,
    humanPrefix = 'Human: ',
    aiPrefix = 'AI: ',
  ) => {
    // 获取历史消息列表
    const messages = await getHistoryPromptMessages(
      maxTokenLimit,
      maxMessageLimit,
    );

    // 将消息列表转换为文本格式
    return getBufferString(messages, humanPrefix, aiPrefix);
  };

  // 返回包含两个方法的对象
  return {
    getHistoryPromptMessages,
    getHistoryPromptText,
  };
};
