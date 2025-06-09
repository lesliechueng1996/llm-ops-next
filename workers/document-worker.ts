import type { Job } from 'bullmq';
import { log } from '@/lib/logger';
import {
  BUILD_DOCUMENTS_TASK_NAME,
  UPDATE_DOCUMENT_ENABLED_TASK_NAME,
} from '@/lib/queues/queue-name';
import { buildDocuments } from '@/services/indexing';

export default async function (job: Job) {
  log.info('Receive job from document queue, data: %o', job);
  const { name, data } = job;
  console.log('name: %s, data: %o', name, data);
  if (name === BUILD_DOCUMENTS_TASK_NAME) {
    log.info('Building documents, data: %o', data);
    const { documentIds, datasetId } = data;
    await buildDocuments(documentIds, datasetId);
  } else if (name === UPDATE_DOCUMENT_ENABLED_TASK_NAME) {
    log.info('Updating document enabled, data: %o', data);
  } else {
    log.error('Unknown job name: %s', name);
  }
}
