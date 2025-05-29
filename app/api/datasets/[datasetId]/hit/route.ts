/**
 * 知识库召回测试相关的 API 路由处理
 * 提供使用指定知识库进行召回测试的功能
 */

type Params = { params: Promise<{ datasetId: string }> };

/**
 * @swagger
 * /api/datasets/{datasetId}/hit:
 *   post:
 *     tags:
 *       - Datasets
 *     summary: 指定知识库进行召回测试
 *     description: 使用指定的知识库进行召回测试，用于检测不同的查询 query 在数据库中的检索效果，每次执行召回测试的时候都会将记录存储到最近查询列表中，返回的数据为检索到的文档片段列表。
 *     parameters:
 *       - in: path
 *         name: datasetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 需要进行召回测试的知识库 id，类型为 uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *               - retrievalStrategy
 *               - k
 *               - score
 *             properties:
 *               query:
 *                 type: string
 *                 description: 进行召回测试的查询语句，类型为字符串，长度不超过 200 个字符
 *                 maxLength: 200
 *               retrievalStrategy:
 *                 type: string
 *                 description: 检索策略，类型为字符串，支持的值为 full_text(全文/关键词检索)、semantic(向量/相似性检索)、hybrid(混合检索)
 *                 enum: [full_text, semantic, hybrid]
 *               k:
 *                 type: integer
 *                 description: 最大召回数量，类型为整型，数据范围为 0-10，必填参数
 *                 minimum: 0
 *                 maximum: 10
 *               score:
 *                 type: number
 *                 format: float
 *                 description: 最小匹配度，类型为浮点型，范围从 0-1，保留 2 位小数，数字越大表示相似度越高
 *                 minimum: 0
 *                 maximum: 1
 *     responses:
 *       200:
 *         description: 召回测试成功
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
 *                         description: 文档片段的 id，类型为 uuid
 *                       document:
 *                         type: object
 *                         description: 片段归属的文档信息
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             description: 文档 id，类型为 uuid
 *                           name:
 *                             type: string
 *                             description: 文档的名称，类型为字符串
 *                           extension:
 *                             type: string
 *                             description: 文档的扩展名
 *                           mimeType:
 *                             type: string
 *                             description: 文档的 mime_type 类型推断
 *                       datasetId:
 *                         type: string
 *                         format: uuid
 *                         description: 片段归属的知识库id，类型为 uuid
 *                       score:
 *                         type: number
 *                         format: float
 *                         description: 片段的召回得分，类型为浮点型，数值范围从 0-1，只有检索类型为相似性检索的时候才会返回得分，full_text 和 hybrid 这两种检索策略不会计算召回得分（返回结果为 0）
 *                       position:
 *                         type: integer
 *                         description: 片段在文档内的位置，数字越小越靠前（自然排序）
 *                       content:
 *                         type: string
 *                         description: 片段的内容，类型为字符串
 *                       keywords:
 *                         type: array
 *                         description: 关键词列表，列表的元素类型为字符串
 *                         items:
 *                           type: string
 *                       characterCount:
 *                         type: integer
 *                         description: 片段的字符串长度，类型为整型
 *                       tokenCount:
 *                         type: integer
 *                         description: 片段的 token 数，类型为整型
 *                       hitCount:
 *                         type: integer
 *                         description: 片段被命中的次数，类型为整型
 *                       enabled:
 *                         type: boolean
 *                         description: 片段是否启用，true 表示启用，false 表示禁用（人为禁用或者程序处理异常、未处理完导致的禁用），只有当 status 为 completed(完成) 时，enabled 才有可能为 true
 *                       disabledAt:
 *                         type: integer
 *                         description: 片段被人为禁用的时间，为 0 表示没有人为禁用，类型为整型
 *                       status:
 *                         type: string
 *                         description: 片段的状态，涵盖 waiting(等待处理)、indexing(构建索引)、completed(构建完成)、error(错误) 等状态，不同的状态代表不同的处理程度
 *                         enum: [waiting, indexing, completed, error]
 *                       error:
 *                         type: string
 *                         description: 错误信息，类型为字符串，当后端程序处理出现错误的时候，会记录错误信息
 *                       updatedAt:
 *                         type: integer
 *                         description: 片段的最后更新时间，类型为时间戳
 *                       createdAt:
 *                         type: integer
 *                         description: 片段的创建时间，类型为时间戳
 *                 message:
 *                   type: string
 *                   example: 召回测试成功
 */
export async function POST() {
  // TODO
}
