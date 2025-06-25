'use client';

import useBuiltinToolsFilter from '@/hooks/useBuiltinToolsFilter';
import FilterHeader from '../../../_components/header/FilterHeader';

/**
 * 内置工具分类数据结构
 */
type Category = {
  /** 分类显示名称 */
  name: string;
  /** 分类标识符 */
  category: string;
};

/**
 * 内置工具过滤器组件属性
 */
type Props = {
  /** 可用的工具分类列表 */
  categories: Category[];
};

/**
 * 内置工具过滤器组件
 *
 * 提供分类筛选和搜索功能，用于过滤内置工具列表
 * 包含分类标签切换和关键词搜索两种过滤方式
 *
 * @param categories - 可用的工具分类列表
 * @returns 渲染的过滤器组件
 */
const BuiltinToolsFilter = ({ categories }: Props) => {
  // 使用自定义 hook 管理过滤器状态
  const {
    activeCategory,
    searchKeywords,
    setActiveCategory,
    setSearchKeywords,
  } = useBuiltinToolsFilter();

  // 将分类数据转换为过滤器组件需要的格式
  const keywords = categories.map((item) => ({
    label: item.name,
    value: item.category,
  }));

  // 在分类列表开头添加"全部"选项
  keywords.unshift({ label: '全部', value: '' });

  /**
   * 处理分类标签点击事件
   * @param value - 选中的分类值
   */
  const handleKeywordClick = ({ value }: { value: string }) => {
    setActiveCategory(value);
  };

  /**
   * 处理搜索确认事件
   * @param value - 搜索关键词
   */
  const handleSearchConfirm = (value: string) => {
    setSearchKeywords(value);
  };

  return (
    <FilterHeader
      keywords={keywords}
      placeholder="请输入插件名称"
      activeKeyword={activeCategory}
      defaultSearchValue={searchKeywords}
      onKeywordClick={handleKeywordClick}
      onSearchConfirm={handleSearchConfirm}
    />
  );
};

export default BuiltinToolsFilter;
