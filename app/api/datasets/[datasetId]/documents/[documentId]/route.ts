/**
 * 文档管理 API 路由处理模块
 * 该模块提供了获取单个文档详细信息的 API 端点
 * @module app/api/datasets/[datasetId]/documents/[documentId]/route
 */

import { verifyApiKey } from '@/lib/auth/dal';
import { handleRouteError, successResult } from '@/lib/route-common';
import { getDocument } from '@/services/document';

// 定义路由参数类型
type Params = { params: Promise<{ datasetId: string; documentId: string }> };

/**
 * @swagger
 * /api/datasets/{datasetId}/documents/{documentId}:
 *   get:
 *     tags:
 *       - Documents
 *     summary: 获取指定文档基础信息
 *     description: 该接口用于获取指定文档的基础信息，主要用于展示文档片段信息+更新文档信息对应的页面。
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
 *         description: 需要获取信息的文档 id，类型为 uuid
 *     responses:
 *       200:
 *         description: 获取成功
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
 *                       description: 文档的 id，类型为 uuid
 *                     datasetId:
 *                       type: string
 *                       format: uuid
 *                       description: 文档归属的知识库 id，类型为 uuid
 *                     name:
 *                       type: string
 *                       description: 文档的名称，类型为字符串
 *                     segmentCount:
 *                       type: integer
 *                       description: 文档的片段总数，类型为整型
 *                     characterCount:
 *                       type: integer
 *                       description: 文档的字符数，类型为整型
 *                     hitCount:
 *                       type: integer
 *                       description: 文档的命中次数，类型为整型
 *                     position:
 *                       type: integer
 *                       description: 文档的位置，数字越小越靠前（自然排序）
 *                     enabled:
 *                       type: boolean
 *                       description: 文档的启用状态，true 表示启用，false 表示已禁用（多种原因禁用）
 *                     disabledAt:
 *                       type: integer
 *                       description: 文档的禁用时间（人为禁用时添加），默认为 0 表示无人工禁用
 *                     status:
 *                       type: string
 *                       description: 文档的状态，类型为字符串，涵盖 waiting(等待中)、parsing(解析处理中)、splitting(分割中)、indexing(构建索引中)、completed(构建完成)、error(出错) 等，只有当构建完成时 enabled 才起作用
 *                     error:
 *                       type: string
 *                       description: 错误信息，如果没有错误则为空字符串，当出现错误的时候，在前端 UI 界面可以予以相关提示
 *                     updatedAt:
 *                       type: integer
 *                       description: 文档的更新时间戳，类型为整型
 *                     createdAt:
 *                       type: integer
 *                       description: 文档的创建时间戳，类型为整型
 *                 message:
 *                   type: string
 *                   example: ""
 */

/**
 * GET 请求处理函数
 * 获取指定文档的详细信息
 *
 * @param _ - 请求对象（未使用）
 * @param params - 包含 datasetId 和 documentId 的路由参数
 * @returns 返回文档详细信息或错误响应
 */
export async function GET(_: Request, { params }: Params) {
  try {
    // 并行验证 API Key 和获取路由参数
    const [{ userId }, { datasetId, documentId }] = await Promise.all([
      verifyApiKey(),
      params,
    ]);

    // 获取文档信息
    const document = await getDocument(datasetId, documentId, userId);
    return successResult(document);
  } catch (error) {
    return handleRouteError(error);
  }
}
