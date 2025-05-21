/**
 * Logo 组件
 *
 * 一个可复用的 Logo 组件，支持可选的链接包装和自定义样式。
 * 当提供 href 属性时，Logo 会被包装在 Next.js Link 组件中。
 *
 * @component
 * @example
 * // 基础用法
 * <Logo />
 *
 * // 带链接的用法
 * <Logo href="/" />
 *
 * // 自定义样式
 * <Logo className="custom-class" />
 */

import { cn } from '@/lib/utils';
import Link from 'next/link';

type Props = {
  /** 自定义 CSS 类名 */
  className?: string;
  /** 可选的链接地址，如果提供则 Logo 会被包装在链接中 */
  href?: string;
};

const logoClass = 'w-28 h-9 rounded-lg bg-border';

const Logo = ({ className, href }: Props) => {
  if (href) {
    return (
      <Link className={cn('w-fit', className)} href={href}>
        <div className={logoClass} />
      </Link>
    );
  }

  return <div className={cn(logoClass, className)} />;
};

export default Logo;
