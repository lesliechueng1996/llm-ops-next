/**
 * DALL-E 图片生成工具
 *
 * 这个模块提供了与 OpenAI 的 DALL-E API 交互的功能，用于生成 AI 图片。
 * 包含了默认配置和自定义参数的处理。
 */

import { DallEAPIWrapper, type DallEAPIWrapperParams } from '@langchain/openai';
import { log } from '@/lib/logger';

// DALL-E API 的默认配置
const defaultOptions = {
  apiKey: process.env.OPENAI_API_KEY,
  model: 'dall-e-3',
};

const defaultDallETool = new DallEAPIWrapper(defaultOptions);

/**
 * 自定义 DALL-E API 参数类型
 * 只包含 size 和 style 两个可选参数
 */
type CustomDallEAPIWrapperParams = Pick<
  DallEAPIWrapperParams,
  'size' | 'style'
>;

/**
 * 创建自定义配置的 DALL-E 工具实例
 * @param params - 自定义参数，包括图片尺寸和风格
 * @returns 配置好的 DALL-E API 包装器实例
 */
export const createDallETool = (params: CustomDallEAPIWrapperParams) => {
  log.info('创建 DALL-E 工具实例, 参数: %o', params);
  return new DallEAPIWrapper({
    ...defaultOptions,
    ...params,
  });
};

/**
 * DALL-E 工具的定义配置
 * 包含工具名称、描述、输入参数和配置选项
 */
export const dallEToolDefination = {
  name: defaultDallETool.name,
  description: defaultDallETool.description,
  inputs: [
    {
      name: 'input',
      description: '生成图片的描述',
      required: true,
      type: 'string' as const,
    },
  ],
  label: 'Dall-E 图片生成',
  params: [
    {
      name: 'size',
      label: '图片尺寸',
      required: true,
      type: 'select' as const,
      default: '1024x1024',
      options: [
        {
          value: '1024x1024',
          label: '(方形) 1024x1024',
        },
        {
          value: '1792x1024',
          label: '(横屏) 1792x1024',
        },
        {
          value: '1024x1792',
          label: '(竖屏) 1024x1792',
        },
      ],
    },
    {
      name: 'style',
      label: '图片风格',
      required: true,
      type: 'select' as const,
      default: 'vivid',
      options: [
        {
          value: 'vivid',
          label: '生动',
        },
        {
          value: 'natural',
          label: '自然',
        },
      ],
    },
  ],
};
