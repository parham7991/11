'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from './ThemeProvider';

type ThemeMode = 'light' | 'dark' | 'system';

const themeOptions: Array<{ mode: ThemeMode; title: string; description: string; icon: React.ReactNode }> = [
  {
    mode: 'light',
    title: 'روشن',
    description: 'ظاهر شفاف روز',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    mode: 'dark',
    title: 'تاریک',
    description: 'نئون عمیق آفلند',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M21 14.4A8.3 8.3 0 0 1 9.6 3a8.8 8.8 0 1 0 11.4 11.4Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 3.5h.01M19 6.5h.01" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    mode: 'system',
    title: 'سیستمی',
    description: 'هماهنگ با دستگاه',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M8 20h8M12 16v4" strokeLinecap="round" />
      </svg>
    ),
  },
];

const ThemeToggle = () => {
  const { mode, resolvedTheme, setMode, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const activeOption = themeOptions.find((option) => option.mode === mode) ?? themeOptions[2];

  return (
    <div ref={wrapperRef} className="fixed bottom-24 left-4 z-[9998] flex flex-col items-end gap-3 print:hidden lg:bottom-6 lg:left-6" dir="rtl">
      <div
        className={`theme-command-panel w-[245px] overflow-hidden rounded-3xl border border-white/20 bg-white/85 p-2 shadow-2xl shadow-blue-500/20 backdrop-blur-2xl transition-all duration-300 dark:border-white/10 dark:bg-slate-950/80 dark:shadow-blue-500/10 ${
          isOpen ? 'translate-y-0 scale-100 opacity-100' : 'pointer-events-none translate-y-4 scale-95 opacity-0'
        }`}
      >
        <div className="px-3 py-2">
          <p className="font-bold text-[13px] text-slate-900 dark:text-white">حالت نمایش آفلند</p>
          <p className="mt-1 font-medium text-[11px] text-slate-500 dark:text-slate-400">تغییر تم روی همه صفحات ذخیره می‌شود.</p>
        </div>
        <div className="grid gap-1.5">
          {themeOptions.map((option) => {
            const active = option.mode === mode;
            return (
              <button
                key={option.mode}
                type="button"
                onClick={(event) => {
                  setMode(option.mode, { x: event.clientX, y: event.clientY });
                  setIsOpen(false);
                }}
                className={`group flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-right transition-all duration-300 ${
                  active ? 'bg-main text-white shadow-lg shadow-blue-500/25' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-2xl transition-all ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-main dark:bg-white/10'}`}>{option.icon}</span>
                  <span>
                    <span className="block font-bold text-[13px]">{option.title}</span>
                    <span className={`block font-medium text-[11px] ${active ? 'text-white/75' : 'text-slate-400'}`}>{option.description}</span>
                  </span>
                </span>
                {active ? <span className="text-lg leading-none">✓</span> : null}
              </button>
            );
          })}
        </div>
      </div>
      <div className="relative">
        <span className="theme-orbit theme-orbit-one" />
        <span className="theme-orbit theme-orbit-two" />
        <button
          type="button"
          aria-label="تغییر حالت نمایش"
          title={`تم فعلی: ${activeOption.title} (${resolvedTheme === 'dark' ? 'تاریک' : 'روشن'})`}
          onClick={() => setIsOpen((prev) => !prev)}
          onDoubleClick={(event) => toggleTheme({ x: event.clientX, y: event.clientY })}
          className="theme-toggle-button group relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-3xl border border-white/30 bg-white/90 text-main shadow-2xl shadow-blue-500/25 backdrop-blur-2xl transition-all duration-500 hover:-translate-y-1 hover:scale-105 active:scale-95 dark:border-white/10 dark:bg-slate-950/90 dark:text-blue-300 dark:shadow-blue-400/10 lg:h-16 lg:w-16"
        >
          <span className="absolute inset-0 bg-gradient-to-br from-blue-500/15 via-purple-500/10 to-cyan-400/15 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <span className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-main text-white shadow-lg shadow-blue-500/30 transition-all duration-500 group-hover:rotate-12 dark:bg-blue-500/20 dark:text-blue-200">{activeOption.icon}</span>
          <span className="absolute -left-1 -top-1 h-4 w-4 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
        </button>
      </div>
    </div>
  );
};

export default ThemeToggle;
