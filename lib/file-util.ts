/**
 * 文件操作工具函数
 * 提供临时文件创建、使用和清理的功能
 */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { log } from '@/lib/logger';

/**
 * 创建一个临时文件，执行回调函数，并在完成后自动清理临时文件
 *
 * @template T 回调函数的返回类型
 * @param fileKey - 临时文件的唯一标识符
 * @param callback - 接收临时文件路径并执行的回调函数
 * @returns Promise<T> - 回调函数的执行结果
 *
 * @example
 * ```typescript
 * const result = await withTempFile('my-temp-file.txt', async (filePath) => {
 *   await fs.writeFile(filePath, 'Hello World');
 *   return await processFile(filePath);
 * });
 * ```
 */
export const withTempFile = async <T>(
  fileKey: string,
  callback: (filePath: string) => Promise<T>,
) => {
  let tempFilePath = '';
  try {
    // 在系统临时目录中创建临时文件路径
    tempFilePath = path.join(os.tmpdir(), fileKey);

    // 确保临时文件所在的目录存在
    const tempDir = path.dirname(tempFilePath);
    await fs.mkdir(tempDir, { recursive: true });

    log.info('临时文件: %s', tempFilePath);
    return await callback(tempFilePath);
  } catch (error) {
    // 记录错误并重新抛出
    log.error('处理临时文件失败: %o', error);
    throw error;
  } finally {
    // 无论执行成功与否，都确保清理临时文件
    if (tempFilePath) {
      await fs.rm(tempFilePath);
      log.info('删除临时文件: %s', tempFilePath);
    }
  }
};
