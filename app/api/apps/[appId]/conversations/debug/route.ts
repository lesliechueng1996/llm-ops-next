/**
 * 应用调试会话管理 API
 *
 * 该模块提供了清空应用调试会话记录的功能。
 * 调试会话是应用开发过程中的临时会话，用于测试和调试应用功能。
 *
 * @fileoverview 应用调试会话相关的 API 路由处理
 * @author LLM Ops Team
 * @version 1.0.0
 */

import { verifyApiKey } from '@/lib/auth/dal';
import { handleRouteError, successResult } from '@/lib/route-common';
import { deleteAppDebugConversation } from '@/services/app';

/**
 * 路由参数类型定义
 * 定义了从 URL 路径中提取的参数结构
 */
type Params = {
  params: Promise<{
    appId: string; // 应用唯一标识符，UUID 格式
  }>;
};

/**
 * @swagger
 * /api/apps/{appId}/conversations/debug:
 *   delete:
 *     tags:
 *       - Apps
 *     summary: 清空应用的调试会话记录
 *     description: 该接口用于清空指定应用的会话调试记录，在后端会将该应用的调试会话 id 清空，该接口无需传递会话 id，在后端会从信息表中获取会话 id，并进行统一管理。
 *     parameters:
 *       - in: path
 *         name: appId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 需要清空指定应用调试会话记录的应用 id，类型为 uuid
 *     responses:
 *       200:
 *         description: 清空成功
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
 *                   description: 空对象
 *                 message:
 *                   type: string
 *                   example: 清空应用调试会话记录成功
 */
export async function DELETE(_: Request, { params }: Params) {
  try {
    // 并行执行 API 密钥验证和参数解析，提高性能
    const [{ userId }, { appId }] = await Promise.all([
      verifyApiKey(), // 验证 API 密钥并获取用户 ID
      params, // 解析路由参数获取应用 ID
    ]);

    // 调用服务层方法清空应用的调试会话记录
    await deleteAppDebugConversation(appId, userId);

    // 返回成功响应
    return successResult(null, 200, '清空应用调试会话记录成功');
  } catch (error) {
    // 统一错误处理，返回标准化的错误响应
    return handleRouteError(error);
  }
}
