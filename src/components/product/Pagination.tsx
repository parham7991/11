'use client';
import useGlobalStore from '@/store/global-store';
import { Pagination as ReactPagination } from '@heroui/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useTransition } from 'react';
type Props = {
  className?: string;
  total?: number;
  top?: number;
};
export default function Pagination({ className, total = 10, top = 220 }: Props) {
  const { setIsPendingCategory } = useGlobalStore();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const onPage = (page: number) => {
    startTransition(() => {
      const currentUrl = new URL(window.location.href);
      const searchParams = new URLSearchParams(currentUrl.search);
      searchParams.set('page', page.toString());
      const newQueryString = searchParams.toString();
      router.push(`${pathname}?${newQueryString}`, { scroll: false });
    });

    window.scrollTo({
      top: top,
      behavior: 'smooth',
    });
  };
  useEffect(() => {
    // setIsPendingCategory(isPending);
  }, [isPending]);
  return (
    <ReactPagination
      onChange={onPage}
      dir="rtl"
      classNames={{ item: 'active:bg-main font-reqular', cursor: 'bg-main !z-0' }}
      className={`m-auto flex !w-fit items-center justify-center overflow-hidden ${className}`}
      initialPage={Number(searchParams.get('page')) || 1}
      total={total}
    />
  );
}
