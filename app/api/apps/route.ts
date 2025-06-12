/**
 * 应用管理相关的 API 路由处理
 * 提供应用的创建和列表查询功能
 */

import { verifyApiKey } from '@/lib/auth/dal';
import { loadSearchPageReqParams } from '@/lib/paginator';
import { handleRouteError, successResult } from '@/lib/route-common';
import { createAppReqSchema, getAppListReqSchema } from '@/schemas/app-schema';
import { createApp, listAppsByPage } from '@/services/app';

/**
 * @swagger
 * /api/apps:
 *   post:
 *     tags:
 *       - Apps
 *     summary: 在个人空间下新增应用
 *     description: 该接口用于在个人空间下新增 Agent 应用，创建的 Agent 应用会添加一个默认的草稿配置信息，默认使用 `openai` 下的 `gpt-4o-mini` 模型，模型的默认参数为：`temperature=0.5`、`top_p=0.85`、`frequency_penalty=0.2`、`presence_penalty=0.2`、`max_tokens=8192`，该参数为相对 `平衡` 的状态。
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
 *                 description: Agent 应用的名称，类型为字符串，长度不超过 40 个字符
 *                 maxLength: 40
 *               icon:
 *                 type: string
 *                 description: Agent 应用的图标 URL 地址，类型为字符串
 *               description:
 *                 type: string
 *                 description: Agent 应用的描述信息，类型为字符串，长度不超过 800 个字符
 *                 maxLength: 800
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
 *                     appId:
 *                       type: string
 *                       format: uuid
 *                       description: 创建的 Agent 应用 id，类型为 uuid
 *                 message:
 *                   type: string
 *                   example: 创建应用成功
 */
export async function POST(request: Request) {
  try {
    const [{ userId }, body] = await Promise.all([
      verifyApiKey(),
      request.json(),
    ]);

    const req = createAppReqSchema.parse(body);

    const appId = await createApp(userId, req);
    return successResult({ appId }, 201, '创建应用成功');
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * @swagger
 * /api/apps:
 *   get:
 *     tags:
 *       - Apps
 *     summary: 获取应用分页列表
 *     description: 该接口用于获取当前登录账号下创建的应用分页列表数据，该接口支持分页+搜索。
 *     parameters:
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
 *           minimum: 10
 *           maximum: 50
 *         description: 每页数据条数，默认为 20，范围为 10-50
 *       - in: query
 *         name: searchWord
 *         schema:
 *           type: string
 *         description: 搜索词，在后端会使用应用的名称进行模糊匹配
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
 *                             description: Agent 智能体应用的 id
 *                           name:
 *                             type: string
 *                             description: Agent 智能体应用的名字
 *                           icon:
 *                             type: string
 *                             description: Agent 智能体应用的图标
 *                           description:
 *                             type: string
 *                             description: Agent 智能体应用的描述信息
 *                           presetPrompt:
 *                             type: string
 *                             description: Agent 智能体应用的预设提示词，应用如果已发布则从运行配置中获取，否则从草稿配置中获取
 *                           modelConfig:
 *                             type: object
 *                             properties:
 *                               provider:
 *                                 type: string
 *                                 description: 模型提供商的名字，例如：openai
 *                               model:
 *                                 type: string
 *                                 description: 模型名字，例如 gpt-4o-mini
 *                           status:
 *                             type: string
 *                             enum: [published, draft]
 *                             description: Agent 智能体应用的状态，支持 published 和 draft，分别代表已发布和草稿
 *                           updatedAt:
 *                             type: integer
 *                             description: Agent 智能体的更新时间，类型为时间戳
 *                           createdAt:
 *                             type: integer
 *                             description: Agent 智能体的创建时间，类型为时间戳
 *                     paginator:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                           description: 当前页数
 *                         pageSize:
 *                           type: integer
 *                           description: 每页的条数
 *                         totalPage:
 *                           type: integer
 *                           description: 数据的总页数
 *                         totalRecord:
 *                           type: integer
 *                           description: 数据的总记录条数
 *                 message:
 *                   type: string
 *                   example: ""
 */
export async function GET(request: Request) {
  try {
    const { userId } = await verifyApiKey();
    const pageReq = getAppListReqSchema.parse(loadSearchPageReqParams(request));
    const result = await listAppsByPage(userId, pageReq);
    return successResult(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
