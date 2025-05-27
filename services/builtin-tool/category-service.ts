/**
 * 内置工具分类服务
 * 提供获取内置工具分类信息的功能
 */

import { categories } from '@/lib/tools';

/**
 * 获取所有内置工具的分类信息
 * @returns {Array<{category: string, name: string, icon: string}>} 返回分类信息数组，每个元素包含分类标识、名称和图标
 */
export const getBuiltinToolCategories = () => {
  // 将原始分类数据映射为所需的格式
  return categories.map((category) => ({
    category: category.category,
    name: category.name,
    icon: category.icon,
  }));
};
