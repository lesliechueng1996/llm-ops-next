/**
 * 登录表单组件
 *
 * 一个完整的登录表单组件，支持邮箱密码登录和 GitHub OAuth 登录。
 * 使用 React Hook Form 进行表单管理和验证，使用 Zod 进行数据验证。
 *
 * @component
 * @returns {JSX.Element} 返回一个包含登录表单的组件
 *
 * @example
 * ```tsx
 * <LoginForm />
 * ```
 */
'use client';

import IconInput from '@/components/IconInput';
import LoadingButton from '@/components/LoadingButton';
import PasswordInput from '@/components/PasswordInput';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { signIn } from '@/lib/auth/auth-client';
import { emailSchema, passwordSchema } from '@/lib/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { SiGithub } from '@icons-pack/react-simple-icons';
import { User } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

// 定义表单验证模式
const formSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

type FormValue = z.infer<typeof formSchema>;

const LoginForm = () => {
  // 登录状态管理
  const [loginLoading, setLoginLoading] = useState(false);
  // const router = useRouter();

  // 初始化表单
  const form = useForm<FormValue>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  /**
   * 处理表单提交
   * @param {FormValue} data - 表单数据，包含邮箱和密码
   */
  const handleSubmit = async (data: FormValue) => {
    // TODO: 实现邮箱密码登录逻辑
    // try {
    //   setLoginLoading(true);
    //   await credentialLogin(data);
    //   toast.success('登录成功');
    //   navigate('/', { replace: true });
    // } catch (e) {
    //   toast.error((e as ApiError).message);
    // } finally {
    //   setLoginLoading(false);
    // }
  };

  /**
   * 处理 GitHub 登录
   * 使用 OAuth 方式进行 GitHub 第三方登录
   */
  const handleGithubClick = async () => {
    try {
      setLoginLoading(true);
      const data = await signIn.social({
        provider: 'github',
      });
      if (data.error) {
        toast.error('登录失败');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="min-w-80">
      <h1 className="text-2xl font-bold text-start">登录 LLMOps AppBuilder</h1>
      <p className="text-muted-foreground mb-8">高效开发你的AI原生应用</p>
      <Form {...form}>
        <form className="space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
          {/* 邮箱输入框 */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <IconInput
                    placeholder="登录账号"
                    {...field}
                    leftIcon={User}
                    required
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* 密码输入框 */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <PasswordInput placeholder="账号密码" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* 登录按钮 */}
          <LoadingButton
            text="登录"
            className="w-full"
            isLoading={loginLoading}
          />
        </form>
      </Form>
      <Separator className="my-7" />
      {/* GitHub 登录按钮 */}
      <Button
        className="w-full"
        variant="secondary"
        disabled={loginLoading}
        onClick={handleGithubClick}
      >
        <SiGithub title="Github" size={16} /> Github
      </Button>
    </div>
  );
};

export default LoginForm;
