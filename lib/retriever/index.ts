/**
 * 数据集检索模块
 *
 * 该模块提供了多种检索策略来从知识库中搜索相关内容：
 * - 语义检索：基于向量相似度搜索
 * - 全文检索：基于关键词匹配搜索
 * - 混合检索：结合语义和全文检索的结果
 *
 * 主要功能：
 * 1. 支持多种检索策略配置
 * 2. 自动记录查询历史和命中统计
 * 3. 提供 LangChain 工具接口
 */

import { db } from '@/lib/db';
import { dataset, datasetQuery, segment } from '@/lib/db/schema';
import {
  DATASET_RETRIEVAL_TOOL_NAME,
  RetrievalSource,
  RetrievalStrategy,
} from '@/lib/entity';
import type { DocumentInterface } from '@langchain/core/documents';
import { tool } from '@langchain/core/tools';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { EnsembleRetriever } from 'langchain/retrievers/ensemble';
import { z } from 'zod';
import { FullTextRetriever } from './full-text-retriever';
import { SemanticRetriever } from './semantic-retriever';

/**
 * 检索配置接口
 */
type RetrievalConfig = {
  /** 检索策略：语义检索、全文检索或混合检索 */
  retrievalStrategy: RetrievalStrategy;
  /** 返回结果数量 */
  k: number;
  /** 检索来源标识 */
  retrievalSource: RetrievalSource;
  /** 相似度阈值，用于过滤低质量结果 */
  score: number;
};

/**
 * 默认检索配置
 */
const defaultRetrievalConfig: RetrievalConfig = {
  retrievalStrategy: RetrievalStrategy.SEMANTIC,
  k: 4,
  retrievalSource: RetrievalSource.HIT_TESTING,
  score: 0,
};

/**
 * 在指定数据集中搜索相关内容
 *
 * @param query - 搜索查询字符串
 * @param datasetIds - 要搜索的数据集ID列表
 * @param userId - 用户ID，用于权限验证
 * @param retrievalConfig - 检索配置参数
 * @returns 检索到的文档列表
 */
const searchInDataset = async (
  query: string,
  datasetIds: string[],
  userId: string,
  retrievalConfig: RetrievalConfig,
) => {
  // 验证用户对数据集的访问权限
  const availableDatasets = await db
    .select()
    .from(dataset)
    .where(and(inArray(dataset.id, datasetIds), eq(dataset.userId, userId)));

  const availiableDatasetIds = availableDatasets.map((record) => record.id);

  // 初始化语义检索器
  const semanticRetriever = new SemanticRetriever(
    availiableDatasetIds,
    retrievalConfig.k,
    retrievalConfig.score,
  );

  // 初始化全文检索器
  const fullTextRetriever = new FullTextRetriever(
    availiableDatasetIds,
    retrievalConfig.k,
  );

  // 创建混合检索器，结合语义和全文检索结果
  const hybridRetriever = new EnsembleRetriever({
    retrievers: [semanticRetriever, fullTextRetriever],
    weights: [0.5, 0.5], // 两种检索方式权重相等
  });

  let langchainDocs: DocumentInterface[] = [];

  // 根据检索策略选择相应的检索器
  if (retrievalConfig.retrievalStrategy === RetrievalStrategy.SEMANTIC) {
    langchainDocs = await semanticRetriever.invoke(query);
  } else if (
    retrievalConfig.retrievalStrategy === RetrievalStrategy.FULL_TEXT
  ) {
    langchainDocs = await fullTextRetriever.invoke(query);
  } else if (retrievalConfig.retrievalStrategy === RetrievalStrategy.HYBRID) {
    langchainDocs = await hybridRetriever.invoke(query);
  }

  // 提取涉及的数据集ID
  const datasetIdSet = new Set(
    langchainDocs.map((doc) => doc.metadata.dataset_id),
  );

  // 在事务中记录查询历史和更新命中统计
  await db.transaction(async (tx) => {
    // 记录查询历史
    const datasetQueryValues = Array.from(datasetIdSet).map((datasetId) => ({
      datasetId,
      query,
      source: retrievalConfig.retrievalSource,
      sourceAppId: null,
      createdBy: userId,
    }));

    await tx.insert(datasetQuery).values(datasetQueryValues);

    // 更新命中片段的统计计数
    const hitSegmentIds = Array.from(
      new Set(langchainDocs.map((doc) => doc.metadata.segment_id)),
    );
    await tx
      .update(segment)
      .set({
        hitCount: sql`${segment.hitCount} + 1`,
      })
      .where(inArray(segment.id, hitSegmentIds));
  });

  return langchainDocs;
};

/**
 * 数据集检索工具的输入参数模式
 */
const datasetRetrievalToolInputSchema = z.object({
  query: z.string().describe('知识库搜索query语句，类型为字符串'),
});

/**
 * 创建用于数据集检索的 LangChain 工具
 *
 * 该工具可以在 AI 对话中被调用，用于搜索知识库中的相关内容。
 * 当 AI 认为用户的提问超出其知识范围时，可以调用此工具获取相关信息。
 *
 * @param datasetIds - 可搜索的数据集ID列表
 * @param userId - 用户ID，用于权限验证
 * @param retrievalConfig - 检索配置参数
 * @returns LangChain 工具实例
 */
export const createLangchainToolForDataset = (
  datasetIds: string[],
  userId: string,
  retrievalConfig: RetrievalConfig,
) => {
  // 合并默认配置和用户配置
  const retrievalOptions = {
    ...defaultRetrievalConfig,
    ...retrievalConfig,
  };

  return tool(
    async ({ query }: z.infer<typeof datasetRetrievalToolInputSchema>) => {
      // 执行数据集搜索
      const langchainDocs = await searchInDataset(
        query,
        datasetIds,
        userId,
        retrievalOptions,
      );

      // 如果没有找到相关内容，返回提示信息
      if (langchainDocs.length === 0) {
        return '知识库内没有检索到对应内容';
      }

      // 将所有检索到的文档内容合并为一个字符串返回
      return langchainDocs.map((doc) => doc.pageContent).join('\n\n');
    },
    {
      name: DATASET_RETRIEVAL_TOOL_NAME,
      description:
        '如果需要搜索扩展的知识库内容，当你觉得用户的提问超过你的知识范围时，可以尝试调用该工具，输入为搜索query语句，返回数据为检索内容字符串',
      schema: datasetRetrievalToolInputSchema,
    },
  );
};
