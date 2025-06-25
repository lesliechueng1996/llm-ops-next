/**
 * Dataset Worker
 *
 * 这是一个处理知识库相关任务的 worker 处理器。它负责处理以下任务：
 * 1. 删除知识库 (DELETE_DATASET_TASK_NAME)
 */

import { log } from '@/lib/logger';
import { DELETE_DATASET_TASK_NAME } from '@/lib/queues/queue-name';
import { deleteDataset } from '@/services/indexing';
import type { Job } from 'bullmq';

/**
 * 处理文档队列中的任务
 * @param job - BullMQ 任务对象，包含任务名称和数据
 * @returns Promise<void>
 */
export default async function (job: Job) {
  log.info('Receive job from document queue, data: %o', job);
  const { name, data } = job;
  console.log('name: %s, data: %o', name, data);

  // 根据任务类型分发到不同的处理函数
  if (name === DELETE_DATASET_TASK_NAME) {
    log.info('Deleting dataset, data: %o', data);
    const { datasetId } = data;
    await deleteDataset(datasetId);
  } else {
    log.error('Unknown job name: %s', name);
  }
}
