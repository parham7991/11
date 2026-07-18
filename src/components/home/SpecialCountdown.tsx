'use client';
import React, { useEffect, useState } from 'react';
import { HiFire } from 'react-icons/hi';

type Props = {
  /** ISO date string when the offer ends */
  toDate?: string | null;
  className?: string;
};

type Remaining = { days: number; hours: number; minutes: number; seconds: number; done: boolean };

const pad2 = (n: number) => n.toString().padStart(2, '0');
const toFa = (s: string) => s.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

function calcRemaining(target: number): Remaining {
  const diff = target - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  return { days, hours, minutes, seconds, done: false };
}

/**
 * Neon-dark countdown chip row with a flame icon.
 * Renders nothing if `toDate` is missing/invalid/expired (safe no-op).
 */
const SpecialCountdown = ({ toDate, className = '' }: Props) => {
  const [target, setTarget] = useState<number | null>(null);
  const [rem, setRem] = useState<Remaining | null>(null);

  // Parse target only on client (avoid SSR/hydration mismatch on Date).
  useEffect(() => {
    if (!toDate) return;
    const t = new Date(toDate).getTime();
    if (Number.isNaN(t) || t <= Date.now()) return;
    setTarget(t);
  }, [toDate]);

  useEffect(() => {
    if (target == null) return;
    setRem(calcRemaining(target));
    const id = setInterval(() => {
      const r = calcRemaining(target);
      setRem(r);
      if (r.done) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [target]);

  if (target == null || !rem || rem.done) return null;

  const chips: { label: string; value: number }[] = [
    { label: 'روز', value: rem.days },
    { label: 'ساعت', value: rem.hours },
    { label: 'دقیقه', value: rem.minutes },
    { label: 'ثانیه', value: rem.seconds },
  ];

  return (
    <div
      dir="ltr"
      className={`flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-50/70 px-2 py-1 dark:border-red-500/25 dark:bg-red-950/30 ${className}`}
    >
      <HiFire
        className="h-4 w-4 shrink-0 animate-pulse text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.6)] motion-reduce:animate-none lg:h-5 lg:w-5"
        aria-hidden
      />
      <div className="flex items-center gap-1">
        {chips.map((c, i) => (
          <React.Fragment key={c.label}>
            {i > 0 && <span className="text-[12px] text-red-400/70 lg:text-[13px]">:</span>}
            <span className="flex min-w-[26px] flex-col items-center justify-center rounded-lg bg-white/70 px-1 py-0.5 shadow-sm dark:bg-zinc-900/60 dark:shadow-[0_0_8px_rgba(239,68,68,0.15)] lg:min-w-[30px]">
              <span className="font-bold text-[13px] tabular-nums leading-none text-gray-900 dark:text-zinc-100 lg:text-[15px]">
                {toFa(pad2(c.value))}
              </span>
              <span className="mt-0.5 text-[8px] text-gray-500 dark:text-zinc-400 lg:text-[9px]">
                {c.label}
              </span>
            </span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default SpecialCountdown;
