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
import {
  createAgentThought,
  QueueEvent,
  TASK_TIMEOUT,
  type AgentStateType,
} from './entity';
import { randomUUID } from 'node:crypto';
import { END } from '@langchain/langgraph';
import { InvokeFrom } from '@/lib/entity';

/** Redis 中存储任务停止状态的键模板 */
const TASK_STOP_KEY = 'generate_task_stopped:{task_id}';
/** Redis 中存储任务所属的缓存键模板 */
const TASK_BELONG_CACHE_KEY = 'generate_task_belong:{task_id}';

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

/**
 * 设置任务归属缓存
 *
 * 将任务ID与用户信息关联存储在Redis中，用于后续的权限验证。
 * 缓存会根据不同的调用来源（Web应用、调试器、API等）设置不同的用户前缀。
 *
 * @param taskId - 任务ID
 * @param invokeFrom - 调用来源（WEB_APP、DEBUGGER、API等）
 * @param userId - 用户ID
 */
export const setTaskBelongCache = async (
  taskId: string,
  invokeFrom: InvokeFrom,
  userId: string,
) => {
  const key = TASK_BELONG_CACHE_KEY.replace('{task_id}', taskId);
  // 根据调用来源确定用户前缀
  // Web应用和调试器使用 'account' 前缀，其他使用 'end-user' 前缀
  const userPrefix = [InvokeFrom.WEB_APP, InvokeFrom.DEBUGGER].includes(
    invokeFrom,
  )
    ? 'account'
    : 'end-user';

  // 设置缓存，过期时间与任务超时时间一致
  await redisClient.set(key, `${userPrefix}-${userId}`, 'EX', TASK_TIMEOUT);
};

/**
 * 检查任务归属权限
 *
 * 验证指定用户是否有权限操作指定的任务。
 * 通过比较Redis中存储的用户信息与当前请求的用户信息来判断权限。
 *
 * @param taskId - 任务ID
 * @param invokeFrom - 调用来源（WEB_APP、DEBUGGER、API等）
 * @param userId - 用户ID
 * @returns Promise<boolean> - 如果用户有权限返回 true，否则返回 false
 */
export const doTaskBelongCheck = async (
  taskId: string,
  invokeFrom: InvokeFrom,
  userId: string,
) => {
  const key = TASK_BELONG_CACHE_KEY.replace('{task_id}', taskId);
  // 根据调用来源确定用户前缀，与设置缓存时保持一致
  const userPrefix = [InvokeFrom.WEB_APP, InvokeFrom.DEBUGGER].includes(
    invokeFrom,
  )
    ? 'account'
    : 'end-user';

  // 从Redis获取存储的用户信息
  const value = await redisClient.get(key);
  // 比较存储的用户信息与当前请求的用户信息
  return value === `${userPrefix}-${userId}`;
};

/**
 * 清除任务归属缓存
 *
 * 删除Redis中存储的任务归属信息，通常在任务完成后调用。
 *
 * @param taskId - 任务ID
 */
export const clearTaskBelongCache = async (taskId: string) => {
  const key = TASK_BELONG_CACHE_KEY.replace('{task_id}', taskId);
  await redisClient.del(key);
};
