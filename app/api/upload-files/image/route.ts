/**
 * 图片上传 API 路由处理程序
 *
 * 此路由处理图片文件的上传请求，支持以下功能：
 * - 验证 API 密钥
 * - 验证文件大小（最大 15MB）
 * - 验证文件类型（支持 PNG、JPG、JPEG、GIF、WEBP、SVG）
 * - 上传文件并返回可访问的 URL
 */

import { BadRequestException } from '@/exceptions';
import { verifyApiKey } from '@/lib/auth/dal';
import { handleRouteError, successResult } from '@/lib/route-common';
import { getFileUrl, uploadFile } from '@/services/upload-file';

// 支持的图片文件扩展名列表
const SUPPORTED_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'];

/**
 * @swagger
 * /api/upload-files/image:
 *   post:
 *     tags:
 *       - Upload Files
 *     summary: 将图片上传到腾讯云cos
 *     description: 将图片上传到腾讯云 cos 对象存储中，该接口用于需要上传图片的模块，接口会返回图片的 URL 地址
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: 需要上传的图片文件，支持上传 jpg、jpeg、png、gif，最大不能超过 15 MB
 *     responses:
 *       201:
 *         description: 图片上传成功
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
 *                     imageUrl:
 *                       type: string
 *                       example: https://cdn.imooc.com/2024/05/14/218e5217-ab10-4634-9681-022867955f1b.png
 *                 message:
 *                   type: string
 *                   example: 图片上传成功
 */
export async function POST(request: Request) {
  try {
    // 验证 API 密钥
    await verifyApiKey();

    // 解析表单数据
    const formData = await request.formData();
    const files = formData.getAll('file');

    // 验证文件数量
    if (files.length !== 1) {
      throw new BadRequestException('图片上传失败，仅支持上传一个图片');
    }

    const file = files[0] as File;

    // 验证文件大小
    if (file.size > 15 * 1024 * 1024) {
      throw new BadRequestException('图片上传失败，图片大小不能超过 15 MB');
    }

    // 验证文件类型
    const fileExtension = file.name.split('.').pop() ?? '';
    if (!fileExtension || !SUPPORTED_IMAGE_EXTENSIONS.includes(fileExtension)) {
      throw new BadRequestException(
        '图片上传失败，仅支持上传 PNG、JPG、JPEG、GIF、WEBP、SVG 图片',
      );
    }

    // 上传文件并获取 URL
    const { key } = await uploadFile(file);
    const fileUrl = await getFileUrl(key);

    return successResult(
      {
        imageUrl: fileUrl,
      },
      201,
      '图片上传成功',
    );
  } catch (err) {
    return handleRouteError(err);
  }
}
