/**
 * 数据集服务模块
 *
 * 该模块提供了知识库（数据集）的完整 CRUD 操作，包括：
 * - 分页查询知识库列表
 * - 创建新知识库
 * - 更新知识库信息
 * - 删除知识库
 * - 获取知识库详情
 *
 * 每个知识库都包含文档数量、字符数量、命中次数等统计信息。
 */

import { BadRequestException, NotFoundException } from '@/exceptions';
import { db } from '@/lib/db';
import { dataset, document, segment } from '@/lib/db/schema';
import { calculatePagination, paginationResult } from '@/lib/paginator';
import type { SearchPageReq } from '@/schemas/common-schema';
import { and, count, desc, eq, inArray, like, ne, sql, sum } from 'drizzle-orm';

// 默认知识库描述模板
const DEFAULT_DATASET_DESCRIPTION_FORMATTER =
  '当你需要回答关于《{name}》的时候可以引用该知识库。';

/**
 * 分页获取用户的知识库列表
 * @param userId - 用户ID
 * @param pageReq - 分页和搜索参数
 * @returns 包含知识库列表和分页信息的结果
 */
export const listDatasetsByPage = async (
  userId: string,
  pageReq: SearchPageReq,
) => {
  const { offset, limit } = calculatePagination(pageReq);
  const where = pageReq.searchWord
    ? and(
        eq(dataset.userId, userId),
        like(dataset.name, `%${pageReq.searchWord}%`),
      )
    : eq(dataset.userId, userId);

  const listQuery = db
    .select()
    .from(dataset)
    .where(where)
    .orderBy(desc(dataset.updatedAt))
    .limit(limit)
    .offset(offset);

  const totalQuery = db.select({ count: count() }).from(dataset).where(where);

  const [list, total] = await Promise.all([listQuery, totalQuery]);

  const datasetIds = list.map((item) => item.id);
  const documentResult = await db
    .select({
      datasetId: document.datasetId,
      documentCount: sql<number>`cast(count(${document.id}) as int)`,
      characterCount: sql<number>`cast(sum(${document.characterCount}) as int)`,
    })
    .from(document)
    .where(
      and(inArray(document.datasetId, datasetIds), eq(document.userId, userId)),
    )
    .groupBy(document.datasetId);

  const documentMap = new Map(
    documentResult.map((item) => [item.datasetId, item]),
  );
  const formattedList = list.map((item) => ({
    id: item.id,
    name: item.name,
    icon: item.icon,
    description: item.description,
    documentCount: documentMap.get(item.id)?.documentCount ?? 0,
    characterCount: documentMap.get(item.id)?.characterCount ?? 0,
    // TODO: get related app count
    relatedAppCount: 0,
    createdAt: item.createdAt.getTime(),
    updatedAt: item.updatedAt.getTime(),
  }));

  return paginationResult(formattedList, total[0].count, pageReq);
};

/**
 * 创建新的知识库
 * @param userId - 用户ID
 * @param name - 知识库名称
 * @param icon - 知识库图标
 * @param description - 知识库描述（可选）
 * @returns 新创建的知识库记录
 * @throws BadRequestException 当知识库名称已存在时
 */
export const createDataset = async (
  userId: string,
  name: string,
  icon: string,
  description: string,
) => {
  const datasetCount = await db.$count(
    dataset,
    and(eq(dataset.userId, userId), eq(dataset.name, name)),
  );
  if (datasetCount > 0) {
    throw new BadRequestException('知识库名称已存在');
  }

  const datasetRecord = await db
    .insert(dataset)
    .values({
      userId,
      name,
      icon,
      description:
        description ||
        DEFAULT_DATASET_DESCRIPTION_FORMATTER.replace('{name}', name),
    })
    .returning();

  return datasetRecord[0];
};

/**
 * 更新知识库信息
 * @param userId - 用户ID
 * @param datasetId - 知识库ID
 * @param name - 新的知识库名称
 * @param icon - 新的知识库图标
 * @param description - 新的知识库描述（可选）
 * @throws BadRequestException 当新的知识库名称与其他知识库重复时
 */
export const updateDataset = async (
  userId: string,
  datasetId: string,
  name: string,
  icon: string,
  description: string,
) => {
  const datasetCount = await db.$count(
    dataset,
    and(
      eq(dataset.userId, userId),
      eq(dataset.name, name),
      ne(dataset.id, datasetId),
    ),
  );
  if (datasetCount > 0) {
    throw new BadRequestException('知识库名称已存在');
  }

  const updateResult = await db
    .update(dataset)
    .set({
      name,
      icon,
      description:
        description ||
        DEFAULT_DATASET_DESCRIPTION_FORMATTER.replace('{name}', name),
    })
    .where(and(eq(dataset.id, datasetId), eq(dataset.userId, userId)))
    .returning();

  if (updateResult.length === 0) {
    throw new NotFoundException('知识库不存在');
  }
};

/**
 * 删除指定的知识库
 * @param userId - 用户ID
 * @param datasetId - 要删除的知识库ID
 * @todo 需要实现删除知识库相关的所有文档和应用关联
 */
export const deleteDataset = async (userId: string, datasetId: string) => {
  // TODO: delete all documents in the dataset
  // TODO: delete all app dataset relations
  await db
    .delete(dataset)
    .where(and(eq(dataset.id, datasetId), eq(dataset.userId, userId)));
};

/**
 * 获取知识库详细信息
 * @param userId - 用户ID
 * @param datasetId - 知识库ID
 * @returns 包含知识库详细信息、文档统计和命中次数的对象
 * @throws NotFoundException 当知识库不存在时
 */
export const getDatasetById = async (userId: string, datasetId: string) => {
  const datasetRecords = await db
    .select()
    .from(dataset)
    .where(and(eq(dataset.id, datasetId), eq(dataset.userId, userId)));

  if (datasetRecords.length === 0) {
    throw new NotFoundException('知识库不存在');
  }
  const datasetRecord = datasetRecords[0];
  const documentResultQuery = db
    .select({
      documentCount: sql<number>`cast(count(${document.id}) as int)`,
      characterCount: sql<number>`cast(sum(${document.characterCount}) as int)`,
    })
    .from(document)
    .where(and(eq(document.datasetId, datasetId), eq(document.userId, userId)));

  const hitCountQuery = db
    .select({
      hitCount: sum(segment.hitCount).mapWith(Number),
    })
    .from(segment)
    .where(and(eq(segment.datasetId, datasetId), eq(segment.userId, userId)));

  const [documentResult, hitCount] = await Promise.all([
    documentResultQuery,
    hitCountQuery,
  ]);
  const documentCount = documentResult[0]?.documentCount ?? 0;
  const characterCount = documentResult[0]?.characterCount ?? 0;

  return {
    id: datasetRecord.id,
    name: datasetRecord.name,
    icon: datasetRecord.icon,
    description: datasetRecord.description,
    documentCount,
    hitCount: hitCount[0]?.hitCount ?? 0,
    // TODO: get related app count
    relatedAppCount: 0,
    characterCount,
    createdAt: datasetRecord.createdAt.getTime(),
    updatedAt: datasetRecord.updatedAt.getTime(),
  };
};
