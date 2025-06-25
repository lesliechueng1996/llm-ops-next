/**
 * 应用相关的 Zod schema 定义
 * 包含以下 schema:
 * - createAppReqSchema: 创建应用的请求验证
 * - getAppListReqSchema: 获取应用列表的请求验证
 * - updateAppReqSchema: 更新应用的请求验证
 * - updateDraftAppConfigReqSchema: 更新应用草稿配置的请求验证
 * - updateAppSummaryReqSchema: 更新应用摘要的请求验证
 * - appConversationReqSchema: 应用对话请求验证
 * - getConversationMessagesReqSchema: 获取对话消息的请求验证
 * - getAppPublishHistoriesReqSchema: 获取应用发布历史的请求验证
 * - fallbackAppConfigReqSchema: 回退应用配置的请求验证
 */

import { RetrievalStrategy } from '@/lib/entity';
import { pageReqSchema, searchPageReqSchema } from '@/schemas/common-schema';
import { z } from 'zod';

/**
 * 创建应用的请求验证 schema
 * @property {string} name - 应用名称，1-40个字符
 * @property {string} icon - 应用图标URL
 * @property {string} [description] - 应用描述，可选，最多800个字符
 */
export const createAppReqSchema = z.object({
  name: z
    .string()
    .min(1, '应用名称不能为空')
    .max(40, '应用名称不能超过 40 个字符'),
  icon: z.string().url('图标 URL 地址格式不正确'),
  description: z.string().max(800, '应用描述不能超过 800 个字符').optional(),
});

export type CreateAppReq = z.infer<typeof createAppReqSchema>;

/**
 * 获取应用列表的请求验证 schema
 * 继承自通用的分页搜索 schema
 */
export const getAppListReqSchema = searchPageReqSchema;

/**
 * 更新应用的请求验证 schema
 * @property {string} name - 应用名称，1-40个字符
 * @property {string} icon - 应用图标URL
 * @property {string} [description] - 应用描述，可选，最多800个字符
 */
export const updateAppReqSchema = z.object({
  name: z
    .string()
    .min(1, '应用名称不能为空')
    .max(40, '应用名称不能超过 40 个字符'),
  icon: z.string().url('图标 URL 地址格式不正确'),
  description: z.string().max(800, '应用描述不能超过 800 个字符').optional(),
});

export type UpdateAppReq = z.infer<typeof updateAppReqSchema>;

/**
 * 更新应用草稿配置的请求验证 schema
 * 这是应用配置的核心schema，包含了应用的所有功能配置
 *
 * @property {any} modelConfig - 模型配置（待完善验证规则）
 * @property {number} dialogRound - 对话轮次，0-100之间的整数
 * @property {string} presetPrompt - 人设与回复逻辑设置，最多2000字符
 * @property {Array<{type: 'builtin_tool'|'api_tool', providerId: string, toolId: string, params: Record<string, any>}>} tools - 插件配置，最多5个
 * @property {any} workflows - 工作流配置（待完善验证规则）
 * @property {string[]} datasets - 知识库配置，最多5个
 * @property {Object} retrievalConfig - 检索配置
 * @property {string} retrievalConfig.retrievalStrategy - 检索策略：'full_text'|'semantic'|'hybrid'
 * @property {number} retrievalConfig.k - 召回数量，0-10之间的整数
 * @property {number} retrievalConfig.score - 匹配度阈值，0-1之间的小数
 * @property {Object} longTermMemory - 长期记忆配置
 * @property {boolean} longTermMemory.enable - 是否启用长期记忆
 * @property {string} openingStatement - 开场白，最多2000字符
 * @property {string[]} openingQuestions - 建议问题，最多3个
 * @property {Object} speechToText - 语音转文字配置
 * @property {boolean} speechToText.enable - 是否启用语音转文字
 * @property {Object} textToSpeech - 文字转语音配置
 * @property {boolean} textToSpeech.enable - 是否启用文字转语音
 * @property {boolean} textToSpeech.autoPlay - 是否自动播放
 * @property {string} textToSpeech.voice - 语音类型，目前仅支持'echo'
 * @property {Object} reviewConfig - 审核配置
 * @property {boolean} reviewConfig.enable - 是否启用审核
 * @property {string[]} reviewConfig.keywords - 关键词列表，最多100个
 * @property {Object} reviewConfig.inputsConfig - 输入审核配置
 * @property {boolean} reviewConfig.inputsConfig.enable - 是否启用输入审核
 * @property {string} reviewConfig.inputsConfig.presetResponse - 预设回复内容
 * @property {Object} reviewConfig.outputsConfig - 输出审核配置
 * @property {boolean} reviewConfig.outputsConfig.enable - 是否启用输出审核
 * @property {Object} suggestedAfterAnswer - 回答后建议配置
 * @property {boolean} suggestedAfterAnswer.enable - 是否启用回答后建议
 */
export const updateDraftAppConfigReqSchema = z
  .object({
    // TODO: 需要验证 modelConfig 的格式 - 当前使用 z.any() 作为临时方案
    modelConfig: z.any(),

    // 对话轮次限制，防止无限对话消耗资源
    dialogRound: z
      .number()
      .int()
      .min(0, '对话轮次设置无效: 请输入0-100之间的整数')
      .max(100, '对话轮次设置无效: 请输入0-100之间的整数'),

    // 人设与回复逻辑设置，限制长度避免过长的提示词
    presetPrompt: z
      .string()
      .max(2000, '人设与回复逻辑设置无效: 内容不能超过2000字符'),

    // 插件配置，支持内置工具和API工具两种类型
    tools: z
      .array(
        z.object({
          type: z.enum(['builtin_tool', 'api_tool'], {
            required_error: '插件类型错误: 仅支持内置插件或API插件',
            invalid_type_error: '插件类型错误: 仅支持内置插件或API插件',
          }),
          providerId: z
            .string()
            .min(1, '插件提供者ID无效: 必须提供有效的字符串标识'),
          toolId: z.string().min(1, '插件工具ID无效: 必须提供有效的字符串标识'),
          params: z.record(z.any(), {
            required_error: '插件参数格式错误: 必须为对象格式',
            invalid_type_error: '插件参数格式错误: 必须为对象格式',
          }),
        }),
      )
      .max(5, '插件数量超限: 最多支持5个插件'),

    // TODO: 需要验证 workflows 的格式 - 当前使用 z.any() 作为临时方案
    workflows: z.any(),

    // 知识库配置，限制数量避免性能问题
    datasets: z.array(z.string()).max(5, '知识库数量超限: 最多支持5个知识库'),

    // 检索配置，包含策略、召回数量和匹配度阈值
    retrievalConfig: z.object({
      retrievalStrategy: z.enum(
        [
          RetrievalStrategy.FULL_TEXT,
          RetrievalStrategy.SEMANTIC,
          RetrievalStrategy.HYBRID,
        ],
        {
          required_error: '检索策略无效: 仅支持全文、语义或混合检索',
          invalid_type_error: '检索策略无效: 仅支持全文、语义或混合检索',
        },
      ),
      k: z
        .number()
        .int()
        .min(0, '召回数量设置无效: 请输入0-10之间的整数')
        .max(10, '召回数量设置无效: 请输入0-10之间的整数'),
      score: z
        .number()
        .min(0, '匹配度阈值无效: 请输入0-1之间的小数')
        .max(1, '匹配度阈值无效: 请输入0-1之间的小数'),
    }),

    // 长期记忆配置
    longTermMemory: z.object({
      enable: z.boolean(),
    }),

    // 开场白设置，限制长度
    openingStatement: z
      .string()
      .max(2000, '开场白设置无效: 请输入不超过2000字符的文本内容'),

    // 建议问题配置，限制数量
    openingQuestions: z
      .array(z.string())
      .max(3, '建议问题数量超限: 最多支持3个问题'),

    // 语音转文字配置
    speechToText: z.object({
      enable: z.boolean(),
    }),

    // 文字转语音配置，目前仅支持echo语音
    textToSpeech: z.object({
      enable: z.boolean(),
      autoPlay: z.boolean(),
      voice: z.literal('echo', {
        required_error:
          '文本转语音配置无效: 必须包含启用状态、自动播放和语音类型(仅支持echo)字段',
        invalid_type_error:
          '文本转语音配置无效: 必须包含启用状态、自动播放和语音类型(仅支持echo)字段',
      }),
    }),

    // 审核配置，包含关键词、输入审核和输出审核
    reviewConfig: z.object({
      enable: z.boolean(),
      keywords: z
        .array(z.string())
        .max(
          100,
          '关键词配置无效: 启用审核时必须提供至少1个且不超过100个关键词',
        ),
      inputsConfig: z.object({
        enable: z.boolean(),
        presetResponse: z.string(),
      }),
      outputsConfig: z.object({
        enable: z.boolean(),
      }),
    }),

    // 回答后建议配置
    suggestedAfterAnswer: z.object({
      enable: z.boolean(),
    }),
  })
  // 自定义验证：审核配置的业务逻辑验证
  .refine(
    (data) => {
      if (data.reviewConfig?.enable) {
        // 启用审核时，必须至少启用输入审核或输出审核
        if (
          !data.reviewConfig.inputsConfig.enable &&
          !data.reviewConfig.outputsConfig.enable
        ) {
          return false;
        }
        // 启用输入审核时，必须提供预设回复内容
        if (
          data.reviewConfig.inputsConfig.enable &&
          !data.reviewConfig.inputsConfig.presetResponse.trim()
        ) {
          return false;
        }
        // 启用审核时，必须提供关键词
        if (data.reviewConfig.keywords.length === 0) {
          return false;
        }
      }
      return true;
    },
    {
      message:
        '审核配置无效: 启用审核时必须至少启用输入审核或输出审核，且必须提供预设回复内容和关键词',
    },
  )
  // 自定义验证：防止插件重复添加
  .refine(
    (data) => {
      if (data.tools) {
        const toolIds = data.tools.map(
          (tool) => `${tool.providerId}_${tool.toolId}`,
        );
        return new Set(toolIds).size === toolIds.length;
      }
      return true;
    },
    {
      message: '插件重复: 每个插件只能添加一次',
    },
  )
  // 自定义验证：防止知识库重复添加
  .refine(
    (data) => {
      if (data.datasets) {
        return new Set(data.datasets).size === data.datasets.length;
      }
      return true;
    },
    {
      message: '知识库重复: 每个知识库只能添加一次',
    },
  );

export type UpdateDraftAppConfigReq = z.infer<
  typeof updateDraftAppConfigReqSchema
>;

/**
 * 更新应用摘要的请求验证 schema
 * @property {string} summary - 应用摘要内容
 */
export const updateAppSummaryReqSchema = z.object({
  summary: z.string(),
});

/**
 * 应用对话请求验证 schema
 * 用于处理用户与应用的单次对话
 * @property {string} query - 用户问题，1-2000个字符
 */
export const appConversationReqSchema = z.object({
  query: z
    .string()
    .min(1, '请输入用户问题')
    .max(2000, '用户问题不能超过2000个字符'),
});

/**
 * 获取对话消息的请求验证 schema
 * 继承自分页请求schema，并添加了时间戳过滤功能
 * @property {number} [createdAt] - 可选的时间戳，用于过滤指定时间之后的消息
 */
export const getConversationMessagesReqSchema = pageReqSchema.extend({
  createdAt: z.number().nullable().optional(),
});

export type GetConversationMessagesReq = z.infer<
  typeof getConversationMessagesReqSchema
>;

/**
 * 获取应用发布历史的请求验证 schema
 * 继承自分页请求schema，用于分页获取应用的发布历史记录
 */
export const getAppPublishHistoriesReqSchema = pageReqSchema;

export type GetAppPublishHistoriesReq = z.infer<
  typeof getAppPublishHistoriesReqSchema
>;

/**
 * 回退应用配置的请求验证 schema
 * 用于将应用配置回退到指定的历史版本
 * @property {string} appConfigVersionId - 应用配置版本ID，必须是有效的UUID格式
 */
export const fallbackAppConfigReqSchema = z.object({
  appConfigVersionId: z.string().uuid('应用配置版本ID格式不正确'),
});
