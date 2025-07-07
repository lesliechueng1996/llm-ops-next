import InterceptingModal from '@/components/InterceptingModal';
import { CREATE_API_TOOL } from '@/lib/modal-name';
import CreateToolForm from './CreateToolForm';

/**
 * 创建工具模态框组件
 *
 * 该组件用于显示创建新 API 插件工具的模态框，包含工具创建表单。
 * 使用拦截模态框 (InterceptingModal) 来提供良好的用户体验。
 *
 * @component
 * @returns {JSX.Element} 返回创建工具的模态框组件
 *
 * @example
 * ```tsx
 * <CreateToolModal />
 * ```
 */
const CreateToolModal = () => {
  return (
    <InterceptingModal
      title="新建插件"
      description="新建 API 插件工具"
      name={CREATE_API_TOOL}
    >
      <CreateToolForm />
    </InterceptingModal>
  );
};

export default CreateToolModal;
