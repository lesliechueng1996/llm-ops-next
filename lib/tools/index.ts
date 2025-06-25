/**
 * 工具模块主文件
 *
 * 该模块定义了系统中所有内置工具的类型和配置，包括：
 * - 工具分类系统
 * - 工具参数类型定义
 * - 内置工具配置
 * - 工具获取和查询函数
 *
 * 主要功能：
 * 1. 提供统一的工具类型定义
 * 2. 管理工具分类
 * 3. 配置内置工具（如搜索、图片生成、天气查询等）
 * 4. 提供工具查询和获取接口
 */

import type { StructuredTool } from '@langchain/core/tools';
import {
  createCurrentTimeTool,
  currentTimeToolDefination,
} from './current-time-tool';
import { createDallETool, dallEToolDefination } from './dall-e-tool';
import {
  createDuckDuckGoSearchTool,
  duckDuckGoSearchToolDefination,
} from './duck-duck-go-search-tool';
import { createGaodeIpTool, gaodeIpToolDefination } from './gaode-ip-tool';
import {
  createGaodeWeatherTool,
  gaodeWeatherToolDefination,
} from './gaode-weather-tool';
import { createWikipediaTool, wikipediaToolDefination } from './wikipedia-tool';

const host = process.env.LLM_OPS_NEXT_HOST;

/**
 * 工具分类类型定义
 * @property category - 分类的唯一标识符，用于系统内部引用
 * @property name - 分类的显示名称，用于用户界面展示
 * @property icon - 分类图标的URL地址
 */
type Category = {
  category: string;
  name: string;
  icon: string;
};

/**
 * 系统预定义的工具分类列表
 * 定义了系统中所有可用的工具分类，包括：
 * - 搜索类工具
 * - 图片处理工具
 * - 天气相关工具
 * - 通用工具
 * - 其他类别工具
 */
export const categories: Category[] = [
  {
    category: 'search',
    name: '搜索',
    icon: `${host}/icons/search.svg`,
  },
  {
    category: 'image',
    name: '图片',
    icon: `${host}/icons/image.svg`,
  },
  {
    category: 'weather',
    name: '天气',
    icon: `${host}/icons/weather.svg`,
  },
  {
    category: 'tool',
    name: '工具',
    icon: `${host}/icons/tool.svg`,
  },
  {
    category: 'other',
    name: '其他',
    icon: `${host}/icons/other.svg`,
  },
];

/**
 * 工具参数基础类型
 * 定义了所有工具参数共享的基本属性
 * @property name - 参数的唯一标识符
 * @property label - 参数的显示名称
 * @property help - 参数的帮助说明文本
 * @property required - 参数是否必填
 */
type BuiltinToolBaseParam = {
  name: string;
  label: string;
  help?: string;
  required: boolean;
};

/**
 * 选择类型参数配置
 * 用于定义下拉选择框类型的参数
 * @property type - 固定为'select'
 * @property default - 默认选中的值
 * @property options - 可选项列表，每个选项包含值和显示标签
 */
type BuiltinToolSelectParam = BuiltinToolBaseParam & {
  type: 'select';
  default: string | number | boolean;
  options: {
    value: string | number | boolean;
    label: string;
  }[];
};

/**
 * 数字类型参数配置
 * 用于定义数字输入类型的参数
 * @property type - 固定为'number'
 * @property default - 默认数值
 * @property min - 可选的最小值
 * @property max - 可选的最大值
 */
type BuiltinToolNumberParam = BuiltinToolBaseParam & {
  type: 'number';
  default: number;
  min?: number;
  max?: number;
};

/**
 * 布尔类型参数配置
 * 用于定义开关类型的参数
 * @property type - 固定为'boolean'
 * @property default - 默认开关状态
 */
type BuiltinToolBooleanParam = BuiltinToolBaseParam & {
  type: 'boolean';
  default: boolean;
};

/**
 * 字符串类型参数配置
 * 用于定义文本输入类型的参数
 * @property type - 固定为'string'
 * @property default - 默认文本值
 */
type BuiltinToolStringParam = BuiltinToolBaseParam & {
  type: 'string';
  default: string;
};

/**
 * 工具参数联合类型
 * 包含所有可能的参数类型，用于工具配置
 */
export type BuiltinToolParam =
  | BuiltinToolSelectParam
  | BuiltinToolNumberParam
  | BuiltinToolBooleanParam
  | BuiltinToolStringParam;

/**
 * 内置工具类型定义
 * 定义了工具的基本信息和配置
 * @property name - 工具的唯一标识符
 * @property label - 工具的显示名称
 * @property description - 工具的功能描述
 * @property icon - 工具的图标URL
 * @property category - 工具所属分类
 * @property createdAt - 工具创建时间戳
 * @property background - 工具背景色
 * @property tools - 工具的具体实现列表
 */
type BuiltinTool = {
  name: string;
  label: string;
  description: string;
  icon: string;
  category: string;
  createdAt: number;
  background: string;
  tools: {
    name: string;
    label: string;
    description: string;
    inputs: {
      name: string;
      description: string;
      required: boolean;
      type: 'string' | 'number' | 'boolean';
    }[];
    params: BuiltinToolParam[];
    createdAt: number;
    fn: (params: Record<string, unknown>) => StructuredTool;
  }[];
};

/**
 * 系统内置工具列表
 * 包含所有预配置的工具，每个工具都包含完整的配置信息
 * 当前支持的工具：
 * - DuckDuckGo搜索
 * - DALL-E图片生成
 * - 维基百科查询
 * - 时间工具
 * - 高德工具包（天气和IP查询）
 */
export const builtinTools: BuiltinTool[] = [
  {
    name: 'duckduckgo',
    label: 'DuckDuckGo',
    description: 'DuckDuckGo 一个注重隐私的搜索引擎。',
    icon: `${host}/icons/duckduckgo.svg`,
    category: 'search',
    createdAt: 1722498386,
    background: '#FFFFFF',
    tools: [
      {
        ...duckDuckGoSearchToolDefination,
        fn: createDuckDuckGoSearchTool,
      },
    ],
  },
  {
    name: 'dall-e',
    label: 'Dall-E',
    description: 'DALLE-3是一个文生图工具。',
    icon: `${host}/icons/dall-e.png`,
    category: 'image',
    createdAt: 1722498386,
    background: '#E5E7EB',
    tools: [
      {
        ...dallEToolDefination,
        fn: createDallETool,
      },
    ],
  },
  {
    name: 'wikipedia',
    label: '维基百科',
    description: '维基百科是一个由全世界的志愿者创建和编辑的免费在线百科全书。',
    icon: `${host}/icons/wikipedia.svg`,
    category: 'other',
    createdAt: 1722498386,
    background: '#FFFFFF',
    tools: [
      {
        ...wikipediaToolDefination,
        fn: createWikipediaTool,
      },
    ],
  },
  {
    name: 'time',
    label: '时间',
    description: '一个用于获取当前时间的工具',
    icon: `${host}/icons/time.svg`,
    category: 'tool',
    createdAt: 1722498386,
    background: '#E5E7EB',
    tools: [
      {
        ...currentTimeToolDefination,
        fn: createCurrentTimeTool,
      },
    ],
  },
  {
    name: 'gaode',
    label: '高德工具包',
    description: '内置了高德天气预报和ip查询功能。',
    icon: `${host}/icons/gaode.png`,
    category: 'tool',
    createdAt: 1722498386,
    background: '#E5E7EB',
    tools: [
      {
        ...gaodeIpToolDefination,
        fn: createGaodeIpTool,
      },
      {
        ...gaodeWeatherToolDefination,
        fn: createGaodeWeatherTool,
      },
    ],
  },
];

/**
 * 根据提供者名称获取内置工具提供者配置
 * @param providerName - 工具提供者的唯一标识符
 * @returns 找到的工具提供者配置，如果未找到则返回undefined
 */
export const getBuiltinToolProvider = (providerName: string) => {
  return builtinTools.find(
    (toolProvider) => toolProvider.name === providerName,
  );
};

/**
 * 从指定的工具提供者中获取特定工具
 * @param provider - 工具提供者配置
 * @param toolName - 要获取的工具名称
 * @returns 找到的工具配置，如果未找到则返回undefined
 */
export const getBuiltinTool = (provider: BuiltinTool, toolName: string) => {
  return provider.tools.find((tool) => tool.name === toolName);
};
