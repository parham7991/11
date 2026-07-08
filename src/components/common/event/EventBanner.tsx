'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useEventTheme } from './EventThemeProvider';

/**
 * EventBanner
 * نوار اعلان متحرک بالای سایت برای تم مناسبتی فعال.
 * - قابل بستن توسط کاربر (در sessionStorage ذخیره می‌شود)
 * - دارای متن چرخان (marquee) و دکمهٔ CTA
 * - اگر تمی فعال نباشد، چیزی رندر نمی‌شود.
 */
const STORAGE_KEY = 'offl-event-banner-dismissed';

export default function EventBanner() {
  const { theme, isActive } = useEventTheme();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isActive) return;
    try {
      const dismissed = sessionStorage.getItem(`${STORAGE_KEY}:${theme?.id}`);
      setVisible(dismissed !== '1');
    } catch {
      setVisible(true);
    }
  }, [isActive, theme?.id]);

  if (!isActive || !theme || !visible) return null;

  const handleClose = () => {
    setVisible(false);
    try {
      sessionStorage.setItem(`${STORAGE_KEY}:${theme.id}`, '1');
    } catch {}
  };

  // متن چرخان را چند بار تکرار می‌کنیم تا marquee پیوسته دیده شود
  const marqueeItems = Array.from({ length: 6 }).map((_, i) => (
    <span key={i} className="event-banner__marquee-item">
      {theme.floatingEmojis.join('  ')} &nbsp; {theme.bannerSubtitle} &nbsp;
    </span>
  ));

  return (
    <div className="event-banner" role="region" aria-label={theme.name}>
      {/* لایهٔ درخشش متحرک پس‌زمینه */}
      <div className="event-banner__glow" aria-hidden="true" />

      <div className="event-banner__inner">
        {/* عنوان + آیکن چرخان */}
        <div className="event-banner__title">
          <span className="event-banner__spark" aria-hidden="true">
            ⚽
          </span>
          <strong>{theme.bannerTitle}</strong>
        </div>

        {/* متن چرخان وسط */}
        <div className="event-banner__marquee" aria-hidden="true">
          <div className="event-banner__marquee-track">{marqueeItems}</div>
        </div>

        {/* دکمهٔ اکشن */}
        {theme.bannerCtaText && theme.bannerCtaHref && (
          <Link href={theme.bannerCtaHref} className="event-banner__cta">
            {theme.bannerCtaText}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M15 19l-7-7 7-7"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        )}

        {/* دکمهٔ بستن */}
        <button
          type="button"
          className="event-banner__close"
          onClick={handleClose}
          aria-label="بستن"
          title="بستن"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
