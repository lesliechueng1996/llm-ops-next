/**
 * 内置工具详情 API 路由
 * 提供获取指定工具详细信息的功能
 */

import { verifyApiKey } from '@/lib/auth/dal';
import { handleRouteError, successResult } from '@/lib/route-common';
import { getBuiltinToolInfo } from '@/services/builtin-tool';

type Params = { params: Promise<{ provider: string; tool: string }> };

/**
 * @swagger
 * /api/builtin-tools/{provider}/tools/{tool}:
 *   get:
 *     summary: 获取指定工具的信息
 *     description: 根据传递的提供商名称和工具名称获取对应工具信息详情，该接口用于在 AI 应用编排页面，点击工具设置时进行相应的展示
 *     tags:
 *       - Builtin Tools
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *         description: 服务提供商对应的名字，例如 google、dalle 等
 *       - in: path
 *         name: tool
 *         required: true
 *         schema:
 *           type: string
 *         description: 工具的名称，例如 google_serper、dalle3 等
 *     responses:
 *       200:
 *         description: 成功获取工具信息
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
 *                     provider:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           description: 提供商的名称
 *                         label:
 *                           type: string
 *                           description: 提供商对应的标签
 *                         description:
 *                           type: string
 *                           description: 提供商对应的描述信息
 *                         category:
 *                           type: string
 *                           description: 提供商对应的分类
 *                         background:
 *                           type: string
 *                           description: 提供商 icon 图标的背景
 *                         icon:
 *                           type: string
 *                           description: 提供商 icon 图标
 *                     name:
 *                       type: string
 *                       description: 工具的名字
 *                     label:
 *                       type: string
 *                       description: 工具的标签
 *                     description:
 *                       type: string
 *                       description: 工具的描述
 *                     inputs:
 *                       type: array
 *                       description: 大语言模型调用对应的参数，如果没有则为空列表
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             description: 参数的名字
 *                           description:
 *                             type: string
 *                             description: 参数的描述
 *                           required:
 *                             type: boolean
 *                             description: 参数是否必填
 *                           type:
 *                             type: string
 *                             description: 参数的类型
 *                     params:
 *                       type: array
 *                       description: 工具设置对应的参数列表信息，如果没有则为空
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             description: 参数的名字
 *                           label:
 *                             type: string
 *                             description: 参数对应的标签
 *                           type:
 *                             type: string
 *                             description: 参数的类型，涵盖了 string、number、boolean、select
 *                           required:
 *                             type: boolean
 *                             description: 参数是否必填
 *                           default:
 *                             type: any
 *                             description: 参数的默认值，如果没有默认值则为 null
 *                           min:
 *                             type: number
 *                             description: 参数的最小值，如果不需要则为 null
 *                           max:
 *                             type: number
 *                             description: 参数的最大值，如果不需要则为 null
 *                           help:
 *                             type: string
 *                             description: 参数的帮助信息，如果没有则为 null 或者空字符串
 *                           options:
 *                             type: array
 *                             description: 类型为下拉列表时需要配置的选项
 *                             items:
 *                               type: object
 *                               properties:
 *                                 value:
 *                                   type: string
 *                                   description: 下拉菜单对应的值
 *                                 label:
 *                                   type: string
 *                                   description: 下拉菜单对应的标签
 *                     createdAt:
 *                       type: integer
 *                       description: 工具的创建时间
 *                 message:
 *                   type: string
 *                   example: ""
 */
export async function GET(_: Request, { params }: Params) {
  try {
    await verifyApiKey();
    const { provider, tool } = await params;
    const toolInfo = getBuiltinToolInfo(provider, tool);
    return successResult(toolInfo);
  } catch (err) {
    return handleRouteError(err);
  }
}
