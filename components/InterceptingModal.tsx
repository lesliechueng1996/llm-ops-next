'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogPortal,
} from '@/components/ui/dialog';
import useModal from '@/hooks/useModal';
import { type ReactNode, useEffect, useState } from 'react';

/**
 * 拦截式模态框组件的属性接口
 */
type Props = {
  /** 模态框标题 */
  title: string;
  /** 模态框描述信息 */
  description: string;
  /** 模态框内容 */
  children: ReactNode;
  /** 模态框唯一标识名称，用于控制显示/隐藏 */
  name: string;
  /** 模态框关闭回调 */
  onClose?: () => void;
};

/**
 * 拦截式模态框组件
 *
 * 这是一个可控制的模态框组件，通过全局的 useModal hook 来管理显示状态。
 * 当 modalName 匹配组件的 name 属性且 isOpen 为 true 时，模态框会显示。
 *
 * @description 特性：
 * - 使用 Dialog 组件构建，提供无障碍支持
 * - 通过 useModal hook 进行全局状态管理
 * - 支持可滚动的内容区域（最大高度 600px）
 * - 自动处理打开/关闭状态同步
 *
 * @param props - 组件属性
 * @returns 拦截式模态框组件
 *
 * @example
 * ```tsx
 * <InterceptingModal
 *   title="确认删除"
 *   description="此操作不可撤销"
 *   name="deleteConfirm"
 * >
 *   <p>确定要删除这个项目吗？</p>
 * </InterceptingModal>
 * ```
 */
const InterceptingModal = ({
  title,
  description,
  children,
  name,
  onClose,
}: Props) => {
  const [open, setOpen] = useState(false);
  const { modalName, isOpen, closeModal } = useModal();

  useEffect(() => {
    if (modalName === null && !isOpen) {
      setOpen(false);
      return;
    }
    if (modalName === name && isOpen) {
      setOpen(true);
      return;
    }
  }, [modalName, name, isOpen]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose?.();
      closeModal();
    }
    setOpen(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPortal>
        <DialogContent className="min-w-xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[600px] overflow-y-auto no-scrollbar">
            {children}
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};

export default InterceptingModal;
