'use client';

import React, { useMemo } from 'react';
import { useEventTheme } from './EventThemeProvider';

/**
 * EventDecorations
 * المان‌های تزئینی شناور برای تم مناسبتی (توپ، جام، ستاره و...).
 * - pointer-events: none تا با کلیک‌های کاربر تداخل نکند
 * - position: fixed و z-index پایین تا روی محتوا نیفتد
 * - تعداد و مسیر حرکت به‌صورت شبه‌تصادفی ولی ثابت تولید می‌شود
 *   (با seed ثابت تا بین رندرها نپرد).
 */

type FloatItem = {
  emoji: string;
  left: number; // درصد افقی
  size: number; // px
  duration: number; // ثانیه
  delay: number; // ثانیه
  drift: number; // px جابجایی افقی
  opacity: number;
};

// تولید موقعیت‌های ثابت (deterministic) برای جلوگیری از hydration mismatch
function buildItems(emojis: string[]): FloatItem[] {
  if (!emojis.length) return [];
  const COUNT = 14;
  const items: FloatItem[] = [];
  for (let i = 0; i < COUNT; i++) {
    // مقادیر شبه‌تصادفی ولی قطعی بر اساس index
    const pseudo = (n: number) => ((Math.sin(i * 99.7 + n) + 1) / 2);
    items.push({
      emoji: emojis[i % emojis.length],
      left: Math.round(pseudo(1) * 96) + 2,
      size: Math.round(18 + pseudo(2) * 28),
      duration: Math.round((14 + pseudo(3) * 16) * 10) / 10,
      delay: Math.round(pseudo(4) * 12 * 10) / 10,
      drift: Math.round((pseudo(5) - 0.5) * 120),
      opacity: Math.round((0.12 + pseudo(6) * 0.22) * 100) / 100,
    });
  }
  return items;
}

export default function EventDecorations() {
  const { theme, isActive } = useEventTheme();
  const items = useMemo(() => buildItems(theme?.floatingEmojis ?? []), [theme?.floatingEmojis]);

  if (!isActive || !theme) return null;

  return (
    <div className="event-decor" aria-hidden="true">
      {items.map((it, idx) => (
        <span
          key={idx}
          className="event-decor__item"
          style={
            {
              left: `${it.left}%`,
              fontSize: `${it.size}px`,
              opacity: it.opacity,
              animationDuration: `${it.duration}s`,
              animationDelay: `${it.delay}s`,
              ['--drift' as string]: `${it.drift}px`,
            } as React.CSSProperties
          }
        >
          {it.emoji}
        </span>
      ))}
    </div>
  );
}
