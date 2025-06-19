import { db } from '@/lib/db';
import { keywordTable, segment } from '@/lib/db/schema';
import { extractKeywords } from '@/lib/keyword';
import { log } from '@/lib/logger';
import { Document } from '@langchain/core/documents';
import {
  BaseRetriever,
  type BaseRetrieverInput,
} from '@langchain/core/retrievers';
import { inArray } from 'drizzle-orm';
import { countBy } from 'es-toolkit/array';

/**
 * 全文检索器类
 *
 * 基于关键词匹配的全文检索实现，通过提取查询关键词并与文档片段的关键词进行匹配，
 * 返回最相关的文档片段。使用关键词出现频率作为相关性评分依据。
 *
 * @example
 * ```typescript
 * const retriever = new FullTextRetriever(['dataset1', 'dataset2'], 10);
 * const documents = await retriever.getRelevantDocuments('用户查询');
 * ```
 */
export class FullTextRetriever extends BaseRetriever {
  /** LangChain 命名空间标识 */
  lc_namespace = ['langchain', 'retrievers'];

  /** 要检索的数据集ID列表 */
  datasetIds: string[];

  /** 返回的最大文档数量 */
  k: number;

  /**
   * 创建全文检索器实例
   *
   * @param datasetIds - 要检索的数据集ID数组
   * @param k - 返回的最大文档数量
   * @param fields - 可选的 BaseRetriever 配置字段
   */
  constructor(datasetIds: string[], k: number, fields?: BaseRetrieverInput) {
    super(fields);
    this.datasetIds = datasetIds;
    this.k = k;
  }

  /**
   * 获取与查询相关的文档
   *
   * 实现步骤：
   * 1. 提取查询中的关键词
   * 2. 从数据库中获取指定数据集的关键词记录
   * 3. 匹配查询关键词与文档关键词
   * 4. 统计每个文档片段的相关性得分
   * 5. 按得分排序并返回前k个最相关的文档
   *
   * @param query - 用户查询字符串
   * @returns 包含相关文档的 Promise
   */
  async _getRelevantDocuments(query: string) {
    // 提取查询中的关键词
    const queryKeywords = extractKeywords(query);

    // 从数据库中获取指定数据集的所有关键词记录
    const keywordRecords = await db
      .select({
        keywords: keywordTable.keywords,
      })
      .from(keywordTable)
      .where(inArray(keywordTable.datasetId, this.datasetIds));

    // 将所有关键词记录转换为数组格式
    const allKeywords = keywordRecords.map(
      (record) => record.keywords,
    ) as Array<Record<string, string[]>>;

    // 收集所有匹配查询关键词的文档片段ID
    let allSegmentIds: string[] = [];
    for (const keywords of allKeywords) {
      for (const keyword of Object.keys(keywords)) {
        // 如果查询关键词包含当前关键词，则收集对应的文档片段ID
        if (queryKeywords.includes(keyword)) {
          allSegmentIds = allSegmentIds.concat(keywords[keyword]);
        }
      }
    }

    // 使用 countBy 统计每个 segmentId 出现的次数作为相关性得分
    const idCounter = countBy(allSegmentIds, (id) => id);

    // 将计数结果转换为数组，按出现次数降序排序，取前k个
    const sortedSegmentIds = Object.entries(idCounter)
      .sort(([, countA], [, countB]) => countB - countA) // 降序排序
      .slice(0, this.k) // 取前k个
      .map(([segmentId]) => segmentId); // 提取segmentId

    log.info('sortedSegmentIds %o', sortedSegmentIds);

    // 根据排序后的ID获取完整的文档片段记录
    const segmentRecords = await db
      .select()
      .from(segment)
      .where(inArray(segment.id, sortedSegmentIds));

    // 创建ID到记录的映射，便于快速查找
    const segmentMap = new Map(
      segmentRecords.map((record) => [record.id, record]),
    );

    // 按照相关性排序重新组织文档片段
    const sortedSegments: Array<typeof segment.$inferSelect> = [];
    for (const id of sortedSegmentIds) {
      const segment = segmentMap.get(id);
      if (segment) {
        sortedSegments.push(segment);
      }
    }

    // 将数据库记录转换为 LangChain Document 格式
    return sortedSegments.map(
      (record) =>
        new Document({
          pageContent: record.content,
          metadata: {
            user_id: record.userId,
            dataset_id: record.datasetId,
            document_id: record.documentId,
            segment_id: record.id,
            node_id: record.nodeId,
            document_enabled: true,
            segment_enabled: true,
            score: 0, // 当前实现中分数为0，可根据需要计算实际分数
          },
        }),
    );
  }
}
