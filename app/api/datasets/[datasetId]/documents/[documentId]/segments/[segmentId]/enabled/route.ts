/**
 * 文档片段启用状态管理 API
 *
 * 该模块提供了管理文档片段启用状态的 API 端点。
 * 主要用于控制文档片段是否可用于检索和查询。
 *
 * @module segment-enabled
 */

import { verifyApiKey } from '@/lib/auth/dal';
import { handleRouteError, successResult } from '@/lib/route-common';
import { updateSegmentEnabledReqSchema } from '@/schemas/segment-schema';
import { updateSegmentEnabled } from '@/services/segment';

// 定义路由参数类型
type Params = {
  params: Promise<{ datasetId: string; documentId: string; segmentId: string }>;
};

/**
 * @swagger
 * /api/datasets/{datasetId}/documents/{documentId}/segments/{segmentId}/enabled:
 *   patch:
 *     tags:
 *       - Segments
 *     summary: 更新文档片段的启用状态
 *     description: 该接口主要用于更新文档片段的启用状态，例如 `启用` 或 `禁用`，该接口会同步更新 `业务数据库` 和 `向量数据库`，并且耗时较短，所以无需执行异步任务。
 *     parameters:
 *       - in: path
 *         name: datasetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 该片段归属的知识库 id，类型为 uuid
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 该片段归属的文档 id，类型为 uuid
 *       - in: path
 *         name: segmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 需要修改的片段 id，类型为 uuid
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
 *                 description: 对应片段的状态，true 为开启，false 为关闭，只有当文档片段处理完成后，才可以修改，文档如果没有执行完毕，将 enabled 修改为 true，会抛出错误信息
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
 *                   example: 更新片段启用状态成功
 */
export async function PATCH(request: Request, { params }: Params) {
  try {
    // 并行处理：验证 API 密钥、获取路由参数和请求体
    const [{ userId }, { datasetId, documentId, segmentId }, body] =
      await Promise.all([verifyApiKey(), params, request.json()]);

    // 验证请求体数据
    const req = updateSegmentEnabledReqSchema.parse(body);

    // 更新片段启用状态
    await updateSegmentEnabled(
      userId,
      datasetId,
      documentId,
      segmentId,
      req.enabled,
    );

    return successResult(null, 200, '更新片段启用状态成功');
  } catch (error) {
    return handleRouteError(error);
  }
}
