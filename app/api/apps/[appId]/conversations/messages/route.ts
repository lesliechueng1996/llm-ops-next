/**
 * 应用会话消息管理 API
 *
 * 该模块提供了获取应用调试会话消息列表的功能，支持基于时间戳的分页查询。
 * 主要用于调试和监控 AI 应用的会话历史记录。
 *
 * @fileoverview 应用会话消息路由处理
 * @author LLM Ops Team
 * @version 1.0.0
 */

import { verifyApiKey } from '@/lib/auth/dal';
import { handleRouteError, successResult } from '@/lib/route-common';
import { getConversationMessagesReqSchema } from '@/schemas/app-schema';
import { getConversationMessagesByPage } from '@/services/app';
import { createLoader, parseAsInteger } from 'nuqs/server';

/**
 * 路由参数类型定义
 * 包含应用 ID 参数，用于标识要查询的应用
 */
type Params = {
  params: Promise<{
    appId: string;
  }>;
};

/**
 * 消息分页查询参数加载器
 * 用于解析和验证 URL 查询参数
 *
 * @param createdAt - 分页起点时间戳游标，用于避免数据重复加载
 * @param currentPage - 当前页数，默认为 1
 * @param pageSize - 每页数据条数，默认为 10
 */
const loadMessagesPageReqParams = createLoader({
  createdAt: parseAsInteger,
  currentPage: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(10),
});

/**
 * @swagger
 * /api/apps/{appId}/conversations/messages:
 *   get:
 *     tags:
 *       - Apps
 *     summary: 获取应用的调试会话消息列表
 *     description: 该接口用于获取指定应用的调试会话记录，该接口支持分页，数据会按照创建时间进行倒序。
 *     parameters:
 *       - in: path
 *         name: appId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 需要获取的应用 id，类型为 uuid
 *       - in: query
 *         name: createdAt
 *         schema:
 *           type: integer
 *         description: 可选参数，分页的起点时间戳游标，如果没有传递则以最新消息时间为准，避免数据重复加载，如果传递了该数据，会使用该数据的时间作为游标起点进行数据检索
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
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             description: 会话消息 id，类型为 uuid
 *                           conversationId:
 *                             type: string
 *                             format: uuid
 *                             description: 消息关联的会话 id，类型为 uuid
 *                           query:
 *                             type: string
 *                             description: 人类提出的问题/查询，类型为字符串
 *                           answer:
 *                             type: string
 *                             description: AI 生成的最终答案，类型为字符串
 *                           totalTokenCount:
 *                             type: integer
 *                             description: 消息消耗的总 token 数，类型为整型
 *                           latency:
 *                             type: number
 *                             format: float
 *                             description: 该条消息响应的时间，类型为浮点型
 *                           agentThoughts:
 *                             type: array
 *                             description: Agent 智能体产生该条消息的推理中间步骤，类型为字典列表，数据会按照 position 字典进行增序排序，一次性返回所有的推理列表
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                   format: uuid
 *                                   description: 推理步骤对应的 id，类型为字符串
 *                                 position:
 *                                   type: integer
 *                                   description: 推理步骤所在的位置，类型为整型
 *                                 event:
 *                                   type: string
 *                                   description: 推理事件的类型，类型为字符串
 *                                 thought:
 *                                   type: string
 *                                   description: 推理内容，类型为字符串，一般是 LLM 生成的工具调用参数
 *                                 observation:
 *                                   type: string
 *                                   description: 观察内容，类型为字符串，一般是工具调用/知识库检索得到的内容
 *                                 tool:
 *                                   type: string
 *                                   description: 调用的工具名称，类型为字符串
 *                                 toolInput:
 *                                   type: object
 *                                   description: 调用工具的工具参数，类型为字典
 *                                 latency:
 *                                   type: integer
 *                                   description: 该推理步骤的响应耗时，类型为整型
 *                                 createdAt:
 *                                   type: integer
 *                                   description: 该推理步骤的创建时间，类型为整型
 *                           createdAt:
 *                             type: integer
 *                             description: 消息的创建时间戳，类型为整型
 *                     paginator:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                           description: 当前页数
 *                         pageSize:
 *                           type: integer
 *                           description: 每页的数据条数
 *                         totalPage:
 *                           type: integer
 *                           description: 总页数
 *                         totalRecord:
 *                           type: integer
 *                           description: 总记录条数
 *                 message:
 *                   type: string
 *                   example: 获取消息列表成功
 */
export async function GET(request: Request, { params }: Params) {
  try {
    // 并行执行 API 密钥验证和参数解析，提高性能
    const [{ userId }, { appId }] = await Promise.all([verifyApiKey(), params]);

    // 解析和验证查询参数
    const query = getConversationMessagesReqSchema.parse(
      loadMessagesPageReqParams(request),
    );

    // 调用服务层获取分页消息数据
    const result = await getConversationMessagesByPage(appId, userId, query);

    // 返回成功响应
    return successResult(result, 200, '获取消息列表成功');
  } catch (error) {
    // 统一错误处理，返回标准化的错误响应
    return handleRouteError(error);
  }
}
