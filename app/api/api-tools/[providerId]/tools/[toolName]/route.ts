/**
 * 自定义 API 工具相关的路由处理
 * 提供获取指定 API 工具信息的功能
 */

import { verifyApiKey } from '@/lib/auth/dal';
import { handleRouteError, successResult } from '@/lib/route-common';
import { getApiTool } from '@/services/api-tool';

type Params = { params: Promise<{ providerId: string; toolName: string }> };

/**
 * @swagger
 * /api/api-tools/{providerId}/tools/{toolName}:
 *   get:
 *     tags:
 *       - API Tools
 *     summary: 获取指定 API 工具信息
 *     description: 根据传递的工具提供者 id + 工具的名称查看自定义 API 插件的相关信息，如果没有找到则返回 404 信息
 *     parameters:
 *       - in: path
 *         name: providerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 需要查看的 API 工具提供商 id，类型为 uuid
 *       - in: path
 *         name: toolName
 *         required: true
 *         schema:
 *           type: string
 *         description: 需要查看的 API 工具名称，类型为字符串
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
 *                       description: 对应工具的 id
 *                     name:
 *                       type: string
 *                       description: 对应工具的名称（OperationId，操作 id）
 *                     description:
 *                       type: string
 *                       description: 对应工具的描述信息
 *                     inputs:
 *                       type: array
 *                       description: 工具的输入信息
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             description: 输入参数的类型，例如 str
 *                           required:
 *                             type: boolean
 *                             description: 输入参数是否必填
 *                           name:
 *                             type: string
 *                             description: 输入参数的名称
 *                           description:
 *                             type: string
 *                             description: 输入参数的描述信息
 *                     provider:
 *                       type: object
 *                       description: 工具关联的服务提供者信息
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                           description: 工具提供者的 id
 *                         name:
 *                           type: string
 *                           description: 工具提供者的名称
 *                         icon:
 *                           type: string
 *                           description: 工具提供者的 icon 图标地址
 *                         description:
 *                           type: string
 *                           description: 工具提供者的描述信息
 *                         createdAt:
 *                           type: number
 *                           description: 工具提供者创建时间
 *                         headers:
 *                           type: array
 *                           description: 工具提供者的请求头列表信息
 *                           items:
 *                             type: object
 *                             properties:
 *                               key:
 *                                 type: string
 *                                 description: 请求头对应的键
 *                               value:
 *                                 type: string
 *                                 description: 请求头对应的值
 *                 message:
 *                   type: string
 *                   example: 获取API工具成功
 */
export async function GET(_: Request, { params }: Params) {
  try {
    const { userId } = await verifyApiKey();
    const { providerId, toolName } = await params;
    const apiTool = await getApiTool(userId, providerId, toolName);
    return successResult(apiTool, 200, '获取API工具成功');
  } catch (err) {
    return handleRouteError(err);
  }
}
