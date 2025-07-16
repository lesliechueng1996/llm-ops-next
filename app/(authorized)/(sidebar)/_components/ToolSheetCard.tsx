'use client';

import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { handleKeyUpAsClick } from '@/lib/utils';
import { useState } from 'react';

/**
 * 内置/API工具卡片组件的属性类型定义
 */
type Props = {
  /** 工具名称 */
  label: string;
  /** 工具描述 */
  description: string;
  /** 工具输入参数列表 */
  inputs: {
    /** 参数名称 */
    name: string;
    /** 参数类型 */
    type: string;
    /** 是否必填 */
    required: boolean;
    /** 参数描述 */
    description: string;
  }[];
};

/**
 * 将参数类型转换为中文显示
 * @param type - 参数类型字符串
 * @returns 中文类型描述
 */
const formatInputType = (type: string) => {
  if (type === 'string') {
    return '字符串';
  }

  if (type === 'number') {
    return '数字';
  }

  if (type === 'boolean') {
    return '布尔值';
  }

  return type;
};

/**
 * 内置/API工具卡片组件
 *
 * 这是一个可展开的卡片组件，用于显示内置工具的详细信息。
 * 用户可以点击卡片来展开/收起工具的输入参数列表。
 *
 * @param label - 工具名称
 * @param description - 工具描述
 * @param inputs - 工具输入参数列表
 * @returns 渲染的内置/API工具卡片组件
 */
const ToolSheetCard = ({ label, description, inputs }: Props) => {
  // 控制参数列表的显示/隐藏状态
  const [isInputsDisplay, setIsInputsDisplay] = useState(false);

  /**
   * 处理卡片点击事件，切换参数列表的显示状态
   */
  const handleToolCardClick = () => {
    setIsInputsDisplay((prev) => !prev);
  };

  return (
    <Card
      className="px-4 py-3 cursor-pointer gap-2"
      tabIndex={0}
      onClick={handleToolCardClick}
      onKeyUp={handleKeyUpAsClick}
    >
      {/* 工具标题 */}
      <h1 className="text-sm font-bold text-foreground">{label}</h1>
      {/* 工具描述 */}
      <p className="text-xs text-muted-foreground">{description}</p>

      {/* 条件渲染参数列表 */}
      {isInputsDisplay && (
        <div className="space-y-4">
          {/* 参数标题区域 */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground shrink-0">
              参数
            </span>
            <Separator />
          </div>

          {/* 参数列表 */}
          {inputs.map((input) => (
            <div key={input.name} className="space-y-1">
              {/* 参数名称、类型和必填标识 */}
              <div className="space-x-2 text-xs">
                <span className="font-bold">{input.name}</span>
                <span className="text-muted-foreground">
                  {formatInputType(input.type)}
                </span>
                {input.required && <span className="text-red-500">必填</span>}
              </div>
              {/* 参数描述 */}
              <p className="text-xs text-muted-foreground">
                {input.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default ToolSheetCard;
