/**
 * Redis 分布式锁实现
 *
 * 这个模块提供了基于 Redis 的分布式锁实现，支持锁的获取和释放操作。
 * 使用 Redis 的 SET NX 命令实现锁的获取，使用 Lua 脚本确保锁释放的原子性。
 *
 * 主要特性：
 * - 支持锁的自动过期（防止死锁）
 * - 支持获取锁时的重试机制
 * - 使用 Lua 脚本确保锁释放的原子性
 */

import { log } from '@/lib/logger';
import { redisClient } from '@/lib/redis';

/** 锁的默认过期时间（秒） */
const LOCK_EXPIRE_TIME_SECONDS = 600;
/** 获取锁时的默认重试时间（秒） */
const DEFAULT_RETRY_TIME_SECONDS = 30;

/**
 * 尝试获取分布式锁
 *
 * @param key - 锁的键名
 * @param value - 锁的值（通常使用唯一标识符，如 UUID）
 * @param expireTimeSeconds - 锁的过期时间（秒），默认 600 秒
 * @param retryTimeSeconds - 获取锁失败时的重试时间（秒），默认 30 秒
 * @returns 获取锁是否成功
 *
 * @example
 * const lockKey = 'my-lock';
 * const lockValue = uuid();
 * const acquired = await acquireLock(lockKey, lockValue);
 */
export const acquireLock = async (
  key: string,
  value: string,
  expireTimeSeconds = LOCK_EXPIRE_TIME_SECONDS,
  retryTimeSeconds = DEFAULT_RETRY_TIME_SECONDS,
) => {
  const startTime = Date.now();
  const endTime = startTime + retryTimeSeconds * 1000;

  while (true) {
    log.info('尝试获取锁, key: %s, value: %s', key, value);
    // 使用 SET NX 命令尝试获取锁，设置过期时间
    const result = await redisClient.set(
      key,
      value,
      'EX',
      expireTimeSeconds,
      'NX',
    );
    log.info('获取锁结果, key: %s, value: %s, result: %s', key, value, result);

    if (result === 'OK') {
      return true;
    }

    // 如果已经超过重试时间，则返回失败
    if (Date.now() >= endTime) {
      return false;
    }

    // 等待一小段时间后重试
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
};

/**
 * 释放分布式锁
 *
 * @param key - 锁的键名
 * @param value - 锁的值（必须与获取锁时使用的值相同）
 * @returns 释放锁是否成功
 *
 * @example
 * const lockKey = 'my-lock';
 * const lockValue = uuid();
 * const released = await releaseLock(lockKey, lockValue);
 */
export const releaseLock = async (key: string, value: string) => {
  // 使用 Lua 脚本来确保原子性操作
  // 只有当锁的值匹配时才删除锁，防止误删其他客户端获取的锁
  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;
  log.info('释放锁, key: %s, value: %s', key, value);
  const result = await redisClient.eval(script, 1, key, value);
  log.info('释放锁结果, key: %s, value: %s, result: %s', key, value, result);
  return result === 1;
};
