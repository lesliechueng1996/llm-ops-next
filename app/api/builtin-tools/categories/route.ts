/**
 * 内置插件分类相关的 API 路由
 * 该模块提供了获取插件分类列表的接口
 */

import { verifyApiKey } from '@/lib/auth/dal';
import { handleRouteError, successResult } from '@/lib/route-common';
import { getBuiltinToolCategories } from '@/services/builtin-tool';

/**
 * @swagger
 * /api/builtin-tools/categories:
 *   get:
 *     summary: 获取内置插件分类列表
 *     description: 用于获取插件广场页面中所有插件的分类信息，该接口不支持分页，会一次性返回所有信息
 *     tags:
 *       - Builtin Tools
 *     responses:
 *       200:
 *         description: 成功获取分类列表
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
 *                       category:
 *                         type: string
 *                         description: 分类英文唯一标识名
 *                         example: search
 *                       name:
 *                         type: string
 *                         description: 分类名称
 *                         example: 搜索
 *                       icon:
 *                         type: string
 *                         description: 插件分类的 icon 图标 url
 *                         example: https://llm-ops.com/icons/search.svg
 *                 message:
 *                   type: string
 *                   example: ""
 */
export async function GET() {
  try {
    await verifyApiKey();
    return successResult(getBuiltinToolCategories());
  } catch (error) {
    return handleRouteError(error);
  }
}
