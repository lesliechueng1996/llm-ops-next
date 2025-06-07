/**
 * 文档处理相关的 Zod Schema 定义
 *
 * 该模块定义了与文档处理相关的所有 Zod Schema，主要用于：
 * 1. 文档列表查询参数验证
 * 2. 文档创建请求参数验证
 * 3. 文档处理规则配置验证
 * 4. 文档更新操作参数验证
 *
 * 主要包含以下功能：
 * - 文档处理类型定义（自动/自定义）
 * - 预处理规则配置
 * - 文本分段配置
 * - 请求参数验证和转换
 * - 文档状态管理
 */

import { DEFAULT_PROCESS_RULE, type DocumentStatus } from '@/lib/entity';
import { z } from 'zod';
import { searchPageReqSchema } from './common-schema';

/**
 * 获取文档列表的请求参数 Schema
 * 继承自通用的分页搜索参数 Schema
 *
 * @remarks
 * 该 Schema 用于验证文档列表查询的请求参数，支持分页和搜索功能
 */
export const getDocumentListReqSchema = searchPageReqSchema;

/**
 * 文档处理类型枚举
 * 定义了文档处理的两种模式
 *
 * @remarks
 * - Automatic: 使用系统预设的默认处理规则
 * - Custom: 允许用户自定义处理规则和参数
 */
export enum ProcessType {
  /** 自动处理：使用系统默认的处理规则 */
  Automatic = 'automatic',
  /** 自定义处理：允许用户自定义处理规则 */
  Custom = 'custom',
}

/**
 * 预处理规则 ID 枚举
 * 定义了可用的文档预处理规则类型
 *
 * @remarks
 * 这些规则用于在文档处理前进行文本清理和标准化
 */
export enum PreProcessRuleId {
  /** 移除文档中的多余空格 */
  RemoveExtraSpace = 'remove_extra_space',
  /** 移除文档中的 URL 和邮箱地址 */
  RemoveUrlAndEmail = 'remove_url_and_email',
}

/**
 * 创建文档的请求参数 Schema
 *
 * @remarks
 * 该 Schema 定义了创建文档时需要的所有参数，包括：
 * 1. 上传文件列表（1-10个文件）
 * 2. 处理类型（自动/自定义）
 * 3. 自定义处理规则配置（可选）
 *
 * 特点：
 * - 自动去重文件ID
 * - 自动处理模式下使用默认规则
 * - 自定义模式下支持配置预处理规则和分段参数
 */
export const createDocumentReqSchema = z
  .object({
    /**
     * 上传文件 ID 列表
     * - 限制 1-10 个文件
     * - 必须是有效的 UUID
     * - 自动去重
     */
    uploadFileIds: z
      .array(z.string().uuid({ message: '文件ID格式错误' }))
      .min(1, { message: '请至少选择一个文件' })
      .max(10, { message: '最多只能选择10个文件' })
      .transform((ids) => [...new Set(ids)]), // 去重

    /**
     * 处理类型
     * 可选值：automatic（自动处理）或 custom（自定义处理）
     */
    processType: z.nativeEnum(ProcessType, {
      message: 'processType 必须是 automatic 或 custom',
    }),

    /**
     * 自定义处理规则配置
     * 仅在 processType 为 custom 时生效
     */
    rule: z
      .object({
        /**
         * 预处理规则列表
         * 必须包含所有预定义的规则（remove_extra_space 和 remove_url_and_email）
         */
        preProcessRules: z
          .array(
            z.object({
              /** 规则 ID：必须是预定义的规则之一 */
              id: z.nativeEnum(PreProcessRuleId, {
                message: 'id 必须是 remove_extra_space 或 remove_url_and_email',
              }),
              /** 是否启用该规则 */
              enabled: z.boolean(),
            }),
          )
          .refine(
            (rules) => {
              const ruleIds = new Set(rules.map((r) => r.id));
              return (
                ruleIds.size === 2 &&
                ruleIds.has(PreProcessRuleId.RemoveExtraSpace) &&
                ruleIds.has(PreProcessRuleId.RemoveUrlAndEmail)
              );
            },
            {
              message:
                'preProcessRules 必须包含 remove_extra_space 和 remove_url_and_email 两个规则',
            },
          ),

        /**
         * 文本分段配置
         * 控制文档如何被分割成更小的片段
         */
        segment: z
          .object({
            /**
             * 分段分隔符列表
             * 用于确定文本分段的边界
             */
            separators: z
              .array(z.string())
              .nonempty({ message: '分隔符不能为空' }),

            /**
             * 分段大小
             * - 范围：100-1000
             * - 必须是整数
             */
            chunkSize: z
              .number()
              .int({ message: '分段大小必须是整数' })
              .min(100, { message: '分段大小不能小于100' })
              .max(1000, { message: '分段大小不能大于1000' }),

            /**
             * 分段重叠大小
             * - 范围：0 到 chunkSize 的 50%
             * - 必须是整数
             */
            chunkOverlap: z
              .number()
              .int({ message: '分段重叠必须是整数' })
              .min(0, { message: '分段重叠不能小于0' }),
          })
          .refine(
            (
              data,
            ): data is {
              separators: [string, ...string[]];
              chunkSize: number;
              chunkOverlap: number;
            } => data.chunkOverlap <= Math.floor(data.chunkSize * 0.5),
            {
              message: '分段重叠不能超过分段大小的50%',
              path: ['chunkOverlap'],
            },
          ),
      })
      .optional(),
  })
  .transform((data) => {
    // 如果是自动处理模式，使用默认规则
    if (data.processType === ProcessType.Automatic) {
      return {
        ...data,
        rule: DEFAULT_PROCESS_RULE,
      };
    }
    return data;
  });

/**
 * 创建文档请求参数的类型定义
 * 由 createDocumentReqSchema 推断得出
 */
export type CreateDocumentReq = z.infer<typeof createDocumentReqSchema>;

/**
 * 批量获取文档信息的响应类型
 *
 * @remarks
 * 包含文档的基本信息、处理状态和时间戳
 */
export type GetDocumentBatchRes = {
  /** 文档唯一标识符 */
  id: string;
  /** 文档名称 */
  name: string;
  /** 文档大小（字节） */
  size: number;
  /** 文件扩展名 */
  extension: string;
  /** MIME 类型 */
  mimeType: string;
  /** 文档在批次中的位置 */
  position: number;
  /** 总分段数 */
  segmentCount: number;
  /** 已完成的分段数 */
  completedSegmentCount: number;
  /** 错误信息（如果有） */
  error: string;
  /** 文档处理状态 */
  status: DocumentStatus;
  /** 处理开始时间戳 */
  processingStartedAt: number;
  /** 解析完成时间戳 */
  parsingCompletedAt: number;
  /** 分段完成时间戳 */
  splittingCompletedAt: number;
  /** 索引完成时间戳 */
  indexingCompletedAt: number;
  /** 处理完成时间戳 */
  completedAt: number;
  /** 处理停止时间戳 */
  stoppedAt: number;
  /** 创建时间戳 */
  createdAt: number;
};

/**
 * 更新文档名称的请求参数 Schema
 *
 * @remarks
 * 用于验证文档重命名操作的参数
 */
export const updateDocumentNameReqSchema = z.object({
  /** 新的文档名称 */
  name: z
    .string({ message: '文档名称不能为空' })
    .min(1, '文档名称不能为空')
    .max(100, '文档名称不能超过 100 个字符'),
});

/**
 * 更新文档启用状态的请求参数 Schema
 *
 * @remarks
 * 用于验证文档启用/禁用操作的参数
 */
export const updateDocumentEnabledReqSchema = z.object({
  /** 文档是否启用 */
  enabled: z.boolean({ message: '文档状态不能为空' }),
});
