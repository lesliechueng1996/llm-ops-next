/**
 * 用户相关的 Zod schema 定义
 * 包含用户信息更新相关的验证规则，如昵称、头像和密码的更新
 */

import { z } from 'zod';

/**
 * 更新用户昵称的请求验证 schema
 * 要求：
 * - 昵称不能为空
 * - 长度在 3-30 个字符之间
 */
export const updateNameReqSchema = z.object({
  name: z
    .string({ message: '昵称不能为空' })
    .min(3, { message: '昵称长度不能小于3位' })
    .max(30, { message: '昵称长度不能大于30位' }),
});

/**
 * 更新用户头像的请求验证 schema
 * 要求：
 * - 头像 URL 不能为空
 * - 必须是一个有效的 URL 格式
 */
export const updateAvatarReqSchema = z.object({
  avatar: z
    .string({
      message: '头像不能为空',
    })
    .url({
      message: '头像必须是一个有效的 URL',
    }),
});

/**
 * 更新用户密码的请求验证 schema
 * 要求：
 * - 密码不能为空
 * - 长度在 8-16 个字符之间
 * - 必须同时包含字母和数字
 */
export const updatePasswordReqSchema = z.object({
  password: z
    .string({ message: '密码不能为空' })
    .min(8, { message: '密码长度不能小于8位' })
    .max(16, { message: '密码长度不能大于16位' })
    .regex(/^(?=.*[a-zA-Z])(?=.*\d).{8,16}$/, {
      message: '密码必须包含至少一个字母和一个数字',
    }),
});
