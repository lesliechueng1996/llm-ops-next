/**
 * 应用调试长记忆 API 路由处理模块
 *
 * 该模块提供了两个主要功能：
 * 1. 获取应用调试长记忆内容
 * 2. 更新应用调试长记忆内容
 *
 * 所有接口都需要通过 API Key 进行认证
 */

import { verifyApiKey } from '@/lib/auth/dal';
import { handleRouteError, successResult } from '@/lib/route-common';
import { updateAppSummaryReqSchema } from '@/schemas/app-schema';
import { getAppSummary, updateAppSummary } from '@/services/app';

type Params = { params: Promise<{ appId: string }> };

/**
 * @swagger
 * /api/apps/{appId}/summary:
 *   get:
 *     tags:
 *       - Apps
 *     summary: 获取应用调试长记忆
 *     description: 用于获取指定应用的调试长记忆内容，如果该应用并没有开启长记忆，则会抛出错误信息。
 *     parameters:
 *       - in: path
 *         name: appId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 需要获取长记忆的应用 id，类型为 uuid
 *     responses:
 *       200:
 *         description: 获取成功
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
 *                   properties:
 *                     summary:
 *                       type: string
 *                       description: 该应用最新调试会话的长记忆内容
 *                 message:
 *                   type: string
 *                   example: 获取应用调试长记忆成功
 */
export async function GET(_: Request, { params }: Params) {
  try {
    const [{ userId }, { appId }] = await Promise.all([verifyApiKey(), params]);
    const summary = await getAppSummary(appId, userId);
    return successResult({ summary }, 200, '获取应用调试长记忆成功');
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * @swagger
 * /api/apps/{appId}/summary:
 *   patch:
 *     tags:
 *       - Apps
 *     summary: 更新应用调试长记忆
 *     description: 用于更新对应应用的调试长记忆内容，如果应用没有开启长记忆功能，则调用接口会发生报错，如果当前应用没有会话记录时，会先创建一个会话，并更新对应的长记忆。
 *     parameters:
 *       - in: path
 *         name: appId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 需要更新长记忆的应用 id，类型为 uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - summary
 *             properties:
 *               summary:
 *                 type: string
 *                 description: 需要更新的长记忆内容
 *     responses:
 *       200:
 *         description: 更新成功
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
 *                   example: 更新应用调试长记忆成功
 */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const [{ userId }, { appId }, body] = await Promise.all([
      verifyApiKey(),
      params,
      req.json(),
    ]);
    const { summary } = updateAppSummaryReqSchema.parse(body);
    await updateAppSummary(appId, userId, summary);
    return successResult({ summary }, 200, '更新应用调试长记忆成功');
  } catch (error) {
    return handleRouteError(error);
  }
}
