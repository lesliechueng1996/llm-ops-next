/**
 * 应用发布取消 API 路由
 *
 * 该模块提供了取消应用发布的功能，允许用户将已发布的应用状态改回草稿状态。
 * 主要功能包括：
 * - 验证 API 密钥和用户权限
 * - 取消指定应用的发布状态
 * - 返回操作结果
 *
 * @fileoverview 应用发布取消相关的 API 端点实现
 */

import { verifyApiKey } from '@/lib/auth/dal';
import { handleRouteError, successResult } from '@/lib/route-common';
import { cancelPublishApp } from '@/services/app';

/**
 * 路由参数类型定义
 * 包含从 URL 路径中提取的应用 ID
 */
type Params = {
  params: Promise<{
    appId: string; // 应用唯一标识符
  }>;
};

/**
 * @swagger
 * /api/apps/{appId}/publish/cancel:
 *   post:
 *     tags:
 *       - Apps
 *     summary: 取消指定应用的发布
 *     description: 该接口用于取消发布当前的应用信息，在后端会将应用的状态进行修改调整，只有在应用已发布的情况下才可以取消发布，取消发布后会将状态改回 `草稿`，WebApp 及开放 API 接口将无法访问该应用，如果应用未发布调用该接口则会直接抛出错误。
 *     parameters:
 *       - in: path
 *         name: appId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 路由参数，需要取消发布的应用 id，类型为 uuid
 *     responses:
 *       200:
 *         description: 取消发布成功
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
 *                   example: 取消发布应用配置成功
 */
export async function POST(_: Request, { params }: Params) {
  try {
    // 并行执行 API 密钥验证和参数解析
    const [{ userId }, { appId }] = await Promise.all([verifyApiKey(), params]);

    // 调用服务层取消应用发布
    await cancelPublishApp(appId, userId);

    // 返回成功结果
    return successResult({}, 200, '取消发布应用配置成功');
  } catch (error) {
    // 处理并返回错误信息
    return handleRouteError(error);
  }
}
