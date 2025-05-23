/**
 * OpenAPI Schema 定义文件
 * 该文件包含了与 API Key 相关的请求验证 schema
 * 使用 Zod 进行类型验证和运行时验证
 */

import { z } from 'zod';

/**
 * 创建 API Key 的请求验证 schema
 * @property {boolean} isActive - API Key 的激活状态
 * @property {string} [remark] - API Key 的备注信息（可选，最大100字符）
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
 * @property {boolean} isActive - API Key 的激活状态
 * @property {string} [remark] - API Key 的备注信息（可选，最大100字符）
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
 * @property {boolean} isActive - API Key 的激活状态
 */
export const updateApiKeyIsActiveReqSchema = z.object({
  isActive: z.boolean({
    message: '是否激活不能为空',
  }),
});
