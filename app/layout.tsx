/**
 * 根布局组件
 *
 * 这是应用的根布局组件，定义了整个应用的基础 HTML 结构。
 * 设置了应用的基本元数据，包括标题和描述。
 * 所有页面都将被包裹在这个布局中。
 *
 * @component
 * @param {Object} props - 组件属性
 * @param {React.ReactNode} props.children - 子组件
 * @returns {JSX.Element} 返回应用的根布局结构
 *
 * @example
 * ```tsx
 * <RootLayout>
 *   <YourPage />
 * </RootLayout>
 * ```
 */

// 导入必要的依赖
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import ModalProvider from '@/components/ModalProvider';

// 应用元数据配置
// 这些配置将用于 SEO 和浏览器标签页显示
export const metadata: Metadata = {
  title: 'LLM Ops',
  description: 'LLM Ops',
};

/**
 * 根布局组件实现
 *
 * @param {Object} props - 组件属性
 * @param {React.ReactNode} props.children - 子组件，将被渲染在布局中
 * @returns {JSX.Element} 返回包含子组件的 HTML 结构
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* 全局样式和子组件将被注入到这里 */}
      <body>
        <ModalProvider>{children}</ModalProvider>
        {/* Toaster 组件用于显示全局通知消息 */}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
