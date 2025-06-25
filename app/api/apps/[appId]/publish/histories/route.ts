/**
 * 应用发布历史 API 路由
 *
 * 该模块提供了获取应用发布历史列表的 API 接口。
 * 支持分页查询，按版本号倒序排列，最新的发布配置会显示在前面。
 *
 * @fileoverview 应用发布历史管理接口
 * @author LLM Ops Team
 * @version 1.0.0
 */

import { verifyApiKey } from '@/lib/auth/dal';
import { loadPageReqParams } from '@/lib/paginator';
import { handleRouteError, successResult } from '@/lib/route-common';
import { getAppPublishHistoriesReqSchema } from '@/schemas/app-schema';
import { getAppPublishHistoriesByPage } from '@/services/app-config';

/**
 * 路由参数类型定义
 * 包含应用 ID 参数，用于标识要查询发布历史的具体应用
 */
type Params = {
  params: Promise<{
    appId: string; // 应用唯一标识符
  }>;
};

/**
 * @swagger
 * /api/apps/{appId}/publish/histories:
 *   get:
 *     tags:
 *       - Apps
 *     summary: 获取应用的发布历史列表
 *     description: 该接口用于获取某个应用的发布历史配置列表信息，该接口支持分页，数据依据 version 进行倒序排序，即发布配置越新，数据越靠前。
 *     parameters:
 *       - in: path
 *         name: appId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 需要获取发布历史的应用 id，类型为 uuid
 *       - in: query
 *         name: currentPage
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 可选参数，代表当前页数，默认为 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 50
 *         description: 可选参数，代表当前每页的数据条数，默认为 20，范围从 1~50
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
 *                       description: 历史配置版本列表，类型为字典列表
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             description: 历史配置版本 id，类型为 uuid
 *                           version:
 *                             type: integer
 *                             description: 版本号，类型为整型，数据从 1 开始递增
 *                           createdAt:
 *                             type: integer
 *                             description: 发布时间戳，类型为整型
 *                     paginator:
 *                       type: object
 *                       description: 分页字典信息
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
 *                   example: 获取应用发布历史成功
 */
export async function GET(request: Request, { params }: Params) {
  try {
    // 并行执行 API 密钥验证和参数解析，提高性能
    const [{ userId }, { appId }] = await Promise.all([
      verifyApiKey(), // 验证 API 密钥并获取用户 ID
      params, // 解析路由参数获取应用 ID
    ]);

    // 解析并验证查询参数（分页参数）
    const query = getAppPublishHistoriesReqSchema.parse(
      loadPageReqParams(request),
    );

    // 根据应用 ID、用户 ID 和查询参数获取分页的发布历史数据
    const histories = await getAppPublishHistoriesByPage(appId, userId, query);

    // 返回成功响应，包含发布历史数据和分页信息
    return successResult(histories, 200, '获取应用发布历史成功');
  } catch (error) {
    // 统一错误处理，返回标准化的错误响应
    return handleRouteError(error);
  }
}
