'use client';

import EmptyResult from '@/components/EmptyResult';
import useBuiltinToolsFilter from '@/hooks/useBuiltinToolsFilter';
import { useState } from 'react';
import BuiltinToolCard from './BuiltinToolCard';
import BuiltinToolSheet from './BuiltinToolSheet';
import type { BuiltinToolParam } from '@/lib/tools';

/**
 * 内置工具提供者的数据结构
 */
type BuiltinTool = {
  /** 工具分类 */
  category: string;
  /** 显示标签 */
  label: string;
  /** 工具描述 */
  description: string;
  /** 图标路径 */
  icon: string;
  /** 工具名称 */
  name: string;
  /** 背景颜色 */
  background: string;
  /** 工具列表 */
  tools: {
    /** 工具名称 */
    name: string;
    /** 工具标签 */
    label: string;
    /** 工具描述 */
    description: string;
    /** 输入参数定义 */
    inputs: {
      /** 参数名称 */
      name: string;
      /** 参数描述 */
      description: string;
      /** 是否必需 */
      required: boolean;
      /** 参数类型 */
      type: 'string' | 'number' | 'boolean';
    }[];
    /** 工具参数 */
    params: BuiltinToolParam[];
  }[];
  /** 创建时间戳 */
  createdAt: number;
};

/**
 * 组件属性类型定义
 */
type Props = {
  /** 内置工具列表 */
  builtinTools: BuiltinTool[];
};

/**
 * 内置工具卡片列表组件
 *
 * 显示内置工具的卡片网格，支持分类筛选和关键词搜索。
 * 点击卡片可以打开详细信息弹窗。
 *
 * @param builtinTools - 内置工具数据列表
 * @returns 渲染的内置工具卡片列表
 */
const BuiltinToolCardList = ({ builtinTools }: Props) => {
  // 使用内置工具筛选钩子获取当前筛选状态
  const { activeCategory, searchKeywords } = useBuiltinToolsFilter();

  // 控制详细信息弹窗的显示状态
  const [isOpen, setIsOpen] = useState(false);

  // 当前选中的工具提供者
  const [selectedProvider, setSelectedProvider] = useState<BuiltinTool | null>(
    null,
  );

  // 根据分类和关键词筛选工具列表
  const filteredTools = builtinTools
    .filter(
      (provider) =>
        activeCategory === '' || activeCategory === provider.category,
    )
    .filter(
      (provider) =>
        searchKeywords === '' || provider.label.includes(searchKeywords),
    );

  /**
   * 处理卡片点击事件
   * @param provider - 被点击的工具提供者
   * @returns 点击事件处理函数
   */
  const handleCardClick = (provider: BuiltinTool) => () => {
    setSelectedProvider(provider);
    setIsOpen(true);
  };

  // 如果没有筛选结果，显示空状态
  if (filteredTools.length === 0) {
    return <EmptyResult />;
  }

  return (
    <section className="p-3 flex flex-wrap gap-5 max-h-full overflow-y-auto no-scrollbar">
      {/* 渲染工具卡片列表 */}
      {filteredTools.map((provider) => (
        <BuiltinToolCard
          key={provider.name}
          description={provider.description}
          createdAt={provider.createdAt}
          providerIcon={provider.icon}
          providerLabel={provider.label}
          providerName={provider.name}
          providerBgColor={provider.background}
          toolCount={provider.tools.length}
          onClick={handleCardClick(provider)}
        />
      ))}

      {/* 渲染详细信息弹窗 */}
      {selectedProvider && (
        <BuiltinToolSheet
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          providerIcon={selectedProvider.icon}
          providerLabel={selectedProvider.label}
          providerName={selectedProvider.name}
          providerBgColor={selectedProvider.background}
          description={selectedProvider.description}
          toolCount={selectedProvider.tools.length}
          tools={selectedProvider.tools}
        />
      )}
    </section>
  );
};

export default BuiltinToolCardList;
