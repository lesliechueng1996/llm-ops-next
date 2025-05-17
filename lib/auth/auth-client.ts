/**
 * 客户端认证工具
 *
 * 导出客户端认证相关的函数和钩子。
 * 包括登录、注册和会话管理功能。
 */

import { createAuthClient } from 'better-auth/react';

// 导出认证客户端函数和钩子
export const { signIn, signUp, useSession } = createAuthClient();
