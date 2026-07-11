'use client';

import React from 'react';
import './assemble.css';
import {
  CpuIcon,
  GpuIcon,
  MotherboardIcon,
  RamIcon,
  SsdIcon,
  PsuIcon,
  CoolerIcon,
} from './PartIcons';
import type { AssembleTheme } from './ThemeSelector';

type Part = {
  category: string;
  categoryLabel: string;
  name: string;
  id: number | string;
  confidence?: number;
  isOptional?: boolean;
  specs?: Record<string, any>;
  [k: string]: any;
};

type Props = {
  parts: Part[];
  theme?: AssembleTheme;
  blockedIds?: Set<string>;
  unavailableIds?: Set<string>;
  size?: number;
};

const THEME_ACCENT: Record<AssembleTheme, { a: string; b: string; label: string }> = {
  snow: { a: '#e8f0ff', b: '#7fb2ff', label: 'All-White' },
  stealth: { a: '#386bf9', b: '#6f3cf5', label: 'Stealth' },
  rgb: { a: '#ff4dd6', b: '#22d3ee', label: 'ARGB' },
};

function Slot({
  x,
  y,
  w,
  h,
  label,
  Icon,
  state,
  accentA,
  accentB,
  glowId,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  Icon: React.FC<any>;
  state: 'present' | 'blocked' | 'unavailable' | 'empty';
  accentA: string;
  accentB: string;
  glowId: string;
}) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const cls = `aw-case__slot aw-case__slot--${state}`;
  return (
    <g className={cls}>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={9}
        className="aw-case__slot-rect"
        style={
          state === 'present'
            ? { stroke: accentB, fill: `${accentB}14` }
            : undefined
        }
      />
      {state === 'present' && (
        <rect x={x} y={y} width={w} height={h} rx={9} className="aw-case__slot-glow" filter={`url(#${glowId})`} style={{ stroke: accentB }} />
      )}
      <foreignObject x={x} y={y} width={w} height={h} className="aw-case__fo">
        <div className="aw-case__slot-inner">
          <span className="aw-case__slot-ic">
            <Icon />
          </span>
          <span className="aw-case__slot-label">{label}</span>
          {state === 'unavailable' && <span className="aw-case__slot-flag">ناموجود</span>}
          {state === 'blocked' && <span className="aw-case__slot-flag aw-case__slot-flag--bad">ناسازگار</span>}
        </div>
      </foreignObject>
      {/* نقطه وضعیت */}
      <circle cx={x + w - 12} cy={y + 12} r={4.5} className={`aw-case__dot aw-case__dot--${state}`} />
      <title>{label}</title>
    </g>
  );
}

/**
 * PcBuildVisual — نمای بصری کیس با اسلات‌های نئونی که با انتخاب قطعات روشن می‌شوند.
 * قطعهٔ حاضر → نئون، ناسازگار → قرمز، ناموجود → کم‌نور، جای خالی → خط چین.
 */
export default function PcBuildVisual({ parts, theme = 'stealth', blockedIds, unavailableIds, size = 360 }: Props) {
  const accent = THEME_ACCENT[theme] || THEME_ACCENT.stealth;
  const byCat: Record<string, Part> = {};
  for (const p of parts) byCat[p.category] = p;

  const stateOf = (cat: string): 'present' | 'blocked' | 'unavailable' | 'empty' => {
    const p = byCat[cat];
    if (!p) return 'empty';
    const id = String(p.id);
    if (blockedIds?.has(id)) return 'blocked';
    if (unavailableIds?.has(id)) return 'unavailable';
    return 'present';
  };

  const W = 360;
  const H = 420;
  const glowId = React.useId();

  const fanSpin = theme === 'rgb' ? 'aw-case__fan--rgb' : '';

  return (
    <div className={`aw-case aw-case--${theme}`} style={{ ['--aw-accent-a' as any]: accent.a, ['--aw-accent-b' as any]: accent.b }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="aw-case__svg" style={{ maxWidth: size }}>
        <defs>
          <linearGradient id={`${glowId}-bg`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(20,30,55,0.9)" />
            <stop offset="100%" stopColor="rgba(10,16,32,0.95)" />
          </linearGradient>
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id={`${glowId}-halo`} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor={`${accent.b}33`} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* هاله نور پس‌زمینه */}
        <rect x="0" y="0" width={W} height={H} rx="22" fill={`url(#${glowId}-halo)`} />

        {/* فریم کیس */}
        <rect x="22" y="14" width={W - 44} height={H - 28} rx="18" className="aw-case__frame" />

        {/* پنل شیشه‌ای جانبی */}
        <rect x="34" y="26" width={W - 68} height={H - 52} rx="12" className="aw-case__glass" />

        {/* فن‌های بالا */}
        <g className={`aw-case__fan ${fanSpin}`}>
          <circle cx="110" cy="40" r="11" className="aw-case__fan-ring" />
          <circle cx="180" cy="40" r="11" className="aw-case__fan-ring" />
          <circle cx="250" cy="40" r="11" className="aw-case__fan-ring" />
        </g>

        {/* مادربرد (فریم داخلی) */}
        <rect x="52" y="62" width="256" height="250" rx="12" className="aw-case__mb" />

        {/* اسلات‌ها */}
        <Slot x={66} y={78} w={150} h={58} label="پردازنده" Icon={CpuIcon} state={stateOf('cpu')} accentA={accent.a} accentB={accent.b} glowId={glowId} />
        <Slot x={224} y={78} w={74} h={58} label="رم" Icon={RamIcon} state={stateOf('ram')} accentA={accent.a} accentB={accent.b} glowId={glowId} />
        <Slot x={66} y={146} w={232} h={40} label="کارت گرافیک" Icon={GpuIcon} state={stateOf('gpu')} accentA={accent.a} accentB={accent.b} glowId={glowId} />
        <Slot x={66} y={196} w={232} h={34} label="مادربرد" Icon={MotherboardIcon} state={stateOf('motherboard')} accentA={accent.a} accentB={accent.b} glowId={glowId} />
        <Slot x={66} y={238} w={112} h={38} label="حافظه" Icon={SsdIcon} state={stateOf('storage')} accentA={accent.a} accentB={accent.b} glowId={glowId} />
        <Slot x={186} y={238} w={112} h={38} label="خنک‌کننده" Icon={CoolerIcon} state={stateOf('cooler')} accentA={accent.a} accentB={accent.b} glowId={glowId} />

        {/* پاور پایین */}
        <Slot x={66} y={312} w={232} h={70} label="پاور" Icon={PsuIcon} state={stateOf('psu')} accentA={accent.a} accentB={accent.b} glowId={glowId} />

        {/* شاخص کیس (اگر انتخاب شده) */}
        {byCat['case'] && (
          <g className="aw-case__case-ind">
            <rect x="284" y="62" width="24" height="250" rx="6" className="aw-case__case-bar" style={{ fill: `${accent.b}1f`, stroke: accent.b }} />
          </g>
        )}

        {/* نوار نور پایین (RGB) */}
        <rect x="34" y={H - 40} width={W - 68} height="6" rx="3" className="aw-case__strip" />
      </svg>

      <div className="aw-case__legend">
        <span><i className="aw-case__leg-dot aw-case__leg-dot--present" />نصب شده</span>
        <span><i className="aw-case__leg-dot aw-case__leg-dot--blocked" />ناسازگار</span>
        <span><i className="aw-case__leg-dot aw-case__leg-dot--unavailable" />ناموجود</span>
        <span><i className="aw-case__leg-dot aw-case__leg-dot--empty" />فضای خالی</span>
      </div>
    </div>
  );
}
