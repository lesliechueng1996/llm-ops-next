/**
 * 通用分页请求模式定义
 * 使用 zod 进行请求参数验证和类型转换
 * 包含页码(currentPage)和每页条数(pageSize)的验证规则
 */

import { z } from 'zod';

/**
 * 分页请求参数验证模式
 * @property {number} currentPage - 当前页码，范围1-9999，默认为1
 * @property {number} pageSize - 每页显示条数，范围1-50，默认为10
 *
 * 支持字符串或数字类型的输入，会自动进行类型转换
 * 提供友好的中文错误提示信息
 */
export const pageReqSchema = z.object({
  currentPage: z
    .union([
      z.string().transform((val) => Number.parseInt(val, 10)),
      z.number(),
    ])
    .pipe(
      z
        .number()
        .min(1, { message: '页码不能小于1' })
        .max(9999, { message: '页码不能大于9999' }),
    )
    .optional()
    .default(1),
  pageSize: z
    .union([
      z.string().transform((val) => Number.parseInt(val, 10)),
      z.number(),
    ])
    .pipe(
      z
        .number()
        .min(1, { message: '每页条数不能小于1' })
        .max(50, { message: '每页条数不能大于50' }),
    )
    .optional()
    .default(10),
});

/**
 * 分页请求参数类型
 * 由 pageReqSchema 推导出的 TypeScript 类型
 */
export type PageReq = z.infer<typeof pageReqSchema>;
