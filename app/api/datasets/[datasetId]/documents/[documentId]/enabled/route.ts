/**
 * 文档启用状态管理 API
 *
 * 该模块提供了用于管理文档启用状态的 API 端点。
 * 主要用于控制文档是否可以被检索和使用。
 */

import { verifyApiKey } from '@/lib/auth/dal';
import { handleRouteError, successResult } from '@/lib/route-common';
import { updateDocumentEnabledReqSchema } from '@/schemas/document-schema';
import { updateDocumentEnabled } from '@/services/document';

// 定义路由参数类型
type Params = { params: Promise<{ datasetId: string; documentId: string }> };

/**
 * @swagger
 * /api/datasets/{datasetId}/documents/{documentId}/enabled:
 *   patch:
 *     tags:
 *       - Documents
 *     summary: 更改指定文档的启用状态
 *     description: 该接口主要用于更改指定文档的启用状态，例如开启或关闭，并且该接口只有在文档状态为 completed(完成) 时才可以做相应的更新调整，否则会抛出错误。
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
 *               - enabled
 *             properties:
 *               enabled:
 *                 type: boolean
 *                 description: 对应文档的状态，true 为开启，false 为关闭，只有当文档处理完成后，才可以修改，文档如果没有执行完毕，将 enabled 修改为 true，会抛出错误信息
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
 *                   example: 更新文档状态成功
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
    const req = updateDocumentEnabledReqSchema.parse(data);

    // 更新文档启用状态
    await updateDocumentEnabled(req.enabled, documentId, datasetId, userId);

    // 返回成功响应
    return successResult({}, 200, '更新文档状态成功');
  } catch (error) {
    // 统一错误处理
    return handleRouteError(error);
  }
}
