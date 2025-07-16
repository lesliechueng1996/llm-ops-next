import TitleCardHeader from '@/components/TitleCardHeader';

/**
 * API 工具卡片头部组件
 *
 * 此文件定义了用于显示 API 工具卡片头部的组件，包含提供商标签、工具数量、
 * 作者信息和图标等元素。组件基于 TitleCardHeader 进行封装，专门用于
 * API 工具列表页面中的工具卡片展示。
 */

/**
 * API 工具卡片头部组件的属性类型定义
 */
type Props = {
  /** 提供商的显示标签 */
  providerLabel: string;
  /** 该提供商下的工具数量 */
  toolCount: number;
  /** 作者的名称 */
  authorName: string;
  /** 提供商图标的URL或路径 */
  providerIcon: string;
};

/**
 * API 工具卡片头部组件
 *
 * 用于显示 API 工具的头部信息，包括作者名称、工具数量和图标
 *
 * @param props - 组件属性
 * @param props.providerIcon - 提供商图标的URL或路径
 * @param props.providerLabel - 提供商的显示标签
 * @param props.authorName - 作者的名称
 * @param props.toolCount - 该提供商下的工具数量
 * @returns 渲染的内置工具卡片头部组件
 */
const ApiToolCardHeader = ({
  providerIcon,
  providerLabel,
  authorName,
  toolCount,
}: Props) => {
  // 构建副标题，显示作者名称和工具数量
  const subTitle = `作者 ${authorName} · ${toolCount} 插件`;

  return (
    <TitleCardHeader
      title={providerLabel}
      subtitle={subTitle}
      imgSrc={providerIcon}
      imgAlt={providerLabel}
    />
  );
};

export default ApiToolCardHeader;
