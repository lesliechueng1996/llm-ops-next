/**
 * 分页相关的工具函数和类型定义
 * 提供分页计算、结果格式化和URL参数加载等功能
 */

import type { PageReq } from '@/schemas/common-schema';
import { createLoader, parseAsInteger } from 'nuqs/server';

/**
 * 分页结果的类型定义
 * @template T 列表项的类型
 */
export type PaginationResult<T> = {
  list: T[]; // 当前页的数据列表
  paginator: {
    currentPage: number; // 当前页码
    pageSize: number; // 每页大小
    totalPage: number; // 总页数
    totalRecord: number; // 总记录数
  };
};

/**
 * 计算分页的偏移量和限制
 * @param pageReq 分页请求参数
 * @returns 包含 offset 和 limit 的对象
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
 * @template T 列表项的类型
 * @param list 当前页的数据列表
 * @param total 总记录数
 * @param pageReq 分页请求参数
 * @returns 标准化的分页结果对象
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
 * 创建用于加载URL分页参数的loader
 * 默认值：currentPage=1, pageSize=10
 */
export const loadPageReqParams = createLoader({
  currentPage: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10),
});
