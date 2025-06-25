import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

/**
 * TitleHeader 组件的属性接口
 */
type Props = {
  /** 标题文本 */
  title: string;
  /** 可选的 CSS 类名 */
  className?: string;
  /** 标题图标 */
  icon: ReactNode;
  /** 右侧内容区域 */
  children: ReactNode;
};

/**
 * 标题头部组件
 *
 * 用于显示带有图标和标题的页面头部，支持右侧自定义内容
 *
 * @param props - 组件属性
 * @param props.title - 标题文本
 * @param props.className - 可选的 CSS 类名
 * @param props.icon - 标题图标
 * @param props.children - 右侧内容区域
 * @returns 标题头部组件
 */
const TitleHeader = ({ title, className, icon, children }: Props) => {
  return (
    <header
      className={cn('flex items-center justify-between px-3 py-3', className)}
    >
      {/* 左侧标题和图标区域 */}
      <div className="flex gap-2 items-center">
        {/* 图标容器 - 使用圆形背景 */}
        <div className="p-2 bg-primary text-accent rounded-full">{icon}</div>
        {/* 标题文本 */}
        <h1 className="text-xl font-medium">{title}</h1>
      </div>
      {/* 右侧自定义内容区域 */}
      {children}
    </header>
  );
};

export default TitleHeader;
