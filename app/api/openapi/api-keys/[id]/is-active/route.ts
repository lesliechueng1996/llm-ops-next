/**
 * API 秘钥状态管理路由
 *
 * 该模块提供了修改 API 秘钥激活状态的接口。
 * 主要用于启用或禁用特定的 API 秘钥。
 */

import { verifyApiKey } from '@/lib/auth/dal';
import { handleRouteError, successResult } from '@/lib/route-common';
import { updateApiKeyIsActiveReqSchema } from '@/schemas/openapi-schema';
import { updateApiKeyIsActive } from '@/services/openapi';

/**
 * 路由参数类型定义
 * @typedef {Object} Params
 * @property {Promise<{id: string}>} params - 包含 API 秘钥 ID 的参数对象
 */
type Params = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /api/openapi/api-keys/{id}/is-active:
 *   patch:
 *     tags:
 *       - OpenAPI
 *     summary: 修改 API 秘钥状态
 *     description: 该接口用于修改指定 API 秘钥的激活状态
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 需要修改的 API 秘钥 id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 description: 秘钥是否激活
 *     responses:
 *       200:
 *         description: 修改成功
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
 *                   example: 修改API秘钥状态成功
 */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { userId } = await verifyApiKey();
    const { id } = await params;
    const data = await request.json();
    const { isActive } = updateApiKeyIsActiveReqSchema.parse(data);
    await updateApiKeyIsActive(userId, id, isActive);
    return successResult({}, 200, '修改API秘钥状态成功');
  } catch (err) {
    return handleRouteError(err);
  }
}
