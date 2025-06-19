/**
 * 应用调试对话 API 路由
 *
 * 该文件实现了 AI 应用的调试对话功能，允许用户在编排 AI 应用时进行实时调试。
 * 通过流式事件响应，可以实时观察 Agent 的执行过程，包括推理、工具调用、知识库检索等步骤。
 *
 * 主要功能：
 * - 验证 API 密钥和用户身份
 * - 解析请求参数
 * - 创建流式响应
 * - 调用调试聊天服务
 * - 错误处理
 */

import { verifyApiKey } from '@/lib/auth/dal';
import { handleRouteError } from '@/lib/route-common';
import { appConversationReqSchema } from '@/schemas/app-schema';
import { debugChat } from '@/services/app';

/**
 * 路由参数类型定义
 * 包含应用 ID 参数，用于标识要调试的 AI 应用
 */
type Params = { params: Promise<{ appId: string }> };

/**
 * @swagger
 * /api/apps/{appId}/conversations:
 *   post:
 *     tags:
 *       - Apps
 *     summary: 应用调试对话
 *     description: 用于在编排 AI 应用时进行 debug 调试，在后端会根据草稿配置创建特定的 Agent 从而执行对应的调试信息，该接口为流式事件响应，会逐个输出 Agent 在运行过程中调用的步骤，涵盖：长期记忆召回、知识库检索、智能体推理/观察、工具调用、LLM消息生成、审核、结束响应等，该接口并非最终版，会随着后续多 LLM 以及多模态 LLM 的接入进行不断扩展。
 *     parameters:
 *       - in: path
 *         name: appId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 需要调试的 AI 应用 id，格式为 uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: 用户发起的提问信息
 *                 example: "能详细讲解下LLM是什么吗？"
 *     responses:
 *       200:
 *         description: 流式事件响应成功
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: object
 *               properties:
 *                 event:
 *                   type: string
 *                   description: 流式事件的名称，例如：agent_thought(Agent推理)、agent_message(Agent消息)、agent_action(Agent行动/执行工具)、dataset_retrieval(知识库检索)、done(流式事件停止) 等
 *                   example: "agent_message"
 *                 data:
 *                   type: object
 *                   description: 流式事件数据，记录当前传递的事件的相关信息
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       description: 当前观察/Agent 步骤记录的 id，如果传递的多次流式事件属于同一个步骤则 id 一致，格式为 uuid
 *                       example: "1550b71a-1444-47ed-a59d-c2f080fbae94"
 *                     conversation_id:
 *                       type: string
 *                       format: uuid
 *                       description: 该次流式事件/Agent 步骤归属的会话 id，类型为 uuid
 *                       example: "2d7d3e3f-95c9-4d9d-ba9c-9daaf09cc8a8"
 *                     message_id:
 *                       type: string
 *                       format: uuid
 *                       description: 该次流式事件/Agent 步骤归属的消息 id，类型为 uuid
 *                     task_id:
 *                       type: string
 *                       format: uuid
 *                       description: 该次流式事件归属的任务 id，该参数用于中断指定的流式事件，当执行该子线程的时候，会在缓存中添加对应的 key，中断流式响应时，会在缓存中删除该 key，从而结束整个流式事件响应
 *                       example: "5e7834dc-bbca-4ee5-9591-8f297f5acded"
 *                     thought:
 *                       type: string
 *                       description: Agent 在当前流式事件下的推理内容，类型为字符串
 *                       example: ""
 *                     observation:
 *                       type: string
 *                       description: Agent 观察的内容，一般是工具执行后的结果、知识库的检索结果，类型是字符串，该字段并非最终字段，后续会随着插件功能的集成增多进行相应的调整
 *                       example: ""
 *                     answer:
 *                       type: string
 *                       description: Agent 返回的文本答案输出，类型为字符串
 *                       example: "LLM 即 Large Language Model，大语言模型，是一种基于深度学习的自然语言处理模型，具有很高的语言理解和生成能力，能够处理各式各样的自然语言任务，例如文本生成、问答、翻译、摘要等。它通过在大量的文本数据上进行训练，学习到语言的模式、结构和语义知识。"
 *                     latency:
 *                       type: number
 *                       format: float
 *                       description: 步骤的执行耗时，单位为毫秒，类型为浮点型
 *                       example: 8541
 *                     created_at:
 *                       type: integer
 *                       description: 消息记录创建的时间戳，类型为整型
 *                       example: 1714053834
 */
export async function POST(request: Request, { params }: Params) {
  try {
    // 并行执行：验证 API 密钥、获取路由参数、解析请求体
    const [{ userId }, { appId }, body] = await Promise.all([
      verifyApiKey(),
      params,
      request.json(),
    ]);

    // 验证并解析请求体中的查询参数
    const { query } = appConversationReqSchema.parse(body);

    // 创建流式响应通道
    // TransformStream 用于创建可读和可写的流，实现服务器发送事件（SSE）
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    // 调用调试聊天服务，开始处理用户查询
    // 该服务会异步写入流式事件到 writer
    debugChat(appId, userId, query, writer);

    // 返回流式响应，设置适当的 HTTP 头
    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    // 统一错误处理，返回适当的 HTTP 错误响应
    return handleRouteError(error);
  }
}
