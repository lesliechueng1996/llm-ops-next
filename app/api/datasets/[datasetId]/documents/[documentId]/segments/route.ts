/**
 * 文档片段管理 API 路由
 *
 * 该文件实现了文档片段（segments）的 RESTful API 接口，包括：
 * 1. GET - 获取指定文档的片段列表，支持分页和内容搜索
 * 2. POST - 创建新的文档片段
 *
 * 路由路径：/api/datasets/[datasetId]/documents/[documentId]/segments
 */

import { verifyApiKey } from '@/lib/auth/dal';
import { loadSearchPageReqParams } from '@/lib/paginator';
import { handleRouteError, successResult } from '@/lib/route-common';
import {
  createSegmentReqSchema,
  getSegmentListReqSchema,
} from '@/schemas/segment-schema';
import { createSegment, getSegmentListByPage } from '@/services/segment';

// 定义路由参数类型
type Params = { params: Promise<{ datasetId: string; documentId: string }> };

/**
 * @swagger
 * /api/datasets/{datasetId}/documents/{documentId}/segments:
 *   get:
 *     tags:
 *       - Segments
 *     summary: 获取指定文档的片段列表
 *     description: 该接口用于获取指定文档的片段列表，该接口支持分页+搜索，搜索模糊匹配片段内容，当搜索词为空时代表不进行任何检索，该接口只要 datasetId、documentId 有任意一个不匹配就会抛出对应的错误。
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
 *       - in: query
 *         name: searchWord
 *         schema:
 *           type: string
 *         description: 搜索词，用于片段内容模糊搜索，默认为空代表不搜索任何内容
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
 *                             description: 文档片段的 id，类型为 uuid
 *                           documentId:
 *                             type: string
 *                             format: uuid
 *                             description: 片段归属的文档 id，类型为 uuid
 *                           datasetId:
 *                             type: string
 *                             format: uuid
 *                             description: 片段归属的知识库 id，类型为 uuid
 *                           position:
 *                             type: integer
 *                             description: 片段在文档内的位置，数字越小越靠前（自然排序）
 *                           content:
 *                             type: string
 *                             description: 片段的内容，类型为字符串
 *                           keywords:
 *                             type: array
 *                             items:
 *                               type: string
 *                             description: 关键词列表，列表的元素类型为字符串
 *                           characterCount:
 *                             type: integer
 *                             description: 片段的字符串长度，类型为整型
 *                           tokenCount:
 *                             type: integer
 *                             description: 片段的 token 数，类型为整型
 *                           hitCount:
 *                             type: integer
 *                             description: 片段被命中的次数，类型为整型
 *                           enabled:
 *                             type: boolean
 *                             description: 片段是否启用，true 表示启用，false 表示禁用（人为禁用或者程序处理异常、未处理完导致的禁用），只有当 status 为 completed(完成) 时，enabled 才有可能为 true
 *                           disabledAt:
 *                             type: integer
 *                             description: 片段被人为禁用的时间，为 0 表示没有人为禁用，类型为整型
 *                           status:
 *                             type: string
 *                             description: 片段的状态，涵盖 waiting(等待处理)、indexing(构建索引)、completed(构建完成)、error(错误) 等状态，不同的状态代表不同的处理程度
 *                           error:
 *                             type: string
 *                             description: 错误信息，类型为字符串，当后端程序处理出现错误的时候，会记录错误信息
 *                           updatedAt:
 *                             type: integer
 *                             description: 片段的最后更新时间，类型为时间戳
 *                           createdAt:
 *                             type: integer
 *                             description: 片段的创建时间，类型为时间戳
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
 *                   example: 获取分段列表成功
 */
export async function GET(request: Request, { params }: Params) {
  try {
    const [{ userId }, { datasetId, documentId }] = await Promise.all([
      verifyApiKey(),
      params,
    ]);
    const pageReq = getSegmentListReqSchema.parse(
      loadSearchPageReqParams(request),
    );
    const result = await getSegmentListByPage(
      userId,
      datasetId,
      documentId,
      pageReq,
    );
    return successResult(result, 200, '获取分段列表成功');
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * @swagger
 * /api/datasets/{datasetId}/documents/{documentId}/segments:
 *   post:
 *     tags:
 *       - Segments
 *     summary: 新增文档片段信息
 *     description: 该接口主要用于在指定文档下新增文档片段信息，添加的片段位置会处于该文档的最后，并且由于每次只能新增一个文档片段，相对来说并不会这么耗时（无需加载分割，直接并行执行关键词提取+文本转向量），所以该接口是同步的，接口会等待处理完毕后再返回，该接口如果任意一个 datasetId 或 documentId 出错，都会抛出对应的错误。
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: 片段内容，原则上长度不能超过 1000 个 token，类型为字符串
 *               keywords:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 片段对应的关键词列表，可选参数，如果该参数没有传，在后端会使用分词服务对片段内容进行分词，得到对应的关键词
 *     responses:
 *       201:
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
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       description: 新创建的片段 id
 *                 message:
 *                   type: string
 *                   example: 创建片段成功
 */
export async function POST(request: Request, { params }: Params) {
  try {
    const [{ userId }, { datasetId, documentId }, body] = await Promise.all([
      verifyApiKey(),
      params,
      request.json(),
    ]);
    const req = createSegmentReqSchema.parse(body);
    const segmentId = await createSegment(userId, datasetId, documentId, req);
    return successResult({ id: segmentId }, 201, '创建片段成功');
  } catch (error) {
    return handleRouteError(error);
  }
}
