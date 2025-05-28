/**
 * 分页工具模块
 *
 * 该模块提供了一套完整的分页处理工具，包括：
 * - 分页参数的类型定义
 * - 分页计算工具函数
 * - 分页结果的格式化
 * - URL参数解析和加载
 *
 * 主要用于处理列表数据的分页展示，支持基础分页和带搜索功能的分页。
 */

import type { PageReq } from '@/schemas/common-schema';
import { createLoader, parseAsInteger, parseAsString } from 'nuqs/server';

/**
 * 分页结果的类型定义
 * @template T 列表项的类型
 * @property {T[]} list - 当前页的数据列表
 * @property {Object} paginator - 分页信息对象
 * @property {number} paginator.currentPage - 当前页码（从1开始）
 * @property {number} paginator.pageSize - 每页显示的记录数
 * @property {number} paginator.totalPage - 总页数
 * @property {number} paginator.totalRecord - 总记录数
 */
export type PaginationResult<T> = {
  list: T[];
  paginator: {
    currentPage: number;
    pageSize: number;
    totalPage: number;
    totalRecord: number;
  };
};

/**
 * 计算分页的偏移量和限制
 *
 * @param {PageReq} pageReq - 分页请求参数
 * @param {number} pageReq.currentPage - 当前页码（从1开始）
 * @param {number} pageReq.pageSize - 每页大小
 * @returns {{offset: number, limit: number}} 包含 offset（偏移量）和 limit（限制数）的对象
 * @example
 * const { offset, limit } = calculatePagination({ currentPage: 2, pageSize: 10 });
 * // 返回 { offset: 10, limit: 10 }
 */
export const calculatePagination = (pageReq: PageReq) => {
  const { currentPage, pageSize } = pageReq;
  const offset = (currentPage - 1) * pageSize;
  return {
    offset,
    limit: pageSize,
  };
};

/**
 * 生成标准的分页结果对象
 *
 * @template T 列表项的类型
 * @param {T[]} list - 当前页的数据列表
 * @param {number} total - 总记录数
 * @param {PageReq} pageReq - 分页请求参数
 * @returns {PaginationResult<T>} 标准化的分页结果对象
 * @example
 * const result = paginationResult(items, 100, { currentPage: 1, pageSize: 10 });
 * // 返回包含分页信息和数据列表的对象
 */
export const paginationResult = <T>(
  list: T[],
  total: number,
  pageReq: PageReq,
): PaginationResult<T> => {
  const { currentPage, pageSize } = pageReq;
  return {
    list,
    paginator: {
      currentPage,
      pageSize,
      totalPage: Math.ceil(total / pageSize),
      totalRecord: total,
    },
  };
};

/**
 * 创建用于加载URL基础分页参数的loader
 *
 * 从URL查询参数中解析分页信息，提供默认值：
 * - currentPage: 默认为1
 * - pageSize: 默认为10
 *
 * @returns {Object} 包含分页参数的loader对象
 */
export const loadPageReqParams = createLoader({
  currentPage: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10),
});

/**
 * 创建用于加载带搜索功能的URL分页参数的loader
 *
 * 从URL查询参数中解析分页和搜索信息，提供默认值：
 * - currentPage: 默认为1
 * - pageSize: 默认为10
 * - searchWord: 默认为空字符串
 *
 * @returns {Object} 包含分页和搜索参数的loader对象
 */
export const loadSearchPageReqParams = createLoader({
  currentPage: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10),
  searchWord: parseAsString.withDefault(''),
});
