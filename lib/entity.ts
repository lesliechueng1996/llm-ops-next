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
 * 7. 应用配置和状态的定义
 * 8. 调用来源的定义
 *
 * 主要组件：
 * - 图片上传配置：定义允许的图片格式和大小限制
 * - API 参数验证：使用 Zod 定义参数验证规则
 * - OpenAPI 规范：定义 API 文档的结构和验证规则
 * - 文本处理规则：定义默认的文本预处理和分段规则
 * - 文档状态：定义文档处理流程中的各种状态
 * - 分布式锁：定义用于并发控制的锁键
 * - 应用配置：定义应用的默认配置和状态
 * - 调用来源：定义系统调用的不同来源（服务 API、Web 应用、调试器）
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
    preProcessRules: [
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
      chunkSize: 500,
      chunkOverlap: 50,
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

/**
 * 文档片段启用状态更新锁的键模板
 * 用于在更新文档片段启用状态时防止并发操作
 * 格式：lock:segment:update:enabled_{segment_id}
 *
 * @constant
 * @type {string}
 */
export const LOCK_SEGMENT_UPDATE_ENABLED =
  'lock:segment:update:enabled_{segment_id}';

/**
 * 应用配置类型枚举
 * 定义了应用配置的两种状态：
 * - DRAFT: 草稿状态，表示配置尚未发布
 * - PUBLISHED: 已发布状态，表示配置已经发布并生效
 */
export enum AppConfigType {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

/**
 * 模型配置类型定义
 * 定义了模型配置的结构，包括：
 * - provider: 模型提供商
 * - model: 模型名称
 * - parameters: 模型参数配置
 *   - temperature: 温度参数，控制输出的随机性
 *   - topP: 核采样参数，控制输出的多样性
 *   - frequencyPenalty: 频率惩罚参数，控制重复内容的生成
 *   - presencePenalty: 存在惩罚参数，控制主题的重复
 *   - maxTokens: 最大生成令牌数
 */
export type ModelConfig = {
  provider: string;
  model: string;
  parameters: {
    temperature: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
    maxTokens: number;
  };
};

export type DraftAppConfig = {
  modelConfig: ModelConfig;
  dialogRound: number;
  presetPrompt: string;
  tools: Array<{
    type: 'builtin_tool' | 'api_tool';
    providerId: string;
    toolId: string;
    params: Record<string, unknown>;
  }>;
  // TODO: add workflows definition
  workflows: unknown;
  datasets: Array<string>;
  retrievalConfig: {
    retrievalStrategy: 'full_text' | 'semantic' | 'hybrid';
    k: number;
    score: number;
  };
  longTermMemory: {
    enable: boolean;
  };
  openingStatement: string;
  openingQuestions: Array<string>;
  speechToText: {
    enable: boolean;
  };
  textToSpeech: {
    enable: boolean;
    autoPlay: boolean;
    voice: 'echo';
  };
  reviewConfig: {
    enable: boolean;
    keywords: Array<string>;
    inputsConfig: {
      enable: boolean;
      presetResponse: string;
    };
    outputsConfig: {
      enable: boolean;
    };
  };
  suggestedAfterAnswer: {
    enable: boolean;
  };
};

/**
 * 默认应用配置
 * 定义了应用的默认配置参数，包括：
 * - modelConfig: 模型配置（提供商、模型名称、参数等）
 * - dialogRound: 对话轮次限制
 * - presetPrompt: 预设提示词
 * - tools: 可用工具列表
 * - workflows: 工作流配置
 * - datasets: 数据集配置
 * - retrievalConfig: 检索配置
 * - longTermMemory: 长期记忆配置
 * - openingStatement: 开场白
 * - openingQuestions: 开场问题列表
 * - speechToText: 语音转文字配置
 * - textToSpeech: 文字转语音配置
 * - reviewConfig: 审核配置
 * - suggestedAfterAnswer: 回答后建议配置
 */
export const DEFAULT_APP_CONFIG: DraftAppConfig = {
  modelConfig: {
    provider: 'openai',
    model: 'gpt-4o-mini',
    parameters: {
      temperature: 0.5,
      topP: 0.85,
      frequencyPenalty: 0.2,
      presencePenalty: 0.2,
      maxTokens: 8192,
    },
  },
  dialogRound: 3,
  presetPrompt: '',
  tools: [],
  workflows: [],
  datasets: [],
  retrievalConfig: {
    retrievalStrategy: 'semantic',
    k: 10,
    score: 0.5,
  },
  longTermMemory: {
    enable: false,
  },
  openingStatement: '',
  openingQuestions: [],
  speechToText: {
    enable: false,
  },
  textToSpeech: {
    enable: false,
    voice: 'echo',
    autoPlay: false,
  },
  reviewConfig: {
    enable: false,
    keywords: [],
    inputsConfig: {
      enable: false,
      presetResponse: '',
    },
    outputsConfig: {
      enable: false,
    },
  },
  suggestedAfterAnswer: {
    enable: true,
  },
};

/**
 * 应用状态枚举
 * 定义了应用的两种状态：
 * - DRAFT: 草稿状态，表示应用尚未发布
 * - PUBLISHED: 已发布状态，表示应用已经发布并可用
 */
export enum AppStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

/**
 * 调用来源枚举
 * 定义了系统调用的不同来源：
 * - SERVICE_API: 服务 API 调用
 * - WEB_APP: Web 应用调用
 * - DEBUGGER: 调试器调用
 *
 * @enum {string}
 */
export enum InvokeFrom {
  /** 服务 API 调用 */
  SERVICE_API = 'service_api',
  /** Web 应用调用 */
  WEB_APP = 'web_app',
  /** 调试器调用 */
  DEBUGGER = 'debugger',
}
