/**
 * 应用相关的 Zod schema 定义
 * 包含创建应用、更新应用和获取应用列表的请求验证 schema
 */

import { searchPageReqSchema } from '@/schemas/common-schema';
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
