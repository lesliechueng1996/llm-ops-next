import 'dotenv/config';
import { DOCUMENT_QUEUE_NAME } from '@/lib/queues/queue-name';
import { redisConnection } from '@/lib/redis';
import { Worker } from 'bullmq';

const documentQueue = new Worker(
  DOCUMENT_QUEUE_NAME,
  `${__dirname}/workers/document-worker.ts`,
  {
    connection: redisConnection,
  },
);
