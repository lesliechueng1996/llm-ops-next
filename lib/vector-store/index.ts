/**
 * 本模块用于初始化和导出 Weaviate 向量存储相关的工具，包括向量存储实例、检索器和集合操作方法。
 * 依赖 weaviate-client 和 @langchain/weaviate。
 */
import weaviate from 'weaviate-client';
import { WeaviateStore } from '@langchain/weaviate';
import { cacheBackedEmbeddings } from '@/lib/embedding';

/**
 * Weaviate 集合名称，所有数据将存储于此集合中。
 */
const COLLECTION_NAME = 'Dataset';

/**
 * 初始化 Weaviate 客户端，连接到自定义主机和端口。
 * 主机和端口通过环境变量 WEAVIATE_HOST 和 WEAVIATE_PORT 配置，默认为 localhost:8080。
 */
const weaviateClient = await weaviate.connectToCustom({
  httpHost: process.env.WEAVIATE_HOST ?? 'localhost',
  httpPort: Number(process.env.WEAVIATE_PORT ?? 8080),
});

/**
 * 向量存储实例，基于 Weaviate 和缓存嵌入。
 * 用于存储和检索文本的向量表示。
 */
export const vectorStore = new WeaviateStore(cacheBackedEmbeddings, {
  client: weaviateClient,
  indexName: COLLECTION_NAME,
  textKey: 'text',
});

/**
 * 获取向量存储的检索器（Retriever），用于相似度检索。
 * @returns 检索器实例
 */
export const vectorStoreRetriver = () => vectorStore.asRetriever();

/**
 * 获取 Weaviate 的集合对象，可用于集合级别的操作。
 * @returns 集合对象
 */
export const vectorStoreCollection = () =>
  weaviateClient.collections.get(COLLECTION_NAME);
