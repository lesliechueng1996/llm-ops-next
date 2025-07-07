/**
 * SpaceHeader 组件
 *
 * 提供空间页面的头部导航和搜索功能，包括关键词过滤和搜索输入。
 * 支持 AI应用、插件、工作流、知识库等不同类型的内容过滤。
 */

'use client';

import { usePathname, useRouter } from 'next/navigation';
import { parseAsString, useQueryState } from 'nuqs';
import FilterHeader, {
  type Keyword,
} from '../../_components/header/FilterHeader';

/**
 * SpaceHeader 组件的属性类型定义
 */
type Props = {
  /** 可选的 CSS 类名 */
  className?: string;
};

/**
 * 空间页面支持的关键词配置
 * 定义了不同类型内容的标签和对应的路由值
 */
const keywords: Keyword[] = [
  {
    label: 'AI应用',
    value: 'apps',
  },
  {
    label: '插件',
    value: 'tools',
  },
  {
    label: '工作流',
    value: 'workflows',
  },
  {
    label: '知识库',
    value: 'datasets',
  },
];

/**
 * 空间头部组件
 *
 * 提供导航和搜索功能的头部组件，包括：
 * - 关键词过滤器（AI应用、插件、工作流、知识库）
 * - 搜索输入框
 * - 基于当前路径的活跃状态显示
 * - URL 查询参数的状态管理
 *
 * @param props - 组件属性
 * @param props.className - 可选的 CSS 类名，用于自定义样式
 * @returns 渲染的空间头部组件
 *
 * @example
 * ```tsx
 * <SpaceHeader className="mb-4" />
 * ```
 */
const SpaceHeader = ({ className }: Props) => {
  const pathname = usePathname();
  const router = useRouter();
  const [searchKeywords, setSearchKeywords] = useQueryState(
    'keywords',
    parseAsString.withDefault(''),
  );
  const activeItem = keywords.find((keyword) =>
    pathname.includes(keyword.value),
  );
  const activeKeyword = activeItem?.value;
  const placeholder = `请输入${activeItem?.label}名称`;

  /**
   * 处理关键词点击事件
   * 导航到对应的空间子页面
   *
   * @param keyword - 被点击的关键词对象
   */
  const handleKeywordClick = (keyword: Keyword) => {
    router.push(`/space/${keyword.value}`);
  };

  return (
    <FilterHeader
      className={className}
      keywords={keywords}
      placeholder={placeholder}
      defaultSearchValue={searchKeywords}
      activeKeyword={activeKeyword}
      onKeywordClick={handleKeywordClick}
      onSearchConfirm={setSearchKeywords}
    />
  );
};

export default SpaceHeader;
