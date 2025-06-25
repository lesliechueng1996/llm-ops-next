/**
 * 插件广场页面
 *
 * 展示内置工具列表，提供工具分类筛选功能
 * 用户可以浏览和选择可用的内置插件
 */

import {
  getBuiltinToolCategories,
  getBuiltinTools,
} from '@/services/builtin-tool';
import TitleHeader from '../../_components/header/TitleHeader';
import { ToolFillIcon } from '../../_components/icons';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import BuiltinToolsFilter from './_components/BuiltinToolsFilter';
import BuiltinToolCardList from './_components/BuiltinToolCardList';

// 获取所有内置工具分类和工具列表
const categories = getBuiltinToolCategories();
const builtinTools = getBuiltinTools();

/**
 * 插件广场页面组件
 *
 * 包含以下功能：
 * - 页面标题和创建自定义插件按钮
 * - 工具分类筛选器
 * - 内置工具卡片列表展示
 *
 * @returns {JSX.Element} 插件广场页面
 */
const StoreToolsPage = () => {
  return (
    <div className="h-full flex flex-col">
      {/* 页面标题区域 - 包含标题、图标和创建按钮 */}
      <TitleHeader
        title="插件广场"
        icon={<ToolFillIcon />}
        className="mb-1 shrink-0 min-h-0"
      >
        <Link href="/space/tools">
          <Button>创建自定义插件</Button>
        </Link>
      </TitleHeader>

      {/* 工具筛选器区域 - 用于按分类筛选工具 */}
      <div className="mb-2 shrink-0 min-h-0">
        <BuiltinToolsFilter categories={categories} />
      </div>

      {/* 工具列表区域 - 展示所有内置工具卡片 */}
      <div className="grow min-h-0">
        <BuiltinToolCardList builtinTools={builtinTools} />
      </div>
    </div>
  );
};

export default StoreToolsPage;
