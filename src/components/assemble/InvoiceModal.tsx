'use client';

/**
 * ════════════════════════════════════════════════════════════════
 * 🧾 InvoiceModal.tsx — پیش‌فاکتور رسمی قابل پرینت A4
 * ════════════════════════════════════════════════════════════════
 *
 * ویژگی‌ها:
 *   • طراحی A4 استاندارد با هدر آفلند
 *   • جدول دقیق قطعات، قیمت واحد، تخفیف و جمع
 *   • نمایش مبلغ سود تخفیف با فونت برجستهٔ سبز
 *   • تولید لینک اشتراک‌گذاری (Build Hash) قابل کپی
 *   • دکمهٔ پرینت با media-query @print مخصوص
 * ════════════════════════════════════════════════════════════════
 */

import React, { useMemo, useState } from 'react';

type InvoicePart = {
  id: string | number;
  name: string;
  category: string;
  categoryLabel: string;
  price: number;
  finalPrice: number;
  discountPercent?: number;
  quantity?: number;
  shortSpec?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  parts: InvoicePart[];
  useCaseLabel?: string;
  budget?: number;
};

const toman = (n: number) => `${Math.round(n).toLocaleString('fa-IR')} تومان`;

function todayFa(): string {
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date());
  } catch {
    return new Date().toLocaleString();
  }
}

/** تولید لینک اشتراک‌گذاری کوتاه با هش کانفیگ */
function buildShareUrl(parts: InvoicePart[]): string {
  if (typeof window === 'undefined') return '';
  const ids = parts
    .map((p) => `${p.category}:${p.id}${p.quantity && p.quantity > 1 ? `x${p.quantity}` : ''}`)
    .join(',');
  try {
    const hash = typeof btoa !== 'undefined' ? btoa(unescape(encodeURIComponent(ids))) : ids;
    return `${window.location.origin}${window.location.pathname}?build=${encodeURIComponent(hash)}`;
  } catch {
    return `${window.location.origin}${window.location.pathname}?build=${encodeURIComponent(ids)}`;
  }
}

export default function InvoiceModal({ open, onClose, parts, useCaseLabel, budget }: Props) {
  const [copied, setCopied] = useState(false);

  const totals = useMemo(() => {
    const qty = (p: InvoicePart) => Math.max(1, Number(p.quantity || 1));
    const totalBefore = parts.reduce((s, p) => s + (Number(p.price) || 0) * qty(p), 0);
    const totalAfter = parts.reduce((s, p) => s + (Number(p.finalPrice) || 0) * qty(p), 0);
    const totalSaving = Math.max(0, totalBefore - totalAfter);
    const savingPercent = totalBefore > 0 ? Math.round((totalSaving / totalBefore) * 100) : 0;
    return { totalBefore, totalAfter, totalSaving, savingPercent };
  }, [parts]);

  const shareUrl = useMemo(() => buildShareUrl(parts), [parts]);

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  return (
    <div className="asm-inv__backdrop no-print" onClick={onClose}>
      <div className="asm-inv__container" onClick={(e) => e.stopPropagation()}>
        {/* Actions */}
        <div className="asm-inv__actions no-print">
          <button className="asm-inv__btn asm-inv__btn--primary" onClick={handlePrint}>
            🖨️ پرینت / ذخیره PDF
          </button>
          <button className="asm-inv__btn asm-inv__btn--ghost" onClick={handleCopy}>
            {copied ? '✅ کپی شد' : '🔗 اشتراک‌گذاری لینک'}
          </button>
          <button className="asm-inv__btn asm-inv__btn--close" onClick={onClose}>
            ✕ بستن
          </button>
        </div>

        {/* ═════ فاکتور اصلی (قابل پرینت) ═════ */}
        <div id="assemble-invoice-modal" className="asm-inv__doc">
          <div className="asm-inv__header">
            <div className="asm-inv__brand">
              <div className="asm-inv__logo">offl.ir</div>
              <div className="asm-inv__slogan">آفلند — سرزمینِ تخفیف</div>
            </div>
            <div className="asm-inv__meta">
              <div>
                <b>پیش‌فاکتور اسمبل هوشمند</b>
              </div>
              <div className="asm-inv__date">{todayFa()}</div>
              {useCaseLabel && (
                <div>
                  کاربری: <b>{useCaseLabel}</b>
                </div>
              )}
              {budget && <div>بودجه انتخابی: {toman(budget)}</div>}
            </div>
          </div>

          <table className="asm-inv__table">
            <thead>
              <tr>
                <th>ردیف</th>
                <th>دستهٔ قطعه</th>
                <th>نام محصول</th>
                <th>تعداد</th>
                <th>قیمت واحد</th>
                <th>تخفیف</th>
                <th>مبلغ نهایی</th>
              </tr>
            </thead>
            <tbody>
              {parts.map((p, i) => {
                const q = Math.max(1, Number(p.quantity || 1));
                const line = (Number(p.finalPrice) || 0) * q;
                const saving =
                  Math.max(0, (Number(p.price) || 0) - (Number(p.finalPrice) || 0)) * q;
                return (
                  <tr key={String(p.id) + '-' + i}>
                    <td>{(i + 1).toLocaleString('fa-IR')}</td>
                    <td>{p.categoryLabel}</td>
                    <td className="asm-inv__pname">
                      <div>{p.name}</div>
                      {p.shortSpec && <small>{p.shortSpec}</small>}
                    </td>
                    <td>{q.toLocaleString('fa-IR')}</td>
                    <td>{toman(Number(p.finalPrice) || 0)}</td>
                    <td className="asm-inv__saving">{saving > 0 ? `- ${toman(saving)}` : '—'}</td>
                    <td>
                      <b>{toman(line)}</b>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={6} className="asm-inv__ftlabel">
                  جمع قبل از تخفیف
                </td>
                <td>{toman(totals.totalBefore)}</td>
              </tr>
              <tr className="asm-inv__savingRow">
                <td colSpan={6} className="asm-inv__ftlabel">
                  مجموع سود شما از تخفیف‌ها ({totals.savingPercent}٪)
                </td>
                <td>- {toman(totals.totalSaving)}</td>
              </tr>
              <tr className="asm-inv__totalRow">
                <td colSpan={6} className="asm-inv__ftlabel">
                  مبلغ قابل پرداخت
                </td>
                <td>{toman(totals.totalAfter)}</td>
              </tr>
            </tfoot>
          </table>

          <div className="asm-inv__footer">
            <div className="asm-inv__note">
              این پیش‌فاکتور صرفاً جهت بررسی کارشناسی است و اعتبار مالی رسمی ندارد. قیمت‌ها در لحظهٔ
              خرید نهایی از سایت آفلند تأیید می‌شوند.
            </div>
            <div className="asm-inv__contact">
              وب‌سایت: offl.ir | پشتیبانی و مشاورهٔ اسمبل: از طریق چت آنلاین در سایت
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
