/**
 * 数据集队列管理模块
 *
 * 该模块负责处理数据集相关的异步任务，特别是数据集的删除操作。
 * 使用 BullMQ 队列系统来管理任务，确保数据操作的可靠性和异步处理。
 *
 * @module dataset-queue
 */

import { log } from '@/lib/logger';
import { redisConnection } from '@/lib/redis';
import { Queue } from 'bullmq';
import { DATASET_QUEUE_NAME, DELETE_DATASET_TASK_NAME } from './queue-name';

/**
 * 数据集队列实例
 * 用于处理所有与数据集相关的异步任务
 */
const datasetQueue = new Queue(DATASET_QUEUE_NAME, {
  connection: redisConnection,
});

/**
 * 异步删除数据集任务
 *
 * 将数据集删除操作添加到队列中，实现异步处理。
 * 任务完成后会自动从队列中移除，避免内存泄漏。
 *
 * @param datasetId - 要删除的数据集ID
 * @returns Promise<Job> 返回队列任务对象
 *
 * @example
 * ```typescript
 * await deleteDatasetAsyncTask('dataset-123');
 * ```
 */
export const deleteDatasetAsyncTask = async (datasetId: string) => {
  log.info('Deleting dataset, datasetId: %s', datasetId);

  return datasetQueue.add(
    DELETE_DATASET_TASK_NAME,
    { datasetId },
    {
      // 任务完成后自动从队列中移除
      removeOnComplete: true,
      // 任务失败后自动从队列中移除
      removeOnFail: true,
    },
  );
};
