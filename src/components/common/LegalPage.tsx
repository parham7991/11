import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * LegalPage + زیرکامپوننت‌های مشترک برای صفحات قانونی/محتوایی آفلند.
 * Server Component (بدون use client) — تمام خروجی در سمت سرور رندر می‌شود.
 * تم‌آگاه از طریق متغیرهای CSS (--offl-*) تعریف‌شده در globals.css.
 */

const SITE_URL = 'https://www.offl.ir'; // ثابت پایهٔ سایت (برای JSON-LD و لینک‌های مطلق)

type Crumb = { name: string; url: string };

function LegalBreadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="مسیر صفحه" className="mb-5">
      <ol className="flex flex-wrap items-center gap-2 font-reqular text-[13px]">
        {items.map((it, i) => (
          <li key={`${it.url}-${i}`} className="flex items-center gap-2">
            {i > 0 && (
              <span className="block h-4 w-px rotate-[25deg] bg-[#A8AFB8]" aria-hidden="true" />
            )}
            {it.url ? (
              <Link
                href={it.url}
                className="text-[#A8AFB8] transition-colors hover:text-[var(--offl-primary)]"
              >
                {it.name}
              </Link>
            ) : (
              <span className="text-[var(--offl-text-muted)]" aria-current="page">
                {it.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export type LegalPageProps = {
  title: string;
  description?: string;
  /** نام صفحهٔ فعلی برای breadcrumb (مثلاً «حریم خصوصی») */
  breadcrumb: string;
  /** یک شیء یا آرایه‌ای از اشیاء JSON-LD برای تزریق در <head> */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  children: ReactNode;
};

export default function LegalPage({
  title,
  description,
  breadcrumb,
  jsonLd,
  children,
}: LegalPageProps) {
  const crumbs: Crumb[] = [
    { name: 'آفلند', url: '/' },
    { name: breadcrumb, url: '' },
  ];
  return (
    <main className="container_page py-6 lg:py-10">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <LegalBreadcrumb items={crumbs} />
      <article className="overflow-hidden rounded-2xl border border-[var(--offl-border)] bg-[var(--offl-surface)] p-5 lg:p-10">
        <header className="border-b border-[var(--offl-border)] pb-6">
          <h1 className="font-bold text-2xl leading-tight text-[var(--offl-text)] lg:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-3 font-reqular text-[15px] leading-7 text-[var(--offl-text-muted)] lg:text-base">
              {description}
            </p>
          )}
        </header>
        <div className="mt-7 space-y-9">{children}</div>
        <footer className="mt-10 border-t border-[var(--offl-border)] pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl font-light text-[12px] leading-6 text-[var(--offl-text-muted)]">
              ما متعهد به{' '}
              <Link
                href="/privacy"
                className="font-medium text-[var(--offl-primary)] transition hover:underline"
              >
                حفظ حریم خصوصی
              </Link>{' '}
              شما هستیم؛ داده‌هایتان شفاف و طبق سیاست حریم خصوصی پردازش می‌شود.
            </p>
            <nav
              aria-label="پیوندهای قانونی"
              className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px]"
            >
              <Link
                href="/privacy"
                className="text-[var(--offl-text-muted)] transition hover:text-[var(--offl-primary)]"
              >
                حریم خصوصی
              </Link>
              <Link
                href="/Terms"
                className="text-[var(--offl-text-muted)] transition hover:text-[var(--offl-primary)]"
              >
                شرایط و قوانین
              </Link>
              <Link
                href="/warranty"
                className="text-[var(--offl-text-muted)] transition hover:text-[var(--offl-primary)]"
              >
                گارانتی
              </Link>
              <Link
                href="/contact-us"
                className="text-[var(--offl-text-muted)] transition hover:text-[var(--offl-primary)]"
              >
                تماس با ما
              </Link>
            </nav>
          </div>
          <p className="mt-4 font-light text-[11px] text-[var(--offl-text-muted)]">
            آفلند · سرزمینِ تخفیف — تمامی حقوق محفوظ است.
          </p>
        </footer>
      </article>
    </main>
  );
}

export function LegalSection({
  title,
  id,
  children,
}: {
  title: string;
  id?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-h` : undefined} className="scroll-mt-24">
      <h2
        id={id ? `${id}-h` : undefined}
        className="mb-4 flex items-center gap-2 font-bold text-xl text-[var(--offl-text)] lg:text-2xl"
      >
        <span
          className="inline-block h-5 w-1.5 rounded-full bg-[var(--offl-primary)]"
          aria-hidden="true"
        />
        {title}
      </h2>
      <div className="space-y-3 font-reqular text-[15px] leading-8 text-[var(--offl-text-muted)]">
        {children}
      </div>
    </section>
  );
}

export function LegalCard({
  icon,
  title,
  children,
}: {
  icon?: ReactNode;
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--offl-border)] bg-[var(--offl-bg-soft)] p-5">
      {title && (
        <h3 className="mb-2 flex items-center gap-2 font-bold text-base text-[var(--offl-text)]">
          {icon}
          {title}
        </h3>
      )}
      <div className="space-y-2 font-reqular text-[14px] leading-7 text-[var(--offl-text-muted)]">
        {children}
      </div>
    </div>
  );
}

export function LegalList({ items, ordered = false }: { items: ReactNode[]; ordered?: boolean }) {
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <Tag className={ordered ? 'list-decimal space-y-2 ps-6' : 'list-disc space-y-2 ps-6'}>
      {items.map((it, i) => (
        <li key={i} className="font-reqular text-[15px] leading-8 text-[var(--offl-text-muted)]">
          {it}
        </li>
      ))}
    </Tag>
  );
}

export function LegalTable({
  headers,
  rows,
  caption,
}: {
  headers: string[];
  rows: ReactNode[][];
  caption?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--offl-border)]">
      <table className="w-full border-collapse text-right font-reqular text-[14px]">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="bg-[var(--offl-bg-soft)] text-[var(--offl-text)]">
            {headers.map((h, i) => (
              <th
                key={i}
                scope="col"
                className="border-b border-[var(--offl-border)] px-4 py-3 text-start font-bold"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="text-[var(--offl-text-muted)] even:bg-[var(--offl-bg-soft)]">
              {row.map((cell, ci) => (
                <td key={ci} className="border-b border-[var(--offl-border)] px-4 py-3 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { SITE_URL };
