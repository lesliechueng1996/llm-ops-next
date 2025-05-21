/**
 * Sidebar 组件
 *
 * 这是应用的主侧边栏组件，包含以下主要功能：
 * - 显示应用 Logo
 * - 提供创建 AI 应用的快捷按钮
 * - 展示主导航菜单（主页、个人空间）
 * - 展示探索菜单（应用广场、插件广场、开放API）
 * - 显示用户下拉菜单
 *
 * @component
 * @param {Object} props - 组件属性
 * @param {string} [props.className] - 可选的 CSS 类名
 */

'use client';

import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { usePathname } from 'next/navigation';
import {
  AppFillIcon,
  AppIcon,
  HomeFillIcon,
  HomeIcon,
  OpenFillIcon,
  OpenIcon,
  ToolFillIcon,
  ToolIcon,
  UserFillIcon,
  UserIcon,
} from '../icons';
import MenuItem from './MenuItem';
import UserDropdown from './UserDropdown';

type Props = {
  className?: string;
};

// 主导航菜单配置
const menus = [
  { label: '主页', href: '/home', icon: HomeIcon, activeIcon: HomeFillIcon },
  {
    label: '个人空间',
    href: '/space',
    icon: UserIcon,
    activeIcon: UserFillIcon,
  },
];

// 探索菜单配置
const discoverMenus = [
  {
    label: '应用广场',
    href: '/store/apps',
    icon: AppIcon,
    activeIcon: AppFillIcon,
  },
  {
    label: '插件广场',
    href: '/store/tools',
    icon: ToolIcon,
    activeIcon: ToolFillIcon,
  },
  { label: '开放API', href: '/open', icon: OpenIcon, activeIcon: OpenFillIcon },
];

const Sidebar = ({ className }: Props) => {
  // 获取当前路径用于高亮显示活动菜单项
  const pathname = usePathname();

  return (
    <aside className={cn('p-2', className)}>
      {/* 侧边栏主容器 */}
      <div className="bg-white rounded-lg h-full px-2 py-4 flex flex-col gap-2">
        {/* Logo 部分 */}
        <Logo className="mb-5 shrink-0 cursor-pointer" href="/home" />

        {/* 创建 AI 应用按钮 */}
        <Button className="w-full mb-4 shrink-0">
          <Plus /> 创建 AI 应用
        </Button>

        {/* 导航菜单区域 */}
        <div className="space-y-2 grow">
          {/* 渲染主导航菜单 */}
          {menus.map((menu) => (
            <MenuItem
              key={menu.label}
              {...menu}
              isActive={pathname.startsWith(menu.href)}
            />
          ))}
          {/* 探索菜单标题 */}
          <h2 className="text-sm text-muted-foreground px-2">探索</h2>
          {/* 渲染探索菜单 */}
          {discoverMenus.map((menu) => (
            <MenuItem
              key={menu.label}
              {...menu}
              isActive={pathname.startsWith(menu.href)}
            />
          ))}
        </div>

        {/* 用户下拉菜单 */}
        <UserDropdown className="shrink-0" />
      </div>
    </aside>
  );
};

export default Sidebar;
