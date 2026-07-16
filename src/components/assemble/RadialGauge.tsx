'use client';

import React from 'react';
import './assemble.css';

type Props = {
  /** مقدار ۰ تا ۱۰۰ */
  value: number;
  /** متن وسط (مثلاً عدد یا درصد) */
  label?: string;
  /** زیرمتن کوچک */
  sublabel?: string;
  /** رنگ اصلی گیج */
  color?: string;
  /** اندازه به پیکسل */
  size?: number;
  /** ضخامت حلقه */
  thickness?: number;
  /** نمایش درصد در مرکز */
  showPercent?: boolean;
  /** متن جایگزین برای مرکز (مثلاً ایموجی یا آیکن) */
  centerNode?: React.ReactNode;
};

/**
 * RadialGauge — گیج دایره‌ای SVG با حلقهٔ نئونی متحرک.
 * برای نمایش امتیاز سازگاری، بار پاور، وضعیت سلامت و غیره.
 */
export default function RadialGauge({
  value,
  label,
  sublabel,
  color = 'var(--asm-primary)',
  size = 132,
  thickness = 11,
  showPercent = true,
  centerNode,
}: Props) {
  const v = Math.max(0, Math.min(100, value));
  const r = (size - thickness) / 2;
  const gradId = React.useId();

  return (
    <div className="aw-gauge" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="aw-gauge__svg">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor="var(--asm-cyan)" />
          </linearGradient>
          <filter id={`${gradId}-glow`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--asm-track)"
          strokeWidth={thickness}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={thickness}
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${v} 100`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="aw-gauge__progress"
          filter={`url(#${gradId}-glow)`}
        />
      </svg>
      <div className="aw-gauge__center">
        {centerNode !== undefined ? (
          centerNode
        ) : (
          <>
            <span className="aw-gauge__value" style={{ color }}>
              {label ?? Math.round(v)}
              {showPercent && <span className="aw-gauge__pct">٪</span>}
            </span>
            {sublabel && <span className="aw-gauge__sub">{sublabel}</span>}
          </>
        )}
      </div>
    </div>
  );
}
