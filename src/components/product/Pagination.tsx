'use client';
import useGlobalStore from '@/store/global-store';
import { Pagination as ReactPagination } from '@heroui/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useTransition } from 'react';

type Props = {
  className?: string;
  total?: number;
  top?: number;
  /** For offset-label mode: products per page (used to compute start index). */
  perPage?: number;
  /** When true, buttons are labeled with the starting product index (1, 11, 21…). */
  offsetLabels?: boolean;
};

export default function Pagination({
  className,
  total = 10,
  top = 220,
  perPage = 1,
  offsetLabels = false,
}: Props) {
  const { setIsPendingCategory } = useGlobalStore();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const current = Number(searchParams.get('page')) || 1;

  const goTo = (page: number) => {
    const p = Math.min(Math.max(page, 1), total);
    startTransition(() => {
      const currentUrl = new URL(window.location.href);
      const sp = new URLSearchParams(currentUrl.search);
      sp.set('page', p.toString());
      router.push(`${pathname}?${sp.toString()}`, { scroll: false });
    });
    window.scrollTo({ top, behavior: 'smooth' });
  };

  useEffect(() => {
    // setIsPendingCategory(isPending);
  }, [isPending]);

  // ── Offset-label mode (custom): label = starting product index ──
  if (offsetLabels) {
    const labelFor = (p: number) => (p - 1) * perPage + 1;

    // windowed page list with ellipsis
    const windowSize = 5;
    let start = Math.max(2, current - Math.floor(windowSize / 2));
    let end = Math.min(total - 1, start + windowSize - 1);
    start = Math.max(2, end - windowSize + 1);

    const pages: (number | '...')[] = [1];
    if (start > 2) pages.push('...');
    for (let p = start; p <= end; p++) pages.push(p);
    if (end < total - 1) pages.push('...');
    if (total > 1) pages.push(total);

    const btnBase = 'min-w-[2.25rem] rounded-lg px-2 py-1.5 text-sm font-medium transition';
    const btnIdle =
      'border border-[var(--offl-border)] text-[var(--offl-text)] hover:bg-[var(--offl-surface-2)]';
    const btnActive = 'bg-main text-white';
    const arrowBtn =
      'flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--offl-border)] text-[var(--offl-text)] transition hover:bg-[var(--offl-surface-2)] disabled:opacity-40';

    return (
      <div
        dir="rtl"
        className={`m-auto flex w-fit items-center justify-center gap-1.5 ${className ?? ''}`}
      >
        <button
          type="button"
          onClick={() => goTo(current - 1)}
          disabled={current <= 1}
          aria-label="prev"
          className={arrowBtn}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dot-${i}`} className="px-1 text-[var(--offl-text-muted)]">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => goTo(p)}
              aria-current={p === current ? 'page' : undefined}
              className={`${btnBase} ${p === current ? btnActive : btnIdle}`}
            >
              {labelFor(p)}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => goTo(current + 1)}
          disabled={current >= total}
          aria-label="next"
          className={arrowBtn}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
      </div>
    );
  }

  // ── Default HeroUI mode (unchanged) ──
  return (
    <ReactPagination
      onChange={goTo}
      dir="rtl"
      classNames={{ item: 'active:bg-main font-reqular', cursor: 'bg-main !z-0' }}
      className={`m-auto flex !w-fit items-center justify-center overflow-hidden ${className}`}
      initialPage={current}
      total={total}
    />
  );
}
