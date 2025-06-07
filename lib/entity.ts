/**
 * 实体类型定义和验证
 *
 * 本文件定义了系统中使用的各种实体类型和验证规则，包括：
 * 1. 文件上传相关的配置（图片类型和大小限制）
 * 2. API 工具参数的类型定义和验证
 * 3. OpenAPI 规范的类型定义和验证
 * 4. 文本处理规则的定义
 * 5. 文档处理状态的定义
 * 6. 分布式锁的键定义
 *
 * 主要组件：
 * - 图片上传配置：定义允许的图片格式和大小限制
 * - API 参数验证：使用 Zod 定义参数验证规则
 * - OpenAPI 规范：定义 API 文档的结构和验证规则
 * - 文本处理规则：定义默认的文本预处理和分段规则
 * - 文档状态：定义文档处理流程中的各种状态
 * - 分布式锁：定义用于并发控制的锁键
 *
 * @module entity
 */

import { z } from 'zod';

/**
 * 允许上传的图片文件扩展名列表
 * 支持的格式包括：PNG、JPG、JPEG、GIF、WEBP、SVG
 * 这些格式都是常见的网页图片格式，具有良好的浏览器兼容性
 *
 * @constant
 * @type {string[]}
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
 *
 * @constant
 * @type {number}
 */
export const ALLOWED_IMAGE_SIZE = 1024 * 1024 * 5;

/**
 * 允许的 HTTP 方法列表
 * 包括：GET、POST、PUT、DELETE、PATCH
 * 这些是 RESTful API 中最常用的 HTTP 方法
 *
 * @constant
 * @type {readonly string[]}
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
 * 使用 Zod 定义了参数必须包含的字段和验证规则：
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
 * 使用 Zod 定义了 OpenAPI 文档必须包含的字段和验证规则：
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

/**
 * 默认的文本处理规则
 * 定义了文本预处理和分段的基本规则：
 *
 * 预处理规则：
 * - remove_extra_space: 移除多余的空格
 * - remove_url_and_email: 移除 URL 和邮箱地址
 *
 * 分段规则：
 * - 使用多种分隔符进行文本分段，包括：
 *   - 段落分隔（\n\n）
 *   - 行分隔（\n）
 *   - 中文标点（。！？）
 *   - 英文标点（.!?）
 *   - 分号（；;）
 *   - 逗号（，,）
 *   - 空格
 * - 每个分块大小为 500 字符
 * - 分块重叠 50 字符，以保持上下文连贯性
 */
export const DEFAULT_PROCESS_RULE = {
  mode: 'custom',
  rule: {
    pre_process_rules: [
      { id: 'remove_extra_space', enabled: true },
      { id: 'remove_url_and_email', enabled: true },
    ],
    segment: {
      separators: [
        '\n\n',
        '\n',
        '。',
        '！',
        '？',
        '.',
        '!',
        '?',
        '；',
        ';',
        '，',
        ',',
        ' ',
        '',
      ],
      chunk_size: 500,
      chunk_overlap: 50,
    },
  },
};

/**
 * 文档处理状态枚举
 * 定义了文档在整个处理流程中可能处于的各种状态：
 * - WAITING: 等待处理，文档已上传但尚未开始处理
 * - PARSING: 正在解析，系统正在解析文档内容
 * - SPLITTING: 正在分段，系统正在将文档分割成更小的片段
 * - INDEXING: 正在索引，系统正在为文档建立索引
 * - COMPLETED: 处理完成，文档已成功处理完成
 * - ERROR: 处理错误，文档处理过程中发生错误
 *
 * @enum {string}
 */
export enum DocumentStatus {
  /** 等待处理状态 */
  WAITING = 'waiting',
  /** 正在解析状态 */
  PARSING = 'parsing',
  /** 正在分段状态 */
  SPLITTING = 'splitting',
  /** 正在索引状态 */
  INDEXING = 'indexing',
  /** 处理完成状态 */
  COMPLETED = 'completed',
  /** 处理错误状态 */
  ERROR = 'error',
}

/**
 * 文档片段处理状态枚举
 * 定义了文档片段在处理过程中可能处于的各种状态：
 * - WAITING: 等待处理，片段已创建但尚未开始处理
 * - INDEXING: 正在索引，系统正在为片段建立索引
 * - COMPLETED: 处理完成，片段已成功处理完成
 * - ERROR: 处理错误，片段处理过程中发生错误
 *
 * @enum {string}
 */
export enum SegmentStatus {
  /** 等待处理状态 */
  WAITING = 'waiting',
  /** 正在索引状态 */
  INDEXING = 'indexing',
  /** 处理完成状态 */
  COMPLETED = 'completed',
  /** 处理错误状态 */
  ERROR = 'error',
}

/**
 * 文档更新锁的键模板
 * 用于在更新文档时防止并发操作
 * 格式：lock:document:update:enabled_{document_id}
 *
 * @constant
 * @type {string}
 */
export const LOCK_DOCUMENT_UPDATE_ENABLED =
  'lock:document:update:enabled_{document_id}';

/**
 * 关键词表更新锁的键模板
 * 用于在更新数据集的关键词表时防止并发操作
 * 格式：lock:keyword_table:update:keyword_table_{dataset_id}
 *
 * @constant
 * @type {string}
 */
export const LOCK_KEYWORD_TABLE_UPDATE_KEYWORD_TABLE =
  'lock:keyword_table:update:keyword_table_{dataset_id}';
