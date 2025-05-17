import { z } from 'zod';

export const emailSchema = z
  .string({
    required_error: '邮箱不能为空',
    invalid_type_error: '邮箱格式不正确',
  })
  .email({
    message: '邮箱格式不正确',
  })
  .max(255, {
    message: '邮箱长度不能超过255个字符',
  });

export const passwordSchema = z
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
  });
