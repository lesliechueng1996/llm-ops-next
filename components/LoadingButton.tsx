/**
 * 加载按钮组件
 *
 * 一个带有加载状态的按钮组件，在加载状态下显示旋转的加载图标。
 * 继承自基础 Button 组件的所有属性，并添加了加载状态相关的功能。
 *
 * @component
 * @param {Object} props - 组件属性
 * @param {boolean} [props.isLoading=false] - 是否处于加载状态
 * @param {string} props.text - 按钮显示的文本
 * @returns {JSX.Element} 返回一个带有加载状态的按钮组件
 *
 * @example
 * ```tsx
 * <LoadingButton
 *   text="提交"
 *   isLoading={true}
 *   onClick={() => console.log('Button clicked')}
 * />
 * ```
 */
import { Button } from '@/components/ui/button';
import { LoaderCircle } from 'lucide-react';
import type { ComponentProps } from 'react';

// 组件属性类型定义
type Props = ComponentProps<typeof Button> & {
  isLoading?: boolean;
  text: string;
};

const LoadingButton = ({ text, isLoading = false, ...props }: Props) => {
  return (
    <Button {...props} disabled={isLoading}>
      {/* 加载状态下显示旋转的加载图标 */}
      {isLoading && <LoaderCircle className="animate-spin" />}
      {text}
    </Button>
  );
};

export default LoadingButton;
