/**
 * API 密钥管理路由处理模块
 *
 * 该模块提供了对单个 API 密钥进行管理的接口，包括删除和更新操作。
 * 所有接口都需要通过 API 密钥认证才能访问。
 */

import { verifyApiKey } from '@/lib/auth/dal';
import { handleRouteError, successResult } from '@/lib/route-common';
import { updateApiKeyReqSchema } from '@/schemas/openapi-schema';
import { deleteApiKey, updateApiKey } from '@/services/openapi';

// 路由参数类型定义
type Params = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /api/openapi/api-keys/{id}:
 *   delete:
 *     tags:
 *       - OpenAPI
 *     summary: 删除指定的 API 秘钥
 *     description: 该接口用于在后端删除指定的 API 秘钥信息，删除后该秘钥接口无法使用
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 需要删除的 API 秘钥 id
 *     responses:
 *       200:
 *         description: 删除成功
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
 *                   example: 删除API秘钥成功
 */
export async function DELETE(_: Request, { params }: Params) {
  try {
    const { userId } = await verifyApiKey();
    const { id } = await params;
    await deleteApiKey(userId, id);
    return successResult({}, 200, '删除API秘钥成功');
  } catch (err) {
    return handleRouteError(err);
  }
}

/**
 * @swagger
 * /api/openapi/api-keys/{id}:
 *   patch:
 *     tags:
 *       - OpenAPI
 *     summary: 修改指定的 API 秘钥
 *     description: 该接口用于修改指定 API 秘钥的基础信息，涵盖是否激活和备注信息
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
 *               remark:
 *                 type: string
 *                 maxLength: 100
 *                 description: 接口备注信息
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
 *                   example: 修改API秘钥成功
 */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { userId } = await verifyApiKey();
    const { id } = await params;
    const data = await request.json();
    const { isActive, remark } = updateApiKeyReqSchema.parse(data);
    await updateApiKey(userId, id, isActive, remark ?? '');
    return successResult({}, 200, '修改API秘钥成功');
  } catch (err) {
    return handleRouteError(err);
  }
}
