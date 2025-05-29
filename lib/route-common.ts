/**
 * 路由通用工具模块
 * 提供路由处理相关的通用功能，包括错误处理和响应格式化
 */

import { BaseException } from '@/exceptions';
import { ZodError } from 'zod';
import { log } from './logger';

/**
 * 处理路由错误并返回标准化的错误响应
 * @param error - 捕获的错误对象
 * @returns 格式化的错误响应
 */
export const handleRouteError = (error: unknown) => {
  // 处理 Zod 验证错误
  if (error instanceof ZodError) {
    const errorMessage = error.issues
      .map((item) => {
        const path = item.path.join('.');
        return `${path}: ${item.message}`;
      })
      .join('\n');

    log.error('请求参数错误: %o', error);
    return Response.json(
      {
        code: 'BAD_REQUEST',
        data: error,
        message: errorMessage,
      },
      {
        status: 400,
      },
    );
  }

  // 处理自定义业务异常
  if (error instanceof BaseException) {
    log.error('业务异常: %o', error);
    return Response.json(
      {
        code: error.resultCode,
        data: null,
        message: error.message,
      },
      {
        status: error.code,
      },
    );
  }

  // 处理未知错误
  log.error('未知错误: %o', error);
  return Response.json(
    {
      code: 'INTERNAL_SERVER_ERROR',
      data: null,
      message: '未知错误',
    },
    {
      status: 500,
    },
  );
};

/**
 * 路由响应结果类型定义
 * @template T - 响应数据的类型
 */
export type RouteResult<T> = {
  code: string; // 响应状态码
  data: T; // 响应数据
  message: string; // 响应消息
};

/**
 * 创建成功响应
 * @template T - 响应数据的类型
 * @param data - 响应数据
 * @param status - HTTP 状态码，默认为 200
 * @param message - 响应消息，默认为"操作成功"
 * @returns 格式化的成功响应
 */
export const successResult = <T>(
  data: T,
  status = 200,
  message = '操作成功',
) => {
  return Response.json(
    {
      code: 'SUCCESS',
      data,
      message,
    },
    {
      status,
    },
  );
};
