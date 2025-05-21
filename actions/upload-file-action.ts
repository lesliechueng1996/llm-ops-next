/**
 * 文件上传相关的服务器端操作
 * 该模块提供了生成文件上传临时凭证的服务器端操作
 * 使用 'use server' 指令确保这些操作在服务器端执行
 */

'use server';

import { authActionClient } from '@/lib/safe-action';
import { generateCredentialReqSchema } from '@/schemas/upload-file-schema';
import { getUploadFileTempCredential } from '@/services/upload-file';

/**
 * 生成文件上传临时凭证的服务器端操作
 *
 * @description
 * 该操作接收文件名和文件大小作为输入，返回用于文件上传的临时凭证
 * 使用 authActionClient 确保操作的安全性，并通过 schema 验证输入参数
 *
 * @param {Object} params - 输入参数对象
 * @param {string} params.fileName - 要上传的文件名
 * @param {number} params.fileSize - 文件大小（字节）
 * @returns {Promise<Object>} 包含上传凭证的对象
 */
export const generateCredentialAction = authActionClient
  .schema(generateCredentialReqSchema)
  .metadata({
    actionName: 'generateCredential',
  })
  .action(async ({ parsedInput: { fileName, fileSize } }) => {
    return getUploadFileTempCredential(fileName, fileSize);
  });
