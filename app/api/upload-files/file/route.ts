/**
 * 文件上传相关的 API 路由
 * 提供将文件上传到腾讯云对象存储的功能
 */

import { BadRequestException } from '@/exceptions';
import { verifyApiKey } from '@/lib/auth/dal';
import { handleRouteError, successResult } from '@/lib/route-common';
import { saveUploadFile, uploadFile } from '@/services/upload-file';

const SUPPORTED_FILE_EXTENSIONS = [
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
];

/**
 * @swagger
 * /api/upload-files/file:
 *   post:
 *     tags:
 *       - Upload Files
 *     summary: 将文件上传到腾讯云对象存储
 *     description: 该接口主要用于上传文件，调用接口后返回对应的文件 id、名字、云端位置等信息，主要用于知识库、工具、多模态应用对话
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: 需要上传的文件，最多支持上传一个文件，最大支持的文件不能超过 15 MB
 *     responses:
 *       200:
 *         description: 上传成功
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
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       description: 上传文件的引用 id，类型为 uuid，在知识库模块、应用对话模块会使用该引用文件 id
 *                       example: 46db30d1-3199-4e79-a0cd-abf12fa6858f
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                       description: 该文件所归属的账号 id，用于标记是哪个账号上传了该文件
 *                       example: e1baf52a-1be2-4b93-ad62-6fad72f1ec37
 *                     name:
 *                       type: string
 *                       description: 原始文件名字
 *                       example: 项目API文档.md
 *                     key:
 *                       type: string
 *                       description: 云端文件对应的 key 或者路径
 *                       example: 2024/05/14/218e5217-ab10-4634-9681-022867955f1b.md
 *                     size:
 *                       type: integer
 *                       description: 文件大小，单位为字节
 *                       example: 30241
 *                     extension:
 *                       type: string
 *                       description: 文件的扩展名，例如 .md
 *                       example: .md
 *                     mime_type:
 *                       type: string
 *                       description: 文件 mime-type 类型推断
 *                       example: txt
 *                     created_at:
 *                       type: integer
 *                       description: 文件的创建时间戳
 *                       example: 1721460914
 *                 message:
 *                   type: string
 *                   example: 上传文件成功
 */
export async function POST(request: Request) {
  try {
    const { userId } = await verifyApiKey();
    const formData = await request.formData();
    const files = formData.getAll('file');
    if (files.length !== 1) {
      throw new BadRequestException('文件上传失败，仅支持上传一个文件');
    }

    const file = files[0] as File;
    if (file.size > 15 * 1024 * 1024) {
      throw new BadRequestException('文件上传失败，文件大小不能超过 15 MB');
    }

    let fileTypeValid = false;
    if (file.type.startsWith('text/')) {
      fileTypeValid = true;
    }
    const fileExtension = file.name.split('.').pop() ?? '';
    if (fileExtension && SUPPORTED_FILE_EXTENSIONS.includes(fileExtension)) {
      fileTypeValid = true;
    }

    if (!fileTypeValid) {
      throw new BadRequestException(
        '文件上传失败，仅支持上传 PDF、DOC、DOCX、XLS、XLSX、PPT、PPTX 及文本文件',
      );
    }

    const uploadResult = await uploadFile(file);
    const uploadFileRecord = await saveUploadFile(uploadResult, userId);

    return successResult(
      {
        id: uploadFileRecord.id,
        userId: uploadFileRecord.userId,
        name: uploadFileRecord.name,
        key: uploadFileRecord.key,
        size: uploadFileRecord.size,
        extension: uploadFileRecord.extension,
        mimeType: uploadFileRecord.mimeType,
        createdAt: uploadFileRecord.createdAt.getTime(),
      },
      201,
      '文件上传成功',
    );
  } catch (err) {
    return handleRouteError(err);
  }
}
