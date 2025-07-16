import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AvatarImage } from '@radix-ui/react-avatar';
import { format } from 'date-fns-tz';

/**
 * TimeCardFooter组件的属性类型定义
 */
type Props = {
  /** 用户昵称 */
  nickname: string;
  /** 时间戳（毫秒） */
  time: number;
  /** 时间标签，如"创建于"、"更新于"等 */
  timeLabel: string;
  /** 头像图片URL，可选 */
  avatarSrc?: string;
  /** 头像占位符文本，默认为昵称首字母 */
  avatarFallback?: string;
};

/**
 * 时间卡片底部组件
 *
 * 显示用户头像、昵称和时间信息的组合组件，常用于消息、评论等场景
 *
 * @param nickname - 用户昵称
 * @param time - 时间戳（毫秒）
 * @param timeLabel - 时间标签文本
 * @param avatarSrc - 头像图片URL（可选）
 * @param avatarFallback - 头像占位符文本（可选，默认为昵称首字母）
 * @returns 渲染的时间卡片底部组件
 *
 * @example
 * ```tsx
 * <TimeCardFooter
 *   nickname="张三"
 *   time={1703123456789}
 *   timeLabel="创建于"
 *   avatarSrc="/avatar.jpg"
 * />
 * ```
 */
const TimeCardFooter = ({
  nickname,
  time,
  timeLabel,
  avatarSrc,
  avatarFallback = nickname[0], // 默认使用昵称首字母作为头像占位符
}: Props) => {
  // 格式化显示消息：昵称 + 时间标签 + 格式化时间
  const msg = `${nickname} · ${timeLabel} ${format(time, 'MM-dd HH:mm')}`;

  return (
    <div className="flex gap-1 items-center">
      {/* 用户头像 */}
      <Avatar className="size-4">
        <AvatarImage src={avatarSrc} alt={nickname} />
        <AvatarFallback className="text-xs bg-primary text-background">
          {avatarFallback}
        </AvatarFallback>
      </Avatar>
      {/* 时间信息文本 */}
      <p className="text-xs text-muted-foreground">{msg}</p>
    </div>
  );
};

export default TimeCardFooter;
