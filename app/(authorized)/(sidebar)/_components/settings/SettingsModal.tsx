/**
 * SettingsModal 组件
 *
 * 一个模态对话框组件，用于显示和管理用户设置。
 * 包含两个主要标签页：
 * 1. 账号设置 - 用于管理用户账号相关信息
 * 2. 发布渠道 - 用于管理内容发布渠道设置
 *
 * @component
 * @param {Object} props - 组件属性
 * @param {boolean} props.open - 控制模态框是否显示
 * @param {function} props.onOpenChange - 模态框显示状态改变时的回调函数
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useState } from 'react';
import AccountSettings from './AccountSettings';
import ChannelSettings from './ChannelSettings';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const SettingsModal = ({ open, onOpenChange }: Props) => {
  // 当前激活的标签页状态
  const [activeTab, setActiveTab] = useState<'account' | 'channel'>('account');

  // 处理标签页切换
  const handleTabClick = (tab: 'account' | 'channel') => () => {
    setActiveTab(tab);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="lg:max-w-4xl md:max-w-3xl sm:max-w-xl">
        {/* 模态框标题和描述 */}
        <DialogHeader>
          <DialogTitle>设置</DialogTitle>
          <VisuallyHidden asChild>
            <DialogDescription>设置账号信息与发布渠道</DialogDescription>
          </VisuallyHidden>
        </DialogHeader>
        {/* 主要内容区域：左侧导航 + 右侧内容 */}
        <div className="w-full flex min-h-[500px] max-h-[600px]">
          {/* 左侧导航栏 */}
          <div className="w-1/4 py-3 pr-6 space-y-1.5">
            <button
              type="button"
              className={cn(
                'block w-full text-left py-2 px-3 text-sm rounded-lg hover:bg-muted transition-all cursor-pointer',
                activeTab === 'account' ? 'bg-muted' : '',
              )}
              onClick={handleTabClick('account')}
            >
              账号设置
            </button>
            <button
              type="button"
              className={cn(
                'block w-full text-left py-2 px-3 text-sm rounded-lg hover:bg-muted transition-all cursor-pointer',
                activeTab === 'channel' ? 'bg-muted' : '',
              )}
              onClick={handleTabClick('channel')}
            >
              发布渠道
            </button>
          </div>
          <Separator orientation="vertical" className="h-full" />
          {/* 右侧内容区域 */}
          <div className="w-3/4 pl-6 py-3 -translate-y-0.5">
            {activeTab === 'account' ? (
              <AccountSettings />
            ) : (
              <ChannelSettings />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
