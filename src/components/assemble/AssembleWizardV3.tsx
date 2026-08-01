'use client';

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CpuIcon, GpuIcon, RamIcon, SsdIcon, PsuIcon,
  MotherboardIcon, CaseIcon, CoolerIcon,
  CartIcon, SparkIcon, ArrowIcon, RefreshIcon,
  CheckIcon, ShieldIcon, WarningIcon, InfoIcon,
  EditIcon, EyeIcon, ExpandIcon, CollapseIcon,
  PART_ICONS, USECASE_ICONS,
} from './PartIcons';
import AssembleProductCard from './AssembleProductCard';
import './assemble-v3.css';

// ════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════

type UsageType = 'gaming' | 'rendering' | 'office' | 'streaming' | 'programming';
type BuildStep = 'usage' | 'budget' | 'building' | 'result';

interface PartSpec {
  brand?: string;
  tier?: number;
  tdp?: number;
  socket?: string;
  ddr?: string;
  capacityGB?: number;
  frequency?: number;
  wattage?: number;
  rating?: string;
  vram?: number;
  cores?: number;
  threads?: number;
  isNVMe?: boolean;
  gen?: number;
  rgb?: boolean;
  _estimatedPrice?: boolean;
  [k: string]: any;
}

interface BuildPart {
  id: number;
  name: string;
  price: number;
  special_price: number | null;
  finalPrice: number;
  brand: string;
  image: string | null;
  is_in_stock: number;
  specs: PartSpec;
  score: number;
  alternatives: {
    id: number;
    name: string;
    price: number;
    finalPrice: number;
    specs: PartSpec;
    score: number;
    inStock: boolean;
    url: string;
  }[];
  url: string;
}

interface BuildResult {
  success: boolean;
  usage: string;
  budget: number;
  parts: Record<string, BuildPart>;
  totalPrice: number;
  totalDiscount: number;
  compatibility: {
    status: 'ok' | 'warning' | 'error';
    issues: { severity: string; message: string; category?: string }[];
    score: number;
  };
  performance: {
    gaming: number;
    rendering: number;
    productivity: number;
    efficiency: number;
    bottleneck?: { type: string; message: string } | null;
  };
  recommendation: string;
  componentsCount: number;
}

// ════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════

const USAGE_OPTIONS: { id: UsageType; label: string; desc: string; color: string }[] = [
  { id: 'gaming', label: 'گیمینگ', desc: 'بازی‌های AAA و آنلاین', color: '#7C3AED' },
  { id: 'rendering', label: 'رندرینگ', desc: '3D، ویدئو و انیمیشن', color: '#3B82F6' },
  { id: 'streaming', label: 'استریم', desc: 'پخش زنده و ضبط', color: '#F43F5E' },
  { id: 'programming', label: 'برنامه‌نویسی', desc: 'توسعه نرم‌افزار و DevOps', color: '#10B981' },
  { id: 'office', label: 'اداری', desc: 'آفیس، وب و مولتی‌مدیا', color: '#F59E0B' },
];

const BUDGET_PRESETS = [
  { label: 'اقتصادی', min: 20_000_000, max: 40_000_000 },
  { label: 'میان‌رده', min: 40_000_000, max: 80_000_000 },
  { label: 'حرفه‌ای', min: 80_000_000, max: 150_000_000 },
  { label: 'فوق حرفه‌ای', min: 150_000_000, max: 300_000_000 },
];

const COMPONENT_META: { key: string; label: string; icon: React.ComponentType<any> }[] = [
  { key: 'cpu', label: 'پردازنده', icon: CpuIcon },
  { key: 'motherboard', label: 'مادربرد', icon: MotherboardIcon },
  { key: 'gpu', label: 'کارت گرافیک', icon: GpuIcon },
  { key: 'ram', label: 'رم', icon: RamIcon },
  { key: 'storage', label: 'حافظه', icon: SsdIcon },
  { key: 'psu', label: 'پاور', icon: PsuIcon },
  { key: 'case', label: 'کیس', icon: CaseIcon },
  { key: 'cooler', label: 'خنک‌کننده', icon: CoolerIcon },
];

// ════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ════════════════════════════════════════════════════════════════

function formatPrice(price: number): string {
  if (!price) return 'تماس بگیرید';
  return new Intl.NumberFormat('fa-IR').format(price);
}

function formatPriceM(price: number): string {
  return (price / 1_000_000).toFixed(0) + ' میلیون';
}

// ════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════

export default function AssembleWizardV3() {
  const [step, setStep] = useState<BuildStep>('usage');
  const [usage, setUsage] = useState<UsageType | null>(null);
  const [budget, setBudget] = useState<number>(60_000_000);
  const [result, setResult] = useState<BuildResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'details'>('overview');
  const [expandedPart, setExpandedPart] = useState<string | null>(null);

  // ── Build System ──
  const buildSystem = useCallback(async () => {
    if (!usage || !budget) return;
    
    setStep('building');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/assemble', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usage, budget }),
      });

      if (!response.ok) throw new Error('خطا در ارتباط با سرور');
      
      const data: BuildResult = await response.json();
      
      if (!data.success) throw new Error(data.recommendation || 'خطا در ساخت سیستم');
      
      setResult(data);
      setStep('result');
    } catch (err: any) {
      setError(err.message || 'خطای ناشناخته');
      setStep('budget');
    } finally {
      setLoading(false);
    }
  }, [usage, budget]);

  // ── Navigation ──
  const goToUsage = () => { setStep('usage'); setResult(null); };
  const goToBudget = () => { if (usage) setStep('budget'); };
  const startBuild = () => { if (usage && budget) buildSystem(); };

  return (
    <div className="asm-v3-root">
      {/* Header */}
      <header className="asm-v3-header">
        <div className="asm-v3-container">
          <div className="asm-v3-header-inner">
            <div className="asm-v3-logo">
              <SparkIcon className="asm-v3-logo-icon" />
              <div>
                <h1 className="asm-v3-title">اسمبل هوشمند</h1>
                <p className="asm-v3-subtitle">سیستم ایده‌آل خود را بسازید</p>
              </div>
            </div>
            {result && (
              <button onClick={goToUsage} className="asm-v3-btn-reset">
                <RefreshIcon size={18} />
                <span>شروع مجدد</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="asm-v3-container">
        <ProgressBar step={step} />
      </div>

      {/* Content */}
      <main className="asm-v3-container asm-v3-main">
        <AnimatePresence mode="wait">
          {step === 'usage' && (
            <StepUsage key="usage" usage={usage} setUsage={setUsage} onNext={goToBudget} />
          )}
          {step === 'budget' && (
            <StepBudget key="budget" usage={usage!} budget={budget} setBudget={setBudget}
              onBack={goToUsage} onNext={startBuild} />
          )}
          {step === 'building' && (
            <StepBuilding key="building" usage={usage!} budget={budget} />
          )}
          {step === 'result' && result && (
            <StepResult key="result" result={result} activeTab={activeTab}
              setActiveTab={setActiveTab} expandedPart={expandedPart}
              setExpandedPart={setExpandedPart} onEdit={goToBudget} />
          )}
        </AnimatePresence>

        {error && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="asm-v3-error">
            <WarningIcon size={20} />
            <span>{error}</span>
            <button onClick={() => setError(null)}>بستن</button>
          </motion.div>
        )}
      </main>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// PROGRESS BAR
// ════════════════════════════════════════════════════════════════

function ProgressBar({ step }: { step: BuildStep }) {
  const steps: { id: BuildStep; label: string }[] = [
    { id: 'usage', label: 'کاربری' },
    { id: 'budget', label: 'بودجه' },
    { id: 'building', label: 'ساخت' },
    { id: 'result', label: 'نتیجه' },
  ];
  
  const currentIndex = steps.findIndex(s => s.id === step);

  return (
    <div className="asm-v3-progress">
      {steps.map((s, i) => (
        <React.Fragment key={s.id}>
          <div className={`asm-v3-progress-step ${i <= currentIndex ? 'active' : ''}`}>
            <div className="asm-v3-progress-dot">
              {i < currentIndex ? <CheckIcon size={14} /> : <span>{i + 1}</span>}
            </div>
            <span className="asm-v3-progress-label">{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`asm-v3-progress-line ${i < currentIndex ? 'filled' : ''}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// STEP: USAGE SELECTION
// ════════════════════════════════════════════════════════════════

function StepUsage({ usage, setUsage, onNext }: {
  usage: UsageType | null;
  setUsage: (u: UsageType) => void;
  onNext: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }} className="asm-v3-step">
      <div className="asm-v3-step-header">
        <h2>سیستم را برای چه کاری می‌خواهید؟</h2>
        <p>نوع کاربری اصلی سیستم خود را انتخاب کنید</p>
      </div>

      <div className="asm-v3-usage-grid">
        {USAGE_OPTIONS.map((opt) => {
          const Icon = USECASE_ICONS[opt.id] || CpuIcon;
          const isSelected = usage === opt.id;
          
          return (
            <motion.button key={opt.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setUsage(opt.id)}
              className={`asm-v3-usage-card ${isSelected ? 'selected' : ''}`}
              style={{ '--accent': opt.color } as React.CSSProperties}>
              <div className="asm-v3-usage-icon">
                <Icon size={32} />
              </div>
              <h3>{opt.label}</h3>
              <p>{opt.desc}</p>
              {isSelected && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="asm-v3-usage-check">
                  <CheckIcon size={16} />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="asm-v3-step-footer">
        <button onClick={onNext} disabled={!usage} className="asm-v3-btn-primary">
          <span>ادامه</span>
          <ArrowIcon size={18} />
        </button>
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════
// STEP: BUDGET SELECTION
// ════════════════════════════════════════════════════════════════

function StepBudget({ usage, budget, setBudget, onBack, onNext }: {
  usage: UsageType;
  budget: number;
  setBudget: (b: number) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const usageLabel = USAGE_OPTIONS.find(u => u.id === usage)?.label || usage;
  const usageColor = USAGE_OPTIONS.find(u => u.id === usage)?.color || '#7C3AED';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }} className="asm-v3-step">
      <div className="asm-v3-step-header">
        <h2>بودجه مورد نظر</h2>
        <p>حداکثر مبلغی که برای سیستم <strong>{usageLabel}</strong> در نظر دارید</p>
      </div>

      {/* Budget Slider */}
      <div className="asm-v3-budget-section">
        <div className="asm-v3-budget-display">
          <span className="asm-v3-budget-amount">{formatPrice(budget)}</span>
          <span className="asm-v3-budget-unit">تومان</span>
        </div>
        
        <input type="range" min={15_000_000} max={400_000_000} step={5_000_000}
          value={budget} onChange={(e) => setBudget(Number(e.target.value))}
          className="asm-v3-budget-slider"
          style={{ '--accent': usageColor, '--progress': `${((budget - 15_000_000) / (400_000_000 - 15_000_000)) * 100}%` } as React.CSSProperties} />
        
        <div className="asm-v3-budget-range">
          <span>۱۵ میلیون</span>
          <span>۴۰۰ میلیون</span>
        </div>
      </div>

      {/* Presets */}
      <div className="asm-v3-presets">
        {BUDGET_PRESETS.map((preset) => {
          const mid = (preset.min + preset.max) / 2;
          const isActive = budget >= preset.min && budget <= preset.max;
          return (
            <button key={preset.label} onClick={() => setBudget(mid)}
              className={`asm-v3-preset-btn ${isActive ? 'active' : ''}`}>
              <span className="asm-v3-preset-label">{preset.label}</span>
              <span className="asm-v3-preset-range">
                {formatPriceM(preset.min)} تا {formatPriceM(preset.max)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Budget Info */}
      <div className="asm-v3-budget-info">
        <InfoIcon size={16} />
        <span>
          سیستم بر اساس بودجه {formatPriceM(budget)} تومان با کاربری {usageLabel} طراحی خواهد شد.
          قیمت‌ها شامل تخفیف‌های فعال فروشگاه هستند.
        </span>
      </div>

      <div className="asm-v3-step-footer">
        <button onClick={onBack} className="asm-v3-btn-ghost">
          <ArrowIcon size={18} style={{ transform: 'rotate(180deg)' }} />
          <span>بازگشت</span>
        </button>
        <button onClick={onNext} className="asm-v3-btn-primary">
          <SparkIcon size={18} />
          <span>ساخت سیستم</span>
        </button>
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════
// STEP: BUILDING (Loading)
// ════════════════════════════════════════════════════════════════

function StepBuilding({ usage, budget }: { usage: UsageType; budget: number }) {
  const [messageIndex, setMessageIndex] = useState(0);
  const messages = [
    'در حال بررسی موجودی فروشگاه...',
    'تحلیل سازگاری قطعات...',
    'بهینه‌سازی بودجه...',
    'محاسبه عملکرد سیستم...',
    'انتخاب بهترین ترکیب...',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      exit={{ opacity: 0 }} className="asm-v3-step asm-v3-building">
      <div className="asm-v3-building-animation">
        <div className="asm-v3-building-ring" />
        <div className="asm-v3-building-ring delay-1" />
        <div className="asm-v3-building-ring delay-2" />
        <div className="asm-v3-building-icon">
          <CpuIcon size={48} />
        </div>
      </div>
      <h2>در حال ساخت سیستم شما</h2>
      <AnimatePresence mode="wait">
        <motion.p key={messageIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="asm-v3-building-message">
          {messages[messageIndex]}
        </motion.p>
      </AnimatePresence>
      <div className="asm-v3-building-meta">
        <span>{USAGE_OPTIONS.find(u => u.id === usage)?.label}</span>
        <span className="asm-v3-dot" />
        <span>{formatPriceM(budget)} تومان</span>
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════
// STEP: RESULT
// ════════════════════════════════════════════════════════════════

function StepResult({ result, activeTab, setActiveTab, expandedPart, setExpandedPart, onEdit }: {
  result: BuildResult;
  activeTab: 'overview' | 'details';
  setActiveTab: (tab: 'overview' | 'details') => void;
  expandedPart: string | null;
  setExpandedPart: (key: string | null) => void;
  onEdit: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="asm-v3-step asm-v3-result">
      {/* Summary Header */}
      <div className="asm-v3-result-header">
        <div className="asm-v3-result-header-top">
          <div>
            <h2>سیستم شما آماده است</h2>
            <p>
              {result.componentsCount} قطعه انتخاب شده
              <span className="asm-v3-dot" />
              {USAGE_OPTIONS.find(u => u.id === result.usage)?.label}
            </p>
          </div>
          <button onClick={onEdit} className="asm-v3-btn-ghost">
            <EditIcon size={16} />
            <span>ویرایش</span>
          </button>
        </div>
        
        <div className="asm-v3-result-price-row">
          <div className="asm-v3-result-total">
            <span className="asm-v3-result-total-label">قیمت کل</span>
            <span className="asm-v3-result-total-amount">{formatPrice(result.totalPrice)}</span>
            <span className="asm-v3-result-total-unit">تومان</span>
          </div>
          {result.totalDiscount > 0 && (
            <div className="asm-v3-result-discount">
              <span>{formatPrice(result.totalDiscount)}</span>
              <span>تخفیف</span>
            </div>
          )}
        </div>
      </div>

      {/* Compatibility Status */}
      <div className={`asm-v3-compat asm-v3-compat-${result.compatibility.status}`}>
        <ShieldIcon size={20} />
        <span>
          {result.compatibility.status === 'ok' && 'تمام قطعات سازگار هستند'}
          {result.compatibility.status === 'warning' && `${result.compatibility.issues.length} هشدار سازگاری`}
          {result.compatibility.status === 'error' && `${result.compatibility.issues.length} مشکل سازگاری`}
        </span>
        <span className="asm-v3-compat-score">{result.compatibility.score}/100</span>
      </div>

      {/* Performance Cards */}
      <div className="asm-v3-perf-grid">
        {[
          { label: 'گیمینگ', value: result.performance.gaming, color: '#7C3AED' },
          { label: 'رندرینگ', value: result.performance.rendering, color: '#3B82F6' },
          { label: 'بهره‌وری', value: result.performance.productivity, color: '#10B981' },
          { label: 'بازدهی', value: result.performance.efficiency, color: '#F59E0B' },
        ].map((perf) => (
          <div key={perf.label} className="asm-v3-perf-card">
            <div className="asm-v3-perf-ring" style={{ '--progress': `${perf.value}%`, '--color': perf.color } as React.CSSProperties}>
              <span>{perf.value}</span>
            </div>
            <span className="asm-v3-perf-label">{perf.label}</span>
          </div>
        ))}
      </div>

      {/* Bottleneck Warning */}
      {result.performance.bottleneck && (
        <div className="asm-v3-bottleneck">
          <WarningIcon size={18} />
          <span>{result.performance.bottleneck.message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="asm-v3-tabs">
        <button className={`asm-v3-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}>
          <EyeIcon size={16} />
          <span>نمای کلی</span>
        </button>
        <button className={`asm-v3-tab ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}>
          <InfoIcon size={16} />
          <span>جزئیات فنی</span>
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' ? (
          <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <OverviewTab result={result} />
          </motion.div>
        ) : (
          <motion.div key="details" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <DetailsTab result={result} expandedPart={expandedPart} setExpandedPart={setExpandedPart} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Recommendation */}
      {result.recommendation && (
        <div className="asm-v3-ai-rec">
          <div className="asm-v3-ai-rec-header">
            <SparkIcon size={18} />
            <span>تحلیل هوشمند</span>
          </div>
          <p>{result.recommendation}</p>
        </div>
      )}

      {/* Actions */}
      <div className="asm-v3-actions">
        <button className="asm-v3-btn-primary asm-v3-btn-cart">
          <CartIcon size={20} />
          <span>افزودن همه به سبد خرید</span>
        </button>
        <button onClick={onEdit} className="asm-v3-btn-ghost">
          <RefreshIcon size={18} />
          <span>تغییر بودجه و کاربری</span>
        </button>
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════
// OVERVIEW TAB
// ════════════════════════════════════════════════════════════════

function OverviewTab({ result }: { result: BuildResult }) {
  return (
    <div className="asm-v3-overview">
      {COMPONENT_META.map(({ key, label, icon: Icon }) => {
        const part = result.parts[key];
        if (!part) return null;
        
        return (
          <motion.div key={key} initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="asm-v3-part-row">
            <div className="asm-v3-part-icon">
              <Icon size={24} />
            </div>
            <div className="asm-v3-part-info">
              <span className="asm-v3-part-label">{label}</span>
              <span className="asm-v3-part-name">{part.name}</span>
              {part.brand && <span className="asm-v3-part-brand">{part.brand}</span>}
            </div>
            <div className="asm-v3-part-price">
              {part.finalPrice !== part.price && (
                <span className="asm-v3-part-old-price">{formatPrice(part.price)}</span>
              )}
              <span className="asm-v3-part-final-price">{formatPrice(part.finalPrice)}</span>
            </div>
            <div className="asm-v3-part-stock">
              {part.is_in_stock ? (
                <span className="asm-v3-in-stock">موجود</span>
              ) : (
                <span className="asm-v3-out-stock">ناموجود</span>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// DETAILS TAB
// ════════════════════════════════════════════════════════════════

function DetailsTab({ result, expandedPart, setExpandedPart }: {
  result: BuildResult;
  expandedPart: string | null;
  setExpandedPart: (key: string | null) => void;
}) {
  return (
    <div className="asm-v3-details">
      {COMPONENT_META.map(({ key, label, icon: Icon }) => {
        const part = result.parts[key];
        if (!part) return null;
        
        const isExpanded = expandedPart === key;
        const specs = part.specs || {};
        
        return (
          <div key={key} className="asm-v3-detail-card">
            <button onClick={() => setExpandedPart(isExpanded ? null : key)}
              className="asm-v3-detail-header">
              <div className="asm-v3-detail-header-right">
                <div className="asm-v3-detail-icon"><Icon size={20} /></div>
                <div>
                  <span className="asm-v3-detail-label">{label}</span>
                  <span className="asm-v3-detail-name">{part.name}</span>
                </div>
              </div>
              <div className={`asm-v3-detail-toggle ${isExpanded ? 'expanded' : ''}`}>
                {isExpanded ? <CollapseIcon size={18} /> : <ExpandIcon size={18} />}
              </div>
            </button>
            
            <AnimatePresence>
              {isExpanded && (
                <motion.div initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="asm-v3-detail-body">
                  {/* Price Info */}
                  <div className="asm-v3-detail-section">
                    <h4>قیمت</h4>
                    <div className="asm-v3-detail-grid">
                      <div className="asm-v3-detail-item">
                        <span className="asm-v3-detail-key">قیمت اصلی</span>
                        <span className="asm-v3-detail-val">{formatPrice(part.price)} تومان</span>
                      </div>
                      {part.special_price && (
                        <div className="asm-v3-detail-item">
                          <span className="asm-v3-detail-key">قیمت با تخفیف</span>
                          <span className="asm-v3-detail-val asm-v3-highlight">{formatPrice(part.special_price)} تومان</span>
                        </div>
                      )}
                      {specs._estimatedPrice && (
                        <div className="asm-v3-detail-item asm-v3-estimated">
                          <InfoIcon size={14} />
                          <span>قیمت تخمینی (محصول ناموجود)</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Technical Specs */}
                  <div className="asm-v3-detail-section">
                    <h4>مشخصات فنی</h4>
                    <div className="asm-v3-detail-grid">
                      {specs.brand && (
                        <div className="asm-v3-detail-item">
                          <span className="asm-v3-detail-key">برند</span>
                          <span className="asm-v3-detail-val">{specs.brand}</span>
                        </div>
                      )}
                      {specs.tier !== undefined && specs.tier > 0 && (
                        <div className="asm-v3-detail-item">
                          <span className="asm-v3-detail-key">سطح عملکرد</span>
                          <span className="asm-v3-detail-val">
                            <span className="asm-v3-tier-bar" style={{ '--tier': `${specs.tier}%` } as React.CSSProperties}>
                              {specs.tier}/100
                            </span>
                          </span>
                        </div>
                      )}
                      {specs.socket && (
                        <div className="asm-v3-detail-item">
                          <span className="asm-v3-detail-key">سوکت</span>
                          <span className="asm-v3-detail-val">{specs.socket.toUpperCase()}</span>
                        </div>
                      )}
                      {specs.platform && (
                        <div className="asm-v3-detail-item">
                          <span className="asm-v3-detail-key">پلتفرم</span>
                          <span className="asm-v3-detail-val">{specs.platform === 'amd' ? 'AMD' : 'Intel'}</span>
                        </div>
                      )}
                      {specs.cores && (
                        <div className="asm-v3-detail-item">
                          <span className="asm-v3-detail-key">تعداد هسته</span>
                          <span className="asm-v3-detail-val">{specs.cores} هسته</span>
                        </div>
                      )}
                      {specs.threads && (
                        <div className="asm-v3-detail-item">
                          <span className="asm-v3-detail-key">تعداد رشته</span>
                          <span className="asm-v3-detail-val">{specs.threads} رشته</span>
                        </div>
                      )}
                      {specs.frequency && (
                        <div className="asm-v3-detail-item">
                          <span className="asm-v3-detail-key">فرکانس</span>
                          <span className="asm-v3-detail-val">{specs.frequency} {specs.frequency > 100 ? 'MHz' : 'GHz'}</span>
                        </div>
                      )}
                      {specs.tdp && (
                        <div className="asm-v3-detail-item">
                          <span className="asm-v3-detail-key">مصرف (TDP)</span>
                          <span className="asm-v3-detail-val">{specs.tdp}W</span>
                        </div>
                      )}
                      {specs.ddr && (
                        <div className="asm-v3-detail-item">
                          <span className="asm-v3-detail-key">نوع حافظه</span>
                          <span className="asm-v3-detail-val">{specs.ddr.toUpperCase()}</span>
                        </div>
                      )}
                      {specs.capacityGB && (
                        <div className="asm-v3-detail-item">
                          <span className="asm-v3-detail-key">ظرفیت</span>
                          <span className="asm-v3-detail-val">{specs.capacityGB} GB</span>
                        </div>
                      )}
                      {specs.capacityTB && (
                        <div className="asm-v3-detail-item">
                          <span className="asm-v3-detail-key">ظرفیت</span>
                          <span className="asm-v3-detail-val">{specs.capacityTB} TB</span>
                        </div>
                      )}
                      {specs.vram && (
                        <div className="asm-v3-detail-item">
                          <span className="asm-v3-detail-key">حافظه ویدیویی</span>
                          <span className="asm-v3-detail-val">{specs.vram} GB</span>
                        </div>
                      )}
                      {specs.wattage && (
                        <div className="asm-v3-detail-item">
                          <span className="asm-v3-detail-key">توان خروجی</span>
                          <span className="asm-v3-detail-val">{specs.wattage}W</span>
                        </div>
                      )}
                      {specs.rating && (
                        <div className="asm-v3-detail-item">
                          <span className="asm-v3-detail-key">گواهی بازدهی</span>
                          <span className="asm-v3-detail-val">80+ {specs.rating.charAt(0).toUpperCase() + specs.rating.slice(1)}</span>
                        </div>
                      )}
                      {specs.isNVMe && (
                        <div className="asm-v3-detail-item">
                          <span className="asm-v3-detail-key">نوع رابط</span>
                          <span className="asm-v3-detail-val">NVMe M.2{specs.gen ? ` Gen${specs.gen}` : ''}</span>
                        </div>
                      )}
                      {specs.rgb !== undefined && (
                        <div className="asm-v3-detail-item">
                          <span className="asm-v3-detail-key">RGB</span>
                          <span className="asm-v3-detail-val">{specs.rgb ? 'دارد' : 'ندارد'}</span>
                        </div>
                      )}
                      {specs.chipset && (
                        <div className="asm-v3-detail-item">
                          <span className="asm-v3-detail-key">چیپست</span>
                          <span className="asm-v3-detail-val">{specs.chipset.toUpperCase()}</span>
                        </div>
                      )}
                      {specs.modular && (
                        <div className="asm-v3-detail-item">
                          <span className="asm-v3-detail-key">ماژولار</span>
                          <span className="asm-v3-detail-val">{specs.modular === 'full' ? 'کاملاً ماژولار' : specs.modular === 'semi' ? 'نیمه ماژولار' : 'غیر ماژولار'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Alternatives */}
                  {part.alternatives && part.alternatives.length > 0 && (
                    <div className="asm-v3-detail-section">
                      <h4>جایگزین‌ها</h4>
                      {part.alternatives.map((alt, idx) => (
                        <div key={alt.id} className="asm-v3-alternative">
                          <span className="asm-v3-alt-name">{alt.name}</span>
                          <span className="asm-v3-alt-price">{formatPrice(alt.finalPrice)} T</span>
                          <span className={`asm-v3-alt-stock ${alt.inStock ? 'in' : 'out'}`}>
                            {alt.inStock ? 'موجود' : 'ناموجود'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* Compatibility Issues */}
      {result.compatibility.issues.length > 0 && (
        <div className="asm-v3-detail-card">
          <div className="asm-v3-detail-header" style={{ cursor: 'default' }}>
            <div className="asm-v3-detail-header-right">
              <div className="asm-v3-detail-icon"><WarningIcon size={20} /></div>
              <div>
                <span className="asm-v3-detail-label">هشدارهای سازگاری</span>
              </div>
            </div>
          </div>
          <div className="asm-v3-detail-body" style={{ height: 'auto' }}>
            {result.compatibility.issues.map((issue, idx) => (
              <div key={idx} className={`asm-v3-issue asm-v3-issue-${issue.severity}`}>
                <span>{issue.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
