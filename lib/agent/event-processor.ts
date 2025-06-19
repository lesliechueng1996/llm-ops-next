import { randomUUID } from 'node:crypto';
import { log } from '@/lib/logger';
import {
  type AgentThought,
  QueueEvent,
  TASK_TIMEOUT,
  createAgentThought,
} from './entity';

/**
 * 事件处理器函数类型定义
 * 用于处理代理思考事件的异步函数
 */
type handlerType = (agentThought: AgentThought) => Promise<void>;

/**
 * 创建事件处理器
 * 提供事件注册和发射功能，支持多个事件处理器
 *
 * @returns 包含 use 和 emit 方法的事件处理器对象
 *
 * @example
 * ```typescript
 * const processor = createEventProcessor();
 * processor.use(async (thought) => {
 *   console.log('处理事件:', thought);
 * });
 * await processor.emit(someAgentThought);
 * ```
 */
export const createEventProcessor = () => {
  // 存储所有注册的事件处理器
  const handlers: Array<handlerType> = [];

  return {
    /**
     * 注册事件处理器
     * @param handler - 要注册的事件处理函数
     */
    use: (handler: handlerType) => {
      handlers.push(handler);
    },
    /**
     * 发射事件到所有注册的处理器
     * @param agentThought - 要发射的代理思考事件
     */
    emit: async (agentThought: AgentThought) => {
      // 依次调用所有注册的处理器
      for (const handler of handlers) {
        await handler(agentThought);
      }
    },
  };
};

// 心跳间隔时间（毫秒）
const PING_INTERVAL = 10000;

/**
 * 为事件发射器添加心跳和超时监控功能
 *
 * 这个函数包装原始的 emit 函数，添加以下功能：
 * 1. 定期发送心跳事件（PING）
 * 2. 监控超时并在超时时发送超时事件
 * 3. 提供清理方法停止监控
 *
 * @param emit - 原始的事件发射函数
 * @param taskId - 任务ID，用于标识相关的事件
 * @returns 包装后的发射函数，包含 stop 方法用于清理资源
 *
 * @example
 * ```typescript
 * const wrappedEmit = wrapEmitWithPing(originalEmit, 'task-123');
 *
 * // 使用包装后的发射器
 * wrappedEmit(someEvent);
 *
 * // 清理资源
 * wrappedEmit.stop();
 * ```
 */
export const wrapEmitWithPing = (
  emit: (event: AgentThought) => void,
  taskId: string,
) => {
  // 记录最后一次发射事件的时间
  let lastEmitTime = Date.now();

  // 设置超时定时器
  const timeout = setTimeout(() => {
    log.info('Agent timeout');
    emit(
      createAgentThought({
        id: randomUUID(),
        taskId,
        event: QueueEvent.TIMEOUT,
      }),
    );
  }, TASK_TIMEOUT);

  // 设置心跳定时器
  const interval = setInterval(() => {
    log.info('Agent ping');
    const now = Date.now();
    // 如果距离上次发射事件的时间超过心跳间隔，发送心跳事件
    if (now - lastEmitTime > PING_INTERVAL) {
      emit(
        createAgentThought({
          id: randomUUID(),
          taskId,
          event: QueueEvent.PING,
        }),
      );
      lastEmitTime = now;
    }
  }, PING_INTERVAL);

  /**
   * 包装后的发射函数
   * 每次发射事件时更新最后发射时间
   */
  const wrapEmit = (event: AgentThought) => {
    lastEmitTime = Date.now();
    emit(event);
  };

  /**
   * 停止心跳和超时监控
   * 清理所有定时器资源
   */
  wrapEmit.stop = () => {
    clearInterval(interval);
    clearTimeout(timeout);
  };

  return wrapEmit;
};
