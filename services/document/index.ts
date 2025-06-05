/**
 * 文档服务模块
 * 提供文档相关的数据库操作和业务逻辑
 *
 * 主要功能：
 * 1. 文档列表的分页查询和搜索
 * 2. 文档的创建和批量处理
 * 3. 文档点击统计
 * 4. 文档处理规则管理
 */

import { NotFoundException } from '@/exceptions';
import { db } from '@/lib/db';
import {
  dataset,
  document,
  processRule,
  segment,
  uploadFile,
} from '@/lib/db/schema';
import { DocumentStatus } from '@/lib/entity';
import { calculatePagination, paginationResult } from '@/lib/paginator';
import { buildDocumentsAyncTask } from '@/lib/queues/document-queue';
import type { SearchPageReq } from '@/schemas/common-schema';
import type { CreateDocumentReq } from '@/schemas/document-schema';
import { randomUUIDv7 } from 'bun';
import { format } from 'date-fns';
import { and, count, desc, eq, inArray, like, max, sql } from 'drizzle-orm';

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
  const batchId = `${format(new Date(), 'yyyyMMddHHmmss')}-${randomUUIDv7()}`;

  // 获取当前最大位置值，用于新文档的位置排序
  const lastDocumentPosition = await db
    .select({ position: max(document.position) })
    .from(document)
    .where(and(eq(document.userId, userId), eq(document.datasetId, datasetId)));
  let lastPosition = lastDocumentPosition[0]?.position ?? 0;

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

  // 启动异步文档处理任务
  buildDocumentsAyncTask(documentIds);

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
