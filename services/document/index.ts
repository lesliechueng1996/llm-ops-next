/**
 * 文档服务模块
 * 提供文档相关的数据库操作和业务逻辑
 *
 * 主要功能：
 * 1. 文档列表的分页查询和搜索
 * 2. 文档的创建和批量处理
 * 3. 文档点击统计
 * 4. 文档处理规则管理
 * 5. 文档状态更新和启用/禁用控制
 * 6. 单个文档的详细信息查询
 * 7. 文档删除和验证
 */

// import { randomUUIDv7 } from 'bun';
import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@/exceptions';
import { db } from '@/lib/db';
import {
  dataset,
  document,
  processRule,
  segment,
  uploadFile,
} from '@/lib/db/schema';
import { DocumentStatus, LOCK_DOCUMENT_UPDATE_ENABLED } from '@/lib/entity';
import { log } from '@/lib/logger';
import { calculatePagination, paginationResult } from '@/lib/paginator';
import {
  buildDocumentsAyncTask,
  deleteDocumentAsyncTask,
  updateDocumentEnabledAsyncTask,
} from '@/lib/queues/document-queue';
import { acquireLock, releaseLock } from '@/lib/redis/lock';
import type { SearchPageReq } from '@/schemas/common-schema';
import type {
  CreateDocumentReq,
  GetDocumentBatchRes,
} from '@/schemas/document-schema';
import { format } from 'date-fns';
import {
  and,
  count,
  desc,
  eq,
  inArray,
  like,
  max,
  sql,
  sum,
} from 'drizzle-orm';

/**
 * 分页获取文档列表
 *
 * @param userId - 用户ID，用于权限验证
 * @param datasetId - 数据集ID，用于筛选特定数据集的文档
 * @param pageReq - 分页请求参数，包含搜索关键词和分页信息
 * @returns 分页后的文档列表，包含每个文档的点击次数统计
 *
 * 功能说明：
 * 1. 支持按关键词搜索文档
 * 2. 返回文档的基本信息和点击统计
 * 3. 按更新时间倒序排序
 * 4. 包含分页信息
 * 5. 并行执行查询以提高性能
 * 6. 聚合计算每个文档的点击次数
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

  // 并行执行查询以提高性能
  const [list, total] = await Promise.all([listQuery, totalQuery]);

  // 获取所有文档ID用于查询点击统计
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

  // 构建文档ID到点击次数的映射，用于快速查找
  const hitCountMap = new Map<string, number>(
    segmentResult.map((item) => [item.documentId, item.hitCount]),
  );

  // 格式化返回结果，统一时间戳格式
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

/**
 * 创建文档并启动处理流程
 *
 * @param userId - 用户ID，用于权限验证
 * @param datasetId - 数据集ID，用于关联文档到特定数据集
 * @param data - 创建文档的请求数据，包含上传文件ID和处理规则
 * @returns 创建的文档列表和批次ID
 *
 * 功能说明：
 * 1. 验证数据集和上传文件的存在性
 * 2. 创建处理规则记录
 * 3. 批量创建文档记录
 * 4. 启动异步文档处理任务
 * 5. 使用事务确保数据一致性
 * 6. 自动计算文档位置排序
 */
export const createDocuments = async (
  userId: string,
  datasetId: string,
  data: CreateDocumentReq,
) => {
  // 验证数据集和上传文件的存在性
  const datasetQuery = db
    .select()
    .from(dataset)
    .where(and(eq(dataset.userId, userId), eq(dataset.id, datasetId)));

  const uploadFileQuery = db
    .select()
    .from(uploadFile)
    .where(
      and(
        eq(uploadFile.userId, userId),
        inArray(uploadFile.id, data.uploadFileIds),
      ),
    );

  const [datasetRecords, uploadFileRecords] = await Promise.all([
    datasetQuery,
    uploadFileQuery,
  ]);

  if (datasetRecords.length === 0) {
    throw new NotFoundException('数据集不存在');
  }

  if (uploadFileRecords.length === 0) {
    throw new NotFoundException('上传文件不存在');
  }

  // 生成批次ID，用于跟踪同一批次的文档
  const batchId = `${format(new Date(), 'yyyyMMddHHmmss')}-${randomUUID()}`;
  log.info('生成批次ID: %s', batchId);

  // 获取当前最大位置值，用于新文档的位置排序
  const lastDocumentPosition = await db
    .select({ position: max(document.position) })
    .from(document)
    .where(and(eq(document.userId, userId), eq(document.datasetId, datasetId)));
  let lastPosition = lastDocumentPosition[0]?.position ?? 0;
  log.info('当前最大位置值: %d', lastPosition);

  // 在事务中创建处理规则和文档记录
  const docs = await db.transaction(async (tx) => {
    // 创建处理规则
    const processRuleRecord = await tx
      .insert(processRule)
      .values({
        userId,
        datasetId,
        mode: data.processType,
        rule: data.rule,
      })
      .returning();

    // 批量创建文档记录
    const documentRecords = await tx
      .insert(document)
      .values(
        uploadFileRecords.map((record) => {
          lastPosition++;
          return {
            userId,
            datasetId,
            uploadFileId: record.id,
            processRuleId: processRuleRecord[0].id,
            status: DocumentStatus.WAITING,
            batch: batchId,
            name: record.name,
            position: lastPosition,
          };
        }),
      )
      .returning();

    return documentRecords;
  });

  // 获取新创建的文档ID
  const documentIds = docs.map((doc) => doc.id);
  log.info('新创建的文档ID: %o', documentIds);

  // 启动异步文档处理任务
  buildDocumentsAyncTask(documentIds, datasetId);

  // 返回创建结果
  return {
    documents: docs.map((doc) => ({
      id: doc.id,
      name: doc.name,
      status: doc.status,
      createdAt: doc.createdAt.getTime(),
    })),
    batch: batchId,
  };
};

/**
 * 获取指定批次的文档详细信息
 *
 * @param datasetId - 数据集ID
 * @param batchId - 批次ID
 * @param userId - 用户ID
 * @returns 批次内所有文档的详细信息，包括处理状态和统计信息
 *
 * 功能说明：
 * 1. 获取批次内所有文档的基本信息
 * 2. 查询关联的上传文件信息
 * 3. 统计每个文档的分段数量
 * 4. 统计每个文档的已完成分段数量
 * 5. 返回完整的文档处理状态信息
 */
export const getDocumentByBatch = async (
  datasetId: string,
  batchId: string,
  userId: string,
) => {
  const docs = await db
    .select()
    .from(document)
    .where(
      and(
        eq(document.userId, userId),
        eq(document.batch, batchId),
        eq(document.datasetId, datasetId),
      ),
    );

  if (docs.length === 0) {
    log.warn(`未发现该批次文档: ${batchId}`);
    throw new NotFoundException('未发现该批次文档');
  }

  const uploadFileIds = docs.map((doc) => doc.uploadFileId);
  const uploadFileQuery = db
    .select()
    .from(uploadFile)
    .where(inArray(uploadFile.id, uploadFileIds));
  const segmentCountQuery = db
    .select({
      documentId: segment.documentId,
      segmentCount: count(),
    })
    .from(segment)
    .where(
      and(
        eq(segment.userId, userId),
        eq(segment.datasetId, datasetId),
        inArray(
          segment.documentId,
          docs.map((doc) => doc.id),
        ),
      ),
    )
    .groupBy(segment.documentId);
  const completedSegmentCountQuery = db
    .select({
      documentId: segment.documentId,
      completedSegmentCount: count(),
    })
    .from(segment)
    .where(
      and(
        eq(segment.userId, userId),
        eq(segment.datasetId, datasetId),
        inArray(
          segment.documentId,
          docs.map((doc) => doc.id),
        ),
        eq(segment.status, DocumentStatus.COMPLETED),
      ),
    )
    .groupBy(segment.documentId);

  const [uploadFileRecords, segmentCountRecords, completedSegmentCountRecords] =
    await Promise.all([
      uploadFileQuery,
      segmentCountQuery,
      completedSegmentCountQuery,
    ]);

  const uploadFileMap = uploadFileRecords.reduce(
    (acc, record) => {
      acc[record.id] = record;
      return acc;
    },
    {} as Record<string, typeof uploadFile.$inferSelect>,
  );

  const docSegmentCountMap = segmentCountRecords.reduce(
    (acc, record) => {
      acc[record.documentId] = record.segmentCount;
      return acc;
    },
    {} as Record<string, number>,
  );

  const docCompletedSegmentCountMap = completedSegmentCountRecords.reduce(
    (acc, record) => {
      acc[record.documentId] = record.completedSegmentCount;
      return acc;
    },
    {} as Record<string, number>,
  );

  const results: GetDocumentBatchRes[] = [];
  for (const doc of docs) {
    const uploadFileRecord = uploadFileMap[doc.uploadFileId];

    results.push({
      id: doc.id,
      name: doc.name,
      size: uploadFileRecord?.size ?? 0,
      extension: uploadFileRecord?.extension ?? 'N/A',
      mimeType: uploadFileRecord?.mimeType ?? 'N/A',
      position: doc.position,
      segmentCount: docSegmentCountMap[doc.id] ?? 0,
      completedSegmentCount: docCompletedSegmentCountMap[doc.id] ?? 0,
      error: doc.error ?? '',
      status: doc.status as DocumentStatus,
      processingStartedAt: doc.processingStartedAt?.getTime() ?? 0,
      parsingCompletedAt: doc.parsingCompletedAt?.getTime() ?? 0,
      splittingCompletedAt: doc.splittingCompletedAt?.getTime() ?? 0,
      indexingCompletedAt: doc.indexingCompletedAt?.getTime() ?? 0,
      completedAt: doc.completedAt?.getTime() ?? 0,
      stoppedAt: doc.stoppedAt?.getTime() ?? 0,
      createdAt: doc.createdAt.getTime(),
    });
  }

  return results;
};

/**
 * 更新文档名称
 *
 * @param name - 新的文档名称
 * @param documentId - 文档ID
 * @param datasetId - 数据集ID
 * @param userId - 用户ID
 * @throws NotFoundException 当文档不存在时抛出
 *
 * 功能说明：
 * 1. 验证文档所有权
 * 2. 更新文档名称
 * 3. 返回更新后的文档信息
 */
export const updateDocumentName = async (
  name: string,
  documentId: string,
  datasetId: string,
  userId: string,
) => {
  const result = await db
    .update(document)
    .set({ name })
    .where(
      and(
        eq(document.userId, userId),
        eq(document.id, documentId),
        eq(document.datasetId, datasetId),
      ),
    )
    .returning();

  if (result.length === 0) {
    throw new NotFoundException('文档不存在');
  }
};

/**
 * 更新文档启用状态
 *
 * @param enabled - 是否启用文档
 * @param documentId - 文档ID
 * @param datasetId - 数据集ID
 * @param userId - 用户ID
 * @throws NotFoundException 当文档不存在时抛出
 * @throws BadRequestException 当文档未完成解析或状态未变化时抛出
 * @throws ConflictException 当文档正在被其他操作修改时抛出
 *
 * 功能说明：
 * 1. 验证文档状态和所有权
 * 2. 使用分布式锁确保并发安全
 * 3. 更新文档启用状态
 * 4. 记录禁用时间（如果禁用）
 * 5. 触发异步更新任务
 */
export const updateDocumentEnabled = async (
  enabled: boolean,
  documentId: string,
  datasetId: string,
  userId: string,
) => {
  const doc = await validateAndGetDocument(datasetId, documentId, userId);
  if (doc.status !== DocumentStatus.COMPLETED) {
    throw new BadRequestException('文档未完成解析，暂无法修改');
  }
  if (doc.enabled === enabled) {
    throw new BadRequestException('文档状态未发生变化');
  }
  const lockKey = LOCK_DOCUMENT_UPDATE_ENABLED.replace(
    '{document_id}',
    documentId,
  );
  const lockValue = randomUUID();
  const lockAcquired = await acquireLock(lockKey, lockValue);
  if (!lockAcquired) {
    log.warn('获取锁失败, key: %s, value: %s', lockKey, lockValue);
    throw new ConflictException('当前文档正在修改启用状态，请稍后再次尝试');
  }

  try {
    await db
      .update(document)
      .set({ enabled, disabledAt: enabled ? null : new Date() })
      .where(and(eq(document.id, documentId), eq(document.userId, userId)));

    updateDocumentEnabledAsyncTask(documentId, enabled, lockKey, lockValue);
  } catch (error) {
    log.error(
      '更新文档启用状态失败, documentId: %s, enabled: %s, error: %o',
      documentId,
      enabled,
      error,
    );
    await releaseLock(lockKey, lockValue);
  }
};

/**
 * 获取单个文档的详细信息
 *
 * @param datasetId - 数据集ID，用于定位特定数据集中的文档
 * @param documentId - 文档ID，用于定位特定文档
 * @param userId - 用户ID，用于权限验证
 * @returns 文档的详细信息，包括基本信息和统计信息
 * @throws NotFoundException 当文档不存在时抛出
 *
 * 功能说明：
 * 1. 验证文档的存在性和所有权
 * 2. 获取文档的基本信息
 * 3. 统计文档的分段数量和点击次数
 * 4. 返回格式化的文档详细信息
 */
export const getDocument = async (
  datasetId: string,
  documentId: string,
  userId: string,
) => {
  // 查询文档基本信息
  const doc = await validateAndGetDocument(datasetId, documentId, userId);

  // 查询文档的分段统计信息
  const segmentData = await db
    .select({
      segmentCount: count(segment.id),
      hitCount: sum(segment.hitCount),
    })
    .from(segment)
    .where(eq(segment.documentId, documentId));

  // 返回格式化的文档信息
  return {
    id: doc.id,
    datasetId: doc.datasetId,
    name: doc.name,
    segmentCount: segmentData[0]?.segmentCount ?? 0,
    characterCount: doc.characterCount,
    hitCount: segmentData[0]?.hitCount ?? 0,
    position: doc.position,
    enabled: doc.enabled,
    disabledAt: doc.disabledAt?.getTime() ?? 0,
    status: doc.status,
    error: doc.error,
    createdAt: doc.createdAt.getTime(),
    updatedAt: doc.updatedAt.getTime(),
  };
};

/**
 * 删除文档及其相关数据
 *
 * @param datasetId - 数据集ID，用于定位特定数据集中的文档
 * @param documentId - 文档ID，用于定位要删除的文档
 * @param userId - 用户ID，用于权限验证
 * @throws NotFoundException 当文档不存在时抛出
 * @throws BadRequestException 当文档未完成解析时抛出
 *
 * 功能说明：
 * 1. 验证文档的存在性和所有权
 * 2. 检查文档状态是否允许删除
 * 3. 获取文档相关的所有分段ID
 * 4. 删除文档记录
 * 5. 触发异步任务清理相关数据
 */
export const deleteDocument = async (
  datasetId: string,
  documentId: string,
  userId: string,
) => {
  const doc = await validateAndGetDocument(datasetId, documentId, userId);

  if (
    doc.status !== DocumentStatus.COMPLETED &&
    doc.status !== DocumentStatus.ERROR
  ) {
    throw new BadRequestException('文档未完成解析，暂无法删除');
  }

  const segmentRecords = await db
    .select({ id: segment.id })
    .from(segment)
    .where(
      and(
        eq(segment.documentId, documentId),
        eq(segment.datasetId, datasetId),
        eq(segment.userId, userId),
      ),
    );

  const segmentIds = segmentRecords.map((item) => item.id);

  await db.delete(document).where(eq(document.id, documentId));
  deleteDocumentAsyncTask(datasetId, documentId, segmentIds);
};

/**
 * 验证并获取文档信息
 *
 * @param datasetId - 数据集ID，用于定位特定数据集中的文档
 * @param documentId - 文档ID，用于定位特定文档
 * @param userId - 用户ID，用于权限验证
 * @returns 文档的完整信息
 * @throws NotFoundException 当文档不存在时抛出
 *
 * 功能说明：
 * 1. 验证文档的存在性
 * 2. 验证文档的所有权
 * 3. 返回文档的完整信息
 */
export const validateAndGetDocument = async (
  datasetId: string,
  documentId: string,
  userId: string,
) => {
  // 查询文档基本信息
  const docs = await db
    .select()
    .from(document)
    .where(
      and(
        eq(document.id, documentId),
        eq(document.datasetId, datasetId),
        eq(document.userId, userId),
      ),
    );

  if (docs.length === 0) {
    throw new NotFoundException('文档不存在');
  }

  return docs[0];
};
