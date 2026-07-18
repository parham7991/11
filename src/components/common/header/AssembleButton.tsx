'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * 🎮 AssembleButton — دکهٔ اسمبل آنلاین هوشمند (نسخهٔ نهایی)
 *
 * تک‌دکمهٔ زیبا و تو چشم:
 *   - روی همهٔ صفحات نمایش داده می‌شه
 *   - روی صفحهٔ /assemble مخفی می‌شه (چون خود صفحه hero داره)
 *   - با gradient متحرک + glow + pulse animation
 */
export default function AssembleButton({ className = '' }: { className?: string }) {
  const pathname = usePathname();
  const [hovered, setHovered] = useState(false);

  // روی صفحهٔ اسمبل، دکمه مخفی می‌شه (تکراری نباشه)
  if (pathname?.startsWith('/assemble') || pathname?.startsWith('/assemble-online')) return null;

  return (
    <Link
      href="/assemble-online"
      prefetch={false}
      className={`asm-header-btn ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="اسمبل آنلاین هوشمند"
    >
      <span className="asm-header-btn__icon">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect
            x="7"
            y="7"
            width="10"
            height="10"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <rect
            x="10"
            y="10"
            width="4"
            height="4"
            rx="0.5"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M9 4v3M12 4v3M15 4v3M9 17v3M12 17v3M15 17v3M4 9h3M4 12h3M4 15h3M17 9h3M17 12h3M17 15h3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        <span className="asm-header-btn__pulse" />
      </span>
      <span className="asm-header-btn__content">
        <span className="asm-header-btn__title">اسمبل آنلاین هوشمند</span>
        <span className="asm-header-btn__subtitle">
          <span className="asm-header-btn__dot" />
          اسمبل هوشمند قطعات
        </span>
      </span>
      <span className="asm-header-btn__arrow">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M15 19l-7-7 7-7"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </Link>
  );
}
