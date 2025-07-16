/**
 * API 工具卡片组件
 *
 * 用于展示 API 工具的详细信息，包括工具描述、创建时间、作者信息等。
 * 提供点击交互功能，用户可以点击卡片查看或使用工具。
 */
'use client';

import BaseCard from '@/components/BaseCard';
import TimeCardFooter from '@/components/TimeCardFooter';
import ApiToolCardHeader from './ApiToolCardHeader';
import type { ComponentProps } from 'react';

type Props = {
  /** 工具描述信息 */
  description: string;
  /** 创建时间戳 */
  createdAt: number;
  /** 点击事件处理函数 */
  onClick: () => void;
  /** 作者的名称 */
  authorName: string;
  /** 作者的头像 */
  authorAvatar?: string;
} & ComponentProps<typeof ApiToolCardHeader>;

/**
 * API 工具卡片组件
 *
 * 展示 API 工具的基本信息和操作入口。卡片包含三个部分：
 * - 头部：工具名称、状态等信息
 * - 中间：工具描述信息
 * - 底部：作者信息和发布时间
 *
 * @param description - 工具的描述信息
 * @param createdAt - 工具的创建时间戳
 * @param onClick - 点击卡片时的回调函数
 * @param authorName - 工具作者的名称
 * @param authorAvatar - 工具作者的头像URL，可选
 * @param headerProps - 传递给 ApiToolCardHeader 组件的其他属性
 * @returns 返回一个包含工具信息的卡片组件
 */
const ApiToolCard = ({
  description,
  createdAt,
  onClick,
  authorAvatar,
  authorName,
  ...headerProps
}: Props) => {
  // 构建卡片头部组件
  const header = <ApiToolCardHeader {...headerProps} authorName={authorName} />;

  // 构建卡片底部组件，显示用户信息和发布时间
  const footer = (
    <TimeCardFooter
      nickname={authorName}
      avatarSrc={authorAvatar}
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

export default ApiToolCard;
