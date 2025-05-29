/**
 * 知识库管理 API 路由处理模块
 *
 * 该模块提供了知识库的更新、删除和查询功能，包括：
 * - PUT: 更新知识库信息（名称、图标、描述等）
 * - DELETE: 删除指定知识库及其关联数据
 * - GET: 获取知识库详细信息
 */

import { verifyApiKey } from '@/lib/auth/dal';
import { handleRouteError, successResult } from '@/lib/route-common';
import { updateDatasetReqSchema } from '@/schemas/dataset-schema';
import {
  deleteDataset,
  getDatasetById,
  updateDataset,
} from '@/services/dataset';

// 路由参数类型定义
type Params = { params: Promise<{ datasetId: string }> };

/**
 * @swagger
 * /api/datasets/{datasetId}:
 *   put:
 *     tags:
 *       - Datasets
 *     summary: 更新指定知识库信息
 *     description: 该接口主要用于更新指定的知识库信息，涵盖：知识库名称、图标、描述等信息。
 *     parameters:
 *       - in: path
 *         name: datasetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 需要更新的知识库 id，类型为 uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - icon
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: 需要更新的知识库名称，知识库名称也必须保证唯一，长度不能超过 100 个字符
 *               icon:
 *                 type: string
 *                 description: 需要更新的知识库图标，类型为图标的 URL 地址
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *                 description: 需要更新的知识库描述，长度不超过 2000 个字符，如果为空，会先删除原有的描述信息，并且在后端自动生成类似 `Useful for when you want to answer queries about the xxx` 的描述，在后端确保该字段永远不会为空
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
 *                   example: 更新知识库成功
 */
export async function PUT(request: Request, { params }: Params) {
  try {
    const { userId } = await verifyApiKey();
    const [{ datasetId }, data] = await Promise.all([params, request.json()]);
    const { name, icon, description } = updateDatasetReqSchema.parse(data);
    await updateDataset(userId, datasetId, name, icon, description);
    return successResult({}, 200, '更新知识库成功');
  } catch (e) {
    return handleRouteError(e);
  }
}

/**
 * @swagger
 * /api/datasets/{datasetId}:
 *   delete:
 *     tags:
 *       - Datasets
 *     summary: 删除指定的知识库
 *     description: 用于删除指定的知识库，删除知识库后，在后端会将关联的应用配置、知识库下的所有文档/文档片段/查询语句也进行一并删除（该接口为耗时接口，将使用异步/消息队列的形式来实现），删除后以前关联的应用将无法引用该知识库。
 *     parameters:
 *       - in: path
 *         name: datasetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 需要删除的知识库 id，类型为 uuid
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
 *                   example: 删除知识库成功
 */
export async function DELETE(_: Request, { params }: Params) {
  try {
    const { userId } = await verifyApiKey();
    const { datasetId } = await params;
    await deleteDataset(userId, datasetId);
    return successResult({}, 200, '删除知识库成功');
  } catch (e) {
    return handleRouteError(e);
  }
}

/**
 * @swagger
 * /api/datasets/{datasetId}:
 *   get:
 *     tags:
 *       - Datasets
 *     summary: 获取指定的知识库详情
 *     description: 用于获取指定的知识库详情信息
 *     parameters:
 *       - in: path
 *         name: datasetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 需要获取的知识库 id，类型为 uuid
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
 *                       description: 知识库 id
 *                     name:
 *                       type: string
 *                       description: 知识库名称
 *                     icon:
 *                       type: string
 *                       description: 知识库的 icon 图标地址
 *                     description:
 *                       type: string
 *                       description: 知识库的描述信息
 *                     documentCount:
 *                       type: integer
 *                       description: 知识库下的文档数量
 *                     hitCount:
 *                       type: integer
 *                       description: 知识库的文档总命中次数
 *                     relatedAppCount:
 *                       type: integer
 *                       description: 知识库关联的 AI/Agent 应用数
 *                     characterCount:
 *                       type: integer
 *                       description: 该知识库拥有的文档的总字符数
 *                     updatedAt:
 *                       type: integer
 *                       description: 知识库的最后编辑时间
 *                     createdAt:
 *                       type: integer
 *                       description: 知识库的创建时间
 *                 message:
 *                   type: string
 */
export async function GET(_: Request, { params }: Params) {
  try {
    const { userId } = await verifyApiKey();
    const { datasetId } = await params;
    const dataset = await getDatasetById(userId, datasetId);
    return successResult(dataset);
  } catch (e) {
    return handleRouteError(e);
  }
}
