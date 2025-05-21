/**
 * 文件上传凭证请求的验证模式
 * 用于验证生成文件上传凭证时所需的请求参数
 */
import { z } from 'zod';

export const generateCredentialReqSchema = z.object({
  // 文件名，必填字段
  fileName: z.string({ message: '文件名不可为空' }),
  // 文件大小，必须为正数
  fileSize: z.number().positive({ message: '文件大小必须为正数' }),
});
