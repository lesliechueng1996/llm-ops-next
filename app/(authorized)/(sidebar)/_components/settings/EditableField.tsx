/**
 * EditableField 组件
 *
 * 一个可编辑的字段组件，支持文本和密码类型的输入。
 * 提供编辑、保存和取消功能，并支持键盘操作（Enter 键保存）。
 *
 * @component
 */

'use client';

import PasswordInput from '@/components/PasswordInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoaderCircle, Pencil } from 'lucide-react';
import {
  type FocusEvent,
  type KeyboardEvent,
  useEffect,
  useState,
} from 'react';
import { useBoolean } from 'usehooks-ts';

type Props = {
  /** 输入字段的唯一标识符 */
  id: string;
  /** 字段的当前值 */
  value: string;
  /** 显示给用户的值（对于密码类型，通常显示为掩码） */
  displayValue: string;
  /** 输入字段的类型：'text' 或 'password' */
  type: 'text' | 'password';
  /** 输入字段的占位符文本 */
  placeholder?: string;
  /** 是否显示加载状态 */
  isLoading?: boolean;
  /** 保存时的回调函数，接收新的值作为参数 */
  onSave: (value: string) => void;
};

const EditableField = ({
  id,
  value,
  displayValue,
  type,
  placeholder,
  isLoading = false,
  onSave,
}: Props) => {
  // 控制编辑状态
  const {
    value: isEditing,
    setTrue: startEditing,
    setFalse: stopEditing,
  } = useBoolean(false);
  // 管理输入文本状态
  const [text, setText] = useState(type === 'password' ? '' : value);

  // 当 value 或 type 改变时更新文本状态
  useEffect(() => {
    setText(type === 'password' ? '' : value);
  }, [value, type]);

  // 保存更改并退出编辑模式
  const handleSave = () => {
    stopEditing();
    onSave(text);
    setText(type === 'password' ? '' : value);
  };

  // 取消编辑并恢复原始值
  const handleCancel = () => {
    stopEditing();
    setText(type === 'password' ? '' : value);
  };

  // 处理输入框失去焦点事件
  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    if (!e.relatedTarget || !(e.relatedTarget instanceof HTMLButtonElement)) {
      handleCancel();
    }
  };

  // 处理键盘事件，支持按 Enter 键保存
  const handleKeyUp = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
      return;
    }
  };

  return (
    <div className="w-full">
      {/* 非编辑状态：显示值和编辑按钮 */}
      {!isEditing ? (
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">{displayValue}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={startEditing}
            disabled={isLoading}
          >
            {isLoading ? (
              <LoaderCircle className="animate-spin" size={16} />
            ) : (
              <Pencil size={16} />
            )}
          </Button>
        </div>
      ) : (
        // 编辑状态：显示输入框和操作按钮
        <div className="flex items-center justify-between gap-2 w-full">
          {type === 'text' ? (
            <Input
              type={type}
              id={id}
              value={text}
              placeholder={placeholder}
              onChange={(e) => setText(e.target.value)}
              onBlur={handleBlur}
              onKeyUp={handleKeyUp}
            />
          ) : (
            <PasswordInput
              id={id}
              value={text}
              placeholder={placeholder}
              onChange={(e) => setText(e.target.value)}
              onBlur={handleBlur}
              onKeyUp={handleKeyUp}
            />
          )}
          <Button variant="secondary" type="button" onClick={handleCancel}>
            取消
          </Button>
          <Button type="button" onClick={handleSave}>
            保存
          </Button>
        </div>
      )}
    </div>
  );
};

export default EditableField;
