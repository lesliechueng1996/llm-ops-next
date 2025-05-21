/**
 * 用户信息更新相关的服务器端操作
 * 该模块提供了更新用户名称、密码和头像的服务器端操作
 * 使用 'use server' 指令确保这些操作在服务器端执行
 * 所有操作都需要用户认证，通过 authActionClient 进行安全控制
 */

'use server';

import { authActionClient } from '@/lib/safe-action';
import {
  updateAvatarReqSchema,
  updateNameReqSchema,
  updatePasswordReqSchema,
} from '@/schemas/user-schema';
import {
  updateUserAvatarById,
  updateUserNameById,
  updateUserPasswordById,
} from '@/services/user';

/**
 * 更新用户名称的服务器端操作
 *
 * @description
 * 该操作接收新的用户名称，更新指定用户的名称信息
 * 使用 authActionClient 确保操作的安全性，并通过 schema 验证输入参数
 *
 * @param {Object} params - 输入参数对象
 * @param {string} params.name - 新的用户名称
 * @param {Object} params.ctx - 上下文对象
 * @param {string} params.ctx.userId - 当前用户ID
 * @returns {Promise<string>} 更新后的用户ID
 */
export const updateNameAction = authActionClient
  .schema(updateNameReqSchema)
  .metadata({
    actionName: 'updateName',
  })
  .action(async ({ parsedInput: { name }, ctx: { userId } }) => {
    await updateUserNameById(name, userId);
    return userId;
  });

/**
 * 更新用户密码的服务器端操作
 *
 * @description
 * 该操作接收新的密码，更新指定用户的密码信息
 * 使用 authActionClient 确保操作的安全性，并通过 schema 验证输入参数
 *
 * @param {Object} params - 输入参数对象
 * @param {string} params.password - 新的用户密码
 * @param {Object} params.ctx - 上下文对象
 * @param {string} params.ctx.userId - 当前用户ID
 * @returns {Promise<string>} 更新后的用户ID
 */
export const updatePasswordAction = authActionClient
  .schema(updatePasswordReqSchema)
  .metadata({
    actionName: 'updatePassword',
  })
  .action(async ({ parsedInput: { password }, ctx: { userId } }) => {
    await updateUserPasswordById(password, userId);
    return userId;
  });

/**
 * 更新用户头像的服务器端操作
 *
 * @description
 * 该操作接收新的头像信息，更新指定用户的头像
 * 使用 authActionClient 确保操作的安全性，并通过 schema 验证输入参数
 *
 * @param {Object} params - 输入参数对象
 * @param {string} params.avatar - 新的用户头像
 * @param {Object} params.ctx - 上下文对象
 * @param {string} params.ctx.userId - 当前用户ID
 * @returns {Promise<string>} 更新后的用户ID
 */
export const updateAvatarAction = authActionClient
  .schema(updateAvatarReqSchema)
  .metadata({
    actionName: 'updateAvatar',
  })
  .action(async ({ parsedInput: { avatar }, ctx: { userId } }) => {
    await updateUserAvatarById(avatar, userId);
    return userId;
  });
