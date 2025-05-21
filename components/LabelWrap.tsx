/**
 * LabelWrap 组件
 *
 * 一个用于包装表单标签和输入元素的通用组件。
 * 提供统一的布局和样式，支持必填标记。
 *
 * @component
 * @example
 * ```tsx
 * <LabelWrap label="用户名" required>
 *   <Input type="text" />
 * </LabelWrap>
 * ```
 */

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { ComponentProps, ReactNode } from 'react';

/**
 * LabelWrap 组件的属性类型定义
 * @property {boolean} [required] - 是否为必填字段
 * @property {ReactNode} children - 子元素（通常是输入组件）
 * @property {string} label - 标签文本
 */
type Props = {
  required?: boolean;
  children: ReactNode;
  label: string;
} & ComponentProps<typeof Label>;

/**
 * LabelWrap 组件
 *
 * @param {Props} props - 组件属性
 * @returns {JSX.Element} 返回一个包含标签和子元素的包装器
 */
const LabelWrap = ({ required, children, label, ...props }: Props) => {
  return (
    <div className="grid w-full items-center gap-3">
      <Label {...props} className={cn(required && 'required-label')}>
        {label}
      </Label>
      {children}
    </div>
  );
};

export default LabelWrap;
