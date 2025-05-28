/**
 * API工具服务模块
 *
 * 该模块提供了API工具的管理功能，包括：
 * - API工具的创建、更新、删除
 * - API工具列表的查询和分页
 * - OpenAPI schema的验证和格式化
 * - API工具参数的格式化
 */

import { BadRequestException, NotFoundException } from '@/exceptions';
import { db } from '@/lib/db';
import { apiTool, apiToolProvider } from '@/lib/db/schema';
import {
  type ApiToolParameter,
  type OpenapiSchema,
  openapiSchema,
} from '@/lib/entity';
import { log } from '@/lib/logger';
import { calculatePagination, paginationResult } from '@/lib/paginator';
import type {
  CreateApiToolReq,
  GetApiToolListRes,
  UpdateApiToolReq,
} from '@/schemas/api-tool-schema';
import type { SearchPageReq } from '@/schemas/common-schema';
import { and, count, desc, eq, inArray, like, ne } from 'drizzle-orm';

/**
 * 验证OpenAPI schema的有效性
 * @param schema - OpenAPI schema的JSON字符串
 * @returns 解析后的OpenAPI schema对象
 * @throws {BadRequestException} 当schema无效或存在重复的operationId时抛出
 */
export const validateOpenapiSchema = (schema: string) => {
  try {
    const data = openapiSchema.parse(JSON.parse(schema));
    const operationIds = new Set<string>();
    for (const [_, methods] of Object.entries(data.paths)) {
      for (const [_, { operationId }] of Object.entries(methods)) {
        if (operationIds.has(operationId)) {
          log.error(
            'operationId %s 重复, validate openapi schema error',
            operationId,
          );
          throw new BadRequestException(`operationId ${operationId} 重复`);
        }
        operationIds.add(operationId);
      }
    }

    return data;
  } catch (err) {
    log.error('validate openapi schema error: %o', err);
    throw err;
  }
};

/**
 * 将OpenAPI schema格式化为API工具数组
 * @param openapi - OpenAPI schema对象
 * @param userId - 用户ID
 * @returns 格式化后的API工具数组
 */
const formatApiTools = (openapi: OpenapiSchema, userId: string) => {
  const tools: {
    userId: string;
    name: string;
    description: string;
    url: string;
    method: string;
    parameters: Record<string, string | boolean>[];
  }[] = [];

  for (const path in openapi.paths) {
    const pathObj = openapi.paths[path];
    for (const method in pathObj) {
      const methodObj = pathObj[method as keyof typeof pathObj];
      if (!methodObj) {
        continue;
      }
      tools.push({
        userId,
        name: methodObj.operationId,
        description: methodObj.description,
        url: `${openapi.server}${path}`,
        method,
        parameters: methodObj.parameters,
      });
    }
  }

  return tools;
};

/**
 * 创建新的API工具
 * @param userId - 用户ID
 * @param data - 创建API工具的请求数据
 * @returns 创建的API工具提供者ID
 * @throws {BadRequestException} 当用户已存在同名API工具时抛出
 */
export const createApiTool = async (userId: string, data: CreateApiToolReq) => {
  const { name, icon, openapiSchema, headers } = data;
  const validatedOpenapiData = validateOpenapiSchema(openapiSchema);
  const countUserSameNameApiToolProvider = await db.$count(
    apiToolProvider,
    and(eq(apiToolProvider.userId, userId), eq(apiToolProvider.name, name)),
  );
  if (countUserSameNameApiToolProvider > 0) {
    throw new BadRequestException('用户已存在同名API工具');
  }

  const tools = formatApiTools(validatedOpenapiData, userId);

  const providerId = await db.transaction(async (tx) => {
    const apiToolProviderRecord = await tx
      .insert(apiToolProvider)
      .values({
        userId,
        name,
        icon,
        description: validatedOpenapiData.description,
        openapiSchema: JSON.stringify(validatedOpenapiData),
        headers,
      })
      .returning();

    await tx.insert(apiTool).values(
      tools.map((tool) => ({
        ...tool,
        providerId: apiToolProviderRecord[0].id,
      })),
    );

    return apiToolProviderRecord[0].id;
  });

  return providerId;
};

/**
 * 删除指定的API工具
 * @param userId - 用户ID
 * @param providerId - API工具提供者ID
 */
export const deleteApiTool = async (userId: string, providerId: string) => {
  await db.transaction(async (tx) => {
    await tx
      .delete(apiTool)
      .where(
        and(eq(apiTool.providerId, providerId), eq(apiTool.userId, userId)),
      );
    await tx
      .delete(apiToolProvider)
      .where(
        and(
          eq(apiToolProvider.id, providerId),
          eq(apiToolProvider.userId, userId),
        ),
      );
  });
};

/**
 * 更新指定的API工具
 * @param userId - 用户ID
 * @param providerId - API工具提供者ID
 * @param data - 更新API工具的请求数据
 * @throws {BadRequestException} 当用户已存在同名API工具时抛出
 */
export const updateApiTool = async (
  userId: string,
  providerId: string,
  data: UpdateApiToolReq,
) => {
  const { name, icon, openapiSchema, headers } = data;
  const validatedOpenapiData = validateOpenapiSchema(openapiSchema);

  const countUserSameNameApiToolProvider = await db.$count(
    apiToolProvider,
    and(
      eq(apiToolProvider.userId, userId),
      eq(apiToolProvider.name, name),
      ne(apiToolProvider.id, providerId),
    ),
  );
  if (countUserSameNameApiToolProvider > 0) {
    throw new BadRequestException('用户已存在同名API工具');
  }

  const tools = formatApiTools(validatedOpenapiData, userId);

  await db.transaction(async (tx) => {
    await tx
      .delete(apiTool)
      .where(
        and(eq(apiTool.providerId, providerId), eq(apiTool.userId, userId)),
      );
    await tx
      .update(apiToolProvider)
      .set({
        name,
        icon,
        description: validatedOpenapiData.description,
        openapiSchema: JSON.stringify(validatedOpenapiData),
        headers,
      })
      .where(
        and(
          eq(apiToolProvider.id, providerId),
          eq(apiToolProvider.userId, userId),
        ),
      );
    await tx.insert(apiTool).values(
      tools.map((tool) => ({
        ...tool,
        providerId,
      })),
    );
  });
};

/**
 * 获取指定的API工具提供者信息
 * @param userId - 用户ID
 * @param providerId - API工具提供者ID
 * @returns API工具提供者的详细信息
 * @throws {NotFoundException} 当API工具不存在时抛出
 */
export const getApiToolProvider = async (
  userId: string,
  providerId: string,
) => {
  const apiToolProviderRecords = await db
    .select()
    .from(apiToolProvider)
    .where(
      and(
        eq(apiToolProvider.id, providerId),
        eq(apiToolProvider.userId, userId),
      ),
    );

  if (apiToolProviderRecords.length === 0) {
    throw new NotFoundException('API工具不存在');
  }
  const record = apiToolProviderRecords[0];
  return {
    id: record.id,
    name: record.name,
    icon: record.icon,
    description: record.description,
    openapiSchema: record.openapiSchema,
    headers: record.headers,
    createdAt: record.createdAt.getTime(),
  };
};

/**
 * 格式化API工具输入参数
 * @param parameters - API工具参数数组
 * @returns 格式化后的参数数组
 */
const formatApiToolInputs = (parameters: ApiToolParameter) =>
  parameters.map((param) => ({
    type: param.type,
    name: param.name,
    description: param.description,
    required: param.required,
  }));

/**
 * 获取指定的API工具详情
 * @param userId - 用户ID
 * @param providerId - API工具提供者ID
 * @param toolName - API工具名称
 * @returns API工具的详细信息
 * @throws {NotFoundException} 当API工具不存在时抛出
 */
export const getApiTool = async (
  userId: string,
  providerId: string,
  toolName: string,
) => {
  const toolQuery = db
    .select()
    .from(apiTool)
    .where(
      and(
        eq(apiTool.providerId, providerId),
        eq(apiTool.userId, userId),
        eq(apiTool.name, toolName),
      ),
    );

  const toolProviderQuery = db
    .select()
    .from(apiToolProvider)
    .where(
      and(
        eq(apiToolProvider.id, providerId),
        eq(apiToolProvider.userId, userId),
      ),
    );

  const [tools, toolProviders] = await Promise.all([
    toolQuery,
    toolProviderQuery,
  ]);

  if (tools.length === 0 || toolProviders.length === 0) {
    throw new NotFoundException('API工具不存在');
  }

  return {
    id: tools[0].id,
    name: tools[0].name,
    description: tools[0].description,
    inputs: formatApiToolInputs(
      (tools[0].parameters ?? []) as ApiToolParameter,
    ),
    provider: {
      id: toolProviders[0].id,
      name: toolProviders[0].name,
      icon: toolProviders[0].icon,
      description: toolProviders[0].description,
      headers: toolProviders[0].headers,
      createdAt: toolProviders[0].createdAt.getTime(),
    },
  };
};

/**
 * 分页获取用户的API工具列表
 * @param userId - 用户ID
 * @param pageReq - 分页查询参数
 * @returns 分页后的API工具列表
 */
export const listApiToolsByPage = async (
  userId: string,
  pageReq: SearchPageReq,
) => {
  const { offset, limit } = calculatePagination(pageReq);
  const where = pageReq.searchWord
    ? and(
        eq(apiToolProvider.userId, userId),
        like(apiToolProvider.name, `%${pageReq.searchWord}%`),
      )
    : eq(apiToolProvider.userId, userId);

  const listQuery = db
    .select({
      id: apiToolProvider.id,
      name: apiToolProvider.name,
      icon: apiToolProvider.icon,
      description: apiToolProvider.description,
      headers: apiToolProvider.headers,
      createdAt: apiToolProvider.createdAt,
    })
    .from(apiToolProvider)
    .where(where)
    .orderBy(desc(apiToolProvider.createdAt))
    .limit(limit)
    .offset(offset);

  const countQuery = db
    .select({ count: count() })
    .from(apiToolProvider)
    .where(where);

  const [list, total] = await Promise.all([listQuery, countQuery]);

  const providerIds = list.map((item) => item.id);
  const tools = await db
    .select()
    .from(apiTool)
    .where(
      and(inArray(apiTool.providerId, providerIds), eq(apiTool.userId, userId)),
    );

  const formattedList: GetApiToolListRes[] = [];
  for (const item of list) {
    const provider: GetApiToolListRes = {
      id: item.id,
      name: item.name,
      icon: item.icon,
      description: item.description,
      headers: item.headers as Record<string, string>[],
      createdAt: item.createdAt.getTime(),
      tools: tools
        .filter((tool) => tool.providerId === item.id)
        .map((tool) => ({
          id: tool.id,
          name: tool.name,
          description: tool.description,
          inputs: formatApiToolInputs(tool.parameters as ApiToolParameter),
        })),
    };
    formattedList.push(provider);
  }

  return paginationResult(formattedList, total[0].count, pageReq);
};
