'use server';

/**
 * API 工具相关的服务器端 actions
 *
 * 本文件包含了处理 API 工具相关操作的服务器端 actions，包括：
 * - 验证 OpenAPI schema 的有效性
 * - 创建和保存 API 工具提供者
 * - 分页获取 API 工具列表
 * - 获取单个 API 工具提供者详情
 * - 删除 API 工具提供者
 * - 更新 API 工具提供者配置
 *
 * 所有 actions 都需要用户认证，并使用 authActionClient 进行包装。
 * 每个 action 都包含输入验证、错误处理和用户权限检查。
 *
 * @fileoverview API 工具管理相关的服务器端操作集合
 */

import { authActionClient } from '@/lib/safe-action';
import {
  createApiToolReqSchema,
  deleteApiToolProviderReqSchema,
  getApiToolListReqSchema,
  getApiToolProviderReqSchema,
  updateApiToolActionReqSchema,
  validateOpenapiSchemaReqSchema,
} from '@/schemas/api-tool-schema';
import {
  validateOpenapiSchema,
  createApiTool,
  listApiToolsByPage,
  getApiToolProvider,
  deleteApiTool,
  updateApiTool,
} from '@/services/api-tool';

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
  .action(async ({ parsedInput, ctx: { userId } }) =>
    createApiTool(userId, parsedInput),
  );

/**
 * 分页获取 API 工具列表
 *
 * 此 action 用于分页获取当前用户的 API 工具列表。
 * 支持根据关键词搜索过滤、排序和分页显示。
 *
 * @param parsedInput - 包含分页和搜索参数的对象
 * @param parsedInput.page - 当前页码（从 1 开始）
 * @param parsedInput.pageSize - 每页显示的项目数量
 * @param parsedInput.keyword - 可选的搜索关键词，用于过滤工具名称
 * @param ctx.userId - 当前用户的 ID（通过认证上下文提供）
 * @returns Promise<{data: ApiTool[], total: number, page: number, pageSize: number}> - 分页数据结果
 * @throws 当获取过程中发生错误时抛出相应异常
 *
 * @example
 * ```typescript
 * const result = await fetchApiToolsByPageAction({
 *   page: 1,
 *   pageSize: 10,
 *   keyword: 'weather'
 * });
 * // 返回: { data: [...], total: 25, page: 1, pageSize: 10 }
 * ```
 */
export const fetchApiToolsByPageAction = authActionClient
  .schema(getApiToolListReqSchema)
  .metadata({
    actionName: 'fetchApiToolsByPage',
  })
  .action(async ({ parsedInput, ctx: { userId } }) =>
    listApiToolsByPage(userId, parsedInput),
  );

/**
 * 获取 API 工具提供者详情
 *
 * 此 action 用于获取指定 API 工具提供者的详细信息。
 * 根据提供者 ID 返回完整的工具配置信息，包括基础 URL、OpenAPI schema 等。
 *
 * @param parsedInput - 包含提供者 ID 的对象
 * @param parsedInput.providerId - 要获取详情的提供者 ID
 * @param ctx.userId - 当前用户的 ID（通过认证上下文提供）
 * @returns Promise<ApiToolProvider> - 返回提供者的详细信息
 * @throws 当提供者不存在或用户无权限访问时抛出相应异常
 *
 * @example
 * ```typescript
 * const provider = await getApiToolProviderAction({
 *   providerId: 'provider-123'
 * });
 * // 返回: { id: 'provider-123', name: 'Weather API', baseUrl: 'https://api.weather.com', ... }
 * ```
 */
export const getApiToolProviderAction = authActionClient
  .schema(getApiToolProviderReqSchema)
  .metadata({
    actionName: 'getApiToolProvider',
  })
  .action(async ({ parsedInput, ctx: { userId } }) =>
    getApiToolProvider(userId, parsedInput.providerId),
  );

/**
 * 删除 API 工具提供者
 *
 * 此 action 用于删除指定的 API 工具提供者。
 * 删除操作会移除提供者的所有配置信息，包括相关的工具定义。
 * 此操作不可逆，请谨慎使用。
 *
 * @param parsedInput - 包含提供者 ID 的对象
 * @param parsedInput.providerId - 要删除的提供者 ID
 * @param ctx.userId - 当前用户的 ID（通过认证上下文提供）
 * @returns Promise<boolean> - 删除成功返回 true
 * @throws 当提供者不存在、用户无权限或删除过程中发生错误时抛出相应异常
 *
 * @example
 * ```typescript
 * const success = await deleteApiToolProviderAction({
 *   providerId: 'provider-123'
 * });
 * // 返回: true (删除成功)
 * ```
 */
export const deleteApiToolProviderAction = authActionClient
  .schema(deleteApiToolProviderReqSchema)
  .metadata({
    actionName: 'deleteApiToolProvider',
  })
  .action(async ({ parsedInput, ctx: { userId } }) =>
    deleteApiTool(userId, parsedInput.providerId),
  );

/**
 * 更新 API 工具提供者配置
 *
 * 此 action 用于更新指定 API 工具提供者的配置信息。
 * 支持更新提供者名称、基础 URL、OpenAPI schema 等所有配置项。
 * 更新操作会保留原有的提供者 ID，只修改配置内容。
 *
 * @param parsedInput - 包含更新信息的对象
 * @param parsedInput.providerId - 要更新的提供者 ID
 * @param parsedInput.data - 包含更新字段的对象（name、baseUrl、openapiSchema 等）
 * @param ctx.userId - 当前用户的 ID（通过认证上下文提供）
 * @returns Promise<ApiToolProvider> - 返回更新后的提供者信息
 * @throws 当提供者不存在、用户无权限或更新过程中发生错误时抛出相应异常
 *
 * @example
 * ```typescript
 * const updatedProvider = await updateApiToolProviderAction({
 *   providerId: 'provider-123',
 *   data: {
 *     name: 'Updated Weather API',
 *     baseUrl: 'https://api.weather-v2.com',
 *     openapiSchema: { ... }
 *   }
 * });
 * // 返回更新后的提供者信息
 * ```
 */
export const updateApiToolProviderAction = authActionClient
  .schema(updateApiToolActionReqSchema)
  .metadata({
    actionName: 'updateApiToolProvider',
  })
  .action(async ({ parsedInput, ctx: { userId } }) =>
    updateApiTool(userId, parsedInput.providerId, parsedInput.data),
  );
