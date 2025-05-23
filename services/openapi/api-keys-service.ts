/**
 * API Key 管理服务
 *
 * 该服务提供完整的 API Key 生命周期管理功能，包括：
 * - API Key 的创建、删除、更新和查询
 * - 权限验证和访问控制
 * - 分页列表查询
 * - 状态管理（启用/禁用）
 *
 * 所有操作都会进行用户权限验证，确保安全性。
 * 使用 Drizzle ORM 进行数据库操作，确保数据一致性。
 */

import { ForbiddenException } from '@/exceptions';
import { auth } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { apikey } from '@/lib/db/schema';
import { calculatePagination, paginationResult } from '@/lib/paginator';
import type { PageReq } from '@/schemas/common-schema';
import { and, count, desc, eq } from 'drizzle-orm';

/**
 * 创建新的 API Key
 *
 * @param {string} userId - 用户ID，用于关联 API Key 的所有者
 * @param {boolean} isActive - API Key 的初始激活状态
 * @param {string} remark - API Key 的备注信息，用于标识用途
 * @returns {Promise<ApiKey>} 返回创建的 API Key 完整信息
 * @throws {Error} 当创建过程中发生错误时抛出
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
 *
 * @param {string} userId - 用户ID，用于验证操作权限
 * @param {string} keyId - 要删除的 API Key ID
 * @throws {ForbiddenException} 当 API Key 不存在或用户无权限时抛出
 * @throws {Error} 当删除过程中发生其他错误时抛出
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
 *
 * @param {string} userId - 用户ID，用于验证操作权限
 * @param {string} keyId - 要更新的 API Key ID
 * @param {boolean} isActive - 新的激活状态
 * @param {string} remark - 新的备注信息
 * @throws {ForbiddenException} 当 API Key 不存在或用户无权限时抛出
 * @throws {Error} 当更新过程中发生其他错误时抛出
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
 *
 * @param {string} userId - 用户ID，用于验证操作权限
 * @param {string} keyId - API Key ID
 * @returns {Promise<ApiKey[]>} 返回匹配的 API Key 信息数组
 * @throws {Error} 当查询过程中发生错误时抛出
 */
export const getApiKey = async (userId: string, keyId: string) => {
  return await db
    .select()
    .from(apikey)
    .where(and(eq(apikey.userId, userId), eq(apikey.id, keyId)));
};

/**
 * 仅更新 API Key 的激活状态
 *
 * @param {string} userId - 用户ID，用于验证操作权限
 * @param {string} keyId - 要更新的 API Key ID
 * @param {boolean} isActive - 新的激活状态
 * @throws {ForbiddenException} 当 API Key 不存在或用户无权限时抛出
 * @throws {Error} 当更新过程中发生其他错误时抛出
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

/**
 * 分页获取用户的 API Key 列表
 *
 * @param {string} userId - 用户ID，用于获取该用户的所有 API Key
 * @param {PageReq} pageReq - 分页请求参数，包含页码和每页数量
 * @returns {Promise<{list: ApiKey[], total: number, page: number, pageSize: number}>}
 *         返回分页后的 API Key 列表和分页信息
 * @throws {Error} 当查询过程中发生错误时抛出
 */
export const listApiKeysByPage = async (userId: string, pageReq: PageReq) => {
  const { offset, limit } = calculatePagination(pageReq);
  const listQuery = db
    .select({
      id: apikey.id,
      apiKey: apikey.key,
      isActive: apikey.enabled,
      remark: apikey.name,
      createdAt: apikey.createdAt,
      updatedAt: apikey.updatedAt,
    })
    .from(apikey)
    .where(eq(apikey.userId, userId))
    .orderBy(desc(apikey.createdAt))
    .limit(limit)
    .offset(offset);

  const countQuery = db
    .select({ count: count() })
    .from(apikey)
    .where(eq(apikey.userId, userId));

  const [list, total] = await Promise.all([listQuery, countQuery]);

  const formattedList = list.map((item) => ({
    ...item,
    isActive: item.isActive ?? false,
    remark: item.remark ?? '',
    createdAt: item.createdAt.getTime(),
    updatedAt: item.updatedAt.getTime(),
  }));

  return paginationResult(formattedList, total[0].count, pageReq);
};
