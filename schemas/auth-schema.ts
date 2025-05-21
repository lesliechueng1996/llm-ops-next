/**
 * 认证相关的 Zod 模式定义
 * 该文件包含了用于验证用户登录凭据的 Zod 模式
 * 主要用于验证邮箱和密码的格式和规则
 */

import { z } from 'zod';

/**
 * 用户凭据登录请求的验证模式
 * 验证规则包括：
 * - 邮箱：必填，格式正确，最大长度255字符
 * - 密码：必填，8-32字符，必须包含字母和数字
 */
export const credentialLoginReqSchema = z.object({
  // 邮箱字段验证
  email: z
    .string({
      required_error: '邮箱不能为空',
      invalid_type_error: '邮箱格式不正确',
    })
    .email({
      message: '邮箱格式不正确',
    })
    .max(255, {
      message: '邮箱长度不能超过255个字符',
    }),
  // 密码字段验证
  password: z
    .string({
      required_error: '密码不能为空',
      invalid_type_error: '密码格式不正确',
    })
    .min(8, {
      message: '密码长度不能少于8个字符',
    })
    .max(32, {
      message: '密码长度不能超过32个字符',
    })
    .regex(/^(?=.*[a-zA-Z])(?=.*\d).{8,16}$/, {
      message: '密码必须包含字母和数字',
    }),
});
