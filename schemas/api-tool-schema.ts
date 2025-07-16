/**
 * API工具相关的Schema定义
 *
 * 本模块定义了与API工具相关的所有Zod验证Schema和TypeScript类型定义，
 * 包括创建、更新、删除、验证和获取API工具的各种请求和响应类型。
 *
 * 主要功能：
 * - API工具的创建和更新验证
 * - OpenAPI Schema的验证
 * - API工具列表的获取和分页
 * - API工具提供者的管理
 *
 * 所有Schema都使用Zod进行运行时类型验证，确保API请求和响应的类型安全。
 */

import { z } from 'zod';
import { searchPageReqSchema } from './common-schema';

/**
 * 创建API工具的请求Schema
 * @property name - 工具名称，1-30个字符
 * @property icon - 工具图标的URL
 * @property openapiSchema - OpenAPI规范文档
 * @property headers - API请求头配置
 */
export const createApiToolReqSchema = z.object({
  name: z
    .string({ message: '工具名称应为字符串' })
    .min(1, { message: '工具名称不能为空' })
    .max(30, { message: '工具名称应少于30个字符' }),
  icon: z
    .string({ message: '工具图标应为字符串' })
    .url({ message: '工具图标应为 url' }),
  openapiSchema: z.string({ message: 'openapiSchema应为字符串' }),
  headers: z.array(
    z.object({
      key: z.string({ message: '请求头名称应为字符串' }),
      value: z.string({ message: '请求头值应为字符串' }),
    }),
  ),
});

export type CreateApiToolReq = z.infer<typeof createApiToolReqSchema>;

/**
 * 更新API工具的请求Schema
 * 字段定义与创建API工具相同
 */
export const updateApiToolReqSchema = z.object({
  name: z
    .string({ message: '工具名称应为字符串' })
    .min(1, { message: '工具名称不能为空' })
    .max(30, { message: '工具名称应少于30个字符' }),
  icon: z
    .string({ message: '工具图标应为字符串' })
    .url({ message: '工具图标应为 url' }),
  openapiSchema: z.string({ message: 'openapiSchema应为字符串' }),
  headers: z.array(
    z.object({
      key: z.string({ message: '请求头名称应为字符串' }),
      value: z.string({ message: '请求头值应为字符串' }),
    }),
  ),
});

export type UpdateApiToolReq = z.infer<typeof updateApiToolReqSchema>;

/**
 * 验证OpenAPI Schema的请求Schema
 * @property openapiSchema - 需要验证的OpenAPI规范文档
 */
export const validateOpenapiSchemaReqSchema = z.object({
  openapiSchema: z.string({ message: 'openapiSchema应为字符串' }),
});

/**
 * 获取API工具列表的请求Schema
 * 继承自searchPageReqSchema，包含分页和搜索参数
 */
export const getApiToolListReqSchema = searchPageReqSchema;

/**
 * 获取API工具列表的响应类型
 * @property id - 工具ID
 * @property name - 工具名称
 * @property icon - 工具图标URL
 * @property description - 工具描述
 * @property headers - API请求头配置
 * @property createdAt - 创建时间戳
 * @property tools - 工具包含的API端点列表
 */
export type GetApiToolListRes = {
  id: string;
  name: string;
  icon: string;
  description: string;
  headers: Record<string, string>[];
  createdAt: number;
  tools: {
    id: string;
    name: string;
    description: string;
    inputs: {
      name: string;
      type: string;
      description: string;
      required: boolean;
    }[];
  }[];
};

/**
 * 获取API工具提供者的请求Schema
 * @property providerId - 提供者ID，必须是有效的UUID格式
 */
export const getApiToolProviderReqSchema = z.object({
  providerId: z
    .string({ message: 'providerId应为字符串' })
    .uuid({ message: 'providerId应为UUID' }),
});

/**
 * 获取API工具提供者的响应类型
 * @property id - 提供者ID
 * @property name - 提供者名称
 * @property icon - 提供者图标URL
 * @property description - 提供者描述
 * @property openapiSchema - OpenAPI规范文档
 * @property headers - API请求头配置
 * @property createdAt - 创建时间戳
 */
export type GetApiToolProviderRes = {
  id: string;
  name: string;
  icon: string;
  description: string;
  openapiSchema: string;
  headers: { key: string; value: string }[];
  createdAt: number;
};

/**
 * 删除API工具提供者的请求Schema
 * @property providerId - 要删除的提供者ID，必须是有效的UUID格式
 */
export const deleteApiToolProviderReqSchema = z.object({
  providerId: z
    .string({ message: 'providerId应为字符串' })
    .uuid({ message: 'providerId应为UUID' }),
});

/**
 * 更新API工具操作的请求Schema
 * @property providerId - 提供者ID，必须是有效的UUID格式
 * @property data - 更新API工具的数据，使用updateApiToolReqSchema进行验证
 */
export const updateApiToolActionReqSchema = z.object({
  providerId: z
    .string({ message: 'providerId应为字符串' })
    .uuid({ message: 'providerId应为UUID' }),
  data: updateApiToolReqSchema,
});
