import pino from 'pino';
import { format } from 'date-fns';

// 检查是否在浏览器环境中运行
const isBrowser = typeof window !== 'undefined';

// 创建基础配置
const baseConfig = {
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  timestamp: () => `,"time":"${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}"`,
  formatters: {
    level: (label: string) => {
      return { level: label };
    },
  },
};

// 在服务器端使用简单的配置，在浏览器端使用基础配置
const logger = isBrowser
  ? pino({
      ...baseConfig,
      browser: {
        asObject: true,
      },
    })
  : pino(baseConfig);

// 导出常用的日志级别方法
export const log = {
  debug: (message: string, ...args: unknown[]) =>
    logger.debug(message, ...args),
  info: (message: string, ...args: unknown[]) => logger.info(message, ...args),
  warn: (message: string, ...args: unknown[]) => logger.warn(message, ...args),
  error: (message: string, ...args: unknown[]) =>
    logger.error(message, ...args),
  fatal: (message: string, ...args: unknown[]) =>
    logger.fatal(message, ...args),
};
