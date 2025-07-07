'use server';

/**
 * API 工具相关的服务器端 actions
 *
 * 本文件包含了处理 API 工具相关操作的服务器端 actions，包括：
 * - 验证 OpenAPI schema 的有效性
 * - 创建和保存 API 工具提供者
 *
 * 所有 actions 都需要用户认证，并使用 authActionClient 进行包装
 */

import { authActionClient } from '@/lib/safe-action';
import {
  createApiToolReqSchema,
  validateOpenapiSchemaReqSchema,
} from '@/schemas/api-tool-schema';
import { validateOpenapiSchema, createApiTool } from '@/services/api-tool';

/**
 * 验证 OpenAPI schema 的有效性
 *
 * 此 action 用于验证用户提供的 OpenAPI schema 是否符合规范。
 * 验证通过后返回 true，验证失败则会抛出异常。
 *
 * @param openapiSchema - 需要验证的 OpenAPI schema 对象
 * @returns Promise<boolean> - 验证成功返回 true
 * @throws 当 schema 格式不正确时抛出验证错误
 *
 * @example
 * ```typescript
 * const result = await validateOpenapiSchemaAction({
 *   openapiSchema: { openapi: '3.0.0', info: { title: 'API', version: '1.0.0' } }
 * });
 * ```
 */
export const validateOpenapiSchemaAction = authActionClient
  .schema(validateOpenapiSchemaReqSchema)
  .metadata({
    actionName: 'validateOpenapiSchema',
  })
  .action(async ({ parsedInput: { openapiSchema } }) => {
    validateOpenapiSchema(openapiSchema);
    return true;
  });

/**
 * 保存 API 工具提供者
 *
 * 此 action 用于创建和保存新的 API 工具提供者。
 * 会根据提供的信息创建 API 工具配置，并返回生成的提供者 ID。
 *
 * @param parsedInput - 包含 API 工具创建所需信息的对象
 * @param ctx.userId - 当前用户的 ID（通过认证上下文提供）
 * @returns Promise<string> - 创建成功后返回新的提供者 ID
 * @throws 当创建过程中发生错误时抛出相应异常
 *
 * @example
 * ```typescript
 * const providerId = await saveApiToolProviderAction({
 *   name: 'My API Tool',
 *   baseUrl: 'https://api.example.com',
 *   openapiSchema: { ... }
 * });
 * ```
 */
export const saveApiToolProviderAction = authActionClient
  .schema(createApiToolReqSchema)
  .metadata({
    actionName: 'saveApiToolProvider',
  })
  .action(async ({ parsedInput, ctx: { userId } }) => {
    const providerId = await createApiTool(userId, parsedInput);
    return providerId;
  });
