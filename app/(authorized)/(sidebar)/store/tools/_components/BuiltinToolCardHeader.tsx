import TitleCardHeader from '@/components/TitleCardHeader';

/**
 * 内置工具卡片头部组件的属性类型定义
 */
type Props = {
  /** 提供商的显示标签 */
  providerLabel: string;
  /** 提供商的名称 */
  providerName: string;
  /** 该提供商下的工具数量 */
  toolCount: number;
  /** 提供商图标的URL或路径 */
  providerIcon: string;
  /** 提供商图标的背景颜色 */
  providerBgColor: string;
};

/**
 * 内置工具卡片头部组件
 *
 * 用于显示内置工具提供商的头部信息，包括提供商名称、工具数量和图标
 *
 * @param props - 组件属性
 * @param props.providerIcon - 提供商图标的URL或路径
 * @param props.providerLabel - 提供商的显示标签
 * @param props.providerName - 提供商的名称
 * @param props.toolCount - 该提供商下的工具数量
 * @param props.providerBgColor - 提供商图标的背景颜色
 * @returns 渲染的内置工具卡片头部组件
 */
const BuiltinToolCardHeader = ({
  providerIcon,
  providerLabel,
  providerName,
  toolCount,
  providerBgColor,
}: Props) => {
  // 构建副标题，显示提供商名称和工具数量
  const subTitle = `提供商 ${providerName} · ${toolCount} 插件`;

  return (
    <TitleCardHeader
      title={providerLabel}
      subtitle={subTitle}
      imgSrc={providerIcon}
      imgAlt={providerLabel}
      imgBgColor={providerBgColor}
    />
  );
};

export default BuiltinToolCardHeader;
