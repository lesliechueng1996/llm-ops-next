/**
 * Wikipedia 工具模块
 *
 * 该模块提供了与维基百科交互的工具，允许通过关键词搜索维基百科内容。
 * 使用 @langchain/community 提供的 WikipediaQueryRun 工具实现。
 */

import { WikipediaQueryRun } from '@langchain/community/tools/wikipedia_query_run';

// 创建默认的维基百科查询工具实例
const defaultWikipediaTool = new WikipediaQueryRun();

/**
 * 创建维基百科工具实例
 * @returns {WikipediaQueryRun} 返回维基百科查询工具实例
 */
export const createWikipediaTool = () => {
  return defaultWikipediaTool;
};

/**
 * 维基百科工具的定义配置
 * 包含工具的名称、描述、输入参数等信息
 */
export const wikipediaToolDefination = {
  name: defaultWikipediaTool.name,
  description: defaultWikipediaTool.description,
  inputs: [
    {
      name: 'input',
      description: '搜索关键词',
      required: true,
      type: 'string' as const,
    },
  ],
  label: '维基百科搜索',
  params: [],
  createdAt: 1722498386,
};
