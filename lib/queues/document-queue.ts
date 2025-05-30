/**
 * 文档队列处理模块
 *
 * 该模块负责处理文档构建的异步任务队列。使用 BullMQ 作为队列管理器，
 * 通过 Redis 作为后端存储。主要用于批量处理文档的构建任务。
 */

import { Queue } from 'bullmq';
import { log } from '@/lib/logger';
import { redisConnection } from '@/lib/redis';
import { DOCUMENT_QUEUE_NAME, BUILD_DOCUMENTS_TASK_NAME } from './queue-name';

// 初始化文档处理队列
const documentQueue = new Queue(DOCUMENT_QUEUE_NAME, {
  connection: redisConnection,
});

/**
 * 异步构建文档任务
 *
 * 将文档构建任务添加到队列中异步处理。任务完成后会自动从队列中移除。
 *
 * @param documentIds - 需要构建的文档ID数组
 * @returns Promise<Job> - 返回队列任务实例
 */
export const buildDocumentsAyncTask = async (documentIds: string[]) => {
  log.info('Building documents: %o', documentIds);

  return documentQueue.add(
    BUILD_DOCUMENTS_TASK_NAME,
    { documentIds },
    {
      removeOnComplete: true, // 任务完成后自动从队列中移除
      removeOnFail: true, // 任务失败后自动从队列中移除
    },
  );
};
