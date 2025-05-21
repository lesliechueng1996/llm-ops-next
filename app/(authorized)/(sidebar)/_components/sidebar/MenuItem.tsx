/**
 * MenuItem 组件
 *
 * 这是一个用于侧边栏导航的菜单项组件。它支持显示图标、文本标签，并能够根据激活状态显示不同的样式。
 * 组件使用 Next.js 的 Link 组件进行导航，并支持自定义激活状态的样式。
 */

import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { JSX } from 'react';

type Props = {
  /** 菜单项显示的文本标签 */
  label: string;
  /** 默认状态下显示的图标组件 */
  icon: () => JSX.Element;
  /** 激活状态下显示的图标组件 */
  activeIcon: () => JSX.Element;
  /** 点击菜单项时导航的目标路径 */
  href: string;
  /** 控制菜单项是否处于激活状态 */
  isActive: boolean;
};

const MenuItem = ({
  label,
  icon: DefaultIcon,
  activeIcon: ActiveIcon,
  href,
  isActive,
}: Props) => {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center p-2 gap-2 w-full rounded-lg text-sm hover:bg-muted transition-all',
        isActive ? 'bg-muted' : '',
      )}
    >
      {isActive ? <ActiveIcon /> : <DefaultIcon />}
      <span>{label}</span>
    </Link>
  );
};

export default MenuItem;
