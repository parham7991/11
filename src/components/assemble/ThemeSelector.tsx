'use client';

/**
 * ════════════════════════════════════════════════════════════════
 * 🎨 ThemeSelector.tsx — انتخابگر تِم ظاهری سیستم اسمبل
 * ════════════════════════════════════════════════════════════════
 *
 * ۳ تِم رسمی آفلند:
 *   • ❄️ Snow White — قطعات سفید در اولویت
 *   • 🖤 Black Stealth — مشکی مات، بدون RGB
 *   • 🌈 Full ARGB — قطعات دارای نورپردازی آدرس‌پذیر
 *
 * تِم انتخابی به عنوان hint برای الگوریتم امتیازدهی و همچنین
 * کلاس CSS روی داشبورد اعمال می‌شود.
 * ════════════════════════════════════════════════════════════════
 */

import React from 'react';

export type AssembleTheme = 'snow' | 'stealth' | 'rgb';

type Props = {
  value: AssembleTheme;
  onChange: (t: AssembleTheme) => void;
};

const THEMES: Array<{ id: AssembleTheme; label: string; desc: string; icon: string }> = [
  { id: 'snow', label: 'سفید برفی', desc: 'قطعات سفید All-White', icon: '❄️' },
  { id: 'stealth', label: 'مشکی مات', desc: 'Black Stealth بدون RGB', icon: '🖤' },
  { id: 'rgb', label: 'ARGB نمایشی', desc: 'نورپردازی هماهنگ کامل', icon: '🌈' },
];

export default function ThemeSelector({ value, onChange }: Props) {
  return (
    <div className="asm-theme">
      <span className="asm-theme__label">تِم ظاهری سیستم:</span>
      <div className="asm-theme__group">
        {THEMES.map(t => (
          <button
            key={t.id}
            type="button"
            className={`asm-theme__btn${value === t.id ? ' asm-theme__btn--active' : ''} asm-theme__btn--${t.id}`}
            onClick={() => onChange(t.id)}
            title={t.desc}
          >
            <span className="asm-theme__ico">{t.icon}</span>
            <span className="asm-theme__txt">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
