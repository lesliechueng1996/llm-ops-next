/**
 * 工具模块主文件
 * 该文件定义了系统中所有内置工具的类型和配置
 * 包括搜索、图片生成、天气查询等功能性工具
 */

import {
  duckDuckGoSearchToolDefination,
  createDuckDuckGoSearchTool,
} from './duck-duck-go-search-tool';
import { createGaodeIpTool, gaodeIpToolDefination } from './gaode-ip-tool';
import {
  createGaodeWeatherTool,
  gaodeWeatherToolDefination,
} from './gaode-weather-tool';
import { createDallETool, dallEToolDefination } from './dall-e-tool';
import { createWikipediaTool, wikipediaToolDefination } from './wikipedia-tool';
import {
  createCurrentTimeTool,
  currentTimeToolDefination,
} from './current-time-tool';
import type { StructuredTool } from '@langchain/core/tools';

const host = process.env.LLM_OPS_NEXT_HOST;

/**
 * 工具分类类型定义
 * @property category - 分类标识符
 * @property name - 分类显示名称
 * @property icon - 分类图标URL
 */
type Category = {
  category: string;
  name: string;
  icon: string;
};

/**
 * 系统预定义的工具分类列表
 * 包括：搜索、图片、天气、工具和其他类别
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
 */
type BuiltinToolBooleanParam = BuiltinToolBaseParam & {
  type: 'boolean';
  default: boolean;
};

/**
 * 字符串类型参数配置
 * 用于定义文本输入类型的参数
 */
type BuiltinToolStringParam = BuiltinToolBaseParam & {
  type: 'string';
  default: string;
};

/**
 * 工具参数联合类型
 * 包含所有可能的参数类型
 */
type BuiltinToolParam =
  | BuiltinToolSelectParam
  | BuiltinToolNumberParam
  | BuiltinToolBooleanParam
  | BuiltinToolStringParam;

/**
 * 内置工具类型定义
 * 定义了工具的基本信息和配置
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
    fn: (params: Record<string, unknown>) => StructuredTool;
  }[];
};

/**
 * 系统内置工具列表
 * 包含所有预配置的工具，如DuckDuckGo搜索、DALL-E图片生成等
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
