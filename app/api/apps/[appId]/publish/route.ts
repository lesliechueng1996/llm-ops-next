/**
 * 应用发布 API 路由
 *
 * 该模块提供了应用配置发布功能，允许用户将草稿配置发布为正式配置。
 * 发布操作会：
 * 1. 将草稿配置同步到发布配置中
 * 2. 创建版本记录以跟踪发布历史
 * 3. 确保配置的一致性和可追溯性
 *
 * @file app/api/apps/[appId]/publish/route.ts
 * @author LLM Ops Team
 */

import { verifyApiKey } from '@/lib/auth/dal';
import { handleRouteError, successResult } from '@/lib/route-common';
import { publishAppConfig } from '@/services/app-config';

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
 * /api/apps/{appId}/publish:
 *   post:
 *     tags:
 *       - Apps
 *     summary: 发布/更新应用配置信息
 *     description: 该接口用于将草稿配置进行发布或者更新，该接口会在后端将草稿配置同步到 `发布配置` 中，并添加 `版本配置` 记录，用于记录历史发布/更新的应用配置信息。
 *     parameters:
 *       - in: path
 *         name: appId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 需要更新/发布的应用 id，类型为 uuid
 *     responses:
 *       200:
 *         description: 发布成功
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
 *                   example: 发布应用成功
 */
export async function POST(_: Request, { params }: Params) {
  try {
    // 并行执行身份验证和参数解析，提高性能
    const [{ userId }, { appId }] = await Promise.all([
      verifyApiKey(), // 验证 API 密钥并获取用户 ID
      params, // 解析路由参数获取应用 ID
    ]);

    // 执行应用配置发布逻辑
    await publishAppConfig(appId, userId);

    // 返回成功响应
    return successResult(null, 200, '发布应用成功');
  } catch (error) {
    // 统一错误处理，确保错误响应格式一致
    return handleRouteError(error);
  }
}
