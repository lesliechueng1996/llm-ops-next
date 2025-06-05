/**
 * 嵌入向量处理模块
 *
 * 该模块提供了文本嵌入向量的生成、缓存和令牌计算功能。
 * 使用阿里云通义千问的嵌入模型，并实现了基于Redis的缓存机制。
 */

import { redisClient } from '@/lib/redis';
import { AlibabaTongyiEmbeddings } from '@langchain/community/embeddings/alibaba_tongyi';
import { RedisByteStore } from '@langchain/community/storage/ioredis';
import { CacheBackedEmbeddings } from 'langchain/embeddings/cache_backed';
import { encoding_for_model as encodingForModel } from 'tiktoken';

// 初始化阿里云通义千问嵌入模型
export const embeddings = new AlibabaTongyiEmbeddings({
  modelName: 'text-embedding-v2',
});

// 初始化Redis存储实例
export const redisStore = new RedisByteStore({
  client: redisClient,
});

// 创建带缓存的嵌入向量生成器
export const cacheBackedEmbeddings = CacheBackedEmbeddings.fromBytesStore(
  embeddings,
  redisStore,
  {
    namespace: 'embeddings',
  },
);

/**
 * 计算文本的令牌数量
 * @param text - 需要计算令牌数的文本
 * @returns 文本对应的令牌数量
 */
export const calculateTokenCount = (text: string) => {
  const encoding = encodingForModel('gpt-4o-mini');
  const tokens = encoding.encode(text);
  encoding.free();
  return tokens.length;
};
