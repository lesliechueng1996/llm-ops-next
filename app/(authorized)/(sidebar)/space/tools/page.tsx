'use client';

import usePaginationQuery from '@/hooks/usePaginationQuery';
import CreateToolModal from './_components/CreateToolModal';
import { fetchApiToolsByPageAction } from '@/actions/api-tool-action';
import { getActionErrorMsg } from '@/lib/utils';
import ApiToolCard from './_components/ApiToolCard';
import { useSession } from '@/lib/auth/auth-client';
import { useEffect, useState } from 'react';
import type { GetApiToolListRes } from '@/schemas/api-tool-schema';
import ApiToolSheet from './_components/ApiToolSheet';

type ApiTool = GetApiToolListRes;

/**
 * API工具页面组件
 *
 * 该组件负责显示和管理用户的API工具列表，提供以下功能：
 * - 分页加载API工具列表，支持无限滚动
 * - 显示每个API工具的详细信息卡片，包括工具数量、创建时间、作者信息
 * - 支持点击卡片打开工具详情侧边栏
 * - 支持创建新的API工具
 * - 自动获取用户会话信息用于展示作者信息
 *
 * 主要特性：
 * - 使用无限滚动分页加载提升用户体验
 * - 集成用户认证系统，显示工具创建者信息
 * - 响应式设计，支持不同屏幕尺寸
 * - 错误处理机制，提供友好的错误提示
 * - 状态管理：维护选中工具的状态，支持侧边栏的打开/关闭
 * - 实时同步：当工具列表更新时，自动同步选中工具的最新信息
 *
 * 状态管理：
 * - isOpen: 控制工具详情侧边栏的显示状态
 * - selectedProvider: 当前选中的API工具，用于在侧边栏中显示详细信息
 *
 * 交互逻辑：
 * - 点击工具卡片时打开侧边栏并设置选中工具
 * - 当工具列表更新时，自动更新选中工具的信息或关闭侧边栏
 * - 支持通过CreateToolModal创建新工具
 *
 * @returns {JSX.Element} 渲染的API工具页面
 */
const ApiToolsPage = () => {
  const { list, LoadMore } = usePaginationQuery({
    fetchFn: async (params) => {
      const res = await fetchApiToolsByPageAction(params);
      if (!res?.data) {
        const errorMsg = getActionErrorMsg(res, '获取API工具失败');
        throw new Error(errorMsg);
      }
      return res.data;
    },
    queryKey: 'api-tools',
  });

  const { data: session } = useSession();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ApiTool | null>(
    null,
  );

  const handleCardClick = (tool: ApiTool) => () => {
    setSelectedProvider(tool);
    setIsOpen(true);
  };

  useEffect(() => {
    if (selectedProvider === null) {
      return;
    }
    const tool = list.find((tool) => tool.id === selectedProvider.id);
    if (tool) {
      setSelectedProvider(tool);
    } else {
      setIsOpen(false);
      setSelectedProvider(null);
    }
  }, [list, selectedProvider]);

  return (
    <div className="h-full">
      <div className="h-full overflow-y-auto">
        <div className="flex flex-wrap gap-5">
          {list.map((tool) => (
            <ApiToolCard
              key={tool.id}
              description={tool.description}
              createdAt={tool.createdAt}
              onClick={handleCardClick(tool)}
              authorName={session?.user?.name || 'User'}
              authorAvatar={session?.user?.image || undefined}
              providerLabel={tool.name}
              providerIcon={tool.icon}
              toolCount={tool.tools.length}
            />
          ))}
        </div>
        {LoadMore}
      </div>
      <CreateToolModal />

      {selectedProvider && (
        <ApiToolSheet
          providerId={selectedProvider.id}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          providerIcon={selectedProvider.icon}
          providerLabel={selectedProvider.name}
          authorName={session?.user?.name || 'User'}
          description={selectedProvider.description}
          toolCount={selectedProvider.tools.length}
          tools={selectedProvider.tools.map((tool) => ({
            ...tool,
            label: tool.name,
          }))}
        />
      )}
    </div>
  );
};

export default ApiToolsPage;
