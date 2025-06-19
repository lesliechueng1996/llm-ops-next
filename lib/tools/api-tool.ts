import type { apiTool, apiToolProvider } from '@/lib/db/schema';
import type { ApiToolParameter } from '@/lib/entity';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { log } from '../logger';

/**
 * 根据 API 参数类型创建对应的 Zod 验证类型
 * @param type - API 参数的类型 ('string', 'boolean', 'integer', 'float')
 * @returns 对应的 Zod 验证器
 */
const createZodType = (type: ApiToolParameter[number]['type']) => {
  switch (type) {
    case 'string':
      return z.string();
    case 'boolean':
      return z.boolean();
    case 'integer':
      return z.number().int();
    case 'float':
      return z.number();
    default:
      return z.string();
  }
};

/**
 * 创建 API 工具实例
 * 根据数据库中的 API 工具记录和提供商记录，动态创建一个可调用的 LangChain 工具
 *
 * @param apiToolRecord - API 工具的数据库记录，包含工具的基本信息和参数定义
 * @param apiToolProviderRecord - API 工具提供商的数据库记录，包含认证信息等
 * @returns 配置好的 LangChain 工具实例
 */
export const createApiTool = (
  apiToolRecord: typeof apiTool.$inferSelect,
  apiToolProviderRecord: typeof apiToolProvider.$inferSelect,
) => {
  /**
   * 执行 API 调用的核心函数
   * 根据传入的参数构建 HTTP 请求并发送到目标 API
   *
   * @param params - 用户提供的参数对象
   * @returns API 响应的文本内容或错误信息
   */
  const callApi = async (params: Record<string, unknown>) => {
    // 初始化不同位置的参数容器
    const allParams: Record<string, Record<string, unknown>> = {
      path: {}, // URL 路径参数
      query: {}, // 查询字符串参数
      header: {}, // HTTP 头部参数
      cookie: {}, // Cookie 参数（暂未实现）
      body: {}, // 请求体参数
    };

    // 创建允许参数的映射表，用于快速查找和验证
    const allowedParameters = new Map(
      (apiToolRecord.parameters as ApiToolParameter).map((param) => [
        param.name,
        param,
      ]),
    );

    // 创建提供商默认头部的映射表
    const providerHeaders = new Map(
      (
        apiToolProviderRecord.headers as Array<{ key: string; value: string }>
      ).map((header) => [header.key, header.value]),
    );

    // 处理用户提供的参数，根据参数定义分配到正确的位置
    for (const paramKey of Object.keys(params)) {
      const mappingParam = allowedParameters.get(paramKey);
      if (!mappingParam) {
        log.warn(`Parameter ${paramKey} is not allowed`);
        continue;
      }

      const paramIn = mappingParam.in;
      // 路径和查询参数需要转换为字符串
      if (paramIn === 'path' || paramIn === 'query') {
        allParams[paramIn][paramKey] = String(params[paramKey]);
      } else {
        allParams[paramIn][paramKey] = params[paramKey];
      }
    }

    // 构建完整的 URL，替换路径参数并添加查询字符串
    let url = apiToolRecord.url;
    // 替换路径中的占位符 {paramName}
    for (const key of Object.keys(allParams.path)) {
      url = url.replace(`{${key}}`, allParams.path[key] as string);
    }
    // 添加查询参数
    if (Object.keys(allParams.query).length > 0) {
      url += `?${new URLSearchParams(allParams.query as Record<string, string>).toString()}`;
    }

    // 构建 HTTP 头部
    const headers = new Headers();
    // 添加提供商默认头部（如 API 密钥等）
    for (const [key, value] of providerHeaders.entries()) {
      headers.set(key, value);
    }
    // 添加用户提供的头部参数
    for (const [key, value] of Object.entries(allParams.header)) {
      headers.set(key, String(value));
    }

    // TODO: 实现 cookie 参数处理
    // 发送 HTTP 请求
    const response = await fetch(url, {
      method: apiToolRecord.method,
      headers,
      body: JSON.stringify(allParams.body),
    });

    // 检查响应状态
    if (!response.ok) {
      log.error(`Failed to call API ${url}: ${response.statusText}`);
      return 'API 调用失败';
    }

    // 返回响应内容
    const responseText = await response.text();
    return responseText;
  };

  /**
   * 创建工具的 Zod 验证模式
   * 根据 API 工具的参数定义动态生成参数验证规则
   *
   * @returns 包含所有参数验证规则的 Zod 对象模式
   */
  const createSchema = () => {
    const schema = z.object({});

    // 为每个参数创建验证规则
    for (const param of apiToolRecord.parameters as ApiToolParameter) {
      const fieldName = param.name;
      const fieldType = param.type;
      const fieldDescription = param.description;
      const fieldZodType = createZodType(fieldType);

      // 根据参数是否必需设置验证规则
      if (!param.required) {
        schema.extend({
          [fieldName]: fieldZodType.optional().describe(fieldDescription),
        });
      } else {
        schema.extend({
          [fieldName]: fieldZodType.describe(fieldDescription),
        });
      }
    }
    return schema;
  };

  // 创建并返回 LangChain 工具实例
  return tool(callApi, {
    name: `${apiToolRecord.providerId}-${apiToolRecord.name}`,
    description: apiToolRecord.description,
    schema: createSchema(),
  });
};
