/**
 * OpenAPI Schema 验证相关的路由处理
 * 提供验证 OpenAPI Schema 字符串是否正确的功能
 */

import { verifyApiKey } from '@/lib/auth/dal';
import { handleRouteError, successResult } from '@/lib/route-common';
import { validateOpenapiSchemaReqSchema } from '@/schemas/api-tool-schema';
import { validateOpenapiSchema } from '@/services/api-tool';

/**
 * @swagger
 * /api/api-tools/openapi-schema/validate:
 *   post:
 *     tags:
 *       - API Tools
 *     summary: 校验 OpenAPI Schema 字符串是否正确
 *     description: 校验传递的 OpenAPI-Schema 字符串是否正确，该接口只校验数据是否符合规则，不校验对应的提供商名字、工具名字等是否唯一
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - openapiSchema
 *             properties:
 *               openapiSchema:
 *                 type: string
 *                 description: 需要校验的 openapi-schema 字符串，该字符串的规则符合项目 OpenAPI-Schema 规范
 *                 example: "{\"description\":\"这是一个查询对应英文单词字典的工具\",\"server\":\"https://dict.youdao.com\",\"paths\":{\"/suggest\":{\"get\":{\"description\":\"根据传递的单词查询其字典信息\",\"operationId\":\"YoudaoSuggest\",\"parameters\":[{\"name\":\"q\",\"in\":\"query\",\"description\":\"要检索查询的单词，例如love/computer\",\"required\":true,\"type\":\"string\"},{\"name\":\"doctype\",\"in\":\"query\",\"description\":\"返回的数据类型，支持json和xml两种格式，默认情况下json数据\",\"required\":false,\"type\":\"string\"}]}}}}"
 *     responses:
 *       200:
 *         description: 验证成功
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
 *                   example: 验证OpenAPI Schema成功
 */

export async function POST(request: Request) {
  try {
    await verifyApiKey();
    const data = await request.json();
    const { openapiSchema } = validateOpenapiSchemaReqSchema.parse(data);
    validateOpenapiSchema(openapiSchema);
    return successResult({}, 200, '验证OpenAPI Schema成功');
  } catch (err) {
    return handleRouteError(err);
  }
}
