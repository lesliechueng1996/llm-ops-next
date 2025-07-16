'use client';

import useModal from '@/hooks/useModal';
import { toast } from 'sonner';
import ToolForm, { type FormData } from './ToolForm';
import {
  deleteApiToolProviderAction,
  updateApiToolProviderAction,
} from '@/actions/api-tool-action';
import { getActionErrorMsg } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

type Props = FormData & {
  providerId: string;
};

/**
 * 编辑 API 工具表单组件
 *
 * 提供编辑现有 API 工具的功能，包括更新工具信息和删除工具。
 * 组件会处理表单提交、数据验证、错误处理和成功反馈。
 *
 * @param providerId - API 工具提供者的唯一标识符
 * @param defaultValues - 表单的默认值，包含工具的基本信息
 * @returns 渲染编辑工具表单界面
 */
const EditToolForm = ({ providerId, ...defaultValues }: Props) => {
  const { closeModal } = useModal();
  const queryClient = useQueryClient();

  const reloadApiTools = () => {
    queryClient.invalidateQueries({
      predicate: (query) => query.queryKey[0] === 'api-tools',
    });
  };

  const saveApiTool = async (data: FormData) => {
    const result = await updateApiToolProviderAction({
      providerId,
      data,
    });
    if (!result?.data) {
      toast.error(getActionErrorMsg(result, '插件更新失败'));
      return;
    }

    toast.success('插件更新成功');
    closeModal();
    reloadApiTools();
  };

  const deleteApiTool = async () => {
    const result = await deleteApiToolProviderAction({
      providerId,
    });
    if (!result?.data) {
      console.log(result);
      toast.error(getActionErrorMsg(result, '插件删除失败'));
      return;
    }
    toast.success('插件删除成功');
    closeModal();
    reloadApiTools();
  };

  return (
    <ToolForm
      defaultValues={defaultValues}
      onSubmit={saveApiTool}
      onDelete={deleteApiTool}
    />
  );
};

export default EditToolForm;
