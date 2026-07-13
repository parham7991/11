'use client';

import { useState } from 'react';
import { usePWAStore } from '@/store/pwa-store';

const isIOS = () =>
  typeof navigator !== 'undefined' &&
  (/iP(hone|od|ipad)/i.test(navigator.userAgent) ||
    ((navigator as unknown as { platform?: string }).platform === 'MacIntel' &&
      (navigator as unknown as { maxTouchPoints?: number }).maxTouchPoints! > 1));

type Props = {
  className?: string;
  label?: string;
};

export default function InstallButton({ className = '', label }: Props) {
  const deferredPrompt = usePWAStore((s) => s.deferredPrompt);
  const install = usePWAStore((s) => s.install);
  const [help, setHelp] = useState(false);

  const onClick = async () => {
    const ok = await install();
    if (!ok) setHelp(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        aria-label="نصب اپلیکیشن آفلند"
        title={deferredPrompt ? 'نصب اپلیکیشن آفلند' : 'راهنمای نصب اپلیکیشن'}
        className={className}
      >
        <DownloadIcon />
        {label ? <span className="font-medium text-main">{label}</span> : null}
      </button>

      {help && (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 p-4"
          onClick={() => setHelp(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-5 text-right shadow-2xl dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#386bf9] to-[#6f3cf5] text-white">
                <DownloadIcon />
              </span>
              <h3 className="text-base font-black text-slate-900 dark:text-white">نصب اپلیکیشن آفلند</h3>
            </div>
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
              {isIOS()
                ? 'در مرورگر Safari روی دکمه اشتراک‌گذاری (بالا) بزن، سپس «Add to Home Screen» را انتخاب کن تا آفلند کنار بقیه اپ‌ها قرار بگیرد.'
                : 'در مرورگر روی دکمه منو (⁝) یا آیکون نصب کنار نوار آدرس بزن و گزینه «نصب آفلند» را انتخاب کن. اگر دکمه نصب نمایش داده نشد، صفحه را رفرش کن.'}
            </p>
            <button
              type="button"
              onClick={() => setHelp(false)}
              className="mt-4 h-11 w-full rounded-xl bg-main font-bold text-white"
            >
              فهمیدم
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M12 3v12M12 15l-4-4M12 15l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 19h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
