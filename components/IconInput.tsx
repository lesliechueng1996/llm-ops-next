/**
 * 图标输入框组件
 *
 * 一个带有可点击图标的输入框组件，支持左右两侧的图标配置。
 * 继承自基础 Input 组件的所有属性，并添加了图标相关的功能。
 *
 * @component
 * @param {Object} props - 组件属性
 * @param {IconType} [props.leftIcon] - 左侧图标组件
 * @param {IconType} [props.rightIcon] - 右侧图标组件
 * @param {number} [props.iconSize=16] - 图标大小（像素）
 * @param {() => void} [props.onLeftIconClick] - 左侧图标点击事件处理函数
 * @param {() => void} [props.onRightIconClick] - 右侧图标点击事件处理函数
 * @param {MouseEventHandler} [props.onRightIconMouseDown] - 右侧图标鼠标按下事件处理函数
 * @returns {JSX.Element} 返回一个带有图标的输入框组件
 *
 * @example
 * ```tsx
 * <IconInput
 *   leftIcon={User}
 *   rightIcon={Search}
 *   onLeftIconClick={() => console.log('Left icon clicked')}
 *   placeholder="请输入..."
 * />
 * ```
 */
import { Input } from '@/components/ui/input';
import type { IconType } from '@/lib/types';
import { cn, handleKeyUpAsClick } from '@/lib/utils';
import type { ComponentProps, MouseEventHandler } from 'react';

// 组件属性类型定义
type Props = ComponentProps<typeof Input> & {
  leftIcon?: IconType;
  rightIcon?: IconType;
  iconSize?: number;
  onLeftIconClick?: () => void;
  onRightIconClick?: () => void;
  onRightIconMouseDown?: MouseEventHandler<HTMLButtonElement>;
};

const IconInput = ({
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  iconSize = 16,
  style,
  onLeftIconClick,
  onRightIconClick,
  onRightIconMouseDown,
  ...props
}: Props) => {
  // 将像素单位转换为 rem 单位
  const iconSizeRem = iconSize / 16;

  return (
    <div className="relative w-full">
      {/* 左侧图标按钮 */}
      {LeftIcon && (
        <button
          type="button"
          className={cn(
            'absolute px-3 left-0 top-1/2 -translate-y-1/2 h-full flex items-center justify-center',
            onLeftIconClick && 'cursor-pointer',
          )}
          onClick={onLeftIconClick}
          onKeyUp={handleKeyUpAsClick}
        >
          <LeftIcon size={iconSize} />
        </button>
      )}
      {/* 输入框主体 */}
      <Input
        {...props}
        style={{
          ...style,
          // 根据图标存在与否动态调整内边距
          paddingLeft: LeftIcon ? `${0.75 + iconSizeRem + 0.75}rem` : '0.75rem',
          paddingRight: RightIcon
            ? `${0.75 + iconSizeRem + 0.75}rem`
            : '0.75rem',
        }}
      />
      {/* 右侧图标按钮 */}
      {RightIcon && (
        <button
          type="button"
          className={cn(
            'absolute right-0 px-3 top-1/2 -translate-y-1/2 flex items-center justify-center',
            onRightIconClick && 'cursor-pointer',
          )}
          onClick={onRightIconClick}
          onMouseDown={onRightIconMouseDown}
          onKeyUp={handleKeyUpAsClick}
        >
          <RightIcon size={iconSize} />
        </button>
      )}
    </div>
  );
};

export default IconInput;
