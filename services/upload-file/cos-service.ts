/**
 * 文件上传服务
 *
 * 该模块提供了与腾讯云 COS（对象存储）相关的文件上传功能。
 * 主要功能包括：
 * 1. 生成临时上传凭证
 * 2. 验证文件格式和大小
 * 3. 生成唯一的文件存储路径
 * 4. 直接上传文件到 COS
 * 5. 获取文件访问 URL
 */

import { randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import fs from 'node:fs/promises';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@/exceptions';
import { ALLOWED_IMAGE_EXTENSIONS, ALLOWED_IMAGE_SIZE } from '@/lib/entity';
import { withTempFile } from '@/lib/file-util';
import { log } from '@/lib/logger';
import COS from 'cos-nodejs-sdk-v5';
import { format } from 'date-fns';
import { getCredential } from 'qcloud-cos-sts';

const cos = new COS({
  SecretId: process.env.TENCENT_COS_SECRET_ID ?? '',
  SecretKey: process.env.TENCENT_COS_SECRET_KEY ?? '',
  Protocol: (process.env.TENCENT_COS_SCHEMA ??
    'https') as COS.COSOptions['Protocol'],
});

/**
 * 生成唯一的文件存储路径
 * @param ext - 文件扩展名
 * @returns 格式为 'yyyyMMdd/uniqueId.ext' 的文件路径
 */
const generateFileKey = (ext: string) => {
  const date = format(new Date(), 'yyyyMMdd');
  return `${date}/${randomUUID()}.${ext}`;
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

/**
 * 直接上传文件到腾讯云 COS
 *
 * @param file - 要上传的文件对象
 * @returns 包含文件信息的对象，包括文件名、存储路径、大小、扩展名、MIME类型和文件哈希值
 * @throws InternalServerErrorException 当文件上传失败时
 */
export const uploadFile = async (file: File) => {
  const ext = file.name.split('.').pop() ?? '';
  const fileKey = generateFileKey(ext);

  return withTempFile(fileKey, async (tempFilePath) => {
    try {
      log.info('暂存文件到: %s', tempFilePath);
      // 使用 ArrayBuffer 或 Blob 数据
      const fileData = await file.arrayBuffer();
      await fs.writeFile(tempFilePath, Buffer.from(fileData));

      // 对中文文件名进行编码处理
      // const encodedOriginalname = Buffer.from(file.name, 'latin1').toString(
      //   'utf8',
      // );

      const uploadPromise = new Promise<COS.UploadFileResult>(
        (resolve, reject) => {
          cos.uploadFile(
            {
              Bucket: process.env.TENCENT_COS_BUCKET ?? '',
              Region: process.env.TENCENT_COS_REGION ?? '',
              Key: fileKey,
              FilePath: tempFilePath,
              onProgress: (progressData) => {
                log.info(
                  '上传进度: %d%',
                  Math.floor(progressData.percent * 100),
                );
              },
            },
            (err, data) => {
              if (err) {
                log.error('上传文件失败: %o', err);
                reject(err);
              } else {
                resolve(data);
              }
            },
          );
        },
      );

      const result = await uploadPromise;
      log.info('上传文件成功');

      return {
        name: file.name,
        key: fileKey,
        size: file.size,
        extension: ext,
        mimeType: file.type,
        hash: result.ETag,
      };
    } catch (error) {
      log.error('上传文件失败: %o', error);
      throw new InternalServerErrorException('上传文件失败');
    }
  });
};

/**
 * 获取文件的访问 URL
 *
 * @param key - 文件在 COS 中的存储路径
 * @returns 完整的文件访问 URL
 */
export const getFileUrl = async (key: string) => {
  let domain = process.env.TENCENT_COS_DOMAIN ?? '';
  if (!domain) {
    const schema = process.env.TENCENT_COS_SCHEMA ?? '';
    const region = process.env.TENCENT_COS_REGION ?? '';
    const bucket = process.env.TENCENT_COS_BUCKET ?? '';
    domain = `${schema}://${bucket}.cos.${region}.myqcloud.com`;
  }

  return `${domain}/${key}`;
};

/**
 * 从腾讯云 COS 下载文件到本地
 *
 * @param key - 文件在 COS 中的存储路径
 * @param filePath - 文件要保存到本地的路径
 * @returns Promise 对象，成功时返回下载的文件数据
 * @throws 当下载失败时抛出错误
 */
export const downloadFile = async (key: string, filePath: string) => {
  const bucket = process.env.TENCENT_COS_BUCKET ?? '';
  const region = process.env.TENCENT_COS_REGION ?? '';
  return new Promise((resolve, reject) => {
    cos.getObject(
      {
        Bucket: bucket,
        Region: region,
        Key: key,
        Output: createWriteStream(filePath),
      },
      (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      },
    );
  });
};
