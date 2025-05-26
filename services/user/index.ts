/**
 * 用户服务模块
 * 提供用户相关的数据库操作和认证功能
 * 包括更新用户名、密码和头像等功能
 */

import { NotFoundException } from '@/exceptions';
import { auth } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { account, session, user } from '@/lib/db/schema';
import { and, desc, eq } from 'drizzle-orm';
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

/**
 * 根据用户ID获取用户详细信息
 * 包括用户基本信息、最后登录时间和IP地址
 * @param userId - 用户ID
 * @returns 包含用户详细信息的对象，包括：
 *          - id: 用户ID
 *          - name: 用户名
 *          - email: 用户邮箱
 *          - avatar: 用户头像
 *          - lastLoginAt: 最后登录时间戳
 *          - lastLoginIp: 最后登录IP地址
 *          - createdAt: 账号创建时间戳
 * @throws {NotFoundException} 当用户不存在时抛出异常
 */
export const getUserInfoById = async (userId: string) => {
  const userQuery = db.select().from(user).where(eq(user.id, userId));
  const sessionQuery = db
    .select()
    .from(session)
    .where(eq(session.userId, userId))
    .orderBy(desc(session.createdAt))
    .limit(1);

  const [userInfo, sessionInfo] = await Promise.all([userQuery, sessionQuery]);

  if (!userInfo || userInfo.length === 0) {
    throw new NotFoundException('用户不存在');
  }

  return {
    id: userId,
    name: userInfo[0].name,
    email: userInfo[0].email,
    avatar: userInfo[0].image,
    lastLoginAt: sessionInfo?.[0]?.updatedAt?.getTime() ?? null,
    lastLoginIp: sessionInfo?.[0]?.ipAddress ?? null,
    createdAt: userInfo[0].createdAt.getTime(),
  };
};
