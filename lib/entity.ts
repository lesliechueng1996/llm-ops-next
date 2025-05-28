/**
 * 实体类型定义和验证
 *
 * 本文件定义了系统中使用的各种实体类型和验证规则，包括：
 * 1. 文件上传相关的配置（图片类型和大小限制）
 * 2. API 工具参数的类型定义和验证
 * 3. OpenAPI 规范的类型定义和验证
 */

import { z } from 'zod';

/**
 * 允许上传的图片文件扩展名列表
 * 支持的格式包括：PNG、JPG、JPEG、GIF、WEBP、SVG
 * 这些格式都是常见的网页图片格式，具有良好的浏览器兼容性
 */
export const ALLOWED_IMAGE_EXTENSIONS = [
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'svg',
];

/**
 * 允许上传的图片文件大小限制
 * 设置为 5MB (5 * 1024 * 1024 字节)
 * 这个限制可以防止过大的文件上传，保护服务器资源
 */
export const ALLOWED_IMAGE_SIZE = 1024 * 1024 * 5;

/**
 * 允许的 HTTP 方法列表
 * 包括：GET、POST、PUT、DELETE、PATCH
 * 这些是 RESTful API 中最常用的 HTTP 方法
 */
const ALLOWED_METHODS = ['get', 'post', 'put', 'delete', 'patch'] as const;

/**
 * 允许的参数位置列表
 * 包括：path、query、header、cookie、body
 * 这些位置对应了 HTTP 请求中参数可以放置的不同位置
 */
const ALLOWED_PARAMETER_LOCATIONS = [
  'path',
  'query',
  'header',
  'cookie',
  'body',
] as const;

/**
 * 允许的参数类型列表
 * 包括：string、integer、float、boolean
 * 这些是 API 参数支持的基本数据类型
 */
export const ALLOWED_PARAMETER_TYPE = [
  'string',
  'integer',
  'float',
  'boolean',
] as const;

/**
 * API 工具参数的验证模式
 * 定义了参数必须包含的字段和验证规则：
 * - name: 参数名称（非空字符串）
 * - in: 参数位置（必须是允许的位置之一）
 * - description: 参数描述（非空字符串）
 * - required: 是否必需（布尔值）
 * - type: 参数类型（必须是允许的类型之一）
 */
const parameterSchema = z.array(
  z.object({
    name: z.string().trim().nonempty({ message: 'name 应是一个非空的字符串' }),
    in: z.enum(ALLOWED_PARAMETER_LOCATIONS, {
      message: 'in 应是 path, query, header, cookie, body 其中之一',
    }),
    description: z
      .string()
      .trim()
      .nonempty({ message: 'description 应是一个非空的字符串' }),
    required: z.boolean({ message: 'required 应是一个布尔值' }),
    type: z.enum(ALLOWED_PARAMETER_TYPE, {
      message: 'type 应是 string, integer, float, boolean 其中之一',
    }),
  }),
  { message: 'parameters 应是一个对象数组' },
);

/**
 * API 工具参数的类型定义
 * 基于 parameterSchema 的类型推断
 */
export type ApiToolParameter = z.infer<typeof parameterSchema>;

/**
 * OpenAPI 规范的验证模式
 * 定义了 OpenAPI 文档必须包含的字段和验证规则：
 * - server: 服务器 URL（必须是合法的 URL）
 * - description: API 描述（非空字符串）
 * - paths: API 路径定义（包含方法、描述、操作 ID 和参数）
 */
export const openapiSchema = z.object({
  server: z.string().url({ message: 'server 应是一个合法的 url' }),
  description: z
    .string()
    .trim()
    .nonempty({ message: 'description 应是一个非空的字符串' }),
  paths: z.record(
    z.string(),
    z.record(
      z.enum(ALLOWED_METHODS, {
        message: 'method 应是 get, post, put, delete, patch 其中之一',
      }),
      z.object({
        description: z
          .string()
          .trim()
          .nonempty({ message: 'description 应是一个非空的字符串' }),
        operationId: z
          .string()
          .trim()
          .nonempty({ message: 'operationId 应是一个非空的字符串' }),
        parameters: parameterSchema,
      }),
    ),
    { message: 'paths 应是一个对象' },
  ),
});

/**
 * OpenAPI 规范的类型定义
 * 基于 openapiSchema 的类型推断
 */
export type OpenapiSchema = z.infer<typeof openapiSchema>;
