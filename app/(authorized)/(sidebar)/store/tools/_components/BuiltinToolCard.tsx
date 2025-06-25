import BaseCard from '@/components/BaseCard';
import TimeCardFooter from '@/components/TimeCardFooter';
import type { ComponentProps } from 'react';
import BuiltinToolCardHeader from './BuiltinToolCardHeader';
import { useSession } from '@/lib/auth/auth-client';

/**
 * 内置工具卡片的属性接口
 */
type Props = {
  /** 工具描述信息 */
  description: string;
  /** 创建时间戳 */
  createdAt: number;
  /** 点击事件处理函数 */
  onClick: () => void;
} & ComponentProps<typeof BuiltinToolCardHeader>;

/**
 * 内置工具卡片组件
 *
 * 用于展示内置工具的卡片，包含工具头部信息、描述和底部时间信息
 *
 * @param description - 工具描述
 * @param createdAt - 创建时间戳
 * @param onClick - 点击事件处理函数
 * @param headerProps - 传递给BuiltinToolCardHeader的属性
 * @returns 渲染的内置工具卡片
 */
const BuiltinToolCard = ({
  description,
  createdAt,
  onClick,
  ...headerProps
}: Props) => {
  // 获取当前用户会话信息
  const { data: session } = useSession();

  // 构建卡片头部组件
  const header = <BuiltinToolCardHeader {...headerProps} />;

  // 构建卡片底部组件，显示用户信息和发布时间
  const footer = (
    <TimeCardFooter
      nickname="Leslie"
      avatarSrc={session?.user?.image ?? undefined}
      time={createdAt}
      timeLabel="发布时间"
    />
  );

  return (
    <BaseCard
      top={header}
      middle={description}
      bottom={footer}
      onClick={onClick}
    />
  );
};

export default BuiltinToolCard;
