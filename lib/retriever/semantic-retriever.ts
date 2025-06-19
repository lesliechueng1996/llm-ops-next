import {
  BaseRetriever,
  type BaseRetrieverInput,
} from '@langchain/core/retrievers';
import { Filters } from 'weaviate-client';
import { vectorStore, vectorStoreCollection } from '../vector-store';

/**
 * 语义检索器类
 *
 * 基于向量数据库进行语义相似度搜索的检索器实现。
 * 支持多数据集查询，并可以根据相似度分数进行过滤。
 *
 * @example
 * ```typescript
 * const retriever = new SemanticRetriever(
 *   ['dataset1', 'dataset2'], // 数据集ID列表
 *   10,                       // 返回结果数量
 *   0.7                       // 相似度阈值
 * );
 *
 * const results = await retriever.getRelevantDocuments("查询文本");
 * ```
 */
export class SemanticRetriever extends BaseRetriever {
  lc_namespace = ['langchain', 'retrievers'];

  /** 要搜索的数据集ID列表 */
  datasetIds: string[];

  /** 返回的最大文档数量 */
  k: number;

  /** 相似度分数阈值，低于此值的文档将被过滤 */
  scoreThreshold: number;

  /**
   * 创建语义检索器实例
   *
   * @param datasetIds - 要搜索的数据集ID数组
   * @param k - 返回的最大文档数量
   * @param scoreThreshold - 相似度分数阈值 (0-1之间)
   * @param fields - 基础检索器的可选配置字段
   */
  constructor(
    datasetIds: string[],
    k: number,
    scoreThreshold: number,
    fields?: BaseRetrieverInput,
  ) {
    super(fields);
    this.datasetIds = datasetIds;
    this.k = k;
    this.scoreThreshold = scoreThreshold;
  }

  /**
   * 执行语义相似度搜索
   *
   * 根据查询文本在指定的数据集中搜索相似文档。
   * 使用向量数据库进行语义相似度计算，并应用以下过滤条件：
   * - 文档必须属于指定的数据集
   * - 文档必须已启用
   * - 文档片段必须已启用
   * - 相似度分数必须达到阈值
   *
   * @param query - 查询文本
   * @returns 包含相似度分数的文档数组
   */
  async _getRelevantDocuments(query: string) {
    // 获取向量存储集合实例
    const collection = vectorStoreCollection();

    // 执行相似度搜索，应用过滤条件
    const searchResults = await vectorStore.similaritySearchWithScore(
      query,
      this.k,
      Filters.and(
        // 过滤指定数据集
        collection.filter
          .byProperty('dataset_id')
          .containsAny(this.datasetIds),
        // 过滤已启用的文档
        collection.filter
          .byProperty('document_enabled')
          .equal(true),
        // 过滤已启用的文档片段
        collection.filter
          .byProperty('segment_enabled')
          .equal(true),
      ),
    );

    // 根据相似度阈值过滤结果
    const filteredSearchResults = searchResults.filter(
      ([_, score]) => score >= this.scoreThreshold,
    );

    // 如果没有找到符合条件的文档，返回空数组
    if (!filteredSearchResults || filteredSearchResults.length === 0) {
      return [];
    }

    // 将相似度分数添加到文档元数据中并返回
    return filteredSearchResults.map(([doc, score]) => {
      doc.metadata.score = score;
      return doc;
    });
  }
}
