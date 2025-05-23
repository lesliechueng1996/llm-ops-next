/**
 * API Key 管理服务
 * 提供 API Key 的创建、删除、更新和查询等核心功能
 * 包含权限验证和数据库操作
 */

import { ForbiddenException } from '@/exceptions';
import { auth } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { apikey } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

/**
 * 创建新的 API Key
 * @param {string} userId - 用户ID
 * @param {boolean} isActive - API Key 的激活状态
 * @param {string} remark - API Key 的备注信息
 * @returns {Promise<ApiKey>} 创建的 API Key 信息
 */
export const createApiKey = async (
  userId: string,
  isActive: boolean,
  remark: string,
) => {
  const apiKey = await auth.api.createApiKey({
    body: {
      name: remark,
      userId,
      rateLimitEnabled: false,
      prefix: 'llmops-v1',
    },
  });
  if (!isActive) {
    await db
      .update(apikey)
      .set({ enabled: false })
      .where(eq(apikey.id, apiKey.id));

    apiKey.enabled = false;
  }
  return apiKey;
};

/**
 * 删除指定的 API Key
 * @param {string} userId - 用户ID
 * @param {string} keyId - 要删除的 API Key ID
 * @throws {ForbiddenException} 当 API Key 不存在或用户无权限时抛出
 */
export const deleteApiKey = async (userId: string, keyId: string) => {
  const apiKeyRecord = await getApiKey(userId, keyId);
  if (apiKeyRecord.length === 0) {
    throw new ForbiddenException('API秘钥不存在或无权限操作');
  }
  await db.delete(apikey).where(eq(apikey.id, keyId));
};

/**
 * 更新 API Key 的信息
 * @param {string} userId - 用户ID
 * @param {string} keyId - 要更新的 API Key ID
 * @param {boolean} isActive - 新的激活状态
 * @param {string} remark - 新的备注信息
 * @throws {ForbiddenException} 当 API Key 不存在或用户无权限时抛出
 */
export const updateApiKey = async (
  userId: string,
  keyId: string,
  isActive: boolean,
  remark: string,
) => {
  const apiKeyRecord = await getApiKey(userId, keyId);
  if (apiKeyRecord.length === 0) {
    throw new ForbiddenException('API秘钥不存在或无权限操作');
  }
  await db
    .update(apikey)
    .set({
      enabled: isActive,
      name: remark,
    })
    .where(eq(apikey.id, keyId));
};

/**
 * 获取指定用户的 API Key 信息
 * @param {string} userId - 用户ID
 * @param {string} keyId - API Key ID
 * @returns {Promise<ApiKey[]>} API Key 信息数组
 */
export const getApiKey = async (userId: string, keyId: string) => {
  return await db
    .select()
    .from(apikey)
    .where(and(eq(apikey.userId, userId), eq(apikey.id, keyId)));
};

/**
 * 仅更新 API Key 的激活状态
 * @param {string} userId - 用户ID
 * @param {string} keyId - 要更新的 API Key ID
 * @param {boolean} isActive - 新的激活状态
 * @throws {ForbiddenException} 当 API Key 不存在或用户无权限时抛出
 */
export const updateApiKeyIsActive = async (
  userId: string,
  keyId: string,
  isActive: boolean,
) => {
  const apiKeyRecord = await getApiKey(userId, keyId);
  if (apiKeyRecord.length === 0) {
    throw new ForbiddenException('API秘钥不存在或无权限操作');
  }
  await db
    .update(apikey)
    .set({ enabled: isActive })
    .where(eq(apikey.id, keyId));
};
