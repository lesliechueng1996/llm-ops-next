/**
 * 当前时间工具模块
 *
 * 该模块提供了一个用于获取当前时间的工具，可以返回格式化的时间字符串。
 * 使用 date-fns 库进行时间格式化，支持时区显示。
 */

import { log } from '@/lib/logger';
import { tool } from '@langchain/core/tools';
import { format } from 'date-fns';

/**
 * 当前时间工具的定义配置
 * 包含工具的名称、描述、输入参数等信息
 */
export const currentTimeToolDefination = {
  name: 'current_time',
  description: '一个用于获取当前时间的工具',
  inputs: [],
  label: '获取当前时间',
  params: [],
  createdAt: 1722498386,
};

/**
 * 创建当前时间工具实例
 *
 * @returns {Tool} 返回一个配置好的时间工具实例
 *
 * 该工具会返回格式化的当前时间字符串，格式为：yyyy-MM-dd HH:mm:ss xxx
 * 其中 xxx 表示时区信息
 */
export const createCurrentTimeTool = () => {
  return tool(
    () => {
      log.info('获取当前时间');
      return format(new Date(), 'yyyy-MM-dd HH:mm:ss xxx');
    },
    {
      name: currentTimeToolDefination.name,
      description: currentTimeToolDefination.description,
    },
  );
};
