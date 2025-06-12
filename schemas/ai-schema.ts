import z from 'zod';

export const optimizePromptReqSchema = z.object({
  prompt: z
    .string()
    .min(1, '提示词不能为空')
    .max(2000, '提示词不能超过2000个字符'),
});

export const suggestedQuestionsReqSchema = z.object({
  messageId: z.string().uuid('messageId格式错误'),
});
