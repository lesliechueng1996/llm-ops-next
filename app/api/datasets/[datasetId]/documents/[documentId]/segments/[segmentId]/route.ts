/**
 * 文档片段管理 API 路由
 *
 * 该文件实现了对文档片段（segments）的 RESTful API 接口，包括：
 * - GET: 获取单个片段信息
 * - DELETE: 删除指定片段
 * - PATCH: 更新片段内容和关键词
 *
 * 所有接口都需要进行 API Key 验证，并且会验证用户对指定知识库的访问权限。
 * 片段操作会同步更新到业务数据库和向量数据库中。
 */

import { verifyApiKey } from '@/lib/auth/dal';
import { handleRouteError, successResult } from '@/lib/route-common';
import { updateSegmentReqSchema } from '@/schemas/segment-schema';
import { deleteSegment, getSegment, updateSegment } from '@/services/segment';

// 路由参数类型定义
type Params = {
  params: Promise<{ datasetId: string; documentId: string; segmentId: string }>;
};

/**
 * @swagger
 * /api/datasets/{datasetId}/documents/{documentId}/segments/{segmentId}:
 *   get:
 *     tags:
 *       - Segments
 *     summary: 查询文档片段信息
 *     description: 该接口主要用于查询对应的文档片段信息，涵盖了片段内容、关键词、状态、字符数、召回次数、创建时间等内容，并且要求传递的 datasetId、documentId、segmentId 保持一致，否则会抛出错误。
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
 *         description: 需要查询的片段 id，类型为 uuid
 *     responses:
 *       200:
 *         description: 查询成功
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
 *                       description: 文档片段的 id
 *                     documentId:
 *                       type: string
 *                       format: uuid
 *                       description: 片段归属的文档 id
 *                     datasetId:
 *                       type: string
 *                       format: uuid
 *                       description: 片段归属的知识库 id
 *                     position:
 *                       type: integer
 *                       description: 片段在文档内的位置，数字越小越靠前（自然排序）
 *                     content:
 *                       type: string
 *                       description: 片段的内容
 *                     keywords:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: 关键词列表
 *                     characterCount:
 *                       type: integer
 *                       description: 片段的字符串长度
 *                     tokenCount:
 *                       type: integer
 *                       description: 片段的 token 数
 *                     hitCount:
 *                       type: integer
 *                       description: 片段被命中的次数
 *                     hash:
 *                       type: string
 *                       description: 片段内容的哈希值，用于确定唯一的片段内容
 *                     enabled:
 *                       type: boolean
 *                       description: 片段是否启用，true 表示启用，false 表示禁用
 *                     disabledAt:
 *                       type: integer
 *                       description: 片段被人为禁用的时间，为 0 表示没有人为禁用
 *                     status:
 *                       type: string
 *                       description: 片段的状态，涵盖 waiting(等待处理)、indexing(构建索引)、completed(构建完成)、error(错误) 等状态
 *                     error:
 *                       type: string
 *                       description: 错误信息，当后端程序处理出现错误的时候，会记录错误信息
 *                     updatedAt:
 *                       type: integer
 *                       description: 片段的最后更新时间
 *                     createdAt:
 *                       type: integer
 *                       description: 片段的创建时间
 *                 message:
 *                   type: string
 *                   example: 获取片段成功
 */
export async function GET(_: Request, { params }: Params) {
  try {
    // 并行执行 API Key 验证和获取路由参数
    const [{ userId }, { datasetId, documentId, segmentId }] =
      await Promise.all([verifyApiKey(), params]);
    const segment = await getSegment(userId, datasetId, documentId, segmentId);
    return successResult(segment, 200, '获取片段成功');
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * @swagger
 * /api/datasets/{datasetId}/documents/{documentId}/segments/{segmentId}:
 *   delete:
 *     tags:
 *       - Segments
 *     summary: 删除对应的文档片段信息
 *     description: 该接口用于删除对应的文档片段信息，并且该操作会同步到向量数据库中并行删除，并且由于该接口操作的数据比较少，没有耗时操作，所以无需在后端异步执行，执行完成后接口会正常响应。
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
 *         description: 需要删除的片段 id，类型为 uuid
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
 *                   example: 删除片段成功
 */
export async function DELETE(_: Request, { params }: Params) {
  try {
    // 并行执行 API Key 验证和获取路由参数
    const [{ userId }, { datasetId, documentId, segmentId }] =
      await Promise.all([verifyApiKey(), params]);
    await deleteSegment(userId, datasetId, documentId, segmentId);
    return successResult(null, 200, '删除片段成功');
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * @swagger
 * /api/datasets/{datasetId}/documents/{documentId}/segments/{segmentId}:
 *   patch:
 *     tags:
 *       - Segments
 *     summary: 修改文档片段内容
 *     description: 该接口主要用于修改指定的文档片段信息，支持修改内容和关键词，修改的数据会双向同步到业务数据库和向量数据库，并且由于该接口修改的数据比较少，耗时相对较短，所以在后端无需异步处理，操作完成后接口进行响应。
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
 *             properties:
 *               content:
 *                 type: string
 *                 description: 片段内容，原则上长度不能超过 1000 个 token
 *               keywords:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 片段对应的关键词列表，可选参数，如果该参数没有传，在后端会使用分词服务对片段内容进行分词，得到对应的关键词；传递了参数则不会调用分词服务
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
 *                   example: 修改文档片段信息成功
 */
export async function PATCH(request: Request, { params }: Params) {
  try {
    // 并行执行 API Key 验证、获取路由参数和解析请求体
    const [{ userId }, { datasetId, documentId, segmentId }, body] =
      await Promise.all([verifyApiKey(), params, request.json()]);
    const req = updateSegmentReqSchema.parse(body);
    await updateSegment(userId, datasetId, documentId, segmentId, req);
    return successResult(null, 200, '更新片段成功');
  } catch (error) {
    return handleRouteError(error);
  }
}
