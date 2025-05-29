/**
 * 文档处理相关的 Zod Schema 定义
 * 包含文档列表查询、创建文档等接口的请求参数验证
 */

import { z } from 'zod';
import { searchPageReqSchema } from './common-schema';

/** 获取文档列表的请求参数 Schema */
export const getDocumentListReqSchema = searchPageReqSchema;

/** 文档处理类型枚举 */
export enum ProcessType {
  /** 自动处理 */
  Automatic = 'automatic',
  /** 自定义处理 */
  Custom = 'custom',
}

/** 预处理规则 ID 枚举 */
export enum PreProcessRuleId {
  /** 移除多余空格 */
  RemoveExtraSpace = 'remove_extra_space',
  /** 移除 URL 和邮箱 */
  RemoveUrlAndEmail = 'remove_url_and_email',
}

/** 创建文档的请求参数 Schema */
export const createDocumentReqSchema = z
  .object({
    /** 上传文件 ID 列表，限制 1-10 个文件 */
    uploadFileIds: z
      .array(z.string().nonempty({ message: '文件ID不能为空' }))
      .min(1, { message: '请至少选择一个文件' })
      .max(10, { message: '最多只能选择10个文件' }),
    /** 处理类型：自动或自定义 */
    processType: z.nativeEnum(ProcessType, {
      message: 'processType 必须是 automatic 或 custom',
    }),
    /** 自定义处理规则配置 */
    rule: z
      .object({
        /** 预处理规则列表 */
        preProcessRules: z.array(
          z.object({
            /** 规则 ID */
            id: z.nativeEnum(PreProcessRuleId, {
              message: 'id 必须是 remove_extra_space 或 remove_url_and_email',
            }),
            /** 是否启用该规则 */
            enabled: z.boolean(),
          }),
        ),
        /** 文本分段配置 */
        segment: z.object({
          /** 分段分隔符列表 */
          separator: z
            .array(z.string())
            .nonempty({ message: '分隔符不能为空' }),
          /** 分段大小，范围 100-1000 */
          chunkSize: z
            .number()
            .int({ message: '分段大小必须是整数' })
            .min(100, { message: '分段大小不能小于100' })
            .max(1000, { message: '分段大小不能大于1000' }),
          /** 分段重叠大小，范围 0-100 */
          chunkOverlap: z
            .number()
            .int({ message: '分段重叠必须是整数' })
            .min(0, { message: '分段重叠不能小于0' })
            .max(100, { message: '分段重叠不能大于100' }),
        }),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    // 当处理类型为自定义时，必须提供处理规则
    if (data.processType === ProcessType.Custom && !data.rule) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '当处理方式为custom时, 必须提供自定义处理规则',
        path: ['rule'],
      });
    }
  });
