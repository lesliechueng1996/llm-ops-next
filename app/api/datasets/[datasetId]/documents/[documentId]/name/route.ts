/**
 * 文档名称更新 API 路由处理模块
 *
 * 该模块提供了更新文档名称的 API 端点。它处理 PATCH 请求来更新指定文档的名称。
 * 主要功能包括：
 * - 验证 API 密钥
 * - 验证请求参数
 * - 更新文档名称
 * - 错误处理
 */

import { verifyApiKey } from '@/lib/auth/dal';
import { handleRouteError, successResult } from '@/lib/route-common';
import { updateDocumentNameReqSchema } from '@/schemas/document-schema';
import { updateDocumentName } from '@/services/document';

// 定义路由参数类型
type Params = { params: Promise<{ datasetId: string; documentId: string }> };

/**
 * @swagger
 * /api/datasets/{datasetId}/documents/{documentId}/name:
 *   patch:
 *     tags:
 *       - Documents
 *     summary: 更新指定文档基础名称
 *     description: 该接口用于更新特定的文档基础信息（文档的名称），在同一个知识库中，文档是可以出现重名的，并且文档更新后的名称长度不能超过100个字符。
 *     parameters:
 *       - in: path
 *         name: datasetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 该文档归属的知识库 id，类型为 uuid
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 需要更新的文档 id，类型为 uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: 需要更新的文档名称，长度不能超过 100 个字符，必填，不能为空，更新的文档名字不必使用对应的扩展，可以任意起名
 *                 maxLength: 100
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
 *                   example: 更新文档信息成功
 */

/**
 * 处理文档名称更新的 PATCH 请求
 *
 * @param request - HTTP 请求对象
 * @param params - 包含 datasetId 和 documentId 的路由参数
 * @returns 更新操作的结果响应
 */
export async function PATCH(request: Request, { params }: Params) {
  try {
    // 并行处理：验证 API 密钥、获取路由参数、解析请求体
    const [{ userId }, { datasetId, documentId }, data] = await Promise.all([
      verifyApiKey(),
      params,
      request.json(),
    ]);

    // 验证并解析请求数据
    const req = updateDocumentNameReqSchema.parse(data);

    // 更新文档名称
    await updateDocumentName(req.name, documentId, datasetId, userId);

    // 返回成功响应
    return successResult({}, 200, '更新文档名称成功');
  } catch (error) {
    // 处理并返回错误响应
    return handleRouteError(error);
  }
}
