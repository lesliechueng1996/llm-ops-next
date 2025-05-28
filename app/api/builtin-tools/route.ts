/**
 * 内置工具 API 路由模块
 *
 * 该模块提供了获取 LLMOps 项目中所有内置插件列表的 API 接口。
 * 主要用于插件广场和 AI 应用编排页面，提供完整的工具提供商和工具信息。
 */

import { verifyApiKey } from '@/lib/auth/dal';
import { handleRouteError, successResult } from '@/lib/route-common';
import { getBuiltinTools } from '@/services/builtin-tool';

/**
 * @swagger
 * /api/builtin-tools:
 *   get:
 *     summary: 获取所有内置插件列表信息
 *     description: 获取 LLMOps 项目中所有内置插件列表信息，该接口会一次性获取所有提供商/工具，无分页，适用于 `插件广场` 与 `AI应用编排` 页面。
 *     tags:
 *       - Builtin Tools
 *     responses:
 *       200:
 *         description: 成功获取内置工具列表
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
 *                       name:
 *                         type: string
 *                         description: 提供商的名称
 *                       label:
 *                         type: string
 *                         description: 提供商对应的标签
 *                       description:
 *                         type: string
 *                         description: 提供商对应的描述信息
 *                       category:
 *                         type: string
 *                         description: 提供商对应的分类
 *                       icon:
 *                         type: string
 *                         description: 提供商 icon 图标
 *                       background:
 *                         type: string
 *                         description: 提供商 icon 图标的背景
 *                       tools:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                               description: 工具的名字
 *                             label:
 *                               type: string
 *                               description: 工具的标签
 *                             description:
 *                               type: string
 *                               description: 工具的描述
 *                             inputs:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   name:
 *                                     type: string
 *                                     description: 参数的名字
 *                                   description:
 *                                     type: string
 *                                     description: 参数的描述
 *                                   required:
 *                                     type: boolean
 *                                     description: 参数是否必填
 *                                   type:
 *                                     type: string
 *                                     description: 参数的类型
 *                             params:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   name:
 *                                     type: string
 *                                     description: 参数的名字
 *                                   label:
 *                                     type: string
 *                                     description: 参数对应的标签
 *                                   type:
 *                                     type: string
 *                                     description: 参数的类型
 *                                   required:
 *                                     type: boolean
 *                                     description: 参数是否必填
 *                                   default:
 *                                     type: any
 *                                     description: 参数的默认值
 *                                   min:
 *                                     type: number
 *                                     description: 参数的最小值
 *                                   max:
 *                                     type: number
 *                                     description: 参数的最大值
 *                                   help:
 *                                     type: string
 *                                     description: 参数的帮助信息
 *                                   options:
 *                                     type: array
 *                                     items:
 *                                       type: object
 *                                       properties:
 *                                         value:
 *                                           type: string
 *                                           description: 下拉菜单对应的值
 *                                         label:
 *                                           type: string
 *                                           description: 下拉菜单对应的标签
 *                       createdAt:
 *                         type: integer
 *                         description: 创建/发布该服务商插件的时间戳
 *                 message:
 *                   type: string
 *                   example: ""
 */
export async function GET() {
  try {
    await verifyApiKey();
    return successResult(getBuiltinTools());
  } catch (error) {
    return handleRouteError(error);
  }
}
