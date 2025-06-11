/**
 * 分段（Segment）相关的请求验证模式
 * 包含获取分段列表、创建分段、更新分段和更新分段状态等接口的请求验证
 */
import { z } from 'zod';
import { searchPageReqSchema } from './common-schema';

// 获取分段列表的请求验证模式
export const getSegmentListReqSchema = searchPageReqSchema;

// 创建分段的请求验证模式
export const createSegmentReqSchema = z.object({
  content: z.string().min(1, '分段内容不能为空'),
  keywords: z.array(z.string()).max(10, '关键词最多10个').optional(),
});

export type CreateSegmentReq = z.infer<typeof createSegmentReqSchema>;

// 更新分段的请求验证模式
export const updateSegmentReqSchema = z.object({
  content: z.string().min(1, '分段内容不能为空'),
  keywords: z.array(z.string()).max(10, '关键词最多10个').optional(),
});

export type UpdateSegmentReq = z.infer<typeof updateSegmentReqSchema>;

// 更新分段启用状态的请求验证模式
export const updateSegmentEnabledReqSchema = z.object({
  enabled: z.boolean(),
});
