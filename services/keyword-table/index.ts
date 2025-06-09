/**
 * 关键词表服务模块
 * 提供关键词表相关的数据库操作功能
 *
 * 该模块主要处理以下功能：
 * 1. 关键词表的创建和获取
 * 2. 关键词映射的构建
 * 3. 从文本片段添加关键词到关键词表
 * 4. 从关键词表中删除指定文本片段的关键词
 *
 * 关键词表的数据结构：
 * - 每个数据集(dataset)对应一个关键词表
 * - 关键词表存储格式为 Record<string, string[]>
 * - key: 关键词
 * - value: 包含该关键词的文本片段ID数组
 */

// import { randomUUIDv7 } from 'bun';
import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db';
import { keywordTable, segment } from '@/lib/db/schema';
import { LOCK_KEYWORD_TABLE_UPDATE_KEYWORD_TABLE } from '@/lib/entity';
import { log } from '@/lib/logger';
import { acquireLock } from '@/lib/redis/lock';
import { eq, inArray } from 'drizzle-orm';

/**
 * 获取或创建关键词表记录
 * @param datasetId - 数据集ID
 * @returns 返回关键词表记录，如果不存在则创建新记录
 * @throws 如果数据库操作失败会抛出异常
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

/**
 * 构建关键词映射
 * 将关键词表记录转换为 Map 格式，便于快速查找和更新
 *
 * @param keywordTableRecord - 关键词表记录
 * @returns Map<string, Set<string>> - 关键词到文本片段ID集合的映射
 * - key: 关键词
 * - value: 包含该关键词的文本片段ID集合
 */
export const buildKeywordMap = (
  keywordTableRecord: typeof keywordTable.$inferSelect,
) => {
  const keywords = keywordTableRecord.keywords as Record<string, string[]>;
  const allKeywordMap = new Map<string, Set<string>>();
  for (const keywordKey of Object.keys(keywords)) {
    const keywordValues = keywords[keywordKey];
    if (!allKeywordMap.has(keywordKey)) {
      allKeywordMap.set(keywordKey, new Set());
    }
    for (const keywordValue of keywordValues) {
      allKeywordMap.get(keywordKey)?.add(keywordValue);
    }
  }
  return allKeywordMap;
};

export const formatKeywordMap = (
  keywordMap: Map<string, Set<string> | Array<string>>,
) => {
  const result: Record<string, string[]> = {};
  for (const [keyword, values] of keywordMap.entries()) {
    result[keyword] = Array.from(values);
  }
  return result;
};

/**
 * 从指定的文本片段添加关键词到关键词表
 * 使用分布式锁确保并发安全
 *
 * @param datasetId - 数据集ID
 * @param segmentIds - 要处理的文本片段ID数组
 * @throws 如果获取锁失败会记录错误日志
 */
export const addKeywordTableFromSegmentIds = async (
  datasetId: string,
  segmentIds: string[],
) => {
  const lockKey = LOCK_KEYWORD_TABLE_UPDATE_KEYWORD_TABLE.replace(
    '{dataset_id}',
    datasetId,
  );
  const lockValue = randomUUID();
  const lockAcquired = await acquireLock(lockKey, lockValue);
  if (!lockAcquired) {
    log.error(
      '添加关键词表失败，锁获取失败，datasetId: %s, segmentIds: %o',
      datasetId,
      segmentIds,
    );
    return;
  }

  const keywordTableRecord = await getOrCreateKeywordTable(datasetId);
  const allKeywordMap = buildKeywordMap(keywordTableRecord);
  log.info(
    'Before add keyword table count: %d, datasetId: %s',
    allKeywordMap.size,
    datasetId,
  );

  const segmentRecords = await db
    .select({
      id: segment.id,
      keywords: segment.keywords,
    })
    .from(segment)
    .where(inArray(segment.id, segmentIds));

  for (const segmentRecord of segmentRecords) {
    const keywords = segmentRecord.keywords as string[];
    for (const keyword of keywords) {
      if (!allKeywordMap.has(keyword)) {
        allKeywordMap.set(keyword, new Set());
      }
      allKeywordMap.get(keyword)?.add(segmentRecord.id);
    }
  }

  log.info(
    'After add keyword table count: %d, datasetId: %s',
    allKeywordMap.size,
    datasetId,
  );

  await db
    .update(keywordTable)
    .set({
      keywords: formatKeywordMap(allKeywordMap),
    })
    .where(eq(keywordTable.id, keywordTableRecord.id));
};

/**
 * 从关键词表中删除指定文本片段的关键词
 * 使用分布式锁确保并发安全
 *
 * @param datasetId - 数据集ID
 * @param segmentIds - 要删除的文本片段ID数组
 * @throws 如果获取锁失败会记录错误日志
 */
export const deleteKeywordTableFromSegmentIds = async (
  datasetId: string,
  segmentIds: string[],
) => {
  const lockKey = LOCK_KEYWORD_TABLE_UPDATE_KEYWORD_TABLE.replace(
    '{dataset_id}',
    datasetId,
  );
  const lockValue = randomUUID();
  const lockAcquired = await acquireLock(lockKey, lockValue);
  if (!lockAcquired) {
    log.error(
      '删除关键词表失败，锁获取失败，datasetId: %s, segmentIds: %o',
      datasetId,
      segmentIds,
    );
    return;
  }
  const deletedSegmentIdsSet = new Set<string>(segmentIds);

  const keywordTableRecord = await getOrCreateKeywordTable(datasetId);
  const keywords = keywordTableRecord.keywords as Record<string, string[]>;

  log.info(
    'Before delete keyword table count: %d, datasetId: %s',
    Object.keys(keywords).length,
    datasetId,
  );
  const remainKeywordMap = new Map<string, Array<string>>();
  for (const keyword of Object.keys(keywords)) {
    const keywordValuesSet = new Set(keywords[keyword]);
    const diff = keywordValuesSet.difference(deletedSegmentIdsSet);
    if (diff.size > 0) {
      remainKeywordMap.set(keyword, Array.from(diff));
    }
  }
  log.info(
    'After delete keyword table count: %d, datasetId: %s',
    remainKeywordMap.size,
    datasetId,
  );

  await db
    .update(keywordTable)
    .set({
      keywords: formatKeywordMap(remainKeywordMap),
    })
    .where(eq(keywordTable.id, keywordTableRecord.id));
};
