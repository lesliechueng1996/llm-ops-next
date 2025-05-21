/**
 * 文件上传服务
 *
 * 该模块提供了与腾讯云 COS（对象存储）相关的文件上传功能。
 * 主要功能包括：
 * 1. 生成临时上传凭证
 * 2. 验证文件格式和大小
 * 3. 生成唯一的文件存储路径
 */

import { BadRequestException } from '@/exceptions';
import { ALLOWED_IMAGE_EXTENSIONS, ALLOWED_IMAGE_SIZE } from '@/lib/entity';
import { format } from 'date-fns';
import { nanoid } from 'nanoid';
import { getCredential } from 'qcloud-cos-sts';

/**
 * 生成唯一的文件存储路径
 * @param ext - 文件扩展名
 * @returns 格式为 'yyyyMMdd/uniqueId.ext' 的文件路径
 */
const generateFileKey = (ext: string) => {
  const date = format(new Date(), 'yyyyMMdd');
  return `${date}/${nanoid()}.${ext}`;
};

/**
 * 获取腾讯云 COS 的临时上传凭证
 * @param fileKey - 文件存储路径
 * @returns 包含临时密钥信息的对象
 */
const getTempCredential = async (fileKey: string) => {
  const bucketName = process.env.TENCENT_COS_BUCKET ?? '';
  const appId = bucketName.substring(1 + bucketName.lastIndexOf('-'));

  const credential = await getCredential({
    secretId: process.env.TENCENT_COS_SECRET_ID ?? '',
    secretKey: process.env.TENCENT_COS_SECRET_KEY ?? '',
    policy: {
      version: '2.0',
      statement: [
        {
          action: ['name/cos:PutObject'],
          effect: 'allow',
          principal: { qcs: ['*'] },
          resource: [
            `qcs::cos:${process.env.TENCENT_COS_REGION ?? ''}:uid/${appId}:${bucketName}/${fileKey}`,
          ],
        },
      ],
    },
  });

  return {
    tmpSecretId: credential.credentials.tmpSecretId,
    tmpSecretKey: credential.credentials.tmpSecretKey,
    sessionToken: credential.credentials.sessionToken,
    startTime: credential.startTime,
    expiredTime: credential.expiredTime,
  };
};

/**
 * 获取文件上传所需的临时凭证和配置信息
 *
 * @param fileName - 原始文件名
 * @param fileSize - 文件大小（字节）
 * @returns 包含上传凭证、文件路径和存储桶信息的对象
 * @throws BadRequestException 当文件格式不正确或大小超过限制时
 */
export const getUploadFileTempCredential = async (
  fileName: string,
  fileSize: number,
) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (!ext) {
    throw new BadRequestException('文件格式不正确');
  }

  if (ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
    if (fileSize > ALLOWED_IMAGE_SIZE) {
      throw new BadRequestException('图片大小超过限制');
    }

    const fileKey = generateFileKey(ext);
    const credential = await getTempCredential(fileKey);

    return {
      credential,
      key: fileKey,
      bucket: {
        schema: process.env.TENCENT_COS_SCHEMA ?? '',
        name: process.env.TENCENT_COS_BUCKET ?? '',
        region: process.env.TENCENT_COS_REGION ?? '',
      },
    };
  }

  throw new BadRequestException('文件格式错误');
};
