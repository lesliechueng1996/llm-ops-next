'use client';

import usePaginationQuery from '@/hooks/usePaginationQuery';
import CreateToolModal from './_components/CreateToolModal';
import { fetchApiToolsByPageAction } from '@/actions/api-tool-action';
import { getActionErrorMsg } from '@/lib/utils';
import ApiToolCard from './_components/ApiToolCard';
import { useSession } from '@/lib/auth/auth-client';

/**
 * API工具页面组件
 *
 * 该组件负责显示和管理用户的API工具列表，提供以下功能：
 * - 分页加载API工具列表
 * - 显示每个API工具的详细信息卡片
 * - 支持创建新的API工具
 * - 自动获取用户会话信息用于展示
 *
 * 主要特性：
 * - 使用无限滚动分页加载提升用户体验
 * - 集成用户认证系统，显示工具创建者信息
 * - 响应式设计，支持不同屏幕尺寸
 * - 错误处理机制，提供友好的错误提示
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

  return (
    <div className="h-full">
      <div className="h-full overflow-y-auto">
        <div>
          {list.map((tool) => (
            <ApiToolCard
              key={tool.id}
              description={tool.description}
              createdAt={tool.createdAt}
              onClick={() => {}}
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
    </div>
  );
};

export default ApiToolsPage;
