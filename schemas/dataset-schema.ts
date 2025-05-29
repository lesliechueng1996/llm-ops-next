/**
 * 数据集相关的 Zod schema 定义
 * 包含获取数据集列表、创建数据集和更新数据集的请求验证 schema
 */

import { z } from 'zod';
import { searchPageReqSchema } from './common-schema';

/**
 * 获取数据集列表的请求 schema
 * 继承自通用的分页搜索请求 schema
 */
export const getDatasetListReqSchema = searchPageReqSchema;

/**
 * 创建数据集的请求 schema
 * @property {string} name - 知识库名称，必填，1-100字符
 * @property {string} icon - 知识库图标URL，必填，必须是有效的URL
 * @property {string} [description] - 知识库描述，可选，最大2000字符
 */
export const createDatasetReqSchema = z.object({
  name: z
    .string({ message: '知识库名称不能为空' })
    .min(1, '知识库名称不能为空')
    .max(100, '知识库名称不能超过 100 个字符'),
  icon: z.string({ message: '知识库图标不能为空' }).url('知识库图标格式不正确'),
  description: z
    .string({ message: '知识库描述不能为空' })
    .max(2000, '知识库描述不能超过 2000 个字符')
    .optional()
    .default(''),
});

/**
 * 更新数据集的请求 schema
 * @property {string} name - 知识库名称，必填，1-100字符
 * @property {string} icon - 知识库图标URL，必填，必须是有效的URL
 * @property {string} [description] - 知识库描述，可选，最大2000字符
 */
export const updateDatasetReqSchema = z.object({
  name: z
    .string({ message: '知识库名称不能为空' })
    .min(1, '知识库名称不能为空')
    .max(100, '知识库名称不能超过 100 个字符'),
  icon: z.string({ message: '知识库图标不能为空' }).url('知识库图标格式不正确'),
  description: z
    .string({ message: '知识库描述不能为空' })
    .max(2000, '知识库描述不能超过 2000 个字符')
    .optional()
    .default(''),
});
