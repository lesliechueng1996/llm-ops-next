import { verifyApiKey } from '@/lib/auth/dal';
import { handleRouteError, iteratorToStream } from '@/lib/route-common';
import { optimizePromptReqSchema } from '@/schemas/ai-schema';
import { optimizePrompt } from '@/services/ai';

/**
 * @swagger
 * /api/ai/optimize-prompt:
 *   post:
 *     tags:
 *       - AI
 *     summary: 利用AI优化预设Prompt
 *     description: 传递原始 Prompt，在后端使用 GPT 模型对预设 Prompt 进行优化并输出，该接口为流式事件输出接口，事件为 optimizePrompt，数据为普通响应结构携带 optimizedPrompt 字段。
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: 原始 prompt，类型为字符串，长度不能超过 2000 个字符
 *                 maxLength: 2000
 *     responses:
 *       200:
 *         description: 优化成功
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: object
 *               properties:
 *                 event:
 *                   type: string
 *                   example: optimize_prompt
 *                 data:
 *                   type: object
 *                   properties:
 *                     optimizedPrompt:
 *                       type: string
 *                       description: 优化的 prompt 片段
 */
export async function POST(request: Request) {
  try {
    const [_, body] = await Promise.all([verifyApiKey(), request.json()]);
    const { prompt } = optimizePromptReqSchema.parse(body);
    const stream = iteratorToStream(await optimizePrompt(prompt));
    return new Response(stream);
  } catch (error) {
    return handleRouteError(error);
  }
}
