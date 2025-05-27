/**
 * 内置工具服务模块
 * 该模块负责管理和导出内置工具的相关功能
 * 包括工具分类和工具列表的获取
 */

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
export function getBuiltinTools() {
  // 将内置工具数据转换为标准格式
  return builtinTools.map((group) => ({
    name: group.name,
    label: group.label,
    description: group.description,
    icon: group.icon,
    category: group.category,
    createdAt: group.createdAt,
    background: group.background,
    // 转换每个工具的信息
    tools: group.tools.map((tool) => ({
      name: tool.name,
      label: tool.label,
      description: tool.description,
      inputs: tool.inputs,
      params: tool.params,
    })),
  }));
}
