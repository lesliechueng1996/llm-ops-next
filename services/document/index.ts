/**
 * 文档服务模块
 * 提供文档相关的数据库操作和业务逻辑
 */

import { db } from '@/lib/db';
import { document, segment } from '@/lib/db/schema';
import { calculatePagination, paginationResult } from '@/lib/paginator';
import type { SearchPageReq } from '@/schemas/common-schema';
import { and, eq, like, desc, count, inArray, sql } from 'drizzle-orm';

/**
 * 分页获取文档列表
 * @param userId - 用户ID
 * @param datasetId - 数据集ID
 * @param pageReq - 分页请求参数，包含搜索关键词和分页信息
 * @returns 分页后的文档列表，包含每个文档的点击次数统计
 */
export const getDocumentListByPage = async (
  userId: string,
  datasetId: string,
  pageReq: SearchPageReq,
) => {
  // 计算分页参数
  const { offset, limit } = calculatePagination(pageReq);

  // 构建查询条件：根据是否有关键词搜索来构建不同的查询条件
  const where = pageReq.searchWord
    ? and(
        eq(document.userId, userId),
        eq(document.datasetId, datasetId),
        like(document.name, `%${pageReq.searchWord}%`),
      )
    : and(eq(document.userId, userId), eq(document.datasetId, datasetId));

  // 查询文档列表
  const listQuery = db
    .select()
    .from(document)
    .where(where)
    .orderBy(desc(document.updatedAt))
    .limit(limit)
    .offset(offset);

  // 查询总数
  const totalQuery = db.select({ count: count() }).from(document).where(where);

  // 并行执行查询
  const [list, total] = await Promise.all([listQuery, totalQuery]);

  // 获取所有文档ID
  const documentIds = list.map((item) => item.id);

  // 查询每个文档的点击次数统计
  const segmentResult = await db
    .select({
      documentId: segment.documentId,
      hitCount: sql<number>`cast(sum(${segment.hitCount}) as int)`,
    })
    .from(segment)
    .where(
      and(
        eq(segment.userId, userId),
        eq(segment.datasetId, datasetId),
        inArray(segment.documentId, documentIds),
      ),
    )
    .groupBy(segment.documentId);

  // 构建文档ID到点击次数的映射
  const hitCountMap = new Map<string, number>(
    segmentResult.map((item) => [item.documentId, item.hitCount]),
  );

  // 格式化返回结果
  const formattedList = list.map((item) => ({
    id: item.id,
    name: item.name,
    characterCount: item.characterCount,
    hitCount: hitCountMap.get(item.id) ?? 0,
    position: item.position,
    enabled: item.enabled,
    disabledAt: item.disabledAt?.getTime() ?? 0,
    status: item.status,
    error: item.error,
    createdAt: item.createdAt.getTime(),
    updatedAt: item.updatedAt.getTime(),
  }));

  return paginationResult(formattedList, total[0].count, pageReq);
};
