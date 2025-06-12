/**
 * 应用复制 API 路由处理模块
 *
 * 该模块提供了复制 Agent 应用的功能，包括：
 * - 验证 API 密钥
 * - 复制应用及其相关配置
 * - 返回新创建的应用 ID
 */

import { verifyApiKey } from '@/lib/auth/dal';
import { handleRouteError, successResult } from '@/lib/route-common';
import { copyApp } from '@/services/app';

// 定义路由参数类型
type Params = {
  params: Promise<{ appId: string }>;
};

/**
 * @swagger
 * /api/apps/{appId}/copy:
 *   post:
 *     tags:
 *       - Apps
 *     summary: 创建应用副本
 *     description: 该接口用于快速复制指定 Agent 应用，涵盖 Agent 应用的基础信息、草稿配置等内容，同时在复制配置的时候，也会检测对应的草稿配置。
 *     parameters:
 *       - in: path
 *         name: appId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 需要复制的 Agent 应用 id，类型为 uuid
 *     responses:
 *       201:
 *         description: 复制成功
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
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       description: 拷贝后的 Agent 应用 id，类型为 uuid
 *                 message:
 *                   type: string
 *                   example: 应用复制成功
 */

/**
 * POST 请求处理函数
 *
 * 处理应用复制请求，主要步骤：
 * 1. 验证 API 密钥并获取用户 ID
 * 2. 获取要复制的应用 ID
 * 3. 执行应用复制操作
 * 4. 返回新创建的应用 ID
 *
 * @param _ - 请求对象（未使用）
 * @param params - 包含 appId 的路由参数
 * @returns 包含新应用 ID 的成功响应或错误响应
 */
export async function POST(_: Request, { params }: Params) {
  try {
    // 并行执行 API 密钥验证和获取路由参数
    const [{ userId }, { appId }] = await Promise.all([verifyApiKey(), params]);

    // 执行应用复制操作
    const newAppId = await copyApp(userId, appId);

    // 返回成功响应
    return successResult(
      {
        id: newAppId,
      },
      201,
      '应用复制成功',
    );
  } catch (error) {
    // 处理并返回错误响应
    return handleRouteError(error);
  }
}
