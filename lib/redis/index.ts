/**
 * Redis 连接配置文件
 *
 * 该文件负责创建和管理与 Redis 服务器的连接。
 * 使用 ioredis 库实现，支持自动重连和错误处理。
 *
 * @module lib/redis
 */

import IORedis from 'ioredis';

/**
 * Redis 连接实例
 *
 * 创建一个新的 Redis 连接，使用环境变量进行配置：
 * - REDIS_HOST: Redis 服务器主机地址
 * - REDIS_PORT: Redis 服务器端口
 * - REDIS_QUEUE_DB: 使用的 Redis 数据库编号
 *
 * 配置说明：
 * - maxRetriesPerRequest: 设置为 null 以禁用每个请求的最大重试次数限制
 */
export const redisConnection = new IORedis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  db: Number(process.env.REDIS_QUEUE_DB),
  maxRetriesPerRequest: null,
});
