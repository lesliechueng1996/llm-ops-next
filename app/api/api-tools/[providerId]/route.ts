/**
 * 自定义 API 工具相关的路由处理
 * 提供删除、更新自定义 API 工具的功能
 */

import { verifyApiKey } from '@/lib/auth/dal';
import { handleRouteError, successResult } from '@/lib/route-common';
import { updateApiToolReqSchema } from '@/schemas/api-tool-schema';
import {
  deleteApiTool,
  getApiToolProvider,
  updateApiTool,
} from '@/services/api-tool';

type Params = { params: Promise<{ providerId: string }> };

/**
 * @swagger
 * /api/api-tools/{providerId}:
 *   delete:
 *     tags:
 *       - API Tools
 *     summary: 删除自定义 API 工具提供者
 *     description: 用于删除特定的自定义 API 插件，删除对应的 API 插件后，关联的应用、工作流也无法使用该插件/工具（在应用对话交流、工作流运行之前都会检测对应的 API 插件是否存在，如果被删除了，均会剔除并无法使用）。
 *     parameters:
 *       - in: path
 *         name: providerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 需要删除的 API 工具提供商 id，类型为 uuid
 *     responses:
 *       200:
 *         description: 删除成功
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
 *                   example: 删除API工具成功
 */
export async function DELETE(_: Request, { params }: Params) {
  try {
    const { userId } = await verifyApiKey();
    const { providerId } = await params;
    await deleteApiTool(userId, providerId);
    return successResult({}, 200, '删除API工具成功');
  } catch (err) {
    return handleRouteError(err);
  }
}

/**
 * @swagger
 * /api/api-tools/{providerId}:
 *   put:
 *     tags:
 *       - API Tools
 *     summary: 更新自定义 API 工具提供者
 *     description: 用于更新自定义 API 工具信息，每次更新的时候，在后端都会删除原有工具信息，并记录创建新的工具数据，在后端使用 provider_id+tool_name 唯一标识进行判断，更新时如果同个账号出现重名，则会抛出错误。
 *     parameters:
 *       - in: path
 *         name: providerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 需要修改的 API 工具提供商 id，类型为 uuid
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
 *                 description: 工具提供商的名字，同一个账号下的工具提供商名字必须唯一
 *                 maxLength: 30
 *               icon:
 *                 type: string
 *                 description: 工具提供商的 icon 图标，类型为图片 URL 字符串
 *               openapiSchema:
 *                 type: string
 *                 description: 符合 OpenAPI 规范的 json 字符串，在字符串中涵盖基础信息、服务
 *               headers:
 *                 type: array
 *                 description: 接口附加的请求头信息
 *                 items:
 *                   type: object
 *                   properties:
 *                     key:
 *                       type: string
 *                       description: 请求头对应的键
 *                     value:
 *                       type: string
 *                       description: 请求头对应的值
 *     responses:
 *       200:
 *         description: 更新成功
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
 *                   example: 更新API工具成功
 */
export async function PUT(request: Request, { params }: Params) {
  try {
    const { userId } = await verifyApiKey();
    const [{ providerId }, data] = await Promise.all([params, request.json()]);

    const req = updateApiToolReqSchema.parse(data);
    await updateApiTool(userId, providerId, req);
    return successResult({}, 200, '更新API工具成功');
  } catch (err) {
    return handleRouteError(err);
  }
}

/**
 * @swagger
 * /api/api-tools/{providerId}:
 *   get:
 *     tags:
 *       - API Tools
 *     summary: 获取指定 API 工具提供者信息
 *     description: 根据传递的工具提供者 id 获取对应的工具提供者详细信息
 *     parameters:
 *       - in: path
 *         name: providerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 需要查看的 API 工具提供商 id，类型为 uuid
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
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       description: 工具提供者的 id
 *                     name:
 *                       type: string
 *                       description: 工具提供者的名字
 *                     icon:
 *                       type: string
 *                       description: 工具提供者的 icon 图标地址
 *                     description:
 *                       type: string
 *                       description: 工具提供者的描述
 *                     openapiSchema:
 *                       type: string
 *                       description: 符合 OpenAPI 规范的 json 字符串
 *                     headers:
 *                       type: array
 *                       description: 接口附加的请求头信息
 *                       items:
 *                         type: object
 *                         properties:
 *                           key:
 *                             type: string
 *                             description: 请求头对应的键
 *                           value:
 *                             type: string
 *                             description: 请求头对应的值
 *                     createdAt:
 *                       type: integer
 *                       description: 该工具提供者的创建时间戳
 *                 message:
 *                   type: string
 *                   example: 获取API工具成功
 */
export async function GET(_: Request, { params }: Params) {
  try {
    const { userId } = await verifyApiKey();
    const { providerId } = await params;
    const apiToolProvider = await getApiToolProvider(userId, providerId);
    return successResult(apiToolProvider, 200, '获取API工具成功');
  } catch (err) {
    return handleRouteError(err);
  }
}
