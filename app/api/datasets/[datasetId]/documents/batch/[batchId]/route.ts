/**
 * 文档批处理进度查询 API
 *
 * 该模块提供了一个 API 端点，用于查询特定批次中文档的处理进度。
 * 它通过数据集 ID 和批处理 ID 来获取相关文档的详细处理状态信息。
 */

import { verifyApiKey } from '@/lib/auth/dal';
import { handleRouteError, successResult } from '@/lib/route-common';
import { getDocumentByBatch } from '@/services/document';

/**
 * 路由参数类型定义
 * @typedef {Object} Params
 * @property {Promise<{datasetId: string, batchId: string}>} params - 包含数据集ID和批处理ID的Promise对象
 */
type Params = { params: Promise<{ datasetId: string; batchId: string }> };

/**
 * @swagger
 * /api/datasets/{datasetId}/documents/batch/{batchId}:
 *   get:
 *     tags:
 *       - Documents
 *     summary: 根据批处理标识获取处理进度
 *     description: 根据生成的批处理标识查询当前批次下文档的处理进度
 *     parameters:
 *       - in: path
 *         name: datasetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 批处理标识关联的知识库id，类型为 uuid
 *       - in: path
 *         name: batchId
 *         required: true
 *         schema:
 *           type: string
 *         description: 批处理标识，类型为字符串，格式为 %Y%m%d%H%M%S + 随机字符串
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
 *                         description: 处理文档的 id，类型为 uuid
 *                       name:
 *                         type: string
 *                         description: 文档的名字
 *                       size:
 *                         type: integer
 *                         description: 文档关联的文件大小，单位为字节
 *                       extension:
 *                         type: string
 *                         description: 文档的扩展名
 *                       mimeType:
 *                         type: string
 *                         description: 文档的 mimetype 类型推断
 *                       position:
 *                         type: integer
 *                         description: 文档在知识库中的位置
 *                       segmentCount:
 *                         type: integer
 *                         description: 该文档下的文档片段数
 *                       completedSegmentCount:
 *                         type: integer
 *                         description: 该文档下已经处理完成的文档片段数
 *                       error:
 *                         type: string
 *                         description: 文档片段如果处理出错，会使用该字段记录
 *                       status:
 *                         type: string
 *                         description: 文档的状态，涵盖 waiting(等待中)、parsing(解析处理中)、splitting(分割中)、indexing(构建索引中)、completed(构建完成)、error(出错) 等内容
 *                       processingStartedAt:
 *                         type: integer
 *                         description: 开始处理时间，当程序开始处理当前的文档时，会记录该时间，类型为时间戳，下一步为解析，如果没有完成则值为 0，当前的状态为 parsing，一开始的状态为 waiting
 *                       parsingCompletedAt:
 *                         type: integer
 *                         description: 解析完成时间，当程序加载完当前文档的时候记录的时间，类型为时间戳，下一步为分割，如果没有完成，则值为 0，当前的状态为 splitting，代表下一步需要分割，因为解析已经结束
 *                       splittingCompletedAt:
 *                         type: integer
 *                         description: 分割完成时间，当程序使用分割器处理完该文档时记录的时间，类型为时间戳，下一步为构建(索引构建+关键词构建)，如果没有完成，则值为 0，当前的状态为 indexing，代表下一步需要构建索引，当前分割已结束
 *                       indexingCompletedAt:
 *                         type: integer
 *                         description: 构建完成时间，当程序使用 Embeddings 文本嵌入模型以及分词器完成向量转换+关键词提取动作的时候记录的时间，类型为时间戳，该阶段为最后一个阶段，如果没有完成，则值为 0，状态为 completed 代表处理完成
 *                       completedAt:
 *                         type: integer
 *                         description: 构建完成时间，当程序使用 Embeddings 文本嵌入模型以及分词器完成向量转换+关键词提取动作的时候记录的时间，类型为时间戳，该阶段为最后一个阶段，如果没有完成，则值为 0，状态为 completed 代表处理完成
 *                       stoppedAt:
 *                         type: integer
 *                         description: 停止时间，类型为时间戳，文档没有正常处理完成的时候，记录的时间，如果没有停止，则值为 0，当前状态为 error，代表出错了
 *                       createdAt:
 *                         type: integer
 *                         description: 文档的记录创建时间戳
 *                 message:
 *                   type: string
 *                   example: ""
 */
export async function GET(_: Request, { params }: Params) {
  try {
    // 并行执行 API 密钥验证和获取路由参数
    const [{ userId }, { datasetId, batchId }] = await Promise.all([
      verifyApiKey(),
      params,
    ]);

    // 获取文档批处理进度
    const results = await getDocumentByBatch(datasetId, batchId, userId);
    return successResult(results);
  } catch (error) {
    // 处理并返回错误信息
    return handleRouteError(error);
  }
}
