'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import type { ReactNode } from 'react';

const queryClient = new QueryClient();

/**
 * 客户端提供者组件，为应用提供必要的客户端上下文
 *
 * 该组件封装了应用所需的客户端提供者，包括：
 * - QueryClient：提供 React Query 的数据获取和缓存功能
 * - NuqsAdapter：提供 URL 搜索参数状态管理功能
 *
 * @param children - 子组件，将被包装在提供者中
 * @returns 包装了所有必要提供者的组件树
 *
 * @example
 * ```tsx
 * <ClientProvider>
 *   <App />
 * </ClientProvider>
 * ```
 */
export const ClientProvider = ({ children }: { children: ReactNode }) => {
  return (
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </NuqsAdapter>
  );
};
