/**
 * Document Worker
 *
 * 这是一个处理文档相关任务的 worker 处理器。它负责处理以下任务：
 * 1. 构建文档 (BUILD_DOCUMENTS_TASK_NAME)
 * 2. 更新文档启用状态 (UPDATE_DOCUMENT_ENABLED_TASK_NAME)
 * 3. 删除文档 (DELETE_DOCUMENT_TASK_NAME)
 */

import { log } from '@/lib/logger';
import {
  BUILD_DOCUMENTS_TASK_NAME,
  DELETE_DOCUMENT_TASK_NAME,
  UPDATE_DOCUMENT_ENABLED_TASK_NAME,
} from '@/lib/queues/queue-name';
import {
  buildDocuments,
  deleteDocument,
  updateDocumentEnabled,
} from '@/services/indexing';
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
  if (name === BUILD_DOCUMENTS_TASK_NAME) {
    log.info('Building documents, data: %o', data);
    const { documentIds, datasetId } = data;
    await buildDocuments(documentIds, datasetId);
  } else if (name === UPDATE_DOCUMENT_ENABLED_TASK_NAME) {
    log.info('Updating document enabled, data: %o', data);
    const { documentId, enabled, lockKey, lockValue } = data;
    await updateDocumentEnabled(documentId, enabled, lockKey, lockValue);
  } else if (name === DELETE_DOCUMENT_TASK_NAME) {
    log.info('Deleting document, data: %o', data);
    const { datasetId, documentId, segmentIds } = data;
    await deleteDocument(datasetId, documentId, segmentIds);
  } else {
    log.error('Unknown job name: %s', name);
  }
}
