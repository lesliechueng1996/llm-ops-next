/**
 * 数据集服务模块
 *
 * 该模块提供了知识库（数据集）的完整 CRUD 操作，包括：
 * - 分页查询知识库列表
 * - 创建新知识库
 * - 更新知识库信息
 * - 删除知识库
 * - 获取知识库详情
 * - 知识库命中测试（向量检索）
 * - 获取知识库查询历史
 *
 * 每个知识库都包含文档数量、字符数量、命中次数、关联应用数量等统计信息。
 */

import { BadRequestException, NotFoundException } from '@/exceptions';
import { db } from '@/lib/db';
import {
  appDatasetJoin,
  dataset,
  datasetQuery,
  document,
  segment,
  uploadFile,
} from '@/lib/db/schema';
import { RetrievalSource } from '@/lib/entity';
import { calculatePagination, paginationResult } from '@/lib/paginator';
import { searchInDataset } from '@/lib/retriever';
import type { SearchPageReq } from '@/schemas/common-schema';
import type { HitDatasetReq } from '@/schemas/dataset-schema';
import type { DocumentInterface } from '@langchain/core/documents';
import { and, count, desc, eq, inArray, like, ne, sql, sum } from 'drizzle-orm';

// 默认知识库描述模板
const DEFAULT_DATASET_DESCRIPTION_FORMATTER =
  '当你需要回答关于《{name}》的时候可以引用该知识库。';

/**
 * 获取知识库记录，如果不存在则抛出异常
 * @param userId - 用户ID
 * @param datasetId - 知识库ID
 * @returns 知识库记录
 * @throws NotFoundException 当知识库不存在时
 */
const getDatasetOrThrow = async (userId: string, datasetId: string) => {
  const datasetRecords = await db
    .select()
    .from(dataset)
    .where(and(eq(dataset.id, datasetId), eq(dataset.userId, userId)));

  if (datasetRecords.length === 0) {
    throw new NotFoundException('知识库不存在');
  }
  return datasetRecords[0];
};

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
  const documentResultQuery = db
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

  // 查询每个知识库关联的应用数量
  const appDatasetJoinResultQuery = db
    .select({
      datasetId: appDatasetJoin.datasetId,
      appCount: sql<number>`cast(count(${appDatasetJoin.id}) as int)`,
    })
    .from(appDatasetJoin)
    .where(inArray(appDatasetJoin.datasetId, datasetIds))
    .groupBy(appDatasetJoin.datasetId);

  const [documentResult, appDatasetJoinResult] = await Promise.all([
    documentResultQuery,
    appDatasetJoinResultQuery,
  ]);

  const documentMap = new Map(
    documentResult.map((item) => [item.datasetId, item]),
  );
  // 构建应用关联数量的映射表
  const appDatasetJoinMap = new Map(
    appDatasetJoinResult.map((item) => [item.datasetId, item]),
  );
  const formattedList = list.map((item) => ({
    id: item.id,
    name: item.name,
    icon: item.icon,
    description: item.description,
    documentCount: documentMap.get(item.id)?.documentCount ?? 0,
    characterCount: documentMap.get(item.id)?.characterCount ?? 0,
    relatedAppCount: appDatasetJoinMap.get(item.id)?.appCount ?? 0,
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
 */
export const deleteDataset = async (userId: string, datasetId: string) => {
  // 验证知识库存在性
  await getDatasetOrThrow(userId, datasetId);

  // 使用事务确保数据一致性：先删除应用关联，再删除知识库
  await db.transaction(async (tx) => {
    await tx
      .delete(appDatasetJoin)
      .where(eq(appDatasetJoin.datasetId, datasetId));

    await tx
      .delete(dataset)
      .where(and(eq(dataset.id, datasetId), eq(dataset.userId, userId)));
  });
};

/**
 * 获取知识库详细信息
 * @param userId - 用户ID
 * @param datasetId - 知识库ID
 * @returns 包含知识库详细信息、文档统计和命中次数的对象
 * @throws NotFoundException 当知识库不存在时
 */
export const getDatasetById = async (userId: string, datasetId: string) => {
  const datasetRecord = await getDatasetOrThrow(userId, datasetId);
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

  // 查询知识库关联的应用数量
  const relatedAppCountQuery = db
    .select({
      appCount: sql<number>`cast(count(${appDatasetJoin.id}) as int)`,
    })
    .from(appDatasetJoin)
    .where(eq(appDatasetJoin.datasetId, datasetId));

  const [documentResult, hitCount, relatedAppCount] = await Promise.all([
    documentResultQuery,
    hitCountQuery,
    relatedAppCountQuery,
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
    relatedAppCount: relatedAppCount[0]?.appCount ?? 0,
    characterCount,
    createdAt: datasetRecord.createdAt.getTime(),
    updatedAt: datasetRecord.updatedAt.getTime(),
  };
};

/**
 * 对知识库进行命中测试（向量检索）
 * @param userId - 用户ID
 * @param datasetId - 知识库ID
 * @param req - 命中测试请求参数，包含查询文本、检索策略等
 * @returns 匹配的文档片段列表，包含相关性分数和详细信息
 * @throws NotFoundException 当知识库不存在时
 */
export const hitDataset = async (
  userId: string,
  datasetId: string,
  req: HitDatasetReq,
) => {
  // 验证知识库存在性
  await getDatasetOrThrow(userId, datasetId);

  // 使用向量检索在知识库中搜索相关文档片段
  const docs = await searchInDataset(req.query, [datasetId], userId, {
    retrievalStrategy: req.retrievalStrategy,
    k: req.k,
    retrievalSource: RetrievalSource.HIT_TESTING,
    score: req.score,
  });

  // 构建文档片段ID到检索结果的映射
  const segmentIdDocMap = new Map<string, DocumentInterface>(
    docs.map((doc) => [doc.metadata.segment_id, doc]),
  );

  // 获取匹配的文档片段记录
  const segmentIds = Array.from(segmentIdDocMap.keys());
  const segmentRecords = await db
    .select()
    .from(segment)
    .where(inArray(segment.id, segmentIds));

  // 获取关联的文档记录
  const documentIds = segmentRecords.map((record) => record.documentId);
  const documentRecords = await db
    .select()
    .from(document)
    .where(inArray(document.id, documentIds));
  const documentMap = new Map<string, typeof document.$inferSelect>(
    documentRecords.map((record) => [record.id, record]),
  );

  // 获取关联的上传文件记录
  const uploadFileIds = documentRecords.map((record) => record.uploadFileId);
  const uploadFileRecords = await db
    .select()
    .from(uploadFile)
    .where(inArray(uploadFile.id, uploadFileIds));
  const uploadFileMap = new Map<string, typeof uploadFile.$inferSelect>(
    uploadFileRecords.map((record) => [record.id, record]),
  );

  // 组装返回结果，包含文档片段信息、相关性分数和文件元数据
  return segmentRecords.map((record) => {
    const doc = documentMap.get(record.documentId);
    if (!doc) {
      return null;
    }
    const file = uploadFileMap.get(doc.uploadFileId);
    if (!file) {
      return null;
    }
    return {
      id: record.id,
      document: {
        id: doc.id,
        name: doc.name,
        extension: file.extension,
        mimeType: file.mimeType,
      },
      datasetId: record.datasetId,
      score: segmentIdDocMap.get(record.id)?.metadata?.score ?? null,
      position: record.position,
      content: record.content,
      keywords: record.keywords,
      characterCount: record.characterCount,
      tokenCount: record.tokenCount,
      hitCount: record.hitCount,
      enabled: record.enabled,
      disabledAt: record.disabledAt?.getTime() ?? null,
      status: record.status,
      error: record.error,
      createdAt: record.createdAt.getTime(),
      updatedAt: record.updatedAt.getTime(),
    };
  });
};

/**
 * 获取知识库的查询历史记录
 * @param userId - 用户ID
 * @param datasetId - 知识库ID
 * @returns 最近10条查询记录，按创建时间倒序排列
 * @throws NotFoundException 当知识库不存在时
 */
export const getDatasetQueries = async (userId: string, datasetId: string) => {
  // 验证知识库存在性
  await getDatasetOrThrow(userId, datasetId);

  // 获取最近10条查询记录
  const queries = await db
    .select()
    .from(datasetQuery)
    .where(eq(datasetQuery.datasetId, datasetId))
    .orderBy(desc(datasetQuery.createdAt))
    .limit(10);

  return queries.map((record) => ({
    id: record.id,
    datasetId: record.datasetId,
    query: record.query,
    source: record.source,
    createdAt: record.createdAt.getTime(),
  }));
};
