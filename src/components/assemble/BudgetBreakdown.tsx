'use client';

import React, { useMemo } from 'react';
import './assemble.css';

type P = {
  id: number | string;
  category: string;
  categoryLabel?: string;
  finalPrice: number;
  quantity?: number;
  [k: string]: any;
};

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  cpu: { label: 'پردازنده', color: '#386bf9' },
  gpu: { label: 'کارت گرافیک', color: '#f55036' },
  motherboard: { label: 'مادربرد', color: '#22d3ee' },
  ram: { label: 'رم', color: '#a855f7' },
  storage: { label: 'حافظه', color: '#34d399' },
  psu: { label: 'پاور', color: '#f59e0b' },
  case: { label: 'کیس', color: '#94a3b8' },
  cooler: { label: 'خنک‌کننده', color: '#2dd4bf' },
  case_fan: { label: 'فن', color: '#fb7185' },
  case_argb: { label: 'نوار نور', color: '#e879f9' },
};

const shortToman = (n: number) => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} میلیارد`;
  if (n >= 1_000_000) return `${Math.round(n / 1_000_000).toLocaleString('fa-IR')} میلیون`;
  return `${n.toLocaleString('fa-IR')}`;
};

const REMAIN_COLOR = 'rgba(148, 163, 184, 0.28)';

// هندسهٔ دایره — تبدیل درصد تجمعی به نقطهٔ کمان روی محیط دایره
const polar = (cx: number, cy: number, r: number, frac: number) => {
  // شروع از بالا (−۹۰ درجه) و حرکت در جهت عقربه‌های ساعت
  const angle = 2 * Math.PI * frac - Math.PI / 2;
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
};

const arcPath = (cx: number, cy: number, r: number, startFrac: number, endFrac: number) => {
  const start = polar(cx, cy, r, startFrac);
  const end = polar(cx, cy, r, endFrac);
  const largeArc = endFrac - startFrac > 0.5 ? 1 : 0;
  // sweep=1 → جهت عقربه‌های ساعت
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
};

export default function BudgetBreakdown({ parts, budget }: { parts: P[]; budget: number }) {
  const { segments, spend, remaining, total, biggest } = useMemo(() => {
    const spend = parts.reduce((sum, p) => sum + (Number(p.finalPrice) || 0) * Math.max(1, Number(p.quantity || 1)), 0);
    const remaining = Math.max(0, budget - spend);

    const byCat: Record<string, number> = {};
    for (const p of parts) {
      byCat[p.category] = (byCat[p.category] || 0) + (Number(p.finalPrice) || 0) * Math.max(1, Number(p.quantity || 1));
    }
    const segments = Object.entries(byCat)
      .map(([cat, val]) => ({ cat, val, ...(CATEGORY_META[cat] || { label: cat, color: '#64748b' }) }))
      .sort((a, b) => b.val - a.val);

    const total = Math.max(1, spend + remaining);
    const biggest = segments[0];
    return { segments, spend, remaining, total, biggest };
  }, [parts, budget]);

  // ساخت کمان‌ها به‌صورت تجمعی
  const SIZE = 168;
  const R = 68;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const GAP = 0.006; // شکاف کوچک بین بخش‌ها

  const arcs: Array<{ key: string; color: string; d: string }> = [];
  let acc = 0;
  const drawSegs = [...segments.map(s => ({ key: s.cat, color: s.color, val: s.val }))];
  if (remaining > 0) drawSegs.push({ key: '__remain', color: REMAIN_COLOR, val: remaining });
  for (const s of drawSegs) {
    const frac = s.val / total;
    if (frac <= 0) continue;
    const start = acc + (arcs.length ? GAP : 0);
    const end = acc + frac;
    if (end > start) arcs.push({ key: s.key, color: s.color, d: arcPath(CX, CY, R, start, Math.max(start, end - GAP)) });
    acc = end;
  }

  const spendPct = Math.round((spend / total) * 100);

  return (
    <div className="aw-budget-donut">
      <div className="aw-budget-donut__head">
        <span className="aw-budget-donut__title">نمودار تخصیص بودجه</span>
        <span className={`aw-budget-donut__pill${remaining > 0 ? '' : ' aw-budget-donut__pill--full'}`}>
          {remaining > 0 ? `${shortToman(remaining)} باقی‌مانده` : 'بودجه کامل مصرف شد'}
        </span>
      </div>

      <div className="aw-budget-donut__body">
        <div className="aw-budget-donut__chart">
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} role="img" aria-label="نمودار حلقه‌ای تخصیص بودجه">
            {/* حلقهٔ پس‌زمینه */}
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(148,163,184,0.14)" strokeWidth="12" />
            {arcs.map((a, i) => (
              <path
                key={a.key}
                className="aw-budget-donut__arc"
                d={a.d}
                fill="none"
                stroke={a.color}
                strokeWidth="12"
                strokeLinecap="round"
                style={{ animationDelay: `${i * 90}ms` }}
              />
            ))}
          </svg>
          <div className="aw-budget-donut__center">
            <b>{shortToman(spend)}</b>
            <small>از {shortToman(budget)}</small>
            <span className="aw-budget-donut__center-pct">{spendPct.toLocaleString('fa-IR')}٪</span>
          </div>
        </div>

        <div className="aw-budget-donut__legend">
          {segments.map(s => {
            const pct = Math.round((s.val / total) * 100);
            return (
              <div key={s.cat} className={`aw-budget-donut__leg${biggest?.cat === s.cat ? ' aw-budget-donut__leg--top' : ''}`}>
                <span className="aw-budget-donut__leg-dot" style={{ background: s.color }} />
                <span className="aw-budget-donut__leg-label">{s.label}</span>
                <span className="aw-budget-donut__leg-bar">
                  <span style={{ width: `${pct}%`, background: s.color }} />
                </span>
                <b className="aw-budget-donut__leg-val">{shortToman(s.val)}</b>
              </div>
            );
          })}
          {remaining > 0 && (
            <div className="aw-budget-donut__leg aw-budget-donut__leg--remain">
              <span className="aw-budget-donut__leg-dot" style={{ background: REMAIN_COLOR }} />
              <span className="aw-budget-donut__leg-label">باقی‌مانده</span>
              <span className="aw-budget-donut__leg-bar">
                <span style={{ width: `${Math.round((remaining / total) * 100)}%`, background: REMAIN_COLOR }} />
              </span>
              <b className="aw-budget-donut__leg-val">{shortToman(remaining)}</b>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
