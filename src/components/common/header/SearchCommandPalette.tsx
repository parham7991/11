'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search_Icon } from '../Icon';

const HISTORY_KEY = 'offl_search_history';
const POPULAR_TAGS = ['کیس_شیشه‌ای', 'RTX_4060', 'لپ_تاپ', 'گیمینگ', 'ادکلن', 'آرایشی'];

const SearchCommandPalette = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<string[]>([]);

  // بارگذاری تاریخچهٔ جستجو
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  // شنیدن Ctrl/Cmd + K و ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const saveHistory = (q: string) => {
    const clean = q.trim();
    if (!clean) return;
    const next = [clean, ...history.filter((h) => h !== clean)].slice(0, 8);
    setHistory(next);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const go = (q: string) => {
    const clean = q.trim();
    if (!clean) return;
    saveHistory(clean);
    setOpen(false);
    setQuery('');
    router.push(`/result?q=${encodeURIComponent(clean)}`);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-start justify-center bg-black/50 px-4 pt-[12vh] backdrop-blur-sm"
      onMouseDown={() => setOpen(false)}
    >
      <div
        className="glass-panel w-full max-w-[640px] overflow-hidden p-4 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* input */}
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/60 px-4 dark:bg-white/5">
          <Search_Icon className="h-5 w-5 text-gray-500 dark:text-zinc-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') go(query);
            }}
            placeholder="جستجو در آفلند…"
            className="w-full bg-transparent py-4 text-right text-[15px] text-gray-900 outline-none placeholder:text-gray-400 dark:text-zinc-100"
          />
          <kbd className="hidden rounded-md border border-gray-300 px-2 py-1 text-[11px] text-gray-400 dark:border-white/10 dark:text-zinc-400 sm:block">
            ESC
          </kbd>
        </div>

        {/* history */}
        {history.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 px-1 font-medium text-[12px] text-gray-500 dark:text-zinc-400">
              جستجوهای اخیر
            </p>
            <div className="flex flex-wrap gap-2">
              {history.map((h, i) => (
                <button
                  key={i}
                  onClick={() => go(h)}
                  className="rounded-xl border border-gray-200 px-3 py-1.5 text-[13px] text-gray-700 transition-all hover:border-blue-400 hover:text-blue-600 dark:border-white/10 dark:text-zinc-300 dark:hover:border-cyan-500/50 dark:hover:text-cyan-300"
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* popular tags */}
        <div className="mt-4">
          <p className="mb-2 px-1 font-medium text-[12px] text-gray-500 dark:text-zinc-400">
            محبوب‌ترین‌ها
          </p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_TAGS.map((t, i) => (
              <button
                key={i}
                onClick={() => go(t)}
                className="rounded-xl bg-blue-50 px-3 py-1.5 font-medium text-[13px] text-blue-600 transition-all hover:bg-blue-100 dark:bg-cyan-500/10 dark:text-cyan-300 dark:hover:bg-cyan-500/20"
              >
                #{t}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchCommandPalette;
