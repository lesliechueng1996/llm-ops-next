/**
 * 认证相关的数据访问层（DAL）模块
 * 提供 API 密钥验证等认证相关的功能
 */

import { UnauthorizedException } from '@/exceptions';
import { headers } from 'next/headers';
import { auth } from './auth';
import { log } from '../logger';

/**
 * 验证 API 密钥的有效性
 *
 * 此函数会：
 * 1. 从请求头中获取 Authorization 头
 * 2. 验证 API 密钥的格式（必须以 'Bearer ' 开头）
 * 3. 调用认证服务验证密钥的有效性
 *
 * @returns {Promise<{apiKey: any, userId: string}>} 返回验证成功后的 API 密钥记录和用户 ID
 * @throws {UnauthorizedException} 当 API 密钥缺失、格式无效或验证失败时抛出
 */
export const verifyApiKey = async () => {
  // 从请求头中获取 Authorization
  const headersList = await headers();
  const apiKey = headersList.get('Authorization');

  // 检查 API 密钥是否存在
  if (!apiKey) {
    log.error('No API key provided');
    throw new UnauthorizedException('No API key provided');
  }

  // 验证 API 密钥格式
  if (!apiKey.startsWith('Bearer ')) {
    log.error('Invalid API key format');
    throw new UnauthorizedException('Invalid API key format');
  }

  // 提取实际的密钥值
  const key = apiKey.split(' ')[1];

  // 调用认证服务验证密钥
  const {
    valid,
    error,
    key: apiKeyRecord,
  } = await auth.api.verifyApiKey({
    body: {
      key,
    },
  });

  // 验证结果处理
  if (!valid || !apiKeyRecord) {
    log.error('Invalid API key', error);
    throw new UnauthorizedException('Invalid API key');
  }

  return {
    apiKey: apiKeyRecord,
    userId: apiKeyRecord?.userId,
  };
};
