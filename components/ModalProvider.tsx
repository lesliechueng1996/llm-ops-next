/**
 * @fileoverview 模态框状态管理上下文提供者
 * 该文件提供了一个全局的模态框状态管理方案，通过 React Context 实现模态框的开启和关闭状态管理
 */

'use client';

import { createContext, type ReactNode, useState } from 'react';

/**
 * 模态框上下文类型定义
 * @typedef {Object} ModalContextType
 * @property {string | null} modalName - 当前打开的模态框名称，null 表示没有模态框打开
 * @property {boolean} isOpen - 模态框是否打开
 * @property {Function} openModal - 打开指定名称的模态框
 * @property {Function} closeModal - 关闭当前模态框
 */
type ModalContextType = {
  modalName: string | null;
  isOpen: boolean;
  openModal: (name: string) => void;
  closeModal: () => void;
};

/**
 * 模态框上下文对象
 * 提供模态框状态管理的上下文，初始值为 null
 */
export const ModalContext = createContext<ModalContextType | null>(null);

/**
 * 模态框上下文提供者组件
 *
 * 该组件为其子组件提供模态框状态管理功能，包括：
 * - 跟踪当前打开的模态框名称
 * - 管理模态框开启/关闭状态
 * - 提供打开和关闭模态框的方法
 *
 * @param {Object} props - 组件属性
 * @param {ReactNode} props.children - 子组件
 * @returns {JSX.Element} 包裹了模态框上下文的组件
 *
 * @example
 * ```tsx
 * <ModalProvider>
 *   <App />
 * </ModalProvider>
 * ```
 */
const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [modalName, setModalName] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ModalContext.Provider
      value={{
        modalName,
        isOpen,
        openModal: (name: string) => {
          setModalName(name);
          setIsOpen(true);
        },
        closeModal: () => {
          setModalName(null);
          setIsOpen(false);
        },
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};

export default ModalProvider;
