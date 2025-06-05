/**
 * Redis 连接配置文件
 *
 * 该文件负责创建和管理与 Redis 服务器的连接。
 * 使用 ioredis 库实现，支持自动重连和错误处理。
 *
 * 环境变量配置：
 * - REDIS_HOST: Redis 服务器主机地址
 * - REDIS_PORT: Redis 服务器端口
 * - REDIS_QUEUE_DB: 队列使用的 Redis 数据库编号
 * - REDIS_DB: 默认使用的 Redis 数据库编号
 *
 * @module lib/redis
 */

import IORedis, { Redis } from 'ioredis';

/**
 * Redis 队列连接实例
 *
 * 用于处理队列相关的 Redis 操作，如任务队列、消息队列等。
 * 配置说明：
 * - maxRetriesPerRequest: 设置为 null 以禁用每个请求的最大重试次数限制
 * - 使用 REDIS_QUEUE_DB 作为数据库编号
 *
 * @type {IORedis}
 */
export const redisConnection = new IORedis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  db: Number(process.env.REDIS_QUEUE_DB),
  maxRetriesPerRequest: null,
});

/**
 * Redis 通用客户端实例
 *
 * 用于处理常规的 Redis 操作，如缓存、会话存储等。
 * 使用 REDIS_DB 作为数据库编号。
 *
 * @type {Redis}
 */
export const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  db: Number(process.env.REDIS_DB),
});
