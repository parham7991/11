'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getActiveEventTheme, type EventThemeConfig } from '@/lib/event-theme';

/**
 * EventThemeProvider
 * ──────────────────────────────────────────────────────────────────
 * تم مناسبتی فعال را در اختیار کل اپ قرار می‌دهد و کلاس مربوطه را
 * (مثل `event-worldcup`) روی <html> نگه می‌دارد تا CSS تم فعال شود.
 *
 * نکته: کلاس اولیه را اسکریپت inline داخل layout (قبل از hydration)
 * ست می‌کند تا «پرش تم» (FOUC) نداشته باشیم؛ این provider صرفاً آن را
 * تثبیت/همگام نگه می‌دارد و context را فراهم می‌کند.
 * ──────────────────────────────────────────────────────────────────
 */

type EventThemeContextValue = {
  theme: EventThemeConfig | null;
  isActive: boolean;
};

const EventThemeContext = createContext<EventThemeContextValue>({
  theme: null,
  isActive: false,
});

export const EventThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // تم با env تعیین می‌شود و در طول عمر اپ ثابت است
  const theme = useMemo(() => getActiveEventTheme(), []);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // پاک‌کردن هر کلاس event-* قدیمی و ست‌کردن کلاس تم فعلی
    const toRemove: string[] = [];
    root.classList.forEach((cls) => {
      if (cls.startsWith('event-')) toRemove.push(cls);
    });
    toRemove.forEach((cls) => root.classList.remove(cls));

    if (theme) {
      root.classList.add(theme.htmlClass);
      root.dataset.eventTheme = theme.id;
    } else {
      delete root.dataset.eventTheme;
    }
  }, [theme]);

  const value = useMemo<EventThemeContextValue>(
    () => ({ theme, isActive: Boolean(theme) }),
    [theme]
  );

  // برای جلوگیری از mismatch، تا قبل از mount چیزی تغییر نمی‌دهیم
  void mounted;

  return <EventThemeContext.Provider value={value}>{children}</EventThemeContext.Provider>;
};

export const useEventTheme = () => useContext(EventThemeContext);
