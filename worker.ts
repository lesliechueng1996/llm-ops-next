import 'dotenv/config';
import { Worker } from 'bullmq';
import { DOCUMENT_QUEUE_NAME } from './lib/queues/queue-name';
import { redisConnection } from './lib/redis';

const documentQueue = new Worker(
  DOCUMENT_QUEUE_NAME,
  `${__dirname}/workers/document-worker.js`,
  {
    connection: redisConnection,
  },
);
