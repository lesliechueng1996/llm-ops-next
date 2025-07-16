import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { ComponentProps } from 'react';
import BuiltinToolCardHeader from './BuiltinToolCardHeader';
import ToolSheetCard from '@/app/(authorized)/(sidebar)/_components/ToolSheetCard';

/**
 * 工具卡片组件的 Props 类型
 * 继承自 ToolSheetCard 组件的所有属性
 */
type ToolProp = ComponentProps<typeof ToolSheetCard>;

/**
 * BuiltinToolSheet 组件的 Props 类型定义
 *
 * @property isOpen - 控制 Sheet 是否打开的状态
 * @property setIsOpen - 设置 Sheet 打开状态的函数
 * @property description - 工具组的描述文本
 * @property tools - 工具列表数组
 * @property headerProps - 继承自 BuiltinToolCardHeader 的所有属性
 */
type Props = {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  description: string;
  tools: ToolProp[];
} & ComponentProps<typeof BuiltinToolCardHeader>;

/**
 * 内置工具详情展示组件
 *
 * 这是一个侧边抽屉组件，用于展示内置工具组的详细信息。
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
 * <BuiltinToolSheet
 *   isOpen={isOpen}
 *   setIsOpen={setIsOpen}
 *   description="搜索相关工具"
 *   tools={searchTools}
 *   title="搜索工具"
 *   toolCount={3}
 * />
 * ```
 */
const BuiltinToolSheet = ({
  isOpen,
  setIsOpen,
  description,
  tools,
  ...headerProps
}: Props) => {
  return (
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
          <div>
            <div className="space-y-3">
              {/* 渲染工具组头部信息 */}
              <BuiltinToolCardHeader {...headerProps} />
              {/* 显示工具组描述 */}
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
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
  );
};

export default BuiltinToolSheet;
