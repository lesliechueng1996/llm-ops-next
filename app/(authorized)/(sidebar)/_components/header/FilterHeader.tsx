'use client';

import SearchInput from '@/components/SearchInput';
import { cn, handleKeyUpAsClick } from '@/lib/utils';

/**
 * 关键词选项类型定义
 */
export type Keyword = {
  /** 显示标签 */
  label: string;
  /** 关键词值 */
  value: string;
};

/**
 * FilterHeader 组件的属性类型定义
 */
type Props = {
  /** 关键词列表 */
  keywords: Keyword[];
  /** 当前激活的关键词值 */
  activeKeyword?: string;
  /** 搜索框占位符文本 */
  placeholder: string;
  /** 自定义样式类名 */
  className?: string;
  /** 搜索框默认值 */
  defaultSearchValue?: string;
  /** 关键词点击回调函数 */
  onKeywordClick?: (keyword: Keyword) => void;
  /** 搜索确认回调函数 */
  onSearchConfirm?: (value: string) => void;
};

/**
 * 过滤器头部组件
 *
 * 提供关键词筛选和搜索功能的组合组件，包含：
 * - 关键词标签按钮组（支持切换激活状态）
 * - 搜索输入框（支持回车确认搜索）
 *
 * @param keywords - 关键词选项列表
 * @param activeKeyword - 当前激活的关键词值
 * @param placeholder - 搜索框占位符
 * @param className - 自定义样式类名
 * @param defaultSearchValue - 搜索框默认值
 * @param onKeywordClick - 关键词点击事件处理函数
 * @param onSearchConfirm - 搜索确认事件处理函数
 *
 * @example
 * ```tsx
 * <FilterHeader
 *   keywords={[
 *     { label: '全部', value: 'all' },
 *     { label: '已发布', value: 'published' }
 *   ]}
 *   activeKeyword="all"
 *   placeholder="搜索应用..."
 *   onKeywordClick={(keyword) => console.log('点击关键词:', keyword)}
 *   onSearchConfirm={(value) => console.log('搜索:', value)}
 * />
 * ```
 */
const FilterHeader = ({
  keywords,
  activeKeyword,
  placeholder,
  className,
  defaultSearchValue,
  onKeywordClick,
  onSearchConfirm,
}: Props) => {
  return (
    <div
      className={cn('flex items-center justify-between px-3 py-3', className)}
    >
      {/* 关键词标签按钮组 */}
      <div className="flex gap-1 items-center">
        {keywords.map((keyword) => (
          <button
            type="button"
            key={keyword.value}
            className={cn(
              'px-3.5 py-1.5 text-sm text-foreground rounded-lg cursor-pointer bg-muted border',
              // 根据激活状态应用不同的样式
              activeKeyword === keyword.value &&
                'text-foreground bg-background border-primary',
            )}
            onClick={() => onKeywordClick?.(keyword)}
            onKeyUp={handleKeyUpAsClick}
          >
            {keyword.label}
          </button>
        ))}
      </div>

      {/* 搜索输入框 */}
      <SearchInput
        className="bg-background"
        placeholder={placeholder}
        defaultValue={defaultSearchValue}
        onConfirm={(value) => {
          onSearchConfirm?.(value);
        }}
      />
    </div>
  );
};

export default FilterHeader;
