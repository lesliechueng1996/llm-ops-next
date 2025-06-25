/**
 * 数据集相关的 Zod schema 定义
 * 包含获取数据集列表、创建数据集、更新数据集和数据集检索的请求验证 schema
 *
 * 该模块提供了以下主要功能：
 * - 数据集列表查询的请求验证
 * - 数据集创建和更新的请求验证
 * - 数据集检索（hit）的请求验证
 * - 相关的 TypeScript 类型定义
 */

import { RetrievalStrategy } from '@/lib/entity';
import { z } from 'zod';
import { searchPageReqSchema } from './common-schema';

/**
 * 获取数据集列表的请求 schema
 * 继承自通用的分页搜索请求 schema，支持分页和搜索功能
 *
 * 包含以下字段：
 * - page: 页码
 * - pageSize: 每页大小
 * - search: 搜索关键词（可选）
 */
export const getDatasetListReqSchema = searchPageReqSchema;

/**
 * 创建数据集的请求 schema
 * 用于验证创建新数据集时的请求参数
 *
 * @property {string} name - 知识库名称，必填，1-100字符
 * @property {string} icon - 知识库图标URL，必填，必须是有效的URL
 * @property {string} [description] - 知识库描述，可选，最大2000字符，默认为空字符串
 */
export const createDatasetReqSchema = z.object({
  // 数据集名称验证：必填，长度1-100字符
  name: z
    .string({ message: '知识库名称不能为空' })
    .min(1, '知识库名称不能为空')
    .max(100, '知识库名称不能超过 100 个字符'),

  // 数据集图标验证：必填，必须是有效的URL格式
  icon: z.string({ message: '知识库图标不能为空' }).url('知识库图标格式不正确'),

  // 数据集描述验证：可选，最大2000字符，默认为空字符串
  description: z
    .string({ message: '知识库描述不能为空' })
    .max(2000, '知识库描述不能超过 2000 个字符')
    .optional()
    .default(''),
});

/**
 * 更新数据集的请求 schema
 * 用于验证更新现有数据集时的请求参数
 *
 * 字段定义与创建数据集schema相同，但用于更新操作
 * @property {string} name - 知识库名称，必填，1-100字符
 * @property {string} icon - 知识库图标URL，必填，必须是有效的URL
 * @property {string} [description] - 知识库描述，可选，最大2000字符，默认为空字符串
 */
export const updateDatasetReqSchema = z.object({
  // 数据集名称验证：必填，长度1-100字符
  name: z
    .string({ message: '知识库名称不能为空' })
    .min(1, '知识库名称不能为空')
    .max(100, '知识库名称不能超过 100 个字符'),

  // 数据集图标验证：必填，必须是有效的URL格式
  icon: z.string({ message: '知识库图标不能为空' }).url('知识库图标格式不正确'),

  // 数据集描述验证：可选，最大2000字符，默认为空字符串
  description: z
    .string({ message: '知识库描述不能为空' })
    .max(2000, '知识库描述不能超过 2000 个字符')
    .optional()
    .default(''),
});

/**
 * 数据集检索（hit）的请求 schema
 * 用于验证在数据集中进行文档检索时的请求参数
 *
 * @property {string} query - 查询词，必填，1-200字符
 * @property {RetrievalStrategy} retrievalStrategy - 检索策略，必填，枚举值
 * @property {number} k - 召回数量，必填，1-10之间的整数
 * @property {number} score - 相似度分数阈值，必填，0-0.99之间的数值
 */
export const hitDatasetReqSchema = z.object({
  // 查询词验证：必填，长度1-200字符
  query: z
    .string({ message: '查询词不能为空' })
    .min(1, '查询词不能为空')
    .max(200, '查询词不能超过 200 个字符'),

  // 检索策略验证：必填，必须是预定义的枚举值
  retrievalStrategy: z.nativeEnum(RetrievalStrategy, {
    message: '检索策略应为 full_text、semantic 或 hybrid',
  }),

  // 召回数量验证：必填，1-10之间的整数
  k: z
    .number({ message: '召回数量不能为空' })
    .min(1, '召回数量不能小于 1')
    .max(10, '召回数量不能超过 10'),

  // 相似度分数阈值验证：必填，0-0.99之间的数值
  score: z
    .number({ message: '相似度分数不能为空' })
    .min(0, '相似度分数不能小于 0')
    .max(0.99, '相似度分数不能超过 0.99'),
});

/**
 * 数据集检索请求的 TypeScript 类型定义
 * 从 hitDatasetReqSchema 推断出的类型，用于类型安全的请求处理
 */
export type HitDatasetReq = z.infer<typeof hitDatasetReqSchema>;
