/**
 * 工具函数集合
 *
 * 这个模块提供了一系列实用的工具函数，主要用于：
 * 1. 类名合并和样式处理
 * 2. 键盘事件处理
 * 3. 错误消息处理
 *
 * 这些函数被设计为可重用的工具，用于提高代码的可维护性和开发效率。
 * 所有函数都是纯函数，不依赖外部状态。
 */

import { type ClassValue, clsx } from 'clsx';
import type { KeyboardEventHandler } from 'react';
import { twMerge } from 'tailwind-merge';

/**
 * 智能合并类名
 *
 * 使用 clsx 和 tailwind-merge 来智能合并类名，特别适用于处理 Tailwind CSS 的类名冲突。
 * 这个函数可以处理多种类型的输入，包括字符串、对象和数组。
 *
 * @param {...ClassValue[]} inputs - 要合并的类名数组，可以是字符串、对象或数组
 * @returns {string} 合并后的类名字符串，已解决所有冲突
 *
 * @example
 * ```tsx
 * // 基本用法
 * cn('px-2 py-1', 'bg-red-500')
 *
 * // 条件类名
 * cn('base-class', { 'active': isActive })
 *
 * // 合并多个类名
 * cn('text-sm', 'font-bold', { 'text-red-500': isError })
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 键盘事件处理函数
 *
 * 将 Enter 键和空格键的按下事件转换为点击事件，提高键盘可访问性。
 * 这个函数主要用于使非按钮元素（如 div）具有类似按钮的键盘交互行为。
 *
 * @param {KeyboardEvent} e - 键盘事件对象
 * @returns {void}
 *
 * @example
 * ```tsx
 * <div
 *   onClick={handleClick}
 *   onKeyUp={handleKeyUpAsClick}
 *   role="button"
 *   tabIndex={0}
 * >
 *   点击我
 * </div>
 * ```
 */
export const handleKeyUpAsClick: KeyboardEventHandler<HTMLElement> = (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.currentTarget.click();
  }
};

/**
 * 获取操作错误消息
 *
 * 从操作结果中提取错误消息，支持服务器错误和验证错误。
 * 这个函数主要用于统一处理 next-safe-action 返回的错误信息。
 *
 * @param {Object} actionResult - 操作结果对象
 * @param {string} [actionResult.serverError] - 服务器错误消息
 * @param {Object} [actionResult.validationErrors] - 验证错误对象
 * @param {string} defaultMsg - 默认错误消息
 * @returns {string} 格式化后的错误消息
 *
 * @example
 * ```tsx
 * const result = await someAction();
 * const errorMsg = getActionErrorMsg(result, '操作失败');
 * ```
 */
export const getActionErrorMsg = (
  actionResult:
    | {
        serverError?: string;
        validationErrors?: {
          _errors?: string[];
          [key: string]: { _errors?: string[] } | string[] | undefined;
        };
      }
    | undefined,
  defaultMsg: string,
) => {
  if (!actionResult) {
    return defaultMsg;
  }

  if (actionResult.serverError) {
    return actionResult.serverError;
  }

  if (actionResult.validationErrors) {
    const errors: string[] = [];

    // 处理顶层错误
    if (actionResult.validationErrors._errors) {
      errors.push(...actionResult.validationErrors._errors);
    }

    // 处理字段错误
    for (const [key, value] of Object.entries(actionResult.validationErrors)) {
      if (key !== '_errors' && value && '_errors' in value) {
        errors.push(...(value._errors || []));
      }
    }

    return errors.join(', ');
  }

  return defaultMsg;
};
