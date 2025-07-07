import type { ReactNode } from 'react';
import TitleHeader from '../_components/header/TitleHeader';
import { UserFillIcon } from '../_components/icons';
import SpaceHeader from './_components/SpaceHeader';

/**
 * Props for the SpaceLayout component
 */
type Props = {
  /** 子组件内容 */
  children: ReactNode;
  /** 操作按钮或组件，显示在标题头部右侧 */
  action: ReactNode;
};

/**
 * 个人空间布局组件
 *
 * 提供个人空间页面的基础布局结构，包含：
 * - 标题头部：显示"个人空间"标题和用户图标
 * - 空间头部：显示空间相关的头部信息
 * - 内容区域：渲染子组件
 *
 * @param props - 组件属性
 * @param props.children - 页面主要内容
 * @param props.action - 显示在标题头部右侧的操作组件
 * @returns 个人空间布局的 JSX 元素
 */
const SpaceLayout = ({ children, action }: Props) => {
  return (
    <div className="h-full flex flex-col">
      <TitleHeader
        className="mb-1 shrink-0 min-h-0"
        title="个人空间"
        icon={<UserFillIcon />}
      >
        {action}
      </TitleHeader>
      <SpaceHeader className="mb-2 shrink-0 min-h-0" />
      <div className="grow min-h-0">{children}</div>
    </div>
  );
};

export default SpaceLayout;
