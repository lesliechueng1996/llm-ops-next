import { Card } from '@/components/ui/card';
import { cn, handleKeyUpAsClick } from '@/lib/utils';
import type { ReactNode } from 'react';

/**
 * BaseCard 组件的属性接口
 */
type Props = {
  /** 卡片顶部内容 */
  top: ReactNode;
  /** 卡片中间内容，支持多行文本显示 */
  middle: ReactNode;
  /** 卡片底部内容 */
  bottom: ReactNode;
  /** 可选的 CSS 类名 */
  className?: string;
  /** 可选的点击事件处理函数 */
  onClick?: () => void;
};

/**
 * BaseCard 组件
 *
 * 一个通用的卡片组件，具有固定的布局结构：
 * - 顶部区域：用于显示标题、图标等
 * - 中间区域：用于显示主要内容，支持多行文本
 * - 底部区域：用于显示操作按钮、状态信息等
 *
 * 支持点击交互和键盘导航（当提供 onClick 时）
 *
 * @param props - 组件属性
 * @param props.top - 卡片顶部内容
 * @param props.middle - 卡片中间内容
 * @param props.bottom - 卡片底部内容
 * @param props.className - 可选的 CSS 类名
 * @param props.onClick - 可选的点击事件处理函数
 * @returns 渲染的卡片组件
 */
const BaseCard = ({ top, middle, bottom, className, onClick }: Props) => {
  return (
    <Card
      className={cn(
        'w-96 h-48 flex flex-col p-4', // 固定宽度和高度，垂直布局，内边距
        className,
        onClick && 'cursor-pointer', // 当有点击事件时显示指针光标
      )}
      tabIndex={onClick ? 0 : undefined} // 当有点击事件时允许键盘导航
      onClick={onClick}
      onKeyUp={handleKeyUpAsClick} // 支持回车键和空格键触发点击
    >
      {/* 顶部区域：固定高度，不收缩 */}
      <div className="min-h-o shrink-0">{top}</div>

      {/* 中间区域：可增长，支持多行文本截断 */}
      <div className="min-h-0 grow py-3 text-sm text-muted-foreground line-clamp-5">
        {middle}
      </div>

      {/* 底部区域：固定高度，不收缩 */}
      <div className="min-h-0 shrink-0">{bottom}</div>
    </Card>
  );
};

export default BaseCard;
