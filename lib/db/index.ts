/**
 * 数据库连接配置
 *
 * 使用 Drizzle ORM 配置 PostgreSQL 数据库连接。
 * 从环境变量中读取数据库连接 URL。
 *
 * 该模块实现了以下功能：
 * 1. 创建全局数据库连接实例
 * 2. 在开发环境中保持连接实例
 * 3. 提供统一的数据库访问接口
 */

import { type BunSQLDatabase, drizzle } from 'drizzle-orm/bun-sql';

// 定义全局类型，用于存储数据库连接实例
const globalForDrizzle = global as unknown as {
  drizzleClient: BunSQLDatabase;
};

// 初始化数据库连接
// 如果全局实例存在则复用，否则创建新连接
const db =
  globalForDrizzle.drizzleClient ||
  drizzle({
    connection: process.env.DATABASE_URL || '', // 从环境变量获取数据库连接 URL
    logger: false, // 启用 SQL 查询日志
  });

// 在非生产环境中，将数据库连接实例保存到全局对象
// 这样可以避免在开发时重复创建连接
if (process.env.NODE_ENV !== 'production') globalForDrizzle.drizzleClient = db;

export { db };
