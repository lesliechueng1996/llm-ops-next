import { verifyApiKey } from '@/lib/auth/dal';
import { handleRouteError, successResult } from '@/lib/route-common';
import { stopConversationTask } from '@/services/app';

type Params = {
  params: Promise<{
    appId: string;
    taskId: string;
  }>;
};

/**
 * @swagger
 * /api/apps/{appId}/conversations/tasks/{taskId}/stop:
 *   post:
 *     tags:
 *       - Apps
 *     summary: 停止某次应用调试对话
 *     description: 该接口用于停止某次应用调试对话，并中断流式事件响应，该接口传递的参数为任务 id，后端会接收传递的 task_id，并在缓存中删除对应的记录，从而中断队列数据的读取。
 *     parameters:
 *       - in: path
 *         name: appId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 需要停止调试会话的应用 id，格式为 uuid
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 需要停止调试会话的任务 id，格式为 uuid
 *     responses:
 *       200:
 *         description: 停止成功
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
 *                   description: 空对象，无返回数据
 *                 message:
 *                   type: string
 *                   example: 停止应用会话调试成功
 */
export async function POST(_: Request, { params }: Params) {
  try {
    const [{ userId }, { appId, taskId }] = await Promise.all([
      verifyApiKey(),
      params,
    ]);

    await stopConversationTask(appId, taskId, userId);
    return successResult({}, 200, '停止应用会话调试成功');
  } catch (error) {
    return handleRouteError(error);
  }
}
