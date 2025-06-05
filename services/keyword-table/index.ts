/**
 * 关键词表服务模块
 * 提供关键词表相关的数据库操作功能
 */

import { db } from '@/lib/db';
import { keywordTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * 获取或创建关键词表记录
 * @param datasetId - 数据集ID
 * @returns 返回关键词表记录，如果不存在则创建新记录
 */
export const getOrCreateKeywordTable = async (datasetId: string) => {
  // 查询是否存在对应的关键词表记录
  const keywordTableRecord = await db
    .select()
    .from(keywordTable)
    .where(eq(keywordTable.datasetId, datasetId));

  // 如果记录存在，直接返回
  if (keywordTableRecord.length > 0) {
    return keywordTableRecord[0];
  }

  // 如果记录不存在，创建新的关键词表记录
  const newKeywordTableRecord = await db
    .insert(keywordTable)
    .values({
      datasetId,
    })
    .returning();
  return newKeywordTableRecord[0];
};
