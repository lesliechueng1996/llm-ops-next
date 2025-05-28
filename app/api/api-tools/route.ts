/**
 * 自定义 API 工具相关的路由处理
 * 提供创建、获取分页自定义 API 工具的功能
 */

import { verifyApiKey } from '@/lib/auth/dal';
import { loadSearchPageReqParams } from '@/lib/paginator';
import { handleRouteError, successResult } from '@/lib/route-common';
import {
  createApiToolReqSchema,
  getApiToolListReqSchema,
} from '@/schemas/api-tool-schema';
import { createApiTool, listApiToolsByPage } from '@/services/api-tool';

/**
 * @swagger
 * /api/api-tools:
 *   post:
 *     tags:
 *       - API Tools
 *     summary: 创建自定义 API 工具提供者
 *     description: 用于将企业现有的 API 服务接入到 LLMOps 项目创建自定义 API 工具，对于该自定义工具，支持 GET+POST 两种 HTTP 方法的 URL 链接，并且对 OpenAPI-Schema 规范进行简化+调整，以让其更适配 LLMOps 项目。
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - icon
 *               - openapiSchema
 *             properties:
 *               name:
 *                 type: string
 *                 description: 工具提供商的名字，同一个账号下的工具提供商名字必须唯一，否则容易识别错误，名字的长度范围是 0-30 个字符
 *                 example: "谷歌搜索"
 *               icon:
 *                 type: string
 *                 description: 工具提供商的 icon 图标，类型为图片 URL 字符串
 *                 example: "https://cdn.imooc.com/google.png"
 *               openapiSchema:
 *                 type: string
 *                 description: 符合 OpenAPI 规范的 json 字符串，在字符串中涵盖基础信息、服务，该数据在后端会进行校验，如果缺少了对应的数据会抛出数据校验错误
 *                 example: "{\"description\":\"这是一个查询对应英文单词字典的工具\",\"server\":\"https://dict.youdao.com\",\"paths\":{\"/suggest\":{\"get\":{\"description\":\"根据传递的单词查询其字典信息\",\"operationId\":\"YoudaoSuggest\",\"parameters\":[{\"name\":\"q\",\"in\":\"query\",\"description\":\"要检索查询的单词，例如love/computer\",\"required\":true,\"type\":\"string\"},{\"name\":\"doctype\",\"in\":\"query\",\"description\":\"返回的数据类型，支持json和xml两种格式，默认情况下json数据\",\"required\":false,\"type\":\"string\"}]}}}}"
 *               headers:
 *                 type: array
 *                 description: 接口附加的请求头信息，类型为列表，列表的每个元素都是一个字典，如果没有请求头信息则传递空列表即可
 *                 items:
 *                   type: object
 *                   properties:
 *                     key:
 *                       type: string
 *                       description: 请求头对应的键
 *                       example: "Authorization"
 *                     value:
 *                       type: string
 *                       description: 请求头对应的值
 *                       example: "Bearer QQYnRFerJTSEcrfB89fw8prOaObmrch8"
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
 *                     providerId:
 *                       type: string
 *                       description: 创建的API工具提供商的ID
 *                       example: "123e4567-e89b-12d3-a456-426614174000"
 *                 message:
 *                   type: string
 *                   example: 创建自定义API插件成功
 */
export async function POST(request: Request) {
  try {
    const { userId } = await verifyApiKey();
    const data = await request.json();
    const req = createApiToolReqSchema.parse(data);
    const providerId = await createApiTool(userId, req);
    return successResult(
      {
        providerId,
      },
      201,
      '创建自定义API插件成功',
    );
  } catch (err) {
    return handleRouteError(err);
  }
}

/**
 * @swagger
 * /api/api-tools:
 *   get:
 *     tags:
 *       - API Tools
 *     summary: 获取自定义 API 工具提供者列表
 *     description: 获取特定账号创建的 API 插件/自定义工具信息，该接口携带分页，并支持搜索。
 *     parameters:
 *       - in: query
 *         name: searchWord
 *         schema:
 *           type: string
 *         description: 搜索词，用于搜索自定义 API 工具，默认为空代表不搜索任何内容
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
 *                             description: 当前工具提供者对应的 id
 *                           name:
 *                             type: string
 *                             description: 工具提供者的名字
 *                           icon:
 *                             type: string
 *                             description: 工具提供者对应的 icon 图标地址
 *                           tools:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                   format: uuid
 *                                   description: 工具的唯一 id
 *                                 description:
 *                                   type: string
 *                                   description: 工具的描述信息
 *                                 name:
 *                                   type: string
 *                                   description: 工具的名称
 *                                 inputs:
 *                                   type: array
 *                                   items:
 *                                     type: object
 *                                     properties:
 *                                       name:
 *                                         type: string
 *                                         description: 参数的名字
 *                                       description:
 *                                         type: string
 *                                         description: 参数的描述
 *                                       required:
 *                                         type: boolean
 *                                         description: 参数是否必填
 *                                       type:
 *                                         type: string
 *                                         description: 参数的类型
 *                           description:
 *                             type: string
 *                             description: 工具提供者的描述信息
 *                           headers:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 key:
 *                                   type: string
 *                                   description: 请求头对应的键
 *                                 value:
 *                                   type: string
 *                                   description: 请求头对应的值
 *                           createdAt:
 *                             type: integer
 *                             description: 工具提供者的发布时间戳
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
    const pageReq = getApiToolListReqSchema.parse(
      loadSearchPageReqParams(request),
    );
    const result = await listApiToolsByPage(userId, pageReq);
    return successResult(result);
  } catch (err) {
    return handleRouteError(err);
  }
}
