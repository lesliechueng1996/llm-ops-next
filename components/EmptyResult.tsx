import { cn } from '@/lib/utils';
import { PackageOpen } from 'lucide-react';

/**
 * EmptyResult 组件的属性接口
 */
type Props = {
  /** 显示的消息文本，默认为 '暂无数据' */
  message?: string;
  /** 额外的 CSS 类名 */
  className?: string;
};

/**
 * 空结果展示组件
 *
 * 用于在数据为空或加载失败时显示友好的空状态界面
 *
 * @param message - 显示的消息文本，默认为 '暂无数据'
 * @param className - 额外的 CSS 类名，用于自定义样式
 * @returns 渲染的空结果组件
 *
 * @example
 * ```tsx
 * // 基本用法
 * <EmptyResult />
 *
 * // 自定义消息
 * <EmptyResult message="没有找到相关数据" />
 *
 * // 自定义样式
 * <EmptyResult className="my-custom-class" />
 * ```
 */
const EmptyResult = ({ message = '暂无数据', className }: Props) => {
  return (
    <div
      className={cn(
        'w-full h-full flex justify-center items-center bg-background rounded-lg',
        className,
      )}
    >
      {/* 空状态内容容器 */}
      <div className="flex flex-col items-center gap-1 text-muted-foreground">
        {/* 空状态图标 */}
        <PackageOpen className="size-10" />
        {/* 空状态消息文本 */}
        <p>{message}</p>
      </div>
    </div>
  );
};

export default EmptyResult;
