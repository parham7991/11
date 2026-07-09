'use client';

import React from 'react';
import { useTheme } from '@/components/common/theme/ThemeProvider';

export default function MagThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={(event) => toggleTheme({ x: event.clientX, y: event.clientY })}
      aria-label={isDark ? 'فعال‌سازی حالت روشن مجله' : 'فعال‌سازی حالت تاریک مجله'}
      title={isDark ? 'حالت روشن' : 'حالت تاریک'}
      className="mag-theme-toggle group relative inline-flex items-center gap-3 overflow-hidden rounded-2xl border border-white/15 bg-white/12 px-3 py-2.5 text-white shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/18 active:scale-95 dark:border-blue-300/15 dark:bg-slate-950/45 dark:hover:bg-slate-900/70 lg:px-4"
    >
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-transparent to-violet-400/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/14 shadow-inner dark:bg-white/8">
        <svg
          className={`absolute h-5 w-5 text-amber-300 transition-all duration-300 ${
            isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
        <svg
          className={`absolute h-5 w-5 text-cyan-200 transition-all duration-300 ${
            !isDark ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </span>
      <span className="relative hidden flex-col items-start leading-none sm:flex">
        <span className="text-[10px] text-white/65">حالت نمایش</span>
        <span className="mt-1 text-[12px] font-medium text-white">{isDark ? 'روشن' : 'تاریک'}</span>
      </span>
    </button>
  );
}
