/**
 * 工具操作页面组件
 *
 * 此组件用于在空间页面中显示工具相关的操作按钮
 * 主要功能：
 * - 提供创建自定义插件的入口按钮
 * - 集成模态框组件用于插件创建流程
 *
 * @component ToolAction
 * @returns React组件，包含创建自定义插件的操作按钮
 */
import { CREATE_API_TOOL } from '@/lib/modal-name';
import SpaceActionButton from '../_component/SpaceActionButton';

const ToolAction = () => {
  return (
    <SpaceActionButton label="创建自定义插件" modalName={CREATE_API_TOOL} />
  );
};

export default ToolAction;
