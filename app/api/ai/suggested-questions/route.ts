/**
 * 建议问题 API 路由
 *
 * 该模块提供了根据消息 ID 生成建议问题的 API 端点。
 * 主要用于在对话界面中为用户提供相关的后续问题建议，
 * 提升用户体验和对话的连贯性。
 *
 * @fileoverview 建议问题生成 API 路由处理
 * @author LLM Ops Team
 * @version 1.0.0
 */

import { verifyApiKey } from '@/lib/auth/dal';
import { handleRouteError, successResult } from '@/lib/route-common';
import { suggestedQuestionsReqSchema } from '@/schemas/ai-schema';
import { generateSuggestedQuestions } from '@/services/ai';

/**
 * @swagger
 * /api/ai/suggested-questions:
 *   post:
 *     tags:
 *       - AI
 *     summary: 根据传递的消息id获取建议问题列表
 *     description: 该接口接收指定的消息 id 与其他数据，然后根据该消息 id 获取建议问题列表（最多不会超过 3 个），该接口会在后端校验该消息的归属账号信息，在 Debug 或者 WebApp 端均可以使用，开放 API 处没有开放该接口。
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messageId
 *             properties:
 *               messageId:
 *                 type: string
 *                 format: uuid
 *                 description: 消息会话归属的消息 id
 *                 example: "d400cec0-892f-49ab-8f72-821b88c1aaa9"
 *     responses:
 *       200:
 *         description: 获取建议问题成功
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
 *                     type: string
 *                   description: 建议问题列表字符串，最多不超过 3 个建议问题
 *                   example: ["你能做什么？", "你叫什么名字？", "怎么联系你？"]
 *                 message:
 *                   type: string
 *                   example: 获取建议问题成功
 */
export async function POST(request: Request) {
  try {
    // 并行处理 API 密钥验证和请求体解析，提高性能
    const [{ userId }, body] = await Promise.all([
      verifyApiKey(), // 验证 API 密钥并获取用户 ID
      request.json(), // 解析请求体 JSON 数据
    ]);

    // 验证请求参数，确保 messageId 符合 UUID 格式
    const { messageId } = suggestedQuestionsReqSchema.parse(body);

    // 调用 AI 服务生成建议问题，传入消息 ID 和用户 ID
    const suggestions = await generateSuggestedQuestions(messageId, userId);

    // 返回成功响应，包含建议问题列表
    return successResult(suggestions, 200, '获取建议问题成功');
  } catch (error) {
    // 统一错误处理，返回适当的 HTTP 状态码和错误信息
    return handleRouteError(error);
  }
}
