/**
 * 文档列表 API 路由处理模块
 * 该模块提供了获取指定知识库下文档列表的 API 接口
 * 支持文档名称的模糊搜索和分页功能
 */

import { verifyApiKey } from '@/lib/auth/dal';
import { loadSearchPageReqParams } from '@/lib/paginator';
import { handleRouteError, successResult } from '@/lib/route-common';
import { getDocumentListReqSchema } from '@/schemas/document-schema';
import { getDocumentListByPage } from '@/services/document';

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
