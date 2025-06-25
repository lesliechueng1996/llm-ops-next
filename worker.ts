import 'dotenv/config';
import {
  DATASET_QUEUE_NAME,
  DOCUMENT_QUEUE_NAME,
} from '@/lib/queues/queue-name';
import { redisConnection } from '@/lib/redis';
import { Worker } from 'bullmq';

const documentQueue = new Worker(
  DOCUMENT_QUEUE_NAME,
  `${__dirname}/workers/document-worker.ts`,
  {
    connection: redisConnection,
  },
);

const datasetQueue = new Worker(
  DATASET_QUEUE_NAME,
  `${__dirname}/workers/dataset-worker.ts`,
  {
    connection: redisConnection,
  },
);
