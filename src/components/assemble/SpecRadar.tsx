'use client';

import React from 'react';
import './assemble.css';

export type RadarAxis = {
  label: string;
  /** مقدار ۰ تا ۱۰ */
  value: number;
};

type Props = {
  axes: RadarAxis[];
  size?: number;
  color?: string;
  maxValue?: number;
  /** نمایش برچسب‌ها روی محورها */
  showLabels?: boolean;
};

/**
 * SpecRadar — نمودار عنکبوتی (رادار) مشخصات سیستم.
 * مقادیر هر محور ۰ تا maxValue (پیش‌فرض ۱۰) هستند.
 */
export default function SpecRadar({
  axes,
  size = 240,
  color = 'var(--asm-primary)',
  maxValue = 10,
  showLabels = true,
}: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 34;
  const n = Math.max(3, axes.length);
  const rings = [0.25, 0.5, 0.75, 1];

  const angleFor = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i: number, ratio: number) => {
    const a = angleFor(i);
    return [cx + Math.cos(a) * radius * ratio, cy + Math.sin(a) * radius * ratio] as const;
  };

  const dataPoints = axes.map((ax, i) => point(i, Math.max(0, Math.min(1, ax.value / maxValue))));
  const polygon = dataPoints.map(p => p.join(',')).join(' ');
  const gradId = React.useId();

  return (
    <div className="aw-radar" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="aw-radar__svg">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--asm-cyan)" stopOpacity="0.35" />
          </linearGradient>
          <filter id={`${gradId}-glow`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* حلقه‌های شبکه */}
        {rings.map((ring, ri) => (
          <polygon
            key={ri}
            className="aw-radar__ring"
            points={axes.map((_, i) => point(i, ring).join(',')).join(' ')}
          />
        ))}

        {/* خطوط محور */}
        {axes.map((_, i) => {
          const [x, y] = point(i, 1);
          return <line key={i} className="aw-radar__axis" x1={cx} y1={cy} x2={x} y2={y} />;
        })}

        {/* چندضلعی داده */}
        <polygon className="aw-radar__area" points={polygon} fill={`url(#${gradId})`} filter={`url(#${gradId}-glow)`} />
        {dataPoints.map((p, i) => (
          <circle key={i} className="aw-radar__dot" cx={p[0]} cy={p[1]} r={3.4} />
        ))}

        {/* برچسب‌ها */}
        {showLabels &&
          axes.map((ax, i) => {
            const [x, y] = point(i, 1.2);
            const anchor = Math.abs(x - cx) < 6 ? 'middle' : x > cx ? 'start' : 'end';
            return (
              <text key={i} className="aw-radar__label" x={x} y={y} textAnchor={anchor} dominantBaseline="middle">
                {ax.label}
                <tspan className="aw-radar__label-val" dx="4">{Math.round(ax.value)}</tspan>
              </text>
            );
          })}
      </svg>
    </div>
  );
}
