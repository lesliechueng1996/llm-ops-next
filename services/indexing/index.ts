/**
 * 文档索引服务
 *
 * 该模块负责处理文档的完整索引流程，包括：
 * 1. 文档解析：从上传的文件中提取文本内容
 * 2. 文档分割：将文档分割成更小的片段
 * 3. 文档索引：为文档片段创建关键词索引
 * 4. 文档存储：将处理后的文档片段存储到向量数据库中
 *
 * 主要依赖：
 * - 数据库操作：使用 Drizzle ORM
 * - 向量存储：使用向量数据库存储文档片段
 * - 文本处理：使用 LangChain 进行文档处理
 */

import { log } from '@/lib/logger';
import { db } from '@/lib/db';
import {
  document,
  keywordTable,
  processRule,
  segment,
  uploadFile,
} from '@/lib/db/schema';
import { inArray, and, eq, max } from 'drizzle-orm';
import { getOrCreateKeywordTable } from '@/services/keyword-table';
import { DocumentStatus, SegmentStatus } from '@/lib/entity';
import { load } from '@/lib/file-extractor';
import type { Document } from '@langchain/core/documents';
import { createTextSplitter, cleanText } from '@/lib/text-splitter';
import { calculateTokenCount } from '@/lib/embedding';
import { randomUUIDv7 } from 'bun';
import { hashText } from '@/lib/file-util';
import { extractKeywords } from '@/lib/keyword';
import { concurrencyTask } from '@/lib/utils';
import { vectorStore } from '@/lib/vector-store';

/**
 * 构建文档索引
 *
 * 该函数是文档索引流程的入口点，负责协调整个文档处理流程。
 * 它会按顺序执行以下步骤：
 * 1. 解析文档
 * 2. 分割文档
 * 3. 创建索引
 * 4. 存储文档
 *
 * @param documentIds - 需要处理的文档ID数组
 * @param datasetId - 数据集ID
 */
export const buildDocuments = async (
  documentIds: string[],
  datasetId: string,
) => {
  if (!documentIds || documentIds.length === 0) {
    log.warn('No document ids provided');
    return;
  }

  log.info(`Building documents: ${documentIds.join(', ')}`);
  // 并行查询文档记录和关键词表，提高查询效率
  const documentsQuery = db
    .select()
    .from(document)
    .where(
      and(inArray(document.id, documentIds), eq(document.datasetId, datasetId)),
    );
  const keywordTableQuery = getOrCreateKeywordTable(datasetId);

  const [documentRecords, keywordTableRecord] = await Promise.all([
    documentsQuery,
    keywordTableQuery,
  ]);

  // 遍历处理每个文档，确保每个文档都能独立处理
  for (const documentRecord of documentRecords) {
    try {
      // 更新文档状态为解析中，记录开始处理时间
      log.info('Update document %s status to parsing', documentRecord.id);
      await db
        .update(document)
        .set({
          status: DocumentStatus.PARSING,
          processingStartedAt: new Date(),
        })
        .where(eq(document.id, documentRecord.id));

      // 执行文档处理的四个主要步骤，每个步骤都有其特定的状态转换
      // 1. 解析文档：从原始文件中提取文本内容
      const langchainDocs = await parsingDocument(documentRecord);
      // 2. 分割文档：将文档分割成更小的片段，便于后续处理
      const langchainSegments = await splittingDocument(
        documentRecord,
        langchainDocs,
      );
      // 3. 索引文档：为文档片段创建关键词索引，支持后续搜索
      await indexingDocument(
        documentRecord,
        langchainSegments,
        keywordTableRecord,
      );
      // 4. 存储文档：将处理后的文档片段存储到向量数据库中
      await savingDocument(documentRecord, langchainSegments);
    } catch (error) {
      // 处理错误并更新文档状态，记录错误信息
      log.error('Build document %s failed! %o', documentRecord.id, error);
      await db
        .update(document)
        .set({
          status: DocumentStatus.ERROR,
          error: error instanceof Error ? error.message : JSON.stringify(error),
          stoppedAt: new Date(),
        })
        .where(eq(document.id, documentRecord.id));
    }
  }
};

/**
 * 解析文档
 *
 * 从上传的文件中提取文本内容，并进行基本的清理。
 * 更新文档状态为解析完成，并记录字符数。
 *
 * @param doc - 文档记录
 * @returns 解析后的 LangChain 文档数组
 */
const parsingDocument = async (doc: typeof document.$inferSelect) => {
  log.info('Start parsing document %s', doc.id);
  // 获取上传文件记录，确保文件存在
  const uploadFileRecords = await db
    .select()
    .from(uploadFile)
    .where(eq(uploadFile.id, doc.uploadFileId));
  if (uploadFileRecords.length === 0) {
    log.error('Upload file %s not found', doc.uploadFileId);
    throw new Error(`Upload file ${doc.uploadFileId} not found`);
  }
  // 使用文件提取器加载文档内容，支持多种文件格式
  const langchainDocs = (await load(
    uploadFileRecords[0].key,
    false,
    true,
  )) as Document[];

  // 清理文本并计算字符数，为后续处理做准备
  let characterCount = 0;
  for (const langchainDoc of langchainDocs) {
    // 清理文本中的特殊字符和控制字符
    langchainDoc.pageContent = cleanExtraText(langchainDoc.pageContent);
    characterCount += langchainDoc.pageContent.length;
  }

  // 更新文档状态为分割中，记录解析完成时间
  await db
    .update(document)
    .set({
      characterCount,
      status: DocumentStatus.SPLITTING,
      parsingCompletedAt: new Date(),
    })
    .where(eq(document.id, doc.id));

  log.info(
    'Document %s parsing complated, character count: %d',
    doc.id,
    characterCount,
  );

  return langchainDocs;
};

/**
 * 分割文档
 *
 * 根据处理规则将文档分割成更小的片段。
 * 为每个片段生成唯一ID，计算token数量，并更新数据库。
 *
 * @param doc - 文档记录
 * @param langchainDocs - LangChain 文档数组
 * @returns 分割后的 LangChain 文档片段数组
 */
const splittingDocument = async (
  doc: typeof document.$inferSelect,
  langchainDocs: Document[],
) => {
  log.info('Start splitting document %s', doc.id);
  // 获取处理规则，用于控制文档分割的方式
  const processRuleRecords = await db
    .select()
    .from(processRule)
    .where(eq(processRule.id, doc.processRuleId));
  if (processRuleRecords.length === 0) {
    log.error('No process rule found %s', doc.processRuleId);
    throw new Error(`No process rule found ${doc.processRuleId}`);
  }

  // 创建文本分割器，根据处理规则和token计算方式
  const textSplitter = createTextSplitter(
    processRuleRecords[0],
    calculateTokenCount,
  );
  // 清理每个文档片段的文本内容
  for (const langchainDoc of langchainDocs) {
    langchainDoc.pageContent = cleanText(
      processRuleRecords[0],
      langchainDoc.pageContent,
    );
  }

  // 使用分割器将文档分割成更小的片段
  const langchainSegments = await textSplitter.splitDocuments(langchainDocs);

  // 获取最后一个片段的位置，用于确定新片段的位置
  const segmentPositionRecord = await db
    .select({
      position: max(segment.position),
    })
    .from(segment)
    .where(eq(segment.documentId, doc.id));
  let lastSegmentPosition = segmentPositionRecord[0]?.position ?? 0;

  // 准备片段数据，包括计算token数量和生成唯一标识
  const segments: (typeof segment.$inferInsert)[] = [];
  let docTokenCount = 0;
  for (const langchainSegment of langchainSegments) {
    lastSegmentPosition++;
    const content = langchainSegment.pageContent;
    const segmentTokenCount = calculateTokenCount(content);
    docTokenCount += segmentTokenCount;
    // 创建新的片段记录，包含完整的元数据
    const segment = {
      userId: doc.userId,
      datasetId: doc.datasetId,
      documentId: doc.id,
      nodeId: randomUUIDv7(), // 生成唯一节点ID
      position: lastSegmentPosition,
      content,
      characterCount: content.length,
      tokenCount: segmentTokenCount,
      hash: hashText(content), // 计算内容哈希值，用于去重
      status: SegmentStatus.WAITING,
    };
    segments.push(segment);
  }

  // 在事务中保存片段并更新文档状态，确保数据一致性
  const segmentRecords = await db.transaction(async (tx) => {
    const saveSegmentBatchQuery = tx
      .insert(segment)
      .values(segments)
      .returning();
    const updateDocumentQuery = tx
      .update(document)
      .set({
        tokenCount: docTokenCount,
        status: DocumentStatus.INDEXING,
        splittingCompletedAt: new Date(),
      })
      .where(eq(document.id, doc.id));

    const [savedSegmentRecords, _] = await Promise.all([
      saveSegmentBatchQuery,
      updateDocumentQuery,
    ]);

    return savedSegmentRecords;
  });

  // 更新 LangChain 文档片段的元数据，添加必要的标识信息
  for (let i = 0; i < langchainSegments.length; i++) {
    const segmentRecord = segmentRecords[i];
    langchainSegments[i].metadata = {
      ...langchainSegments[i].metadata,
      user_id: segmentRecord.userId,
      dataset_id: segmentRecord.datasetId,
      document_id: segmentRecord.documentId,
      segment_id: segmentRecord.id,
      node_id: segmentRecord.nodeId,
      document_enabled: false, // 初始状态为禁用
      segment_enabled: false, // 初始状态为禁用
    };
  }

  log.info(
    'Document %s splitting completed, segment count: %d',
    doc.id,
    langchainSegments.length,
  );

  return langchainSegments;
};

/**
 * 索引文档
 *
 * 为文档片段创建关键词索引，并更新关键词表。
 * 同时更新文档和片段的状态。
 *
 * @param doc - 文档记录
 * @param langchainSegments - LangChain 文档片段数组
 * @param keywordTableRecord - 关键词表记录
 */
const indexingDocument = async (
  doc: typeof document.$inferSelect,
  langchainSegments: Document[],
  keywordTableRecord: typeof keywordTable.$inferSelect,
) => {
  log.info('Start indexing document %s', doc.id);
  // 初始化关键词映射，用于存储关键词和对应的片段ID
  const keywordMapping: Record<string, Set<string>> = {};
  const keywords = keywordTableRecord.keywords as Record<string, string[]>;
  // 加载现有的关键词映射
  for (const keywordKey of Object.keys(keywords)) {
    const keywordValues = keywords[keywordKey];
    if (!keywordMapping[keywordKey]) {
      keywordMapping[keywordKey] = new Set();
    }
    for (const keywordValue of keywordValues) {
      keywordMapping[keywordKey].add(keywordValue);
    }
  }

  // 处理每个文档片段，提取关键词并更新索引
  for (const langchainSegment of langchainSegments) {
    // 提取片段中的关键词，限制为前10个
    const segmentKeywords = extractKeywords(langchainSegment.pageContent, 10);
    // 更新片段状态和关键词
    await db
      .update(segment)
      .set({
        keywords: segmentKeywords,
        status: SegmentStatus.INDEXING,
        indexingCompletedAt: new Date(),
      })
      .where(eq(segment.id, langchainSegment.metadata.segment_id));

    // 更新关键词映射，建立关键词和片段的关联
    for (const segmentKeyword of segmentKeywords) {
      if (!keywordMapping[segmentKeyword]) {
        keywordMapping[segmentKeyword] = new Set();
      }
      keywordMapping[segmentKeyword].add(langchainSegment.metadata.segment_id);
    }
  }

  log.info('Document %s all segments indexed', doc.id);
  // 在事务中更新关键词表和文档状态
  await db.transaction(async (tx) => {
    // 更新关键词表，将Set转换为数组
    const updateKeywordTableQuery = tx
      .update(keywordTable)
      .set({
        keywords: Object.entries(keywordMapping).map((item) => ({
          [item[0]]: Array.from(item[1]),
        })),
      })
      .where(eq(keywordTable.id, keywordTableRecord.id));
    // 更新文档状态为索引完成
    const updateDocumentQuery = tx
      .update(document)
      .set({
        indexingCompletedAt: new Date(),
      })
      .where(eq(document.id, doc.id));

    await Promise.all([updateKeywordTableQuery, updateDocumentQuery]);
  });
};

/**
 * 存储文档
 *
 * 将处理完成的文档片段存储到向量数据库中。
 * 使用并发任务处理批量存储，并更新文档和片段的状态。
 *
 * @param doc - 文档记录
 * @param langchainSegments - LangChain 文档片段数组
 */
const savingDocument = async (
  doc: typeof document.$inferSelect,
  langchainSegments: Document[],
) => {
  log.info('Start saving document %s', doc.id);
  // 启用文档和片段，准备存储
  for (const langchainSegment of langchainSegments) {
    langchainSegment.metadata.document_enabled = true;
    langchainSegment.metadata.segment_enabled = true;
  }

  // 使用并发任务处理批量存储，提高性能
  const task = concurrencyTask(10); // 限制并发数为10
  for (let i = 0; i < langchainSegments.length; i += 10) {
    const segmentBatch = langchainSegments.slice(i, i + 10);
    const ids = segmentBatch.map((item) => item.metadata.node_id);
    task.addTask(async () => {
      // 将片段添加到向量存储，支持相似度搜索
      await vectorStore.addDocuments(segmentBatch, {
        ids,
      });

      // 更新片段状态为完成，启用片段
      await db
        .update(segment)
        .set({
          status: SegmentStatus.COMPLETED,
          completedAt: new Date(),
          enabled: true,
        })
        .where(inArray(segment.nodeId, ids));
    });
  }

  // 等待所有存储任务完成
  await task.run();
  log.info('Document %s all segments completed', doc.id);
  // 更新文档状态为完成，启用文档
  await db
    .update(document)
    .set({
      status: DocumentStatus.COMPLETED,
      completedAt: new Date(),
      enabled: true,
    })
    .where(eq(document.id, doc.id));

  log.info('Document %s completed', doc.id);
};

/**
 * 清理文本中的特殊字符
 *
 * 移除文本中的控制字符和特殊标记，确保文本格式的一致性。
 *
 * @param text - 需要清理的文本
 * @returns 清理后的文本
 */
const cleanExtraText = (text: string) => {
  // 清理特殊标记，替换为标准的HTML标签
  let result = text.replace(/<\|/g, '<');
  result = result.replace(/\|>/g, '>');
  // 用字符串构造 RegExp，避免控制字符导致的语法错误
  const controlChars = '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F\uFFFE]';
  // 清理所有控制字符
  result = result.replace(new RegExp(controlChars, 'g'), '');
  // 清理特殊Unicode字符
  result = result.replace(/\uFFFE/g, '');
  return result;
};
