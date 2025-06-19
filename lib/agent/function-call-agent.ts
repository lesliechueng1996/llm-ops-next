/**
 * 函数调用智能体模块
 *
 * 这个模块实现了一个基于函数调用的智能体系统，支持：
 * - 预设操作处理（关键词匹配和预设响应）
 * - 长期记忆召回
 * - LLM 推理和工具调用
 * - 工具执行和结果处理
 * - 状态图驱动的执行流程
 *
 * 智能体使用 LangGraph 状态图来管理执行流程，支持流式响应和事件发射。
 */

import type { BaseLanguageModel } from '@langchain/core/language_models/base';
import {
  type AgentConfig,
  AgentState,
  type AgentStateType,
  defaultAgentConfig,
  createAgentThought,
  QueueEvent,
  AGENT_SYSTEM_PROMPT_TEMPLATE,
  createErrorAgentThought,
  MAX_ITERATION_RESPONSE,
} from './entity';
import { StateGraph, START, END } from '@langchain/langgraph';
import {
  AIMessage,
  type AIMessageChunk,
  HumanMessage,
  isAIMessage,
  RemoveMessage,
  SystemMessage,
  ToolMessage,
} from '@langchain/core/messages';
import { randomUUID } from 'node:crypto';
import { log } from '@/lib/logger';
import { InternalServerErrorException } from '@/exceptions';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { StructuredTool } from '@langchain/core/tools';
import { DATASET_RETRIEVAL_TOOL_NAME } from '@/lib/entity';
import { stopCondition, withStopCheck } from './helper';

/**
 * 智能体配置选项
 */
type AgentOptions = {
  /** 语言模型实例 */
  llm: BaseLanguageModel;
  /** 智能体配置参数 */
  agentConfig: AgentConfig;
};

/**
 * 创建函数调用智能体
 *
 * 这个函数创建一个完整的智能体系统，包含以下执行节点：
 * 1. preset_operation: 处理预设操作（关键词匹配）
 * 2. long_term_memory_recall: 长期记忆召回
 * 3. llm: LLM 推理和工具调用决策
 * 4. tools: 工具执行
 *
 * @param options - 智能体配置选项
 * @returns 编译后的状态图实例
 */
export const createFunctionCallAgent = (options: AgentOptions) => {
  const { llm, agentConfig: inputAgentConfig } = options;

  // 合并默认配置和用户配置
  const agentConfig: AgentConfig = {
    ...defaultAgentConfig,
    ...inputAgentConfig,
  };

  /**
   * 预设操作节点
   *
   * 检查用户查询是否包含预设关键词，如果包含则返回预设响应。
   * 这个节点在智能体执行流程的最开始执行。
   *
   * @param state - 当前智能体状态
   * @returns 更新后的状态部分
   */
  const presetOperationNode = (
    state: AgentStateType,
  ): Partial<AgentStateType> => {
    const reviewConfig = options.agentConfig.reviewConfig;
    const query = state.messages[state.messages.length - 1].content as string;

    // 检查是否启用预设操作且包含关键词
    if (reviewConfig.enable && reviewConfig.inputsConfig.enable) {
      if (reviewConfig.keywords.some((keyword) => query.includes(keyword))) {
        const presetResponse = reviewConfig.inputsConfig.presetResponse;

        // 发射预设响应事件
        state.emit(
          createAgentThought({
            id: randomUUID(),
            taskId: state.taskId,
            event: QueueEvent.AGENT_MESSAGE,
            thought: presetResponse,
            message: state.messages.map((message) => message.toDict()),
            answer: presetResponse,
            latency: 0,
          }),
        );

        // 发射智能体结束事件
        state.emit(
          createAgentThought({
            id: randomUUID(),
            taskId: state.taskId,
            event: QueueEvent.AGENT_END,
          }),
        );

        return {
          messages: [new AIMessage(presetResponse)],
        };
      }
    }

    // 如果没有匹配的关键词，返回空消息数组继续执行
    return {
      messages: [],
    };
  };

  /**
   * 长期记忆召回节点
   *
   * 构建完整的消息上下文，包括：
   * - 系统提示词（包含预设提示和长期记忆）
   * - 历史对话记录
   * - 当前用户消息
   *
   * @param state - 当前智能体状态
   * @returns 更新后的状态部分
   */
  const longTermMemoryRecallNode = (
    state: AgentStateType,
  ): Partial<AgentStateType> => {
    let longTermMemory = '';

    // 如果启用长期记忆，获取并记录长期记忆内容
    if (agentConfig.enableLongTermMemory) {
      longTermMemory = state.longTermMemory;
      state.emit(
        createAgentThought({
          id: randomUUID(),
          taskId: state.taskId,
          event: QueueEvent.LONG_TERM_MEMORY_RECALL,
          observation: longTermMemory,
        }),
      );
    }

    // 构建系统消息，替换模板中的占位符
    const presetMessages = [
      new SystemMessage(
        AGENT_SYSTEM_PROMPT_TEMPLATE.replace(
          '{preset_prompt}',
          agentConfig.presetPrompt,
        ).replace('{long_term_memory}', longTermMemory),
      ),
    ];

    // 添加历史对话记录
    const history = state.history;
    if (history.length > 0) {
      // 验证历史消息格式（应该是成对的人机对话）
      if (history.length % 2 !== 0) {
        state.emit(
          createErrorAgentThought(
            state.taskId,
            new Error('智能体历史消息列表格式错误'),
          ),
        );
        log.error(
          '智能体历史消息列表格式错误, len(history)={%d}, history={%s}',
          history.length,
          JSON.stringify(history.map((message) => message.toDict())),
        );
        throw new InternalServerErrorException('智能体历史消息列表格式错误');
      }
      presetMessages.push(...history);
    }

    // 添加当前用户消息
    const humanMessage = state.messages[
      state.messages.length - 1
    ] as HumanMessage;
    presetMessages.push(new HumanMessage(humanMessage.content as string));

    // 如果用户消息有ID，需要先移除旧消息再添加新消息
    let returnMessages = [...presetMessages];
    if (humanMessage.id) {
      returnMessages = [
        new RemoveMessage({ id: humanMessage.id }),
        ...presetMessages,
      ];
    }

    return {
      messages: returnMessages,
    };
  };

  /**
   * LLM 推理节点
   *
   * 这是智能体的核心节点，负责：
   * - 检查迭代次数限制
   * - 调用语言模型进行推理
   * - 处理流式响应
   * - 发射相应的事件
   *
   * @param state - 当前智能体状态
   * @returns 更新后的状态部分
   */
  const llmNode = async (
    state: AgentStateType,
  ): Promise<Partial<AgentStateType>> => {
    // 检查是否超过最大迭代次数
    if (state.iterationCount >= agentConfig.maxIterationCount) {
      state.emit(
        createAgentThought({
          id: randomUUID(),
          taskId: state.taskId,
          event: QueueEvent.AGENT_MESSAGE,
          thought: MAX_ITERATION_RESPONSE,
          message: state.messages.map((message) => message.toDict()),
          answer: MAX_ITERATION_RESPONSE,
          latency: 0,
        }),
      );
      state.emit(
        createAgentThought({
          id: randomUUID(),
          taskId: state.taskId,
          event: QueueEvent.AGENT_END,
        }),
      );
      return {
        messages: [new AIMessage(MAX_ITERATION_RESPONSE)],
      };
    }

    const startAt = Date.now();
    const id = randomUUID();

    // 准备LLM客户端，如果支持工具绑定则绑定工具
    let llmClient = llm;
    if (
      llm instanceof BaseChatModel &&
      llm.bindTools &&
      typeof llm.bindTools === 'function' &&
      agentConfig.tools.length > 0
    ) {
      llmClient = llm.bindTools(agentConfig.tools) as BaseChatModel;
    }

    // 流式调用LLM
    const chunks = await (llmClient as BaseChatModel).stream(state.messages);
    let gathered: AIMessageChunk | null = null;
    let generationType = '';

    // 处理流式响应
    for await (const chunk of chunks) {
      if (gathered === null) {
        gathered = chunk;
      } else {
        gathered = gathered.concat(chunk);
      }

      // 确定生成类型（工具调用或普通消息）
      if (generationType === '') {
        if (chunk.tool_calls && chunk.tool_calls.length > 0) {
          generationType = 'thought';
        } else if (chunk.content) {
          generationType = 'message';
        }
      }

      // 如果是普通消息，处理内容过滤并发射事件
      if (generationType === 'message') {
        const reviewConfig = agentConfig.reviewConfig;
        let content = chunk.content as string;

        // 如果启用输出过滤，替换敏感关键词
        if (reviewConfig.enable && reviewConfig.outputsConfig.enable) {
          for (const keyword of reviewConfig.keywords) {
            const regex = new RegExp(
              keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
              'gi',
            );
            content = content.replace(regex, '**');
          }
        }

        state.emit(
          createAgentThought({
            id,
            taskId: state.taskId,
            event: QueueEvent.AGENT_MESSAGE,
            thought: content,
            message: state.messages.map((message) => message.toDict()),
            answer: content,
            latency: Date.now() - startAt,
          }),
        );
      }
    }

    // 检查是否成功生成消息
    if (gathered === null) {
      state.emit(
        createErrorAgentThought(state.taskId, new Error('LLM 生成消息失败')),
      );
      log.error(
        'LLM 生成消息失败, state.messages={%s}',
        JSON.stringify(state.messages.map((message) => message.toDict())),
      );
      throw new InternalServerErrorException('LLM 生成消息失败');
    }

    // 根据生成类型发射相应事件
    if (generationType === 'thought') {
      state.emit(
        createAgentThought({
          id,
          taskId: state.taskId,
          event: QueueEvent.AGENT_THOUGHT,
          thought: JSON.stringify(gathered.tool_calls),
          message: state.messages.map((message) => message.toDict()),
          latency: Date.now() - startAt,
        }),
      );
    }

    if (generationType === 'message') {
      state.emit(
        createAgentThought({
          id: randomUUID(),
          taskId: state.taskId,
          event: QueueEvent.AGENT_END,
        }),
      );
    }

    return {
      messages: [gathered],
      iterationCount: state.iterationCount + 1,
    };
  };

  /**
   * 工具执行节点
   *
   * 执行LLM调用的工具，包括：
   * - 工具参数验证
   * - 工具调用执行
   * - 错误处理
   * - 结果记录
   *
   * @param state - 当前智能体状态
   * @returns 更新后的状态部分
   */
  const toolsNode = async (
    state: AgentStateType,
  ): Promise<Partial<AgentStateType>> => {
    // 创建工具名称到工具实例的映射
    const toolNameMap = new Map<string, StructuredTool>(
      agentConfig.tools.map((tool) => [tool.name, tool]),
    );

    const aiMessage = state.messages[state.messages.length - 1] as AIMessage;
    const toolCalls = aiMessage.tool_calls ?? [];

    const toolMessages: ToolMessage[] = [];
    try {
      // 逐个执行工具调用
      for (const toolCall of toolCalls) {
        if (!toolCall.id) {
          log.error('工具调用 ID 不存在, toolCall.name={%s}', toolCall.name);
          throw new Error('工具调用 ID 不存在');
        }

        const id = randomUUID();
        const startAt = Date.now();
        let result: unknown = null;

        try {
          // 查找并执行工具
          const tool = toolNameMap.get(toolCall.name);
          if (!tool) {
            log.error('工具不存在, toolCall.name={%s}', toolCall.name);
            throw new Error('工具不存在');
          }
          result = await tool.invoke(toolCall.args);
        } catch (err) {
          log.error(
            '工具调用失败, toolCall.name={%s}, toolCall.args={%s}, error={%o}',
            toolCall.name,
            JSON.stringify(toolCall.args),
            err,
          );
          result = `工具执行出错: ${JSON.stringify(err)}`;
        }

        // 创建工具消息
        toolMessages.push(
          new ToolMessage({
            content: JSON.stringify(result),
            name: toolCall.name,
            tool_call_id: toolCall.id,
          }),
        );

        // 根据工具类型确定事件类型
        const event =
          toolCall.name === DATASET_RETRIEVAL_TOOL_NAME
            ? QueueEvent.DATASET_RETRIEVAL
            : QueueEvent.AGENT_ACTION;

        // 发射工具执行事件
        state.emit(
          createAgentThought({
            id,
            taskId: state.taskId,
            event,
            observation: JSON.stringify(result),
            tool: toolCall.name,
            toolInput: toolCall.args,
            latency: Date.now() - startAt,
          }),
        );
      }
    } catch (error) {
      log.error('Tool 节点执行出错, error={%o}', error);
      state.emit(
        createErrorAgentThought(
          state.taskId,
          new Error(`Tool 节点执行出错: ${JSON.stringify(error)}`),
        ),
      );
      throw new InternalServerErrorException('Tool 节点执行出错');
    }

    return {
      messages: toolMessages,
    };
  };

  /**
   * 预设操作条件判断
   *
   * 检查预设操作节点是否需要继续执行或结束
   *
   * @param state - 当前智能体状态
   * @returns 下一个节点的名称
   */
  const presetOperationCondition = (state: AgentStateType) => {
    const message = state.messages[state.messages.length - 1];
    if (isAIMessage(message)) {
      return END; // 如果已经生成了AI消息，结束执行
    }
    return 'long_term_memory_recall'; // 否则继续到长期记忆召回
  };

  /**
   * LLM 条件判断
   *
   * 检查LLM节点是否需要调用工具或结束
   *
   * @param state - 当前智能体状态
   * @returns 下一个节点的名称
   */
  const llmCondition = (state: AgentStateType) => {
    const message = state.messages[state.messages.length - 1] as AIMessage;
    if (message.tool_calls && message.tool_calls.length > 0) {
      return 'tools'; // 如果有工具调用，执行工具节点
    }
    return END; // 否则结束执行
  };

  /**
   * 构建状态图
   *
   * 创建完整的智能体执行流程图，包括：
   * - 节点定义和连接
   * - 条件边（条件判断）
   * - 停止检查包装
   *
   * @returns 编译后的状态图实例
   */
  const buildGraph = () => {
    const graph = new StateGraph(AgentState)
      // 添加所有执行节点
      .addNode('preset_operation', withStopCheck(presetOperationNode))
      .addNode(
        'long_term_memory_recall',
        withStopCheck(longTermMemoryRecallNode),
      )
      .addNode('llm', withStopCheck(llmNode))
      .addNode('tools', withStopCheck(toolsNode))

      // 设置起始边
      .addEdge(START, 'preset_operation')

      // 设置条件边
      .addConditionalEdges(
        'preset_operation',
        stopCondition(presetOperationCondition),
      )
      .addConditionalEdges('long_term_memory_recall', stopCondition('llm'))
      .addConditionalEdges('llm', stopCondition(llmCondition))
      .addConditionalEdges('tools', stopCondition('llm'))

      // 编译图
      .compile();

    return graph;
  };

  return buildGraph();
};
