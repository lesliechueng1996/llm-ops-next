/**
 * 侧边栏布局组件
 *
 * 这个组件提供了一个带有侧边栏的基础布局结构，用于需要侧边导航的页面。
 * 它包含一个固定宽度的侧边栏和一个可伸缩的主内容区域。
 */

import type { ReactNode } from 'react';
import Sidebar from './_components/sidebar/Sidebar';

type Props = {
  children: ReactNode;
};

/**
 * SidebarLayout 组件
 *
 * @param {Props} props - 组件属性
 * @param {ReactNode} props.children - 要渲染的子组件
 * @returns {JSX.Element} 带有侧边栏的布局组件
 */
const SidebarLayout = ({ children }: Props) => {
  return (
    <div className="h-screen w-screen flex bg-muted">
      {/* 固定宽度的侧边栏 */}
      <Sidebar className="w-60 h-screen shrink-0" />

      {/* 主内容区域，可伸缩 */}
      <div className="grow p-3 h-screen">{children}</div>
    </div>
  );
};

export default SidebarLayout;
