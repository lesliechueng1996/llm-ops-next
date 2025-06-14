/**
 * 对话服务模块
 * 提供对话相关的核心功能，包括创建和管理调试对话
 */

import { db } from '@/lib/db';
import { app, conversation } from '@/lib/db/schema';
import { InvokeFrom } from '@/lib/entity';
import { and, eq } from 'drizzle-orm';

/**
 * 获取或创建调试对话
 * 如果提供了debugConversationId，则尝试获取现有对话
 * 如果对话不存在或未提供ID，则创建新的调试对话
 *
 * @param debugConversationId - 调试对话ID，可为null
 * @param appId - 应用ID
 * @param userId - 用户ID
 * @returns 返回对话记录
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
