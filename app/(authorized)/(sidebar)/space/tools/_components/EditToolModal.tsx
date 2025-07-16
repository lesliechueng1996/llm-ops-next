import InterceptingModal from '@/components/InterceptingModal';
import { EDIT_API_TOOL } from '@/lib/modal-name';
import EditToolForm from './EditToolForm';
import type { ComponentProps } from 'react';

type Props = {
  providerId: string;
  defaultValues: Omit<ComponentProps<typeof EditToolForm>, 'providerId'> | null;
  onClose: () => void;
};

/**
 * 编辑 API 工具插件模态框组件
 *
 * 用于显示编辑 API 工具的表单界面，支持传入默认值进行编辑操作。
 * 当 defaultValues 为 null 时，模态框内容为空。
 *
 * @param providerId - API 提供商的唯一标识符
 * @param defaultValues - 编辑表单的默认值，为 null 时不显示表单
 * @param onClose - 关闭模态框的回调函数
 */
const EditToolModal = ({ providerId, defaultValues, onClose }: Props) => {
  return (
    <InterceptingModal
      title="编辑插件"
      description="编辑 API 插件工具"
      name={EDIT_API_TOOL}
      onClose={onClose}
    >
      {defaultValues && (
        <EditToolForm providerId={providerId} {...defaultValues} />
      )}
    </InterceptingModal>
  );
};

export default EditToolModal;
