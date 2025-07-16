/**
 * 授权布局组件
 *
 * 这是一个受保护的布局组件，用于包装需要用户认证的路由。
 * 它会检查用户的会话状态，如果用户未登录，将重定向到登录页面。
 *
 * @component
 * @param {Object} props - 组件属性
 * @param {ReactNode} props.children - 子组件
 * @returns {JSX.Element} 返回一个包含子组件的受保护布局
 */
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { ClientProvider } from './_component/ClientProvider';

const AuthorizedLayout = async ({ children }: { children: ReactNode }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  return (
    <main className="w-screen h-screen">
      <ClientProvider>{children}</ClientProvider>
    </main>
  );
};

export default AuthorizedLayout;
