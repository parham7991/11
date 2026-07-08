'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiCpu, FiSearch, FiShoppingCart } from 'react-icons/fi';

export default function FloatingSmartActions() {
  const pathname = usePathname();
  if (pathname?.startsWith('/auth') || pathname?.startsWith('/mag')) return null;

  return (
    <div className="offl-floating-actions" aria-label="دسترسی سریع آفلند">
      <Link href="/assemble-online" prefetch={false} className="offl-floating-actions__main">
        <FiCpu />
        <span>اسمبل آنلاین</span>
      </Link>
      <Link href="/result" prefetch={false} aria-label="جستجوی محصولات">
        <FiSearch />
      </Link>
      <Link href="/cart" prefetch={false} aria-label="سبد خرید">
        <FiShoppingCart />
      </Link>
    </div>
  );
}
