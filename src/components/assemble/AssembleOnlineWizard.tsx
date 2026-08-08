'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import './assemble.css';
import {
  CpuIcon,
  GpuIcon,
  RamIcon,
  SsdIcon,
  PsuIcon,
  SparkIcon,
  ArrowIcon,
  RefreshIcon,
  CheckIcon,
  ShieldIcon,
  WarningIcon,
  CartIcon,
  InfoIcon,
  EyeIcon,
  ExpandIcon,
  CollapseIcon,
} from './PartIcons';
import AssembleProductCard from './AssembleProductCard';
import TelemetryDashboard from './TelemetryDashboard';
import InvoiceModal from './InvoiceModal';
import { useAddBulkCart } from '@/hooks/cart/useAddBulkCart';

/* ──────────────────────────────────────────────────────────
   Types — aligned with engine proxy (api/assemble route v2)
   ────────────────────────────────────────────────────────── */
type Specs = Record<string, any>;

type Part = {
  category: string;
  categoryLabel: string;
  emoji: string;
  id: number | string;
  name: string;
  url: string;
  image: string | null;
  price: number;
  finalPrice: number;
  discountPercent: number;
  inStock: boolean;
  brand: string | null;
  warranty: string | null;
  shortSpec: string;
  specs: Specs;
  confidence: number;
  isOptional: boolean;
  quantity?: number;
  alternatives: Part[];
  pickReason?: string;
};

type CompatibilityMatrix = {
  buildable: boolean;
  score: number;
  status: 'compatible' | 'warning' | 'incompatible';
  errors: { severity: string; message: string; reason?: string; solution?: string }[];
  warnings: { severity: string; message: string }[];
  info: any[];
  blockedPartIds: string[];
  unavailablePartIds: string[];
};

type Summary = {
  totalBefore: number;
  totalAfter: number;
  totalSaving: number;
  savingPercent: number;
  itemCount: number;
  mandatoryCount: number;
  optionalCount: number;
  totalTdp: number;
};

type AssembleResult = {
  ok: boolean;
  useCaseLabel: string;
  budget: number;
  tier: string;
  parts: Part[];
  summary: Summary;
  compatibilityScore: number;
  compatibilityMatrix?: CompatibilityMatrix;
  description: string;
  analysis?: string;
  recommendation?: any;
  ai?: { finalAnalysisUsed: boolean; finalAnalysisModel: string };
  error?: string;
};

/* ──────────────────────────────────────────────────────────
   Constants — mirrors engine PROFILES
   ────────────────────────────────────────────────────────── */
const USE_CASES = [
  { key: 'gaming', label: 'گیمینگ', desc: 'بازی‌های روز و آنلاین', icon: 'gaming' },
  { key: 'office', label: 'اداری', desc: 'آفیس، وب، حسابداری', icon: 'office' },
  { key: 'editing', label: 'ادیت و تدوین', desc: 'پریمیر، فتوشاپ، افترافکت', icon: 'editing' },
  { key: 'rendering', label: 'رندرینگ', desc: 'بلندر، 3ds Max، مایا', icon: 'rendering' },
  { key: 'programming', label: 'برنامه‌نویسی', desc: 'کد، داکر، هوش مصنوعی', icon: 'programming' },
  { key: 'streaming', label: 'استریم', desc: 'OBS، یوتیوب، توییچ', icon: 'streaming' },
  { key: 'server', label: 'سرور', desc: 'مجازی‌سازی، ۲۴ ساعته', icon: 'server' },
  { key: 'home', label: 'خانگی', desc: 'فیلم، وب‌گردی، خانوادگی', icon: 'home' },
];

const FALLBACK_PRESETS: Record<string, number[]> = {
  gaming: [32_000_000, 45_000_000, 65_000_000, 85_000_000, 120_000_000, 160_000_000],
  office: [18_000_000, 22_000_000, 28_000_000, 35_000_000, 45_000_000, 55_000_000],
  editing: [38_000_000, 55_000_000, 85_000_000, 120_000_000, 160_000_000, 200_000_000],
  rendering: [45_000_000, 70_000_000, 110_000_000, 160_000_000, 220_000_000, 280_000_000],
  programming: [25_000_000, 38_000_000, 55_000_000, 75_000_000, 100_000_000, 130_000_000],
  streaming: [38_000_000, 55_000_000, 90_000_000, 130_000_000, 165_000_000, 200_000_000],
  server: [24_000_000, 40_000_000, 60_000_000, 85_000_000, 115_000_000, 150_000_000],
  home: [18_000_000, 25_000_000, 32_000_000, 45_000_000, 58_000_000, 70_000_000],
};

const TIER_META: Record<string, { label: string; color: string; bg: string }> = {
  ultra: { label: 'پرچم‌دار', color: '#7C3AED', bg: 'rgba(124,58,237,0.14)' },
  high: { label: 'حرفه‌ای', color: '#2563EB', bg: 'rgba(37,99,235,0.12)' },
  medium: { label: 'میان‌رده', color: '#059669', bg: 'rgba(5,150,105,0.12)' },
  entry: { label: 'اقتصادی', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
  // engine raw labels
  پرچم‌دار: { label: 'پرچم‌دار', color: '#7C3AED', bg: 'rgba(124,58,237,0.14)' },
  حرفه‌ای: { label: 'حرفه‌ای', color: '#2563EB', bg: 'rgba(37,99,235,0.12)' },
  میان‌رده: { label: 'میان‌رده', color: '#059669', bg: 'rgba(5,150,105,0.12)' },
  اقتصادی: { label: 'اقتصادی', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
};

const LOADING_STEPS = [
  'تحلیل کاربری و بودجه در موتور اسمبل…',
  'دریافت موجودی زنده از فروشگاه آفلند…',
  'اعتبارسنجی سازگاری سوکت و رم…',
  'محاسبه توان پاور و انتخاب قطعات بهینه…',
  'تولید تحلیل هوش مصنوعی و امتیاز عملکرد…',
];

const toman = (n: number) => `${Math.round(n).toLocaleString('fa-IR')} تومان`;
const shortToman = (n: number) => {
  if (n >= 1_000_000_000)
    return `${(n / 1_000_000_000).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} میلیارد`;
  if (n >= 1_000_000) return `${Math.round(n / 1_000_000).toLocaleString('fa-IR')} میلیون`;
  return n.toLocaleString('fa-IR');
};

/* ──────────────────────────────────────────────────────────
   Helper: icon per useCase (uses same icons as PartIcons)
   ────────────────────────────────────────────────────────── */
function UseCaseIcon({ k }: { k: string }) {
  if (k === 'gaming') return <GpuIcon />;
  if (k === 'office') return <CpuIcon />;
  if (k === 'editing') return <SsdIcon />;
  if (k === 'rendering') return <CpuIcon />;
  if (k === 'programming') return <CpuIcon />;
  if (k === 'streaming') return <GpuIcon />;
  if (k === 'server') return <PsuIcon />;
  if (k === 'home') return <RamIcon />;
  return <CpuIcon />;
}

/* ──────────────────────────────────────────────────────────
   Main — Engine-driven Wizard
   ────────────────────────────────────────────────────────── */
export default function AssembleOnlineWizard() {
  const router = useRouter();
  const { mutate: addBulk, isPending: buying } = useAddBulkCart();

  // Steps
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [useCase, setUseCase] = useState<string>('gaming');
  const [customDesc, setCustomDesc] = useState('');
  const [budget, setBudget] = useState<number>(65_000_000);

  // Budget range from engine
  const [range, setRange] = useState<{
    min: number;
    max: number;
    recommended: number;
    presets: number[];
  } | null>(null);
  const [rangeLoading, setRangeLoading] = useState(false);

  // Build
  const [loading, setLoading] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [result, setResult] = useState<AssembleResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parts, setParts] = useState<Part[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [bought, setBought] = useState(false);

  // Fetch budget range when step 2 enters or useCase/customDesc changes — per-useCase LIVE
  useEffect(() => {
    if (step !== 2) return;
    let cancelled = false;
    setRangeLoading(true);
    const qs = new URLSearchParams({ useCase });
    if (customDesc.trim()) qs.set('customDesc', customDesc.trim());
    fetch(`/api/assemble/budget-range?${qs.toString()}`, {
      cache: 'no-store',
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const min = Number(data.min) || 15_000_000;
        const max = Number(data.max) || 200_000_000;
        const recommended = Number(data.recommended) || 50_000_000;
        const presets =
          Array.isArray(data.presets) && data.presets.length
            ? data.presets
            : FALLBACK_PRESETS[useCase] || FALLBACK_PRESETS.gaming;
        setRange({ min, max, recommended, presets });
        // snap budget inside range
        setBudget((b) => (b < min || b > max ? recommended : b));
      })
      .catch(() => {
        if (cancelled) return;
        const presets = FALLBACK_PRESETS[useCase] || FALLBACK_PRESETS.gaming;
        setRange({ min: 15_000_000, max: 200_000_000, recommended: 65_000_000, presets });
      })
      .finally(() => {
        if (!cancelled) setRangeLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [step, useCase, customDesc]);

  // Loading steps animation
  useEffect(() => {
    if (!loading) return;
    setLoadStep(0);
    const iv = setInterval(
      () => setLoadStep((s) => (s < LOADING_STEPS.length - 1 ? s + 1 : s)),
      1200
    );
    return () => clearInterval(iv);
  }, [loading]);

  const build = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setParts([]);
    setExpanded(new Set());
    setBought(false);
    setStep(3);

    // retry 3x with backoff for resilience
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch('/api/assemble', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ useCase, budget, customDesc }),
          signal: AbortSignal.timeout(25_000),
        });

        const data = (await res.json()) as AssembleResult;

        if (!res.ok || !data.ok) {
          throw new Error((data as any)?.error || `خطای سرور ${res.status}`);
        }

        setResult(data);
        setParts(Array.isArray(data.parts) ? data.parts : []);
        setLoading(false);
        return;
      } catch (e: any) {
        console.error(`[AssembleOnline] attempt ${attempt} failed:`, e?.message);
        if (attempt === 3) {
          setError(e?.message || 'خطا در ارتباط با موتور اسمبل. لطفاً دوباره تلاش کنید.');
          setLoading(false);
        } else {
          await new Promise((r) => setTimeout(r, 600 * attempt));
        }
      }
    }
  }, [useCase, budget, customDesc]);

  const restart = () => {
    setResult(null);
    setParts([]);
    setError(null);
    setBought(false);
    setExpanded(new Set());
    setStep(1);
  };

  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const selectAlternative = (partId: string, alt: Part) => {
    setParts((prev) =>
      prev.map((p) =>
        String(p.id) === String(partId)
          ? { ...alt, alternatives: p.alternatives, isOptional: p.isOptional }
          : p
      )
    );
    setExpanded((prev) => {
      const n = new Set(prev);
      n.delete(String(partId));
      return n;
    });
  };

  const removeOptional = (id: string) =>
    setParts((prev) => prev.filter((p) => String(p.id) !== String(id)));

  const buyAll = () => {
    const available = parts.filter((p) => p.inStock && p.finalPrice > 0);
    if (!available.length) {
      alert('هیچ قطعهٔ موجودی برای افزودن به سبد نیست.');
      return;
    }
    addBulk(
      available.map((p) => ({ id: p.id, qty: Math.max(1, Number(p.quantity || 1)) })),
      { onSuccess: () => setBought(true) }
    );
  };

  // Derived
  const tierInfo = useMemo(() => {
    if (!result?.tier) return TIER_META.medium;
    return TIER_META[result.tier] || TIER_META.medium;
  }, [result?.tier]);

  const summary = useMemo(() => {
    if (parts.length) {
      const totalBefore = parts.reduce(
        (s, p) => s + Number(p.price || 0) * Math.max(1, Number(p.quantity || 1)),
        0
      );
      const totalAfter = parts.reduce(
        (s, p) => s + Number(p.finalPrice || 0) * Math.max(1, Number(p.quantity || 1)),
        0
      );
      const saving = Math.max(0, totalBefore - totalAfter);
      return {
        totalBefore,
        totalAfter,
        totalSaving: saving,
        savingPercent: totalBefore ? Math.round((saving / totalBefore) * 100) : 0,
        itemCount: parts.length,
      };
    }
    return result?.summary ? { ...result.summary, itemCount: result.summary.itemCount } : null;
  }, [parts, result?.summary]);

  const blockedIds = useMemo(
    () => new Set(result?.compatibilityMatrix?.blockedPartIds || []),
    [result?.compatibilityMatrix]
  );
  const unavailableIds = useMemo(
    () => new Set(result?.compatibilityMatrix?.unavailablePartIds || []),
    [result?.compatibilityMatrix]
  );
  const isIncompatible = useMemo(
    () => result?.compatibilityMatrix?.status === 'incompatible',
    [result?.compatibilityMatrix]
  );

  return (
    <div className="asm">
      {/* ───────── HERO — UI/UX Pro Max: Vibrant Block + Gaming Neon ───────── */}
      <div className="asm__hero">
        <span className="asm__hero-icon">
          <CpuIcon />
        </span>
        <h1>اسمبل آنلاین هوشمند — موتور واقعی</h1>
        <p>
          منطق جدید مستقیماً به <b>Assembly Engine v5</b> (۲۰۱۴۳) وصل است — موجودی زنده، سازگاری
          سوکت/DDR و توان پاور به‌صورت Real-time از بک‌اند می‌آید و به فرانت تحویل داده می‌شود. UI
          همین مانده اما روان‌تر و تمیزتر.
        </p>
        <div className="asm__hero-stats">
          <span className="asm__hero-stat">
            <b>Engine</b> 20143 — Single Source
          </span>
          <span className="asm__hero-stat">
            <b>Real-time</b> قیمت و موجودی
          </span>
          <span className="asm__hero-stat">
            <b>8</b> دسته — 100% سازگار
          </span>
          <span className="asm__hero-stat">
            <b>AI</b> offl-assemble-elite
          </span>
        </div>
      </div>

      {/* Stepper */}
      <div className="asm__steps">
        <Step n={1} label="کاربری" active={step === 1} done={step > 1} />
        <Step n={2} label="بودجه" active={step === 2} done={step > 2} />
        <Step n={3} label="پیشنهاد موتور" active={step === 3} done={false} />
      </div>

      {/* ───────── STEP 1: USE CASE ───────── */}
      {step === 1 && (
        <div className="asm__panel">
          <h2>سیستم برای چه کاری می‌خواهی؟</h2>
          <p className="asm__sub">
            انتخاب کاربری، وزن بودجه و بازهٔ پیشنهادی موتور را تعیین می‌کند — همه از بک‌اند.
          </p>

          <div className="asm__usecases">
            {USE_CASES.map((u) => {
              const active = useCase === u.key;
              return (
                <button
                  key={u.key}
                  type="button"
                  className={`asm__usecase${active ? 'asm__usecase--active' : ''}`}
                  onClick={() => setUseCase(u.key)}
                  aria-pressed={active}
                >
                  <span className="asm__usecase-check">
                    <CheckIcon />
                  </span>
                  <span className="asm__usecase-icon">
                    <UseCaseIcon k={u.key} />
                  </span>
                  <div className="asm__usecase-label">{u.label}</div>
                  <div className="asm__usecase-desc">{u.desc}</div>
                </button>
              );
            })}
          </div>

          <div className="asm__custom-box">
            <label className="asm__custom-label">
              <SparkIcon /> توضیح اختیاری (به موتور می‌رود):
            </label>
            <textarea
              className="asm__note"
              value={customDesc}
              onChange={(e) => setCustomDesc(e.target.value)}
              placeholder="مثال: گیمینگ 1440p + استریم همزمان، یا رندرینگ بلندر با بودجه متوسط"
              maxLength={300}
              rows={3}
            />
          </div>

          <button className="asm__cta" style={{ marginTop: 18 }} onClick={() => setStep(2)}>
            ادامه <ArrowIcon />
          </button>
        </div>
      )}

      {/* ───────── STEP 2: BUDGET (from engine) ───────── */}
      {step === 2 && (
        <div className="asm__panel">
          <h2>بودجه‌ات چقدر است؟</h2>
          <p className="asm__sub">
            {rangeLoading ? (
              <span className="asm__sub-loading">
                <span className="asm__sub-spinner" /> در حال گرفتن بازهٔ واقعی از موتور ۲۰۱۴۳…
              </span>
            ) : range ? (
              <span className="asm__sub-range">
                بازه موتور: <b>{shortToman(range.min)}</b> تا <b>{shortToman(range.max)}</b>
                <span className="asm__sub-range-rec">
                  پیشنهادی: {shortToman(range.recommended)}
                </span>
              </span>
            ) : (
              'اسلایدر بودجه'
            )}
          </p>

          {rangeLoading || !range ? (
            <div className="asm__budget-loading">
              <div className="asm__budget-loading-skeleton">
                <div className="asm__skeleton-bar asm__skeleton-bar--value" />
                <div className="asm__skeleton-bar asm__skeleton-bar--range" />
                <div className="asm__skeleton-presets">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="asm__skeleton-preset" />
                  ))}
                </div>
              </div>
              <div className="asm__budget-loading-message">
                <span className="asm__budget-loading-spinner" /> موتور دارد کف و سقف واقعی را حساب
                می‌کند…
              </div>
            </div>
          ) : (
            <>
              <div className="asm__budget-val">
                {budget.toLocaleString('fa-IR')} <span>تومان</span>
              </div>
              <input
                className="asm__range"
                type="range"
                min={range.min}
                max={range.max}
                step={Math.max(1_000_000, Math.round((range.max - range.min) / 100))}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
              />
              <div className="asm__range-labels">
                <span>{shortToman(range.min)}</span>
                <span className="asm__range-rec" onClick={() => setBudget(range.recommended)}>
                  پیشنهادی {shortToman(range.recommended)}
                </span>
                <span>{shortToman(range.max)}</span>
              </div>
              <div className="asm__presets">
                {(range.presets.length ? range.presets : FALLBACK_PRESETS[useCase] || []).map(
                  (v) => (
                    <button
                      key={v}
                      type="button"
                      className={`asm__preset${budget === v ? 'asm__preset--active' : ''}`}
                      onClick={() => setBudget(v)}
                    >
                      {shortToman(v)}
                    </button>
                  )
                )}
              </div>
              <p className="asm__presets-hint">
                اسلایدر و پریست‌ها مستقیماً از Engine می‌آید — نه حدس فرانت‌اند.
              </p>
            </>
          )}

          <div className="asm__sum-actions" style={{ marginTop: 22 }}>
            <button className="asm__btn-ghost" onClick={() => setStep(1)}>
              <ArrowIcon /> بازگشت
            </button>
            <button
              className="asm__cta"
              style={{ flex: 2 }}
              onClick={build}
              disabled={!range || rangeLoading}
            >
              {rangeLoading ? (
                <>
                  <span className="asm__buy-spin" /> صبر کن…
                </>
              ) : (
                <>
                  <SparkIcon /> بسپار به موتور!
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ───────── STEP 3: RESULT (engine-driven) ───────── */}
      {step === 3 && (
        <div className="asm__panel">
          {loading && (
            <div className="asm__loading">
              <div className="asm__spinner" />
              <div className="asm__loading-title">موتور دارد سیستم می‌چیند…</div>
              <div className="asm__loading-steps">
                {LOADING_STEPS.map((s, i) => (
                  <div
                    key={i}
                    className={`asm__loading-step${i <= loadStep ? 'asm__loading-step--on' : ''}`}
                  >
                    <span className="asm__ls-dot" />
                    {s}
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 12, color: '#6B7790', marginTop: 14 }}>
                POST /api/assemble → 20143/assemble (retry 3×)
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="asm__error">
              <p style={{ color: '#DC2626', fontFamily: 'bold' }}>{error}</p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
                <button className="asm__btn-ghost" onClick={build}>
                  <RefreshIcon /> تلاش دوباره
                </button>
                <button className="asm__btn-ghost" onClick={restart}>
                  شروع دوباره
                </button>
              </div>
            </div>
          )}

          {!loading && result?.ok && (
            <>
              {/* Header — tier + engine badge */}
              <div className="asm__result-head">
                <span className="asm__usecase-icon" style={{ width: 42, height: 42 }}>
                  <UseCaseIcon k={useCase} />
                </span>
                <h2 className="asm__black">سیستم {result.useCaseLabel}</h2>
                <span
                  className="asm__badge-tier"
                  style={{ background: tierInfo.bg, color: tierInfo.color }}
                >
                  {tierInfo.label}
                </span>
                <span className="asm__badge-count">
                  {summary?.itemCount || parts.length} قطعه • {toman(summary?.totalAfter || 0)}
                </span>
              </div>

              {result.description && (
                <div className="asm__reason">
                  <SparkIcon />
                  <span>{result.description}</span>
                </div>
              )}

              {/* Telemetry — live */}
              <TelemetryDashboard parts={parts as any} onAutoBalance={() => build()} />

              {/* Compatibility — from engine verifyBuild */}
              {result.compatibilityMatrix && (
                <div
                  className="asm__compat-panel-v3"
                  style={{
                    borderColor: isIncompatible
                      ? '#EF4444'
                      : result.compatibilityMatrix.score >= 85
                        ? '#10B981'
                        : '#F59E0B',
                  }}
                >
                  <div
                    className="asm__compat-v3-head"
                    style={{
                      borderColor: isIncompatible ? '#FECACA' : '#E5E7EB',
                      background: isIncompatible ? '#FEF2F2' : '#F9FAFB',
                    }}
                  >
                    <div
                      className="asm__compat-v3-score-circle"
                      style={{
                        borderColor: isIncompatible ? '#EF4444' : '#10B981',
                        color: isIncompatible ? '#EF4444' : '#10B981',
                      }}
                    >
                      <span className="asm__compat-v3-score-num">
                        {result.compatibilityMatrix.score}
                      </span>
                      <span className="asm__compat-v3-score-max">/100</span>
                    </div>
                    <div className="asm__compat-v3-status">
                      <div
                        className="asm__compat-v3-status-label"
                        style={{ color: isIncompatible ? '#DC2626' : '#059669' }}
                      >
                        {isIncompatible
                          ? 'ناسازگار'
                          : result.compatibilityMatrix.score >= 90
                            ? 'کاملاً سازگار'
                            : 'سازگار با هشدار'}
                      </div>
                      <div className="asm__compat-v3-status-desc">
                        {isIncompatible
                          ? 'موتور ناسازگاری سوکت/DDR/توان را تشخیص داد'
                          : `سوکت ${(result.compatibilityMatrix as any) ? (result as any).compatibilityMatrix?.socket || '—' : '—'} — هماهنگی کامل`}
                      </div>
                    </div>
                  </div>

                  {result.compatibilityMatrix.errors.length > 0 && (
                    <div className="asm__compat-v3-section asm__compat-v3-section--error">
                      <div className="asm__compat-v3-section-title">
                        مشکلات ({result.compatibilityMatrix.errors.length})
                      </div>
                      {result.compatibilityMatrix.errors.map((e, i) => (
                        <div key={i} className="asm__compat-v3-row">
                          <WarningIcon /> {e.message}
                        </div>
                      ))}
                    </div>
                  )}
                  {result.compatibilityMatrix.warnings.length > 0 && (
                    <div className="asm__compat-v3-section asm__compat-v3-section--warning">
                      <div className="asm__compat-v3-section-title">
                        هشدارها ({result.compatibilityMatrix.warnings.length})
                      </div>
                      {result.compatibilityMatrix.warnings.map((w, i) => (
                        <div key={i} className="asm__compat-v3-row">
                          <InfoIcon /> {w.message}
                        </div>
                      ))}
                    </div>
                  )}
                  {result.compatibilityMatrix.errors.length === 0 &&
                    result.compatibilityMatrix.warnings.length === 0 && (
                      <div className="asm__compat-v3-section asm__compat-v3-section--ok">
                        <CheckIcon /> همهٔ قوانین سازگاری پاس شد — سیستم آمادهٔ سفارش است.
                      </div>
                    )}
                </div>
              )}

              {/* AI Analysis — from engine queryAiCombo */}
              {(result.analysis || result.ai?.finalAnalysisUsed) && (
                <div className="asm__ai-panel">
                  <div className="asm__ai-head">
                    <span className="asm__ai-icon">
                      <SparkIcon />
                    </span>
                    <div className="asm__ai-info">
                      <div className="asm__ai-title">
                        تحلیل موتور
                        <span className="asm__ai-provider-badge">
                          {result.ai?.finalAnalysisModel || 'offl-assemble-elite'}
                        </span>
                      </div>
                      <div className="asm__ai-subtitle">
                        {result.ai?.finalAnalysisUsed ? 'تولیدشده با OmniRouter' : 'تحلیل داخلی'}
                      </div>
                    </div>
                  </div>
                  <div className="asm__ai-content">
                    <div className="asm__ai-text">
                      {(result.analysis || 'سیستم با قطعات کاملاً هماهنگ اسمبل شد.')
                        .split('\n')
                        .slice(0, 4)
                        .map((line, i) => (
                          <p key={i}>{line}</p>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Parts grid — directly from engine */}
              <div className="asm__parts-section">
                <h3 className="asm__parts-title">
                  قطعات پیشنهادی موتور <span className="asm__parts-count">{parts.length} قطعه</span>
                </h3>
                <div className="asm__parts-cards-grid">
                  {parts.map((p, idx) => {
                    const blocked = blockedIds.has(String(p.id));
                    const unavailable = unavailableIds.has(String(p.id));
                    return (
                      <AssembleProductCard
                        key={`${p.category}-${p.id}`}
                        part={p}
                        index={idx}
                        expanded={expanded.has(String(p.id))}
                        onToggleExpand={() => toggleExpand(String(p.id))}
                        onSelectAlternative={(alt) => selectAlternative(String(p.id), alt)}
                        onRemoveOptional={
                          p.isOptional ? () => removeOptional(String(p.id)) : undefined
                        }
                        blocked={blocked}
                        unavailable={unavailable}
                        blockingReason={
                          blocked ? 'ناسازگار با بقیه سیستم' : unavailable ? 'ناموجود' : undefined
                        }
                      />
                    );
                  })}
                </div>
              </div>

              {/* Summary — from engine totals, but recalculated if user edited qty/alternatives */}
              {summary && (
                <div className="asm__summary">
                  <div className="asm__sum-row">
                    <span>قیمت قبل تخفیف</span>
                    <span className="asm__sum-before">{toman(summary.totalBefore)}</span>
                  </div>
                  <div className="asm__sum-row">
                    <span>صرفه‌جویی</span>
                    <span className="asm__sum-saving">
                      − {toman(summary.totalSaving)} ({summary.savingPercent}٪)
                    </span>
                  </div>
                  <div className="asm__sum-row asm__sum-total">
                    <span>قیمت نهایی (موتور)</span>
                    <span>{toman(summary.totalAfter)}</span>
                  </div>

                  {bought ? (
                    <div className="asm__bought">
                      <CheckIcon /> به سبد اضافه شد
                      <button
                        className="asm__btn-ghost"
                        style={{ flex: 'none', marginInlineStart: 8 }}
                        onClick={() => router.push('/cart')}
                      >
                        <CartIcon /> سبد خرید
                      </button>
                    </div>
                  ) : (
                    <button
                      className="asm__buy"
                      onClick={buyAll}
                      disabled={buying || isIncompatible}
                    >
                      {buying ? (
                        <>
                          <span className="asm__buy-spin" /> در حال افزودن…
                        </>
                      ) : (
                        <>
                          <CartIcon /> افزودن قطعات موجود به سبد
                        </>
                      )}
                    </button>
                  )}

                  <div className="asm__sum-actions">
                    <button className="asm__btn-ghost" onClick={() => setStep(2)}>
                      <RefreshIcon /> تغییر بودجه
                    </button>
                    <button className="asm__btn-ghost" onClick={build}>
                      <RefreshIcon /> پیشنهاد دیگر موتور
                    </button>
                    <button className="asm__btn-ghost" onClick={() => setInvoiceOpen(true)}>
                      🧾 پیش‌فاکتور
                    </button>
                    <button className="asm__btn-ghost" onClick={restart}>
                      شروع دوباره
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <InvoiceModal
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        parts={parts as any}
        useCaseLabel={result?.useCaseLabel}
        budget={budget}
      />

      {/* Footer info — engine link */}
      <p style={{ textAlign: 'center', fontSize: 11, color: '#94A3B8', marginTop: 14 }}>
        Backend: <code>POST /api/assemble → {`http://147.45.43.25:20143/assemble`}</code> • Budget:{' '}
        <code>GET /api/assemble/budget-range</code> • Engine v5
      </p>
    </div>
  );
}

function Step({
  n,
  label,
  active,
  done,
}: {
  n: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div
      className={`asm__step${active ? 'asm__step--active' : ''}${done ? 'asm__step--done' : ''}`}
    >
      <span className="asm__step-num">{done ? <CheckIcon /> : n}</span>
      {label}
    </div>
  );
}
