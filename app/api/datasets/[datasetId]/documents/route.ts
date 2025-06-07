/**
 * 文档管理 API 路由处理模块
 *
 * 该模块提供了知识库文档管理的核心 API 接口，包括：
 * 1. 获取文档列表：支持按文档名称进行模糊搜索和分页查询
 * 2. 创建新文档：支持批量上传文档（最多10份），并提供自动和自定义两种处理模式
 *
 * 文档处理流程：
 * - 文档创建后进入异步处理流程
 * - 处理状态包括：等待中、解析中、分割中、索引构建中、完成、错误等
 * - 支持文档的启用/禁用管理
 *
 * 安全特性：
 * - 所有接口都需要通过 API Key 进行身份验证
 * - 严格的数据验证和错误处理机制
 */

import { verifyApiKey } from '@/lib/auth/dal';
import { loadSearchPageReqParams } from '@/lib/paginator';
import { handleRouteError, successResult } from '@/lib/route-common';
import {
  createDocumentReqSchema,
  getDocumentListReqSchema,
} from '@/schemas/document-schema';
import { createDocuments, getDocumentListByPage } from '@/services/document';

// 定义路由参数类型
type Params = { params: Promise<{ datasetId: string }> };

/**
 * @swagger
 * /api/datasets/{datasetId}/documents:
 *   get:
 *     tags:
 *       - Documents
 *     summary: 获取指定知识库的文档列表
 *     description: 用于获取指定知识库下的文档列表，该接口支持搜索+分页，如果传递的搜索词为空代表不搜索任何内容，这里的搜索词使用文档名称进行模糊匹配。
 *     parameters:
 *       - in: path
 *         name: datasetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 需要获取文档列表归属的知识库 id，类型为 uuid
 *       - in: query
 *         name: searchWord
 *         schema:
 *           type: string
 *         description: 搜索词，用于模糊匹配搜索文档名称，默认为空代表不搜索任何内容
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
 *                             description: 文档的 id，类型为 uuid
 *                           name:
 *                             type: string
 *                             description: 文档的名字
 *                           characterCount:
 *                             type: integer
 *                             description: 文档的字符总数
 *                           hitCount:
 *                             type: integer
 *                             description: 文档的召回命中次数
 *                           position:
 *                             type: integer
 *                             description: 文档在知识库中的位置，数字越小越靠前
 *                           enabled:
 *                             type: boolean
 *                             description: 文档是否开启，如果为 true 则表示开启，false 表示关闭，只有当状态为 completed(构建完成) 时该接口才可以设置为 true
 *                           disabledAt:
 *                             type: integer
 *                             description: 文档的禁用时间（人为禁用的时候记录），类型为时间戳，如果开启则为 0
 *                           status:
 *                             type: string
 *                             description: 文档的状态，涵盖 waiting(等待中)、parsing(解析处理中)、splitting(分割中)、indexing(构建索引中)、completed(构建完成)、error(出错) 等
 *                           error:
 *                             type: string
 *                             description: 错误信息，如果没有错误则为空字符串
 *                           updatedAt:
 *                             type: integer
 *                             description: 文档的更新时间戳
 *                           createdAt:
 *                             type: integer
 *                             description: 文档的创建时间戳
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
export async function GET(request: Request, { params }: Params) {
  try {
    // 验证 API Key 并获取用户 ID
    const { userId } = await verifyApiKey();
    // 获取知识库 ID
    const { datasetId } = await params;
    // 解析并验证请求参数
    const pageReq = getDocumentListReqSchema.parse(
      loadSearchPageReqParams(request),
    );
    // 获取文档列表数据
    const result = await getDocumentListByPage(userId, datasetId, pageReq);
    return successResult(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * @swagger
 * /api/datasets/{datasetId}/documents:
 *   post:
 *     tags:
 *       - Documents
 *     summary: 在指定知识库下新增文档
 *     description: 该接口用于在指定的知识库下添加新文档，该接口后端的服务会长时间进行处理，所以在后端服务中，创建好基础的文档信息后接口就会响应前端，在前端关闭页面/接口不影响后端逻辑的执行，该接口一次性最多可以上传 10 份文档。
 *     parameters:
 *       - in: path
 *         name: datasetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 需要添加文档的知识库 id，类型为 uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - uploadFileIds
 *               - processType
 *             properties:
 *               uploadFileIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: 需要新增到知识库中的文件id列表，最多支持上传 10 份文件
 *               processType:
 *                 type: string
 *                 enum: [automatic, custom]
 *                 description: 处理类型，支持 automatic(自动模式) 和 custom(自定义)
 *               rule:
 *                 type: object
 *                 description: 当处理类型为 custom 时为必填参数
 *                 properties:
 *                   preProcessRules:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           enum: [remove_extra_space, remove_url_and_email]
 *                           description: 预处理标识，支持 remove_extra_space(移除多余空格) 和 remove_url_and_email(移除链接和邮箱)
 *                         enabled:
 *                           type: boolean
 *                           description: 对应的预处理是否开启
 *                   segment:
 *                     type: object
 *                     properties:
 *                       separators:
 *                         type: array
 *                         items:
 *                           type: string
 *                         description: 片段的分隔符列表，支持正则匹配
 *                       chunkSize:
 *                         type: integer
 *                         description: 每个片段的最大 Token 数
 *                       chunkOverlap:
 *                         type: integer
 *                         description: 每个片段之间的重叠度
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
 *                     documents:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             description: 创建的文档 id
 *                           name:
 *                             type: string
 *                             description: 创建的文档名字
 *                           status:
 *                             type: string
 *                             description: 当前文档的状态，涵盖 waiting(等待中)、parsing(解析处理中)、splitting(分割中)、indexing(构建索引中)、completed(构建完成)、error(出错) 等
 *                           createdAt:
 *                             type: integer
 *                             description: 文档的创建时间戳
 *                     batch:
 *                       type: string
 *                       description: 当前处理的批次标识，可以通过该批次来获取对应文档的处理信息
 *                 message:
 *                   type: string
 *                   example: ""
 */
export async function POST(request: Request, { params }: Params) {
  try {
    const { userId } = await verifyApiKey();
    const [{ datasetId }, data] = await Promise.all([params, request.json()]);
    const req = createDocumentReqSchema.parse(data);
    const result = await createDocuments(userId, datasetId, req);
    return successResult(result, 201, '创建成功');
  } catch (error) {
    return handleRouteError(error);
  }
}
