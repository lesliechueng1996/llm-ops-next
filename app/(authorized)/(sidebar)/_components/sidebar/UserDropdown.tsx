/**
 * UserDropdown 组件
 *
 * 这是一个用户下拉菜单组件，显示当前登录用户的信息并提供相关操作选项。
 * 主要功能包括：
 * - 显示用户头像、名称和邮箱
 * - 提供账号设置入口
 * - 提供退出登录功能
 */

'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut, useSession } from '@/lib/auth/auth-client';
import { cn } from '@/lib/utils';
import { redirect } from 'next/navigation';
import { useBoolean } from 'usehooks-ts';
import SettingsModal from '../settings/SettingsModal';

type Props = {
  className?: string; // 可选的自定义样式类名
};

const UserDropdown = ({ className }: Props) => {
  // 获取当前会话信息
  const { data: session } = useSession();

  // 控制设置模态框的开关状态
  const {
    value: open,
    setValue: setOpen,
    setTrue: openModal,
  } = useBoolean(false);

  // 处理退出登录
  const handleSignOut = () => {
    signOut();
    redirect('/login');
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          {/* 用户信息展示区域 */}
          <div
            className={cn(
              'p-2 flex gap-2 items-center cursor-pointer',
              className,
            )}
          >
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarImage src={session?.user?.image ?? ''} />
              <AvatarFallback className="text-white bg-primary">
                {session?.user?.name?.substring(0, 1) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="text-start grow w-0">
              <p className="text-sm text-foreground">{session?.user?.name}</p>
              <p className="text-xs text-muted-foreground text-ellipsis w-full overflow-hidden">
                {session?.user?.email}
              </p>
            </div>
          </div>
        </DropdownMenuTrigger>
        {/* 下拉菜单选项 */}
        <DropdownMenuContent className="text-sm" align="start" side="top">
          <DropdownMenuItem className="cursor-pointer" onClick={openModal}>
            账号设置
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer text-red-700 focus:text-red-900"
            onClick={handleSignOut}
          >
            退出登录
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {/* 设置模态框组件 */}
      <SettingsModal open={open} onOpenChange={setOpen} />
    </>
  );
};

export default UserDropdown;
