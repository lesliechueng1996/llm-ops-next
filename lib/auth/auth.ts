/**
 * 认证配置
 *
 * 使用 better-auth 库配置应用的认证系统。
 * 支持数据库存储、API Key 认证、邮箱和密码认证、和 GitHub OAuth 登录。
 */

import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { apiKey } from 'better-auth/plugins';

// 初始化认证系统
export const auth = betterAuth({
  // 配置邮箱和密码认证
  emailAndPassword: {
    enabled: true,
  },
  // 配置数据库适配器
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  // 启用 API Key 认证插件
  plugins: [apiKey()],
  // 配置社交登录提供商
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    },
  },
});
