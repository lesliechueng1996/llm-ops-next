import { verifyApiKey } from '@/lib/auth/dal';
import { handleRouteError, successResult } from '@/lib/route-common';
import { fallbackAppConfigReqSchema } from '@/schemas/app-schema';
import { fallbackAppConfig } from '@/services/app-config';

type Params = {
  params: Promise<{
    appId: string;
  }>;
};

/**
 * @swagger
 * /api/apps/{appId}/publish/fallback:
 *   post:
 *     tags:
 *       - Apps
 *     summary: 回退指定的历史配置到草稿
 *     description: 该接口用于将指定的应用历史配置回退到草稿，并不会修改实际发布，仅仅是将历史配置覆盖到当前应用的草稿配置中，如果需要发布，需要调用发布接口。
 *     parameters:
 *       - in: path
 *         name: appId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 路由参数，需要回退的历史配置信息的应用 id，类型为 uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - appConfigVersionId
 *             properties:
 *               appConfigVersionId:
 *                 type: string
 *                 format: uuid
 *                 description: 应用配置版本 id，类型为 uuid
 *                 example: "e1baf52a-1be2-4b93-ad62-6fad72f1ec37"
 *     responses:
 *       200:
 *         description: 回退成功
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
 *                   example: 回退历史配置至草稿成功
 */
export async function POST(request: Request, { params }: Params) {
  try {
    // 并行处理：验证API密钥、获取路由参数、解析请求体
    const [{ userId }, { appId }, body] = await Promise.all([
      verifyApiKey(), // 验证API密钥并获取用户ID
      params, // 获取路由参数中的appId
      request.json(), // 解析请求体JSON数据
    ]);

    // 验证请求体数据格式
    const { appConfigVersionId } = fallbackAppConfigReqSchema.parse(body);

    // 执行应用配置回滚操作
    await fallbackAppConfig(appId, userId, appConfigVersionId);

    // 返回成功响应
    return successResult({}, 200, '回滚应用配置成功');
  } catch (error) {
    // 统一错误处理
    return handleRouteError(error);
  }
}
