import { ModalContext } from '@/components/ModalProvider';
import { useContext } from 'react';

/**
 * 自定义 Hook，用于访问模态框上下文
 *
 * 这个 Hook 提供了对 ModalContext 的访问，允许组件打开、关闭和管理模态框状态。
 * 必须在 ModalProvider 组件内部使用。
 *
 * @returns {object} 模态框上下文对象，包含模态框的状态管理方法
 * @throws {Error} 当在 ModalProvider 外部使用时抛出错误
 *
 * @example
 * ```tsx
 * const { openModal, closeModal, isOpen } = useModal();
 *
 * const handleOpenModal = () => {
 *   openModal('myModal');
 * };
 *
 * const handleCloseModal = () => {
 *   closeModal();
 * };
 * ```
 */
const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }

  return context;
};

export default useModal;
