/**
 * 日志工具模块
 *
 * 这个模块提供了一个统一的日志记录接口，使用 pino 作为底层日志库。
 * 支持在浏览器和服务器端环境下的日志记录，并提供了不同级别的日志方法。
 *
 * 特点：
 * - 自动检测运行环境（浏览器/服务器）
 * - 根据环境自动选择合适的配置
 * - 提供统一的日志接口（debug, info, warn, error, fatal）
 * - 支持格式化时间戳
 */

import { format } from 'date-fns';
import pino from 'pino';

// 检查是否在浏览器环境中运行
const isBrowser = typeof window !== 'undefined';

// 创建基础配置
const baseConfig = {
  // 在生产环境下使用 info 级别，其他环境使用 debug 级别
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  // 自定义时间戳格式
  timestamp: () => `,"time":"${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}"`,
  // 自定义日志级别格式化
  formatters: {
    level: (label: string) => {
      return { level: label };
    },
  },
};

// 根据运行环境选择不同的配置
// 浏览器环境：添加 browser 配置，启用 asObject 模式
// 服务器环境：使用基础配置
const logger = isBrowser
  ? pino({
      ...baseConfig,
      browser: {
        asObject: true,
      },
    })
  : pino(baseConfig);

/**
 * 日志记录接口
 * 提供不同级别的日志记录方法：
 * - debug: 调试信息
 * - info: 一般信息
 * - warn: 警告信息
 * - error: 错误信息
 * - fatal: 致命错误信息
 */
export const log = logger;
