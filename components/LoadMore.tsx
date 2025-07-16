'use client';

import { LoaderCircle } from 'lucide-react';
import { useEffect } from 'react';
import { useIntersectionObserver } from 'usehooks-ts';

/**
 * LoadMore 组件的属性类型
 */
type Props = {
  /** 当组件进入视口时触发的回调函数，用于加载更多数据 */
  onLoadMore: () => void;
};

/**
 * LoadMore 组件
 *
 * 显示加载中的状态，并在组件进入视口时自动触发加载更多数据。
 * 组件会显示一个旋转的加载图标和"加载中..."文本。
 *
 * @param props - 组件属性
 * @param props.onLoadMore - 加载更多数据的回调函数
 * @returns 加载更多组件
 */
const LoadMore = ({ onLoadMore }: Props) => {
  const { isIntersecting, ref } = useIntersectionObserver();

  useEffect(() => {
    if (isIntersecting) {
      onLoadMore();
    }
  }, [isIntersecting, onLoadMore]);

  return (
    <div
      ref={ref}
      className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
    >
      <LoaderCircle className="animate-spin" />
      <p>加载中...</p>
    </div>
  );
};

export default LoadMore;
