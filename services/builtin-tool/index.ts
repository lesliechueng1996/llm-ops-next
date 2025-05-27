/**
 * 内置工具服务模块
 * 该模块负责管理和导出内置工具的相关功能
 * 包括工具分类、工具列表的获取以及特定工具信息的查询
 */

import { NotFoundException } from '@/exceptions';
import { builtinTools } from '@/lib/tools';
export { getBuiltinToolCategories } from './category-service';

/**
 * 获取所有内置工具的信息
 * @returns {Object[]} 返回内置工具的分组信息，每个分组包含：
 *   - name: 分组名称
 *   - label: 分组显示标签
 *   - description: 分组描述
 *   - icon: 分组图标
 *   - category: 分组类别
 *   - createdAt: 创建时间
 *   - background: 背景信息
 *   - tools: 该分组下的工具列表，每个工具包含：
 *     - name: 工具名称
 *     - label: 工具显示标签
 *     - description: 工具描述
 *     - inputs: 工具输入参数
 *     - params: 工具配置参数
 */
export const getBuiltinTools = () => {
  // 将内置工具数据转换为标准格式
  return builtinTools.map((provider) => ({
    name: provider.name,
    label: provider.label,
    description: provider.description,
    icon: provider.icon,
    category: provider.category,
    createdAt: provider.createdAt,
    background: provider.background,
    // 转换每个工具的信息
    tools: provider.tools.map((tool) => ({
      name: tool.name,
      label: tool.label,
      description: tool.description,
      inputs: tool.inputs,
      params: tool.params,
    })),
  }));
};

/**
 * 根据提供商名称获取内置工具提供商信息
 * @param {string} providerName - 工具提供商名称
 * @returns {Object|null} 返回工具提供商信息，如果未找到则返回null
 */
export const getBuiltinToolProvider = (providerName: string) => {
  return builtinTools.find((provider) => provider.name === providerName);
};

/**
 * 从指定的工具提供商中获取特定工具信息
 * @param {Object} provider - 工具提供商对象
 * @param {string} toolName - 工具名称
 * @returns {Object|null} 返回工具信息，如果未找到则返回null
 */
export const getBuiltinTool = (
  provider: ReturnType<typeof getBuiltinToolProvider>,
  toolName: string,
) => {
  if (!provider) {
    return null;
  }
  return provider.tools.find((tool) => tool.name === toolName);
};

/**
 * 获取指定工具提供商的特定工具的详细信息
 * @param {string} providerName - 工具提供商名称
 * @param {string} toolName - 工具名称
 * @returns {Object} 返回工具详细信息，包含提供商信息和工具信息
 * @throws {NotFoundException} 当工具提供商或工具不存在时抛出异常
 */
export const getBuiltinToolInfo = (providerName: string, toolName: string) => {
  const provider = getBuiltinToolProvider(providerName);
  if (!provider) {
    throw new NotFoundException('工具提供商不存在');
  }
  const tool = getBuiltinTool(provider, toolName);
  if (!tool) {
    throw new NotFoundException('工具不存在');
  }

  return {
    provider: {
      name: provider.name,
      label: provider.label,
      description: provider.description,
      icon: provider.icon,
      category: provider.category,
      background: provider.background,
    },
    name: tool.name,
    label: tool.label,
    description: tool.description,
    inputs: tool.inputs,
    params: tool.params,
    createdAt: tool.createdAt,
  };
};
