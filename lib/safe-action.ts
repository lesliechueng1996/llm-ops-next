/**
 * 安全操作客户端工具
 *
 * 这个文件提供了两个主要的客户端工具：
 * 1. actionClient: 基础安全操作客户端，提供错误处理和性能监控
 * 2. authActionClient: 带有身份验证功能的安全操作客户端
 *
 * 这些工具用于在 Next.js 应用中安全地处理服务器端操作，
 * 包括输入验证、错误处理和身份验证。
 */

import { BaseException } from '@/exceptions';
import { db } from '@/lib/db';
import { session } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createSafeActionClient } from 'next-safe-action';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { log } from './logger';

// 创建基础安全操作客户端，配置元数据模式和错误处理
export const actionClient = createSafeActionClient({
  // 定义元数据模式，要求每个操作都必须包含 actionName
  defineMetadataSchema: () => {
    return z.object({
      actionName: z.string(),
    });
  },
  // 统一的错误处理逻辑
  handleServerError: (error, utils) => {
    const { clientInput, metadata } = utils;
    log.error('clientInput: %o', clientInput);
    log.error('metadata: %o', metadata);
    log.error('Error: %o', error);
    if (error instanceof BaseException) {
      return error.message;
    }
    return '服务器错误';
  },
}).use(async ({ next, clientInput, metadata }) => {
  // 性能监控中间件
  const startTime = performance.now();
  const result = await next();
  const endTime = performance.now();
  log.debug('Result -> %o', result);
  log.debug('Client input -> %o', clientInput);
  log.debug('Metadata -> %o', metadata);
  log.debug('Action execution took: %dms', endTime - startTime);
  return result;
});

// 创建带有身份验证功能的安全操作客户端
export const authActionClient = actionClient.use(async ({ next }) => {
  // 从 cookie 中获取会话令牌
  const cookieStore = await cookies();
  const sessionToken =
    cookieStore.get('better-auth.session_token')?.value ?? '';

  const token = sessionToken.split('.')[0];

  // 验证会话令牌并获取用户信息
  const sessionRecord = await db
    .select()
    .from(session)
    .where(eq(session.token, token));

  log.debug('sessionRecord: %o', sessionRecord);
  if (!sessionRecord || sessionRecord.length === 0) {
    log.error('Unauthorized: %s', sessionToken);
    redirect('/login');
  }

  // 将用户ID添加到上下文中
  return next({ ctx: { userId: sessionRecord[0].userId } });
});
