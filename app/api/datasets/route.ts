/**
 * 知识库管理相关的 API 路由处理模块
 * 提供知识库的创建和列表查询功能
 */

import { verifyApiKey } from '@/lib/auth/dal';
import { loadSearchPageReqParams } from '@/lib/paginator';
import { handleRouteError, successResult } from '@/lib/route-common';
import {
  createDatasetReqSchema,
  getDatasetListReqSchema,
} from '@/schemas/dataset-schema';
import { createDataset, listDatasetsByPage } from '@/services/dataset';

/**
 * @swagger
 * /api/datasets:
 *   get:
 *     tags:
 *       - Datasets
 *     summary: 获取知识库列表
 *     description: 用于获取当前登录账号的知识库列表信息，该接口支持搜索+分页，传递搜索词为空时代表不搜索。
 *     parameters:
 *       - in: query
 *         name: searchWord
 *         schema:
 *           type: string
 *         description: 搜索词，用于知识库名称模糊搜索，默认为空代表不搜索任何内容
 *       - in: query
 *         name: currentPage
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 当前页数，默认为 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 50
 *         description: 每页的数据条数，默认为 20，范围从 1~50
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
 *                     list:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             description: 知识库对应的 id，类型为 uuid
 *                           name:
 *                             type: string
 *                             description: 知识库对应的名称
 *                           icon:
 *                             type: string
 *                             description: 知识库对应的图标
 *                           description:
 *                             type: string
 *                             description: 知识库描述信息
 *                           documentCount:
 *                             type: integer
 *                             description: 该知识库下的文档数
 *                           characterCount:
 *                             type: integer
 *                             description: 该知识库拥有的文档的总字符数
 *                           relatedAppCount:
 *                             type: integer
 *                             description: 该知识库关联的 APP 数量
 *                           updatedAt:
 *                             type: integer
 *                             description: 知识库的最近编辑时间，类型为时间戳
 *                           createdAt:
 *                             type: integer
 *                             description: 知识库的创建时间，类型为时间戳
 *                     paginator:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                           description: 当前的页数
 *                         pageSize:
 *                           type: integer
 *                           description: 每页的条数
 *                         totalPage:
 *                           type: integer
 *                           description: 总页数
 *                         totalRecord:
 *                           type: integer
 *                           description: 总记录条数
 *                 message:
 *                   type: string
 *                   example: ""
 */
export async function GET(request: Request) {
  try {
    const { userId } = await verifyApiKey();
    const pageReq = getDatasetListReqSchema.parse(
      loadSearchPageReqParams(request),
    );
    const result = await listDatasetsByPage(userId, pageReq);
    return successResult(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * @swagger
 * /api/datasets:
 *   post:
 *     tags:
 *       - Datasets
 *     summary: 创建知识库
 *     description: 根据传递的信息创建知识库，在同一个账号下，只能创建一个同名的知识库，避免在引用的时候发生误解。
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
 *                 description: 知识库的名称，在同一个账号下，只能创建一个同名的知识库，最长不能超过 100 个字符
 *                 maxLength: 100
 *               icon:
 *                 type: string
 *                 description: 知识库的 icon 图标地址，在前端可以调用图片上传接口获取 URL 链接后提交
 *               description:
 *                 type: string
 *                 description: 可选参数，知识库的描述信息，描述最大不能超过 2000 个字符，当该参数没有填写时，会自动生成类似 "Useful for when you want to answer queries about the xxx" 的描述
 *                 maxLength: 2000
 *     responses:
 *       200:
 *         description: 创建成功
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
 *                     datasetId:
 *                       type: string
 *                       description: 创建的知识库的 ID
 *                       example: "123e4567-e89b-12d3-a456-426614174000"
 *                 message:
 *                   type: string
 *                   example: 创建知识库成功
 */
export async function POST(request: Request) {
  try {
    const { userId } = await verifyApiKey();
    const data = await request.json();
    const { name, icon, description } = createDatasetReqSchema.parse(data);
    const result = await createDataset(userId, name, icon, description);
    return successResult(
      {
        datasetId: result.id,
      },
      201,
      '创建知识库成功',
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
