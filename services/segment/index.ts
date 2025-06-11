/**
 * 片段管理服务
 *
 * 该模块提供了对文档片段（Segment）的完整管理功能，包括：
 * - 片段的创建、更新、删除和查询
 * - 片段的分页列表获取
 * - 片段的启用/禁用状态管理
 * - 片段的向量存储和关键词表管理
 *
 * 每个片段都包含以下主要属性：
 * - 内容（content）：片段的实际文本内容
 * - 关键词（keywords）：从内容中提取的关键词
 * - 位置（position）：在文档中的顺序位置
 * - 状态（status）：片段的处理状态
 * - 启用状态（enabled）：片段是否可用
 */

import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@/exceptions';
import { db } from '@/lib/db';
import { segment } from '@/lib/db/schema';
import { document } from '@/lib/db/schema';
import { cacheBackedEmbeddings, calculateTokenCount } from '@/lib/embedding';
import {
  DocumentStatus,
  LOCK_SEGMENT_UPDATE_ENABLED,
  SegmentStatus,
} from '@/lib/entity';
import { hashText } from '@/lib/file-util';
import { extractKeywords } from '@/lib/keyword';
import { log } from '@/lib/logger';
import { calculatePagination, paginationResult } from '@/lib/paginator';
import { acquireLock, releaseLock } from '@/lib/redis/lock';
import { vectorStore, vectorStoreCollection } from '@/lib/vector-store';
import type { SearchPageReq } from '@/schemas/common-schema';
import type {
  CreateSegmentReq,
  UpdateSegmentReq,
} from '@/schemas/segment-schema';
import { Document } from '@langchain/core/documents';
import { and, asc, count, eq, like, max, sum } from 'drizzle-orm';
import {
  addKeywordTableFromSegmentIds,
  deleteKeywordTableFromSegmentIds,
} from '../keyword-table';

/**
 * 分页获取片段列表
 * @param userId - 用户ID
 * @param datasetId - 数据集ID
 * @param documentId - 文档ID
 * @param pageReq - 分页请求参数，包含页码、每页数量和可选的搜索关键词
 * @returns 分页后的片段列表和总数
 */
export const getSegmentListByPage = async (
  userId: string,
  datasetId: string,
  documentId: string,
  pageReq: SearchPageReq,
) => {
  // 计算分页参数
  const { offset, limit } = calculatePagination(pageReq);

  // 构建查询条件：根据是否有关键词搜索来构建不同的查询条件
  const conditions = [
    eq(segment.userId, userId),
    eq(segment.datasetId, datasetId),
    eq(segment.documentId, documentId),
  ];
  if (pageReq.searchWord) {
    conditions.push(like(segment.content, `%${pageReq.searchWord}%`));
  }
  const where = and(...conditions);

  // 查询文档列表
  const listQuery = db
    .select()
    .from(segment)
    .where(where)
    .orderBy(asc(segment.position))
    .limit(limit)
    .offset(offset);

  // 查询总数
  const totalQuery = db.select({ count: count() }).from(segment).where(where);

  const [list, total] = await Promise.all([listQuery, totalQuery]);

  // 格式化返回结果，统一时间戳格式
  const formattedList = list.map((item) => ({
    id: item.id,
    documentId: item.documentId,
    datasetId: item.datasetId,
    position: item.position,
    content: item.content,
    keywords: item.keywords as string[],
    characterCount: item.characterCount,
    tokenCount: item.tokenCount,
    hitCount: item.hitCount,
    enabled: item.enabled,
    disabledAt: item.disabledAt?.getTime() ?? 0,
    status: item.status,
    error: item.error ?? '',
    createdAt: item.createdAt.getTime(),
    updatedAt: item.updatedAt.getTime(),
  }));

  return paginationResult(formattedList, total[0].count, pageReq);
};

/**
 * 创建新的片段
 * @param userId - 用户ID
 * @param datasetId - 数据集ID
 * @param documentId - 文档ID
 * @param req - 创建片段的请求参数，包含内容和可选的关键词
 * @returns 新创建的片段ID
 * @throws {BadRequestException} 当内容超过1000个token或文档未完成时
 * @throws {NotFoundException} 当文档不存在时
 * @throws {InternalServerErrorException} 当创建过程中发生错误时
 */
export const createSegment = async (
  userId: string,
  datasetId: string,
  documentId: string,
  req: CreateSegmentReq,
) => {
  const tokenCount = calculateTokenCount(req.content);
  if (tokenCount > 1000) {
    throw new BadRequestException('片段内容的长度不能超过1000 token');
  }

  const docRecords = await db
    .select()
    .from(document)
    .where(
      and(
        eq(document.id, documentId),
        eq(document.userId, userId),
        eq(document.datasetId, datasetId),
      ),
    );
  if (docRecords.length === 0) {
    throw new NotFoundException('文档不存在');
  }
  const doc = docRecords[0];
  if (doc.status !== DocumentStatus.COMPLETED) {
    throw new BadRequestException('所属文档未完成，暂时无法添加片段');
  }

  const lastSegmentPosition = await db
    .select({ position: max(segment.position) })
    .from(segment)
    .where(eq(segment.documentId, documentId));

  const position = lastSegmentPosition[0]?.position ?? 0 + 1;

  let keywords = req.keywords;
  if (!keywords || keywords.length === 0) {
    keywords = extractKeywords(req.content);
  }

  let segmentId: string | null = null;
  try {
    const segmentRecords = await db
      .insert(segment)
      .values({
        userId,
        datasetId,
        documentId,
        nodeId: randomUUID(),
        position,
        content: req.content,
        characterCount: req.content.length,
        tokenCount,
        keywords,
        hash: hashText(req.content),
        enabled: true,
        processingStartedAt: new Date(),
        indexingCompletedAt: new Date(),
        completedAt: new Date(),
        status: SegmentStatus.COMPLETED,
      })
      .returning();
    if (segmentRecords.length === 0) {
      throw new Error('创建片段失败');
    }
    const segmentRecord = segmentRecords[0];
    segmentId = segmentRecord.id;
    if (!segmentRecord.nodeId) {
      log.error('Create segment failed, nodeId is empty');
      throw new Error('创建片段失败');
    }
    log.info('Create segment success, start vector storage');
    await vectorStore.addDocuments(
      [
        new Document({
          pageContent: req.content,
          metadata: {
            user_id: userId,
            dataset_id: datasetId,
            document_id: documentId,
            segment_id: segmentId,
            node_id: segmentRecord.nodeId,
            document_enabled: doc.enabled,
            segment_enabled: true,
          },
        }),
      ],
      {
        ids: [segmentRecord.nodeId],
      },
    );
    log.info('Vector storage completed, start updating doc status');
    const promises = [];
    promises.push(updateDocCharacterAndTokenCount(documentId));
    if (doc.enabled) {
      promises.push(addKeywordTableFromSegmentIds(datasetId, [segmentId]));
    }
    await Promise.all(promises);
    log.info('Create segment success, update doc status success');
    return segmentId;
  } catch (error) {
    log.error('Create segment failed, error: %s', error);
    if (segmentId) {
      await updateSegmentErrorStatus(segmentId, error);
    }
    throw new InternalServerErrorException('创建片段失败');
  }
};

/**
 * 删除指定的片段
 * @param userId - 用户ID
 * @param datasetId - 数据集ID
 * @param documentId - 文档ID
 * @param segmentId - 要删除的片段ID
 * @throws {BadRequestException} 当片段未完成时
 * @throws {NotFoundException} 当片段不存在时
 */
export const deleteSegment = async (
  userId: string,
  datasetId: string,
  documentId: string,
  segmentId: string,
) => {
  const segmentRecord = await getSegmentOrThrow(
    userId,
    datasetId,
    documentId,
    segmentId,
  );

  if (
    segmentRecord.status !== SegmentStatus.COMPLETED &&
    segmentRecord.status !== SegmentStatus.ERROR
  ) {
    throw new BadRequestException('片段未完成，无法删除');
  }

  await db.transaction(async (tx) => {
    await tx.delete(segment).where(eq(segment.id, segmentId));
    log.info('Delete segment success, start deleting keyword table');
    await deleteKeywordTableFromSegmentIds(datasetId, [segmentId]);
    log.info('Delete keyword table success, start deleting vector storage');
    if (segmentRecord.nodeId) {
      await vectorStoreCollection().data.deleteById(segmentRecord.nodeId);
      log.info('Delete vector storage success');
    }
  });

  await updateDocCharacterAndTokenCount(documentId);
};

/**
 * 更新文档的字符数和token数统计
 * @param documentId - 文档ID
 * @throws {Error} 当计算文档总长度失败时
 */
const updateDocCharacterAndTokenCount = async (documentId: string) => {
  const segmentDatas = await db
    .select({
      characterCount: sum(segment.characterCount).mapWith(Number),
      tokenCount: sum(segment.tokenCount).mapWith(Number),
    })
    .from(segment)
    .where(eq(segment.documentId, documentId));
  if (segmentDatas.length === 0) {
    log.error('Update doc status failed, segmentData is empty');
    throw new Error('计算文档总长度失败');
  }
  const segmentData = segmentDatas[0];
  await db
    .update(document)
    .set({
      characterCount: segmentData.characterCount ?? 0,
      tokenCount: segmentData.tokenCount ?? 0,
    })
    .where(eq(document.id, documentId));
};

/**
 * 更新片段内容
 * @param userId - 用户ID
 * @param datasetId - 数据集ID
 * @param documentId - 文档ID
 * @param segmentId - 要更新的片段ID
 * @param req - 更新片段的请求参数，包含新的内容和可选的关键词
 * @throws {BadRequestException} 当内容超过1000个token或片段未完成时
 * @throws {NotFoundException} 当片段不存在时
 * @throws {InternalServerErrorException} 当更新过程中发生错误时
 */
export const updateSegment = async (
  userId: string,
  datasetId: string,
  documentId: string,
  segmentId: string,
  req: UpdateSegmentReq,
) => {
  const tokenCount = calculateTokenCount(req.content);
  if (tokenCount > 1000) {
    throw new BadRequestException('片段内容的长度不能超过1000 token');
  }

  const segmentRecord = await getSegmentOrThrow(
    userId,
    datasetId,
    documentId,
    segmentId,
  );

  if (segmentRecord.status !== SegmentStatus.COMPLETED) {
    throw new BadRequestException('片段未完成，无法更新');
  }

  let keywords = req.keywords;
  if (!keywords || keywords.length === 0) {
    keywords = extractKeywords(req.content);
  }

  const newHash = hashText(req.content);
  const requiredUpdate = newHash !== segmentRecord.hash;

  try {
    await db
      .update(segment)
      .set({
        content: req.content,
        characterCount: req.content.length,
        tokenCount,
        keywords,
        hash: newHash,
      })
      .where(eq(segment.id, segmentId));

    await deleteKeywordTableFromSegmentIds(datasetId, [segmentId]);
    await addKeywordTableFromSegmentIds(datasetId, [segmentId]);

    if (requiredUpdate && segmentRecord.nodeId) {
      await vectorStoreCollection().data.update({
        id: segmentRecord.nodeId,
        properties: {
          text: req.content,
        },
        vectors: await cacheBackedEmbeddings.embedQuery(req.content),
      });

      await updateDocCharacterAndTokenCount(documentId);
    }
  } catch (error) {
    log.error('Update segment failed, error: %s', error);
    await updateSegmentErrorStatus(segmentId, error);
    throw new InternalServerErrorException('更新片段失败');
  }
};

/**
 * 获取指定片段，如果不存在则抛出异常
 * @param userId - 用户ID
 * @param datasetId - 数据集ID
 * @param documentId - 文档ID
 * @param segmentId - 片段ID
 * @returns 片段记录
 * @throws {NotFoundException} 当片段不存在时
 */
const getSegmentOrThrow = async (
  userId: string,
  datasetId: string,
  documentId: string,
  segmentId: string,
) => {
  const segmentRecords = await db
    .select()
    .from(segment)
    .where(
      and(
        eq(segment.id, segmentId),
        eq(segment.userId, userId),
        eq(segment.datasetId, datasetId),
        eq(segment.documentId, documentId),
      ),
    );
  if (segmentRecords.length === 0) {
    throw new NotFoundException('片段不存在');
  }
  return segmentRecords[0];
};

/**
 * 更新片段的启用状态
 * @param userId - 用户ID
 * @param datasetId - 数据集ID
 * @param documentId - 文档ID
 * @param segmentId - 片段ID
 * @param enabled - 新的启用状态
 * @throws {BadRequestException} 当片段未完成或状态未发生变化时
 * @throws {NotFoundException} 当片段或文档不存在时
 * @throws {ConflictException} 当片段正在被其他请求更新时
 * @throws {InternalServerErrorException} 当更新过程中发生错误时
 */
export const updateSegmentEnabled = async (
  userId: string,
  datasetId: string,
  documentId: string,
  segmentId: string,
  enabled: boolean,
) => {
  const segmentRecord = await getSegmentOrThrow(
    userId,
    datasetId,
    documentId,
    segmentId,
  );

  if (segmentRecord.status !== SegmentStatus.COMPLETED) {
    throw new BadRequestException('片段未完成，无法更新启用状态');
  }

  if (segmentRecord.enabled === enabled) {
    throw new BadRequestException('片段启用状态未发生变化');
  }

  const lockKey = LOCK_SEGMENT_UPDATE_ENABLED.replace(
    '{segment_id}',
    segmentId,
  );
  const lockValue = randomUUID();
  const acquired = await acquireLock(lockKey, lockValue);
  if (!acquired) {
    throw new ConflictException('当前片段正在被其他请求更新，请稍后再试');
  }

  try {
    const docs = await db
      .select()
      .from(document)
      .where(
        and(
          eq(document.userId, userId),
          eq(document.datasetId, datasetId),
          eq(document.id, documentId),
        ),
      );
    if (docs.length === 0) {
      throw new NotFoundException('文档不存在');
    }
    const doc = docs[0];

    const promises = [];
    const updateSegmentQuery = db
      .update(segment)
      .set({
        enabled,
        disabledAt: enabled ? null : new Date(),
      })
      .where(eq(segment.id, segmentId));
    promises.push(updateSegmentQuery);

    if (segmentRecord.nodeId) {
      const updateVectorQuery = vectorStoreCollection().data.update({
        id: segmentRecord.nodeId,
        properties: {
          segment_enabled: enabled,
        },
      });
      promises.push(updateVectorQuery);
    }

    if (enabled && doc.enabled) {
      const addKeywordTableQuery = addKeywordTableFromSegmentIds(datasetId, [
        segmentId,
      ]);
      promises.push(addKeywordTableQuery);
    }

    if (!enabled && doc.enabled) {
      const deleteKeywordTableQuery = deleteKeywordTableFromSegmentIds(
        datasetId,
        [segmentId],
      );
      promises.push(deleteKeywordTableQuery);
    }
    await Promise.all(promises);
  } catch (error) {
    log.error('Update segment enabled failed, error: %s', error);
    await updateSegmentErrorStatus(segmentId, error);
    throw new InternalServerErrorException('更新片段启用状态失败');
  } finally {
    await releaseLock(lockKey, lockValue);
  }
};

/**
 * 更新片段的错误状态
 * @param segmentId - 片段ID
 * @param error - 错误信息
 */
const updateSegmentErrorStatus = async (segmentId: string, error: unknown) => {
  await db
    .update(segment)
    .set({
      status: SegmentStatus.ERROR,
      error: error instanceof Error ? error.message : JSON.stringify(error),
      enabled: false,
      disabledAt: new Date(),
      stoppedAt: new Date(),
    })
    .where(eq(segment.id, segmentId));
};

/**
 * 获取指定片段的详细信息
 * @param userId - 用户ID
 * @param datasetId - 数据集ID
 * @param documentId - 文档ID
 * @param segmentId - 片段ID
 * @returns 片段的详细信息
 * @throws {NotFoundException} 当片段不存在时
 */
export const getSegment = async (
  userId: string,
  datasetId: string,
  documentId: string,
  segmentId: string,
) => {
  const segmentRecord = await getSegmentOrThrow(
    userId,
    datasetId,
    documentId,
    segmentId,
  );
  return {
    id: segmentRecord.id,
    documentId: segmentRecord.documentId,
    datasetId: segmentRecord.datasetId,
    position: segmentRecord.position,
    content: segmentRecord.content,
    keywords: segmentRecord.keywords as string[],
    characterCount: segmentRecord.characterCount,
    tokenCount: segmentRecord.tokenCount,
    hitCount: segmentRecord.hitCount,
    hash: segmentRecord.hash,
    enabled: segmentRecord.enabled,
    disabledAt: segmentRecord.disabledAt?.getTime() ?? 0,
    status: segmentRecord.status,
    error: segmentRecord.error ?? '',
    createdAt: segmentRecord.createdAt.getTime(),
    updatedAt: segmentRecord.updatedAt.getTime(),
  };
};
