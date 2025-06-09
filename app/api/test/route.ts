import { log } from '@/lib/logger';
import { buildDocumentsAyncTask } from '@/lib/queues/document-queue';
import { successResult } from '@/lib/route-common';

/**
 * @swagger
 * /api/test:
 *   get:
 *     tags:
 *       - Test
 *     summary: 用于测试的接口
 *     description: 用于测试的接口
 *     responses:
 *       200:
 *         description: 测试成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *                   example: ""
 */
export async function GET() {
  const result = await buildDocumentsAyncTask([], 'dataset1');
  log.info('result: %o', result);
  return successResult(null);
}
