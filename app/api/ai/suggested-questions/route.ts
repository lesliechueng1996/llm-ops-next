import { verifyApiKey } from '@/lib/auth/dal';
import { handleRouteError } from '@/lib/route-common';
import { suggestedQuestionsReqSchema } from '@/schemas/ai-schema';

export async function POST(request: Request) {
  try {
    const [_, body] = await Promise.all([verifyApiKey(), request.json()]);
    const { messageId } = suggestedQuestionsReqSchema.parse(body);
    // TODO: 获取消息
    return new Response(null);
  } catch (error) {
    return handleRouteError(error);
  }
}
