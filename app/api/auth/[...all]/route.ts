/**
 * 认证路由处理器
 *
 * 这个文件处理所有与认证相关的 API 路由请求。
 * 使用 better-auth 库的 Next.js 适配器来处理认证请求。
 * 支持所有认证相关的 HTTP 方法（GET 和 POST）。
 *
 * @module
 * @exports {Object} 导出处理 GET 和 POST 请求的路由处理器
 */
import { auth } from '@/lib/auth/auth';
import { toNextJsHandler } from 'better-auth/next-js';

export const { POST, GET } = toNextJsHandler(auth);
