/**
 * DuckDuckGo搜索工具模块
 *
 * 该模块提供了与DuckDuckGo搜索引擎集成的功能，允许通过API进行网络搜索。
 * 包含默认搜索工具实例的创建和工具定义配置。
 */

import { DuckDuckGoSearch } from '@langchain/community/tools/duckduckgo_search';

// 创建默认的DuckDuckGo搜索工具实例
const defaultDuckDuckGoSearchTool = new DuckDuckGoSearch();

/**
 * 创建并返回DuckDuckGo搜索工具实例
 * @returns {DuckDuckGoSearch} DuckDuckGo搜索工具实例
 */
export const createDuckDuckGoSearchTool = () => {
  return defaultDuckDuckGoSearchTool;
};

/**
 * DuckDuckGo搜索工具的定义配置
 * 包含工具名称、描述、输入参数等配置信息
 */
export const duckDuckGoSearchToolDefination = {
  name: defaultDuckDuckGoSearchTool.name,
  description: defaultDuckDuckGoSearchTool.description,
  inputs: [
    {
      name: 'input',
      description: '搜索关键词',
      required: true,
      type: 'string' as const,
    },
  ],
  label: 'DuckDuckGo搜索',
  params: [],
  createdAt: 1722498386,
};
