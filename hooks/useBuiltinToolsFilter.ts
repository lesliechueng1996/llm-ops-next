import { parseAsString, useQueryState } from 'nuqs';

/**
 * 自定义 Hook：用于管理内置工具的筛选状态
 *
 * 这个 Hook 使用 URL 查询参数来管理工具分类和搜索关键词的状态，
 * 确保页面刷新后筛选条件能够保持。
 *
 * @returns {Object} 返回筛选状态和更新函数
 * @returns {string} returns.activeCategory - 当前激活的工具分类
 * @returns {string} returns.searchKeywords - 当前搜索关键词
 * @returns {Function} returns.setActiveCategory - 设置激活分类的函数
 * @returns {Function} returns.setSearchKeywords - 设置搜索关键词的函数
 */
const useBuiltinToolsFilter = () => {
  // 使用 URL 查询参数管理工具分类状态，默认为空字符串
  const [activeCategory, setActiveCategory] = useQueryState(
    'category',
    parseAsString.withDefault(''),
  );

  // 使用 URL 查询参数管理搜索关键词状态，默认为空字符串
  const [searchKeywords, setSearchKeywords] = useQueryState(
    'keywords',
    parseAsString.withDefault(''),
  );

  return {
    activeCategory,
    searchKeywords,
    setActiveCategory,
    setSearchKeywords,
  };
};

export default useBuiltinToolsFilter;
