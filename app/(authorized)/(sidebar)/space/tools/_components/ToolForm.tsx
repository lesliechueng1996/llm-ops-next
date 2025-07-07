/**
 * @fileoverview 工具表单组件 - 用于创建和编辑自定义 API 工具
 *
 * 此组件提供了一个完整的表单界面，允许用户：
 * - 设置工具名称和图标
 * - 输入 OpenAPI Schema 并自动解析可用工具
 * - 配置 HTTP 请求头
 * - 验证和提交工具配置
 */

'use client';

import { validateOpenapiSchemaAction } from '@/actions/api-tool-action';
import EmptyResult from '@/components/EmptyResult';
import ImageUpload, { type ImageUploadRef } from '@/components/ImageUpload';
import LoadingButton from '@/components/LoadingButton';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { getActionErrorMsg } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

/**
 * 工具表单数据验证模式
 * 定义了工具创建/编辑时的必需字段和验证规则
 */
const toolFormSchema = z.object({
  name: z
    .string()
    .max(30, { message: '插件名称应少于30个字符' })
    .trim()
    .nonempty({ message: '插件名称不能为空' }),
  openapiSchema: z
    .string()
    .max(1000, { message: 'OpenAPI 描述应少于1000个字符' })
    .trim()
    .nonempty({ message: 'OpenAPI 描述不能为空' }),
  headers: z.array(
    z.object({
      key: z.string().trim().nonempty({ message: '请求头键名不能为空' }),
      value: z.string().trim().nonempty({ message: '请求头键值不能为空' }),
    }),
  ),
});

/**
 * 工具信息类型定义
 * 表示从 OpenAPI Schema 中解析出的单个工具信息
 *
 * @typedef {Object} ToolInfo
 * @property {string} name - 工具名称（operationId）
 * @property {string} description - 工具描述
 * @property {string} method - HTTP 方法（GET, POST, PUT, DELETE 等）
 * @property {string} path - API 路径
 */
type ToolInfo = {
  name: string;
  description: string;
  method: string;
  path: string;
};

/**
 * 工具表单数据类型
 * 基于 toolFormSchema 推断出的类型
 */
type ToolFormData = z.infer<typeof toolFormSchema>;

/**
 * 完整的表单数据类型
 * 包含表单数据和工具图标 URL
 *
 * @typedef {Object} FormData
 * @property {string} name - 工具名称
 * @property {string} openapiSchema - OpenAPI Schema JSON 字符串
 * @property {Array<{key: string, value: string}>} headers - HTTP 请求头配置
 * @property {string} icon - 工具图标 URL
 */
export type FormData = ToolFormData & { icon: string };

/**
 * 工具表单组件属性类型
 *
 * @typedef {Object} Props
 * @property {FormData} [defaultValues] - 表单默认值，用于编辑现有工具
 * @property {function(FormData): Promise<void>} onSubmit - 表单提交处理函数
 */
type Props = {
  defaultValues?: FormData;
  onSubmit: (values: FormData) => Promise<void>;
};

/**
 * 工具表单组件
 *
 * 提供创建和编辑自定义 API 工具的完整表单界面。
 * 支持工具名称设置、OpenAPI Schema 解析、HTTP 请求头配置和图标上传。
 *
 * @component
 * @param {Props} props - 组件属性
 * @param {FormData} [props.defaultValues] - 表单默认值，用于编辑现有工具
 * @param {function(FormData): Promise<void>} props.onSubmit - 表单提交处理函数
 *
 * @returns {JSX.Element} 工具表单组件
 *
 * @example
 * // 创建新工具
 * <ToolForm onSubmit={handleCreateTool} />
 *
 * @example
 * // 编辑现有工具
 * <ToolForm
 *   defaultValues={existingTool}
 *   onSubmit={handleUpdateTool}
 * />
 */
const ToolForm = ({ defaultValues, onSubmit }: Props) => {
  const form = useForm<ToolFormData>({
    resolver: zodResolver(toolFormSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      openapiSchema: defaultValues?.openapiSchema || '',
      headers: defaultValues?.headers || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'headers',
  });

  const [tools, setTools] = useState<ToolInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const uploadImageRef = useRef<ImageUploadRef>(null);

  /**
   * 处理表单提交
   *
   * 上传图标并调用父组件的提交处理函数
   *
   * @param {ToolFormData} values - 表单数据
   * @returns {Promise<void>}
   */
  const handleSubmit = async (values: ToolFormData) => {
    try {
      setIsLoading(true);
      const iconUrl = await uploadImageRef.current?.uploadImage();

      if (!iconUrl) {
        return;
      }

      await onSubmit({
        ...values,
        icon: iconUrl,
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 添加新的 HTTP 请求头
   *
   * 向 headers 数组中添加一个新的空白请求头配置
   */
  const handleAppendHeader = () => {
    append({ key: '', value: '' });
  };

  /**
   * 删除指定的 HTTP 请求头
   *
   * @param {number} index - 要删除的请求头索引
   * @returns {function(): void} 删除操作的事件处理函数
   */
  const handleDeleteHeader = (index: number) => () => {
    remove(index);
  };

  /**
   * 处理 OpenAPI Schema 输入框失去焦点事件
   *
   * 验证并解析 OpenAPI Schema，提取可用工具信息
   * 如果解析成功，更新工具列表；如果失败，显示错误信息
   *
   * @returns {Promise<void>}
   */
  const handleOpenapiSchemaBlur = async () => {
    setIsLoading(true);
    try {
      const { openapiSchema } = form.getValues();
      if (!openapiSchema) {
        form.setError('openapiSchema', {
          message: 'OpenAPI 描述不能为空',
        });
        return;
      }

      const result = await validateOpenapiSchemaAction({ openapiSchema });
      if (!result?.data) {
        form.setError('openapiSchema', {
          message: getActionErrorMsg(result, 'OpenAPI 描述格式错误'),
        });
        return;
      }

      const pathList = [];
      const openapi = JSON.parse(openapiSchema);
      const paths = Object.keys(openapi.paths);
      for (const path of paths) {
        const methods = Object.keys(openapi.paths[path]);
        for (const method of methods) {
          const { operationId, description } = openapi.paths[path][method];
          pathList.push({
            name: operationId,
            description,
            method,
            path,
          });
        }
      }

      setTools(pathList);
      form.clearErrors('openapiSchema');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* 工具图标上传区域 */}
      <div className="flex justify-center mb-6">
        <ImageUpload
          alt="tool provider icon"
          imageUrl={defaultValues?.icon}
          ref={uploadImageRef}
          required
        />
      </div>

      {/* 主要表单区域 */}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-8 px-1"
        >
          {/* 工具名称输入字段 */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="required-label">插件名称</FormLabel>
                <FormControl>
                  <Input
                    placeholder="请输入插件名称，请确保名称含义清晰"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* OpenAPI Schema 输入字段 */}
          <FormField
            control={form.control}
            name="openapiSchema"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="required-label">OpenAPI Schema</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="在此处输入您的 OpenAPI Schema"
                    {...field}
                    onBlur={handleOpenapiSchemaBlur}
                  />
                </FormControl>
                <FormDescription>{field.value.length}/1000</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 从 OpenAPI Schema 解析出的可用工具列表 */}
          <div className="space-y-2">
            <FormLabel>可用工具</FormLabel>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>名称</TableHead>
                    <TableHead>描述</TableHead>
                    <TableHead>方法</TableHead>
                    <TableHead>路径</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tools.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <EmptyResult
                          className="bg-transparent"
                          message="暂无可用工具"
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    tools.map((tool) => (
                      <TableRow key={tool.name}>
                        <TableCell>{tool.name}</TableCell>
                        <TableCell>{tool.description}</TableCell>
                        <TableCell>{tool.method}</TableCell>
                        <TableCell>{tool.path}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* HTTP 请求头配置区域 */}
          <div className="space-y-2">
            <FormLabel>Headers</FormLabel>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* 动态生成的请求头输入行 */}
                  {fields.map(({ id }, index) => (
                    <TableRow key={id}>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`headers.${index}.key`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  placeholder="请输入请求头键名"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`headers.${index}.value`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  placeholder="请输入请求头键值内容"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handleDeleteHeader(index)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* 添加新请求头的按钮行 */}
                  <TableRow>
                    <TableCell colSpan={3}>
                      <Button type="button" onClick={handleAppendHeader}>
                        添加
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          {/* 表单操作按钮区域 */}
          <div className="text-right space-x-4">
            <Button type="button" variant="secondary">
              取消
            </Button>
            <LoadingButton type="submit" text="保存" isLoading={isLoading} />
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ToolForm;
