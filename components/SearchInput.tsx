import IconInput from '@/components/IconInput';
import { Search, X } from 'lucide-react';
import {
  type FocusEventHandler,
  type KeyboardEventHandler,
  type MouseEventHandler,
  useRef,
} from 'react';

/**
 * 搜索输入框组件的属性接口
 */
type Props = {
  /** 自定义 CSS 类名 */
  className?: string;
  /** 输入框的默认值 */
  defaultValue?: string;
  /** 输入框的占位符文本 */
  placeholder?: string;
  /** 确认搜索时的回调函数，参数为搜索值 */
  onConfirm?: (value: string) => void;
};

/**
 * 搜索输入框组件
 *
 * 一个带有搜索图标和清除按钮的输入框组件，支持以下功能：
 * - 输入搜索内容
 * - 按 Enter 键确认搜索
 * - 点击 X 按钮清除内容
 * - 失焦时自动确认搜索
 *
 * @param props - 组件属性
 * @param props.className - 自定义 CSS 类名
 * @param props.placeholder - 占位符文本，默认为空字符串
 * @param props.defaultValue - 默认值，默认为空字符串
 * @param props.onConfirm - 确认搜索的回调函数
 * @returns 搜索输入框组件
 */
const SearchInput = ({
  className,
  placeholder = '',
  defaultValue = '',
  onConfirm,
}: Props) => {
  // 输入框的引用，用于直接操作 DOM
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * 清除输入框内容
   * 清空输入框的值并触发 onConfirm 回调
   */
  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = '';
      onConfirm?.('');
    }
  };

  /**
   * 处理键盘事件
   * 当按下 Enter 键时，让输入框失去焦点以触发搜索
   */
  const handleKeyUp: KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
  };

  /**
   * 处理失焦事件
   * 当输入框失去焦点时，触发搜索确认
   */
  const handleBlur: FocusEventHandler<HTMLInputElement> = (e) => {
    onConfirm?.(e.target.value);
  };

  /**
   * 处理清除按钮的鼠标按下事件
   * 阻止默认行为，避免输入框获得焦点
   */
  const handleClearMouseDown: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
  };

  return (
    <IconInput
      containerClassName="w-fit"
      className={className}
      ref={inputRef}
      leftIcon={Search}
      rightIcon={X}
      placeholder={placeholder}
      defaultValue={defaultValue}
      onRightIconMouseDown={handleClearMouseDown}
      onRightIconClick={handleClear}
      onBlur={handleBlur}
      onKeyUp={handleKeyUp}
    />
  );
};

export default SearchInput;
