/**
 * 文档队列处理模块
 *
 * 该模块负责处理文档相关的异步任务队列。使用 BullMQ 作为队列管理器，
 * 通过 Redis 作为后端存储。主要用于处理文档的构建、删除和状态更新等任务。
 *
 * 主要功能：
 * 1. 异步构建文档
 * 2. 更新文档启用状态
 * 3. 异步删除文档及其相关片段
 *
 * 使用说明：
 * - 所有任务完成后会自动从队列中移除
 * 2. 任务失败后也会自动从队列中移除
 * 3. 使用 Redis 作为队列存储后端
 * 4. 支持分布式锁机制确保状态更新的原子性
 */

import { log } from '@/lib/logger';
import { redisConnection } from '@/lib/redis';
import { Queue } from 'bullmq';
import {
  BUILD_DOCUMENTS_TASK_NAME,
  DELETE_DOCUMENT_TASK_NAME,
  DOCUMENT_QUEUE_NAME,
  UPDATE_DOCUMENT_ENABLED_TASK_NAME,
} from './queue-name';

// 初始化文档处理队列，使用 Redis 作为后端存储
const documentQueue = new Queue(DOCUMENT_QUEUE_NAME, {
  connection: redisConnection,
});

/**
 * 异步构建文档任务
 *
 * 将文档构建任务添加到队列中异步处理。任务完成后会自动从队列中移除。
 * 该函数用于批量处理多个文档的构建任务。
 *
 * @param documentIds - 需要构建的文档ID数组
 * @param datasetId - 数据集ID
 * @returns Promise<Job> - 返回队列任务实例，可用于跟踪任务状态
 *
 * @example
 * ```typescript
 * await buildDocumentsAyncTask(['doc1', 'doc2'], 'dataset1');
 * ```
 */
export const buildDocumentsAyncTask = async (
  documentIds: string[],
  datasetId: string,
) => {
  log.info('Building documents: %o', documentIds);

  return documentQueue.add(
    BUILD_DOCUMENTS_TASK_NAME,
    { documentIds, datasetId },
    {
      removeOnComplete: true, // 任务完成后自动从队列中移除
      removeOnFail: true, // 任务失败后自动从队列中移除
    },
  );
};

/**
 * 更新文档启用状态的异步任务
 *
 * 将文档启用状态更新任务添加到队列中异步处理。该任务包含分布式锁信息，
 * 用于确保状态更新的原子性。
 *
 * @param documentId - 需要更新状态的文档ID
 * @param enabled - 新的启用状态（true/false）
 * @param lockKey - 分布式锁的键名
 * @param lockValue - 分布式锁的值
 * @returns Promise<Job> - 返回队列任务实例，可用于跟踪任务状态
 *
 * @example
 * ```typescript
 * await updateDocumentEnabledAsyncTask('doc1', true, 'lock:doc1', 'lock-value');
 * ```
 */
export const updateDocumentEnabledAsyncTask = async (
  documentId: string,
  enabled: boolean,
  lockKey: string,
  lockValue: string,
) => {
  log.info(
    'Updating document enabled, docId: %s, enabled: %s, lockKey: %s, lockValue: %s',
    documentId,
    enabled,
    lockKey,
    lockValue,
  );

  return documentQueue.add(
    UPDATE_DOCUMENT_ENABLED_TASK_NAME,
    { documentId, enabled, lockKey, lockValue },
    {
      removeOnComplete: true, // 任务完成后自动从队列中移除
      removeOnFail: true, // 任务失败后自动从队列中移除
    },
  );
};

/**
 * 异步删除文档任务
 *
 * 将文档删除任务添加到队列中异步处理。该任务会删除指定的文档及其相关的所有片段。
 * 任务完成后会自动从队列中移除。
 *
 * @param datasetId - 数据集ID
 * @param documentId - 需要删除的文档ID
 * @param segmentIds - 需要删除的文档片段ID数组
 * @returns Promise<Job> - 返回队列任务实例，可用于跟踪任务状态
 *
 * @example
 * ```typescript
 * await deleteDocumentAsyncTask('dataset1', 'doc1', ['seg1', 'seg2']);
 * ```
 */
export const deleteDocumentAsyncTask = async (
  datasetId: string,
  documentId: string,
  segmentIds: string[],
) => {
  log.info(
    'Deleting document, datasetId: %s, documentId: %s, segmentIds: %o',
    datasetId,
    documentId,
    segmentIds,
  );

  return documentQueue.add(
    DELETE_DOCUMENT_TASK_NAME,
    { datasetId, documentId, segmentIds },
    {
      removeOnComplete: true,
      removeOnFail: true,
    },
  );
};
