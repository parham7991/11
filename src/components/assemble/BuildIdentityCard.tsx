'use client';

/**
 * ════════════════════════════════════════════════════════════════
 * 🎫 BuildIdentityCard.tsx — شناسنامه گرافیکی سیستم + QR Certificate
 * ════════════════════════════════════════════════════════════════
 *
 * کارت شکیل قابل اشتراک‌گذاری در استوری اینستاگرام / تلگرام /
 * واتساپ. شامل خلاصهٔ قطعات، قیمت کل و QR Code اختصاصی که با
 * اسکن دقیقاً همین کانفیگ را در سایت آفلند لود می‌کند.
 *
 * ⚠️ برای QR: از سرویس رایگان و پابلیک api.qrserver.com استفاده
 * می‌کنیم که نیازی به وابستگی npm ندارد.
 * ════════════════════════════════════════════════════════════════
 */

import React, { useMemo, useState } from 'react';

type IdCardPart = {
  id: string | number;
  name: string;
  category: string;
  categoryLabel: string;
  finalPrice: number;
  quantity?: number;
  shortSpec?: string;
};

type Props = {
  parts: IdCardPart[];
  useCaseLabel?: string;
  totalPrice: number;
  title?: string;
};

const toman = (n: number) => `${Math.round(n).toLocaleString('fa-IR')} تومان`;
const shortToman = (n: number) => {
  if (n >= 1_000_000_000)
    return `${(n / 1_000_000_000).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} میلیارد`;
  if (n >= 1_000_000) return `${Math.round(n / 1_000_000).toLocaleString('fa-IR')} میلیون`;
  return n.toLocaleString('fa-IR');
};

/** خلاصه‌ی کوتاه از یک قطعه (تا 40 کاراکتر) */
function shortName(name: string): string {
  const clean = String(name || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (clean.length <= 40) return clean;
  return clean.slice(0, 38) + '…';
}

/** ساخت رشتهٔ کوتاه هش برای URL */
function buildHash(parts: IdCardPart[]): string {
  const ids = parts
    .map((p) => `${p.category}:${p.id}${p.quantity && p.quantity > 1 ? `x${p.quantity}` : ''}`)
    .join(',');
  try {
    return typeof btoa !== 'undefined' ? btoa(unescape(encodeURIComponent(ids))) : ids;
  } catch {
    return ids;
  }
}

/** URL کامل قابل اسکن با QR */
function buildShareUrl(parts: IdCardPart[]): string {
  const hash = buildHash(parts);
  if (typeof window === 'undefined') {
    return `https://offl.ir/assemble-online?build=${encodeURIComponent(hash)}`;
  }
  return `${window.location.origin}${window.location.pathname}?build=${encodeURIComponent(hash)}`;
}

/** URL تصویر QR از سرویس رایگان api.qrserver.com */
function buildQrSrc(data: string, size = 200): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&format=png&margin=1`;
}

export default function BuildIdentityCard({ parts, useCaseLabel, totalPrice, title }: Props) {
  const [copied, setCopied] = useState<'link' | 'text' | null>(null);

  const shareUrl = useMemo(() => buildShareUrl(parts), [parts]);
  const qrSrc = useMemo(() => buildQrSrc(shareUrl, 220), [shareUrl]);

  const cpu = parts.find((p) => p.category === 'cpu');
  const gpu = parts.find((p) => p.category === 'gpu');
  const ram = parts.find((p) => p.category === 'ram');
  const storage = parts.find((p) => p.category === 'storage');

  const buildTitle =
    title || (useCaseLabel ? `سیستم ${useCaseLabel} — آفلند` : 'کانفیگ اسمبل هوشمند آفلند');

  const shareText = [
    `🖥️ ${buildTitle}`,
    cpu ? `🧠 پردازنده: ${shortName(cpu.name)}` : '',
    gpu ? `🎮 گرافیک: ${shortName(gpu.name)}` : '',
    ram ? `💾 رم: ${shortName(ram.name)}` : '',
    storage ? `⚡ حافظه: ${shortName(storage.name)}` : '',
    `💰 قیمت کل: ${toman(totalPrice)}`,
    ``,
    `🔗 مشاهده کانفیگ: ${shareUrl}`,
  ]
    .filter(Boolean)
    .join('\n');

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied('link');
      setTimeout(() => setCopied(null), 2000);
    } catch {}
  };
  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied('text');
      setTimeout(() => setCopied(null), 2000);
    } catch {}
  };
  const shareTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener');
  };
  const shareWhatsapp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener');
  };

  if (!parts?.length) return null;

  return (
    <div className="asm-idcard">
      <div className="asm-idcard__info">
        <div className="asm-idcard__brand">offl.ir</div>
        <div className="asm-idcard__slogan">آفلند — سرزمینِ تخفیف</div>
        <div className="asm-idcard__title">{buildTitle}</div>
        <div className="asm-idcard__specs">
          {cpu && <div>🧠 {shortName(cpu.name)}</div>}
          {gpu && <div>🎮 {shortName(gpu.name)}</div>}
          {ram && <div>💾 {shortName(ram.name)}</div>}
          {storage && <div>⚡ {shortName(storage.name)}</div>}
        </div>
        <div className="asm-idcard__total">💰 {shortToman(totalPrice)} تومان</div>
        <div className="asm-idcard__actions">
          <button type="button" className="asm-idcard__action" onClick={copyLink}>
            {copied === 'link' ? '✅ کپی شد' : '🔗 کپی لینک'}
          </button>
          <button type="button" className="asm-idcard__action" onClick={copyText}>
            {copied === 'text' ? '✅ کپی شد' : '📋 کپی متن استوری'}
          </button>
          <button type="button" className="asm-idcard__action" onClick={shareTelegram}>
            ✈️ اشتراک تلگرام
          </button>
          <button type="button" className="asm-idcard__action" onClick={shareWhatsapp}>
            💬 واتساپ
          </button>
        </div>
      </div>
      <div
        className="asm-idcard__qr"
        title="این QR را با موبایل اسکن کنید تا کانفیگ در سایت باز شود."
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrSrc} alt="QR Code کانفیگ آفلند" loading="lazy" width={98} height={98} />
      </div>
    </div>
  );
}
