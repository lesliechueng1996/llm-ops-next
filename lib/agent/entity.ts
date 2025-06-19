/**
 * 智能体实体模块
 *
 * 该模块定义了智能体应用的核心实体、配置和状态管理。
 * 包含智能体的系统提示模板、配置结构、状态注解、事件类型等。
 *
 * @module agent/entity
 */

import { randomUUID } from 'node:crypto';
import {
  DEFAULT_APP_CONFIG,
  type DraftAppConfig,
  InvokeFrom,
} from '@/lib/entity';
import type { BaseMessage, StoredMessage } from '@langchain/core/messages';
import type { StructuredTool } from '@langchain/core/tools';
import { Annotation, MessagesAnnotation } from '@langchain/langgraph';

/**
 * 智能体系统提示模板
 *
 * 定义了智能体的核心行为规则和功能说明，包括：
 * - 预设任务执行
 * - 工具调用和参数生成
 * - 历史对话和长期记忆
 * - 外部知识库检索
 * - 高效性和简洁性要求
 */
export const AGENT_SYSTEM_PROMPT_TEMPLATE = `你是一个高度定制的智能体应用，旨在为用户提供准确、专业的内容生成和问题解答，请严格遵守以下规则：

1.**预设任务执行**
  - 你需要基于用户提供的预设提示(PRESET-PROMPT)，按照要求生成特定内容，确保输出符合用户的预期和指引；

2.**工具调用和参数生成**
  - 当任务需要时，你可以调用绑定的外部工具(如知识库检索、计算工具等)，并生成符合任务需求的调用参数，确保工具使用的准确性和高效性；

3.**历史对话和长期记忆**
  - 你可以参考\`历史对话\`记录，结合经过摘要提取的\`长期记忆\`，以提供更加个性化和上下文相关的回复，这将有助于在连续对话中保持一致性，并提供更加精确的反馈；

4.**外部知识库检索**
  - 如果用户的问题超出当前的知识范围或需要额外补充，你可以调用\`recall_dataset(知识库检索工具)\`以获取外部信息，确保答案的完整性和正确性；

5.**高效性和简洁性**
  - 保持对用户需求的精准理解和高效响应，提供简洁且有效的答案，避免冗长或无关信息；
  
<预设提示>
{preset_prompt}
</预设提示>

<长期记忆>
{long_term_memory}
</长期记忆>
`;

/**
 * 智能体配置接口
 *
 * 定义了智能体运行所需的所有配置参数
 */
export type AgentConfig = {
  /** 用户ID，用于标识智能体所属用户 */
  userId: string;
  /** 调用来源，用于区分不同的调用场景 */
  invokeFrom: InvokeFrom;
  /** 最大迭代次数，防止无限循环 */
  maxIterationCount: number;
  /** 系统提示词，定义智能体的行为规则 */
  systemPrompt: string;
  /** 预设提示词，用于特定任务的执行 */
  presetPrompt: string;
  /** 是否启用长期记忆功能 */
  enableLongTermMemory: boolean;
  /** 可用的工具列表 */
  tools: StructuredTool[];
  /** 审核配置，用于内容审核 */
  reviewConfig: DraftAppConfig['reviewConfig'];
};

/**
 * 默认智能体配置
 *
 * 提供了智能体配置的默认值，不包含用户ID
 */
export const defaultAgentConfig: Omit<AgentConfig, 'userId'> = {
  invokeFrom: InvokeFrom.WEB_APP,
  maxIterationCount: 5,
  systemPrompt: AGENT_SYSTEM_PROMPT_TEMPLATE,
  presetPrompt: '',
  enableLongTermMemory: false,
  tools: [],
  reviewConfig: DEFAULT_APP_CONFIG.reviewConfig,
};

/**
 * 创建智能体配置
 *
 * 合并默认配置和用户提供的配置，确保所有必需字段都有值
 *
 * @param config - 用户提供的配置，必须包含userId
 * @returns 完整的智能体配置对象
 */
export const createAgentConfig = (
  config: Partial<AgentConfig> & {
    userId: string;
  },
) => {
  return {
    ...defaultAgentConfig,
    ...config,
  };
};

/**
 * 智能体状态注解
 *
 * 定义了智能体运行时的状态结构，包括：
 * - 消息注解（继承自MessagesAnnotation）
 * - 任务ID
 * - 迭代计数
 * - 历史记录
 * - 长期记忆
 * - 事件发射器
 * - 停止标志
 */
export const AgentState = Annotation.Root({
  ...MessagesAnnotation.spec,
  taskId: Annotation<string>,
  iterationCount: Annotation<number>,
  history: Annotation<Array<BaseMessage>>,
  longTermMemory: Annotation<string>,
  emit: Annotation<(event: AgentThought) => void>,
  stop: Annotation<boolean>,
});

/** 智能体状态类型 */
export type AgentStateType = typeof AgentState.State;

/**
 * 队列事件枚举
 *
 * 定义了智能体运行过程中可能发生的各种事件类型
 */
export enum QueueEvent {
  /** 长期记忆召回事件 */
  LONG_TERM_MEMORY_RECALL = 'long_term_memory_recall',
  /** 智能体思考事件 */
  AGENT_THOUGHT = 'agent_thought',
  /** 智能体消息事件 */
  AGENT_MESSAGE = 'agent_message',
  /** 智能体行动事件 */
  AGENT_ACTION = 'agent_action',
  /** 数据集检索事件 */
  DATASET_RETRIEVAL = 'dataset_retrieval',
  /** 智能体结束事件 */
  AGENT_END = 'agent_end',
  /** 停止事件 */
  STOP = 'stop',
  /** 错误事件 */
  ERROR = 'error',
  /** 超时事件 */
  TIMEOUT = 'timeout',
  /** 心跳事件 */
  PING = 'ping',
}

/**
 * 智能体思考记录接口
 *
 * 记录了智能体在运行过程中的详细思考过程、工具调用、成本统计等信息
 */
export type AgentThought = {
  /** 唯一标识符 */
  id: string;
  /** 任务ID */
  taskId: string;

  /** 事件类型 */
  event: QueueEvent;
  /** 思考内容 */
  thought: string;
  /** 观察结果 */
  observation: string;

  /** 使用的工具名称 */
  tool: string;
  /** 工具输入参数 */
  toolInput: Record<string, unknown>;

  /** 消息列表 */
  message: Array<StoredMessage>;
  /** 消息token数量 */
  messageTokenCount: number;
  /** 消息单价 */
  messageUnitPrice: number;
  /** 消息价格单位 */
  messagePriceUnit: number;

  /** 回答内容 */
  answer: string;
  /** 回答token数量 */
  answerTokenCount: number;
  /** 回答单价 */
  answerUnitPrice: number;
  /** 回答价格单位 */
  answerPriceUnit: number;

  /** 总token数量 */
  totalTokenCount: number;
  /** 总价格 */
  totalPrice: number;
  /** 延迟时间（毫秒） */
  latency: number;
};

/**
 * 默认智能体思考记录
 *
 * 提供了AgentThought的默认值，不包含必需字段
 */
const defaultAgentThought: Omit<AgentThought, 'id' | 'taskId' | 'event'> = {
  thought: '',
  observation: '',

  tool: '',
  toolInput: {},

  message: [],
  messageTokenCount: 0,
  messageUnitPrice: 0,
  messagePriceUnit: 0,

  answer: '',
  answerTokenCount: 0,
  answerUnitPrice: 0,
  answerPriceUnit: 0,

  totalTokenCount: 0,
  totalPrice: 0,
  latency: 0,
};

/**
 * 创建智能体思考记录
 *
 * 合并默认值和用户提供的值，创建完整的思考记录
 *
 * @param agentThought - 用户提供的思考记录，必须包含id、taskId和event
 * @returns 完整的智能体思考记录
 */
export const createAgentThought = (
  agentThought: Partial<AgentThought> &
    Pick<AgentThought, 'id' | 'taskId' | 'event'>,
): AgentThought => {
  return {
    ...defaultAgentThought,
    ...agentThought,
  };
};

/**
 * 创建错误智能体思考记录
 *
 * 用于记录智能体运行过程中的错误信息
 *
 * @param taskId - 任务ID
 * @param error - 错误对象
 * @returns 包含错误信息的智能体思考记录
 */
export const createErrorAgentThought = (taskId: string, error: Error) => {
  return createAgentThought({
    id: randomUUID(),
    taskId,
    event: QueueEvent.ERROR,
    observation: error.message,
  });
};

/**
 * 最大迭代响应消息
 *
 * 当智能体达到最大迭代次数时返回的提示信息
 */
export const MAX_ITERATION_RESPONSE =
  '对不起，我已经尽力了，但是还是无法回答您的问题。';

// 超时时间（毫秒）- 10分钟
export const TASK_TIMEOUT = 600000;
