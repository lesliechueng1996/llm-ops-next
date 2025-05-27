/**
 * 文件上传服务
 * 提供文件上传相关的数据库操作功能
 */

import { db } from '@/lib/db';
import { uploadFile } from '@/lib/db/schema';

/**
 * 保存上传文件的信息到数据库
 * @param data - 文件元数据
 * @param data.name - 文件名
 * @param data.key - 文件唯一标识符
 * @param data.size - 文件大小（字节）
 * @param data.extension - 文件扩展名
 * @param data.mimeType - 文件MIME类型
 * @param data.hash - 文件哈希值
 * @param userId - 上传用户的ID
 * @returns 保存后的文件记录
 */
export const saveUploadFile = async (
  data: {
    name: string;
    key: string;
    size: number;
    extension: string;
    mimeType: string;
    hash: string;
  },
  userId: string,
) => {
  // 将文件信息插入数据库并返回插入的记录
  const result = await db
    .insert(uploadFile)
    .values({
      ...data,
      userId,
    })
    .returning();

  return result[0];
};
