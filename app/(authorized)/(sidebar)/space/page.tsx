/**
 * 空间页面入口组件
 *
 * 该组件作为空间页面的主入口，负责将用户自动重定向到应用列表页面。
 * 这是一个重定向组件，不渲染任何实际内容。
 */

'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * 空间页面入口组件
 *
 * 该组件在页面加载时自动重定向到 `/space/apps` 页面，
 * 提供从根空间路径到应用列表页面的无缝导航体验。
 *
 * @returns {null} 不渲染任何内容
 */
const SpaceIndexPage = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace('/space/apps');
  }, [router]);

  return null;
};

export default SpaceIndexPage;
