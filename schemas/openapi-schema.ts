/**
 * OpenAPI Schema 定义文件
 *
 * 该文件定义了与 API Key 管理相关的所有请求验证 schema。
 * 使用 Zod 库进行类型验证和运行时验证，确保 API 请求数据的完整性和正确性。
 *
 * 包含以下主要功能：
 * 1. 创建新的 API Key
 * 2. 更新现有 API Key 的信息
 * 3. 更新 API Key 的激活状态
 * 4. 获取 API Key 列表
 */

import { z } from 'zod';
import { pageReqSchema } from './common-schema';

/**
 * 创建 API Key 的请求验证 schema
 *
 * @property {boolean} isActive - API Key 的激活状态，true 表示激活，false 表示禁用
 * @property {string} [remark] - API Key 的备注信息，可选字段，最大长度 100 字符
 *
 * @throws {ZodError} 当请求数据不符合验证规则时抛出错误
 */
export const createApiKeyReqSchema = z.object({
  isActive: z.boolean({
    message: '是否激活不能为空',
  }),
  remark: z
    .string()
    .max(100, {
      message: '备注信息不能超过100个字符',
    })
    .optional(),
});

/**
 * 更新 API Key 的请求验证 schema
 *
 * @property {boolean} isActive - API Key 的激活状态，true 表示激活，false 表示禁用
 * @property {string} [remark] - API Key 的备注信息，可选字段，最大长度 100 字符
 *
 * @throws {ZodError} 当请求数据不符合验证规则时抛出错误
 */
export const updateApiKeyReqSchema = z.object({
  isActive: z.boolean({
    message: '是否激活不能为空',
  }),
  remark: z
    .string()
    .max(100, {
      message: '备注信息不能超过100个字符',
    })
    .optional(),
});

/**
 * 仅更新 API Key 激活状态的请求验证 schema
 *
 * @property {boolean} isActive - API Key 的激活状态，true 表示激活，false 表示禁用
 *
 * @throws {ZodError} 当请求数据不符合验证规则时抛出错误
 */
export const updateApiKeyIsActiveReqSchema = z.object({
  isActive: z.boolean({
    message: '是否激活不能为空',
  }),
});

/**
 * 获取 API Key 列表的请求验证 schema
 *
 * 继承自 pageReqSchema，用于分页查询 API Key 列表
 *
 * @throws {ZodError} 当分页参数不符合验证规则时抛出错误
 */
export const getApiKeyListReqSchema = pageReqSchema;
