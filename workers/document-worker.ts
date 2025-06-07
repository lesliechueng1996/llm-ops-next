import type { Job } from 'bullmq';
import { log } from '../lib/logger';

export default async function (job: Job) {
  // TODO
  log.info('Building documents, data: %o', job);
}
