'use client';

import { saveApiToolProviderAction } from '@/actions/api-tool-action';
import { toast } from 'sonner';
import { getActionErrorMsg } from '@/lib/utils';
import ToolForm, { type FormData } from './ToolForm';
import useModal from '@/hooks/useModal';

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
  };

  return <ToolForm onSubmit={saveApiTool} />;
};

export default CreateToolForm;
