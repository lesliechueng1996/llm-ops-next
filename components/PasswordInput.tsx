/**
 * 密码输入框组件
 *
 * 一个专门用于密码输入的组件，支持密码的显示和隐藏切换。
 * 基于 IconInput 组件实现，添加了密码相关的图标和交互功能。
 *
 * @component
 * @param {Object} props - 组件属性（继承自 IconInput，但排除了部分属性）
 * @returns {JSX.Element} 返回一个密码输入框组件
 *
 * @example
 * ```tsx
 * <PasswordInput
 *   placeholder="请输入密码"
 *   onChange={(e) => console.log(e.target.value)}
 * />
 * ```
 */
import IconInput from '@/components/IconInput';
import { Eye, EyeOff, Lock, LockOpen } from 'lucide-react';
import { type ComponentProps, useState } from 'react';

// 组件属性类型定义，排除了一些不需要的属性
type Props = Omit<
  ComponentProps<typeof IconInput>,
  'leftIcon' | 'rightIcon' | 'type' | 'onLeftIconClick' | 'onRightIconClick'
>;

const PasswordInput = (props: Props) => {
  // 控制密码显示/隐藏状态
  const [showPassword, setShowPassword] = useState(false);

  // 根据密码显示状态动态设置图标
  const leftIcon = showPassword ? LockOpen : Lock;
  const rightIcon = showPassword ? Eye : EyeOff;
  const inputType = showPassword ? 'text' : 'password';

  return (
    <IconInput
      {...props}
      leftIcon={leftIcon}
      rightIcon={rightIcon}
      type={inputType}
      onRightIconClick={() => setShowPassword(!showPassword)}
    />
  );
};

export default PasswordInput;
