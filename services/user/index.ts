/**
 * 用户服务模块
 * 提供用户相关的数据库操作和认证功能
 * 包括更新用户名、密码和头像等功能
 */

import { auth } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { account, user } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { headers } from 'next/headers';

/**
 * 根据用户ID更新用户名
 * @param name - 新的用户名
 * @param id - 用户ID
 */
export const updateUserNameById = async (name: string, id: string) => {
  await db
    .update(user)
    .set({
      name,
    })
    .where(eq(user.id, id));
};

/**
 * 根据用户ID更新用户密码
 * 如果用户使用凭证认证，将更新其密码
 * @param password - 新的密码
 * @param id - 用户ID
 */
export const updateUserPasswordById = async (password: string, id: string) => {
  const credentialAccount = await db
    .select()
    .from(account)
    .where(and(eq(account.userId, id), eq(account.providerId, 'credential')));

  if (!credentialAccount || credentialAccount.length === 0) {
    // 如果用户没有凭证认证，则设置密码
    const headersList = await headers();
    await auth.api.setPassword({
      body: {
        newPassword: password,
      },
      headers: headersList,
    });
  } else {
    // 如果用户使用凭证认证，则更新其密码
    const ctx = await auth.$context;
    const hash = await ctx.password.hash(password);
    await ctx.internalAdapter.updatePassword(id, hash);
  }
};

/**
 * 根据用户ID更新用户头像
 * @param avatar - 新的头像URL或图片数据
 * @param id - 用户ID
 */
export const updateUserAvatarById = async (avatar: string, id: string) => {
  await db
    .update(user)
    .set({
      image: avatar,
    })
    .where(eq(user.id, id));
};
