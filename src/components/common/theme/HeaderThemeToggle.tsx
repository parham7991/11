'use client';

import React from 'react';
import { useTheme } from '../theme/ThemeProvider';

const HeaderThemeToggle = () => {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={resolvedTheme === 'dark' ? 'روشن کردن' : 'تاریک کردن'}
      title={resolvedTheme === 'dark' ? 'حالت روشن' : 'حالت تاریک'}
      className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white transition-all duration-300 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md active:scale-90 dark:border-white/10 dark:bg-white/5 dark:hover:border-blue-400/50 dark:hover:bg-blue-500/10 dark:hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] lg:h-10 lg:w-10"
    >
      {/* Sun icon - shown in dark mode */}
      <svg
        className={`absolute h-5 w-5 text-amber-400 transition-all duration-300 ${resolvedTheme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`}
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
      {/* Moon icon - shown in light mode */}
      <svg
        className={`absolute h-5 w-5 text-blue-600 transition-all duration-300 ${resolvedTheme === 'light' ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  );
};

export default HeaderThemeToggle;
