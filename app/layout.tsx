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
import type { Metadata } from 'next';
import './globals.css';

// 应用元数据配置
export const metadata: Metadata = {
  title: 'LLM Ops',
  description: 'LLM Ops',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* 全局样式和子组件将被注入到这里 */}
      <body>{children}</body>
    </html>
  );
}
