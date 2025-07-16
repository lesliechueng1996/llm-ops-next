'use client';

import { saveApiToolProviderAction } from '@/actions/api-tool-action';
import { toast } from 'sonner';
import { getActionErrorMsg } from '@/lib/utils';
import ToolForm, { type FormData } from './ToolForm';
import useModal from '@/hooks/useModal';
import { useQueryClient } from '@tanstack/react-query';

/**
 * 创建工具表单组件
 *
 * 提供创建 API 工具的表单界面，包含表单验证、数据提交、错误处理等功能。
 * 成功创建后会显示成功提示并关闭模态框。
 *
 * @component
 * @example
 * ```tsx
 * <CreateToolForm />
 * ```
 *
 * @returns {JSX.Element} 创建工具表单组件
 */
const CreateToolForm = () => {
  const { closeModal } = useModal();
  const queryClient = useQueryClient();

  /**
   * 重新加载API工具列表
   *
   * 当API工具列表发生变化时，调用此函数刷新列表数据。
   * 通过查询客户端的缓存，确保列表数据是最新的。
   *
   * @returns {void} 无返回值
   */
  const reloadApiTools = () => {
    queryClient.invalidateQueries({
      predicate: (query) => query.queryKey[0] === 'api-tools',
    });
  };

  /**
   * 保存 API 工具
   *
   * 处理表单提交，调用后端接口保存 API 工具提供商数据。
   * 根据操作结果显示相应的成功或错误提示。
   *
   * @param {FormData} data - 表单数据
   * @returns {Promise<void>} 异步操作结果
   */
  const saveApiTool = async (data: FormData) => {
    const result = await saveApiToolProviderAction(data);
    if (!result?.data) {
      toast.error(getActionErrorMsg(result, '插件创建失败'));
      return;
    }

    toast.success('插件创建成功');
    closeModal();
    reloadApiTools();
  };

  return <ToolForm onSubmit={saveApiTool} />;
};

export default CreateToolForm;
