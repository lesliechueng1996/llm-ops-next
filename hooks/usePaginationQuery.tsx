import type { PaginationResult } from '@/lib/paginator';
import { useInfiniteQuery } from '@tanstack/react-query';
import { parseAsString, useQueryState } from 'nuqs';
import LoadMoreComponent from '@/components/LoadMore';
import { useEffect } from 'react';
import { toast } from 'sonner';

/**
 * 获取分页数据的函数参数
 */
type FetchFnParams = {
  /** 当前页码 */
  currentPage: number;
  /** 搜索关键词 */
  searchWord: string;
};

/**
 * usePaginationQuery Hook 的配置参数
 */
type Props<T> = {
  /** 获取分页数据的函数，接收当前页码和搜索关键词，返回分页结果 */
  fetchFn: (params: FetchFnParams) => Promise<PaginationResult<T>>;
  /** React Query 的查询键，用于缓存标识 */
  queryKey: string;
};

/**
 * 分页查询 Hook，支持无限滚动和搜索功能
 *
 * 该 Hook 集成了以下功能：
 * - 使用 React Query 的 useInfiniteQuery 处理无限滚动
 * - 通过 URL 查询参数管理搜索关键词状态
 * - 自动错误处理和提示
 * - 智能化的 LoadMore 组件显示逻辑
 *
 * @param fetchFn - 获取分页数据的异步函数
 * @param queryKey - React Query 的查询键，用于缓存和重新获取数据
 *
 * @returns 返回包含以下属性的对象：
 * - list: 所有页面数据的扁平化数组
 * - error: 查询过程中的错误信息
 * - LoadMore: 加载更多组件（仅在有更多数据时显示）
 *
 * @example
 * ```tsx
 * const { list, error, LoadMore } = usePaginationQuery({
 *   fetchFn: async ({ currentPage, searchWord }) => {
 *     return await fetchApiTools({ page: currentPage, search: searchWord });
 *   },
 *   queryKey: 'api-tools'
 * });
 *
 * return (
 *   <div>
 *     {list.map(item => <ItemCard key={item.id} item={item} />)}
 *     {LoadMore}
 *   </div>
 * );
 * ```
 */
const usePaginationQuery = <T,>({ fetchFn, queryKey }: Props<T>) => {
  const [searchKeyword] = useQueryState(
    'keywords',
    parseAsString.withDefault(''),
  );

  const { data, error, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: [queryKey, searchKeyword],
    queryFn: ({ pageParam }) =>
      fetchFn({ currentPage: pageParam, searchWord: searchKeyword }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      // 修复逻辑：当 totalPage 为 0 时，说明没有数据，应该返回 undefined
      if (lastPage.paginator.totalPage === 0) {
        return undefined;
      }
      return lastPage.paginator.currentPage >= lastPage.paginator.totalPage
        ? undefined
        : lastPage.paginator.currentPage + 1;
    },
  });

  useEffect(() => {
    if (error) {
      toast.error(error.message || '获取数据失败');
    }
  }, [error]);

  const list = data?.pages.flatMap((page) => page.list) ?? [];
  // 优化 LoadMore 显示逻辑：只有在有数据且确实有下一页时才显示
  const LoadMore = hasNextPage && list.length > 0 && (
    <LoadMoreComponent onLoadMore={fetchNextPage} />
  );

  return {
    list,
    error,
    LoadMore,
  };
};

export default usePaginationQuery;
