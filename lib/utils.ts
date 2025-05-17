/**
 * 工具函数集合
 *
 * 提供了一些常用的工具函数，包括类名合并和键盘事件处理。
 */

import { type ClassValue, clsx } from 'clsx';
import type { KeyboardEventHandler } from 'react';
import { twMerge } from 'tailwind-merge';

/**
 * 合并类名
 * 使用 clsx 和 tailwind-merge 来智能合并类名，处理 Tailwind CSS 的类名冲突。
 *
 * @param {...ClassValue[]} inputs - 要合并的类名数组
 * @returns {string} 合并后的类名字符串
 *
 * @example
 * ```tsx
 * cn('px-2 py-1', 'bg-red-500', { 'text-white': true })
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 键盘事件处理函数
 * 将 Enter 键和空格键的按下事件转换为点击事件。
 * 用于提高键盘可访问性。
 *
 * @param {KeyboardEvent} e - 键盘事件对象
 */
export const handleKeyUpAsClick: KeyboardEventHandler<HTMLElement> = (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.currentTarget.click();
  }
};
