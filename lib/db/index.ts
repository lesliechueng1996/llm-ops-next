/**
 * 数据库连接配置
 *
 * 使用 Drizzle ORM 配置 PostgreSQL 数据库连接。
 * 从环境变量中读取数据库连接 URL。
 */

import { drizzle } from 'drizzle-orm/bun-sql';

// 初始化数据库连接
export const db = drizzle({
  connection: process.env.DATABASE_URL || '',
  logger: true,
});
