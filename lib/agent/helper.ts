/**
 * Agent Helper Module
 *
 * 这个模块提供了代理（Agent）执行过程中的辅助功能，主要包括：
 * - 任务停止控制机制
 * - 停止检查装饰器
 * - 停止条件判断
 *
 * 使用 Redis 来管理任务的停止状态，支持跨进程的任务控制。
 */

import { redisClient } from '@/lib/redis';
import { createAgentThought, QueueEvent, type AgentStateType } from './entity';
import { randomUUID } from 'node:crypto';
import { END } from '@langchain/langgraph';

/** Redis 中存储任务停止状态的键模板 */
const TASK_STOP_KEY = 'generate_task_stopped:{task_id}';

/**
 * 检查指定任务是否被标记为停止
 *
 * @param taskId - 任务ID
 * @returns Promise<boolean> - 如果任务被标记为停止返回 true，否则返回 false
 */
export const checkForStop = async (taskId: string) => {
  const key = TASK_STOP_KEY.replace('{task_id}', taskId);
  const value = await redisClient.exists(key);
  return value === 1;
};

/**
 * 清除指定任务的停止标记
 *
 * @param taskId - 任务ID
 */
export const clearStopFlag = async (taskId: string) => {
  const key = TASK_STOP_KEY.replace('{task_id}', taskId);
  await redisClient.del(key);
};

/**
 * 设置指定任务的停止标记
 *
 * 标记会在 Redis 中保存 300 秒（5分钟）后自动过期
 *
 * @param taskId - 任务ID
 */
export const setStopFlag = async (taskId: string) => {
  const key = TASK_STOP_KEY.replace('{task_id}', taskId);
  await redisClient.set(key, '1', 'EX', 300);
};

/**
 * 停止检查装饰器
 *
 * 这个高阶函数包装一个代理函数，在执行前检查任务是否被标记为停止。
 * 如果任务被停止，会发出停止事件并返回停止状态。
 *
 * @param fn - 要包装的代理函数
 * @returns 包装后的函数，包含停止检查逻辑
 */
export const withStopCheck = (
  fn: (
    state: AgentStateType,
  ) => Promise<Partial<AgentStateType>> | Partial<AgentStateType>,
) => {
  return async (state: AgentStateType) => {
    const { taskId, emit } = state;

    // 检查任务是否被标记为停止
    const isStopped = await checkForStop(taskId);
    if (isStopped) {
      // 发出停止事件
      emit(
        createAgentThought({
          id: randomUUID(),
          taskId,
          event: QueueEvent.STOP,
        }),
      );
      // 返回停止状态
      return {
        stop: true,
      };
    }

    // 如果任务未被停止，执行原始函数
    return fn(state);
  };
};

/**
 * 停止条件判断函数
 *
 * 根据代理状态中的 stop 标志决定下一步操作。
 * 如果 stop 为 true，返回 END 表示结束执行；
 * 否则根据 next 参数决定下一步。
 *
 * @param next - 下一步节点名称或返回节点名称的函数
 * @returns 返回停止条件判断函数
 */
export const stopCondition =
  (next: string | ((state: AgentStateType) => string)) =>
  (state: AgentStateType) => {
    const stop = state.stop;

    // 如果任务被停止，返回 END 结束执行
    if (stop) {
      return END;
    }

    // 否则根据 next 参数决定下一步
    return typeof next === 'function' ? next(state) : next;
  };
