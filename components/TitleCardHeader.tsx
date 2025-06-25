import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

/**
 * TitleCardHeader 组件的属性接口
 */
type Props = {
  /** 标题内容，支持字符串或 React 节点 */
  title: ReactNode;
  /** 副标题内容，支持字符串或 React 节点 */
  subtitle: ReactNode;
  /** 可选的右侧操作按钮或操作区域 */
  action?: ReactNode;
  /** 头像图片的 URL */
  imgSrc?: string;
  /** 头像图片的 alt 属性 */
  imgAlt: string;
  /** 头像的备用显示内容，如果不提供则使用标题的第一个字符 */
  imgFallback?: string;
  /** 头像背景颜色，支持任意 CSS 颜色值 */
  imgBgColor?: string;
  /** 是否使用圆形头像，默认为 false（方形圆角） */
  isCircleImg?: boolean;
};

/**
 * 标题卡片头部组件
 *
 * 用于显示带有头像、标题、副标题和可选操作按钮的卡片头部。
 * 常用于应用列表、工具卡片等场景。
 *
 * @param props - 组件属性
 * @param props.title - 标题内容
 * @param props.subtitle - 副标题内容
 * @param props.action - 可选的右侧操作区域
 * @param props.imgSrc - 头像图片 URL
 * @param props.imgAlt - 头像图片 alt 属性
 * @param props.imgFallback - 头像备用显示内容
 * @param props.imgBgColor - 头像背景颜色
 * @param props.isCircleImg - 是否使用圆形头像
 *
 * @example
 * ```tsx
 * <TitleCardHeader
 *   title="应用名称"
 *   subtitle="应用描述"
 *   imgSrc="/app-icon.png"
 *   imgAlt="应用图标"
 *   action={<Button>操作</Button>}
 * />
 * ```
 */
const TitleCardHeader = ({
  title,
  subtitle,
  action,
  imgSrc,
  imgAlt,
  imgFallback,
  imgBgColor,
  isCircleImg = false,
}: Props) => {
  // 如果标题是字符串且没有提供 imgFallback，使用标题的第一个字符作为备用显示
  if (typeof title === 'string' && !imgFallback) {
    imgFallback = title[0];
  }

  return (
    <div className="flex items-center gap-3">
      {/* 头像区域 */}
      <Avatar
        className={cn(
          'shrink-0 size-10',
          imgBgColor ? `bg-[${imgBgColor}]` : 'bg-transparent',
          isCircleImg ? 'rounded-full' : 'rounded-lg',
        )}
      >
        <AvatarImage src={imgSrc} alt={imgAlt} />
        <AvatarFallback>{imgFallback}</AvatarFallback>
      </Avatar>

      {/* 标题和副标题区域 */}
      <div className="grow">
        <div className="text-base font-bold">{title}</div>
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      </div>

      {/* 可选的右侧操作区域 */}
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

export default TitleCardHeader;
