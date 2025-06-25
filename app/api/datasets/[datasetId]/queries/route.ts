import { verifyApiKey } from '@/lib/auth/dal';
import { handleRouteError, successResult } from '@/lib/route-common';
import { getDatasetQueries } from '@/services/dataset';

type Params = { params: Promise<{ datasetId: string }> };

/**
 * @swagger
 * /api/datasets/{datasetId}/queries:
 *   get:
 *     tags:
 *       - Datasets
 *     summary: 获取指定知识库最近的查询列表
 *     description: 用于获取指定知识库最近的查询列表，该接口会返回最近的 10 条记录，没有分页+搜索功能，返回的数据是按照 createdAt 进行倒序，即数据越新越靠前。
 *     parameters:
 *       - in: path
 *         name: datasetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 需要获取最近查询的知识库 id，类型为 uuid
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
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         description: 查询的记录 id，类型为 uuid
 *                       datasetId:
 *                         type: string
 *                         format: uuid
 *                         description: 查询记录关联的知识库 id，类型为 uuid
 *                       query:
 *                         type: string
 *                         description: 查询的 query 语句，类型为字符串
 *                       source:
 *                         type: string
 *                         description: 查询的来源信息，支持 Hit Testing(召回测试)、App(AI/Agent应用调用)
 *                       createdAt:
 *                         type: integer
 *                         description: 查询的时间戳，类型为整型
 *                 message:
 *                   type: string
 *                   example: ""
 */
export async function GET(_: Request, { params }: Params) {
  try {
    const [{ userId }, { datasetId }] = await Promise.all([
      verifyApiKey(),
      params,
    ]);
    const queries = await getDatasetQueries(userId, datasetId);
    return successResult(queries);
  } catch (error) {
    return handleRouteError(error);
  }
}
