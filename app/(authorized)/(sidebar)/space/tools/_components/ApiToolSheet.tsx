'use client';

import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { ComponentProps } from 'react';
import ApiToolCardHeader from './ApiToolCardHeader';
import ToolSheetCard from '@/app/(authorized)/(sidebar)/_components/ToolSheetCard';
import LoadingButton from '@/components/LoadingButton';
import { Settings } from 'lucide-react';
import { useState } from 'react';
import { getApiToolProviderAction } from '@/actions/api-tool-action';
import { toast } from 'sonner';
import { getActionErrorMsg } from '@/lib/utils';
import type { GetApiToolProviderRes } from '@/schemas/api-tool-schema';
import EditToolModal from './EditToolModal';
import useModal from '@/hooks/useModal';
import { EDIT_API_TOOL } from '@/lib/modal-name';

/**
 * 工具卡片组件的 Props 类型
 * 继承自 ToolSheetCard 组件的所有属性
 */
type ToolProp = ComponentProps<typeof ToolSheetCard>;

/**
 * ApiToolSheet 组件的 Props 类型定义
 *
 * @property isOpen - 控制 Sheet 是否打开的状态
 * @property setIsOpen - 设置 Sheet 打开状态的函数
 * @property description - 工具组的描述文本
 * @property tools - 工具列表数组
 * @property headerProps - 继承自 ApiToolCardHeader 的所有属性
 */
type Props = {
  providerId: string;
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  description: string;
  tools: ToolProp[];
} & ComponentProps<typeof ApiToolCardHeader>;

/**
 * API工具详情展示组件
 *
 * 这是一个侧边抽屉组件，用于展示API工具组的详细信息。
 * 包含工具组标题、描述和工具列表。
 *
 * @param isOpen - 控制抽屉是否打开
 * @param setIsOpen - 设置抽屉打开状态的函数
 * @param description - 工具组的描述信息
 * @param tools - 要展示的工具列表
 * @param headerProps - 传递给头部组件的属性
 *
 * @example
 * ```tsx
 * <ApiToolSheet
 *   isOpen={isOpen}
 *   setIsOpen={setIsOpen}
 *   description="API工具描述"
 *   tools={apiTools}
 *   title="API工具"
 *   toolCount={3}
 * />
 * ```
 */
const ApiToolSheet = ({
  providerId,
  isOpen,
  setIsOpen,
  description,
  tools,
  ...headerProps
}: Props) => {
  const [isEditButtonLoading, setIsEditButtonLoading] = useState(false);
  const [editProvider, setEditProvider] =
    useState<GetApiToolProviderRes | null>(null);
  const { openModal } = useModal();

  const handleEdit = async () => {
    setIsEditButtonLoading(true);
    try {
      const res = await getApiToolProviderAction({
        providerId,
      });
      if (!res?.data) {
        toast.error(getActionErrorMsg(res, '获取自定义插件信息失败'));
        return;
      }
      setEditProvider(res.data);
      openModal(EDIT_API_TOOL);
    } catch (error) {
      toast.error('获取自定义插件信息失败');
    } finally {
      setIsEditButtonLoading(false);
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent aria-describedby={undefined}>
          {/* Sheet 头部区域 */}
          <SheetHeader>
            <SheetTitle>工具详情</SheetTitle>
          </SheetHeader>

          <Separator className="mb-4" />

          {/* 主要内容区域 */}
          <div className="px-8">
            {/* 工具组信息区域 */}
            <div className="space-y-4">
              <div className="space-y-3">
                {/* 渲染工具组头部信息 */}
                <ApiToolCardHeader {...headerProps} />
                {/* 显示工具组描述 */}
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
              <LoadingButton
                text="编辑"
                icon={<Settings />}
                className="w-full"
                variant="outline"
                onClick={handleEdit}
                isLoading={isEditButtonLoading}
              />
            </div>

            <Separator className="mt-3 mb-4" />

            {/* 工具列表区域 */}
            <div>
              {/* 工具数量提示 */}
              <h3 className="text-xs text-muted-foreground mb-3">
                包含{headerProps.toolCount}个工具
              </h3>
              {/* 工具列表容器，支持滚动 */}
              <div className="space-y-2 overflow-y-auto h-full no-scrollbar">
                {/* 遍历渲染每个工具卡片 */}
                {tools.map((tool) => (
                  <ToolSheetCard key={tool.label} {...tool} />
                ))}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <EditToolModal
        providerId={providerId}
        defaultValues={editProvider}
        onClose={() => setEditProvider(null)}
      />
    </>
  );
};

export default ApiToolSheet;
