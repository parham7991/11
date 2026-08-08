'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu,
  Bot,
  Gamepad2,
  Briefcase,
  Clapperboard,
  Box,
  Code2,
  Radio,
  Video,
  Server,
  Home,
  Tv,
  Wand2,
  Sparkles,
  Wallet,
  ShieldCheck,
  BrainCircuit,
  LayoutGrid,
  Check,
  MousePointerClick,
  Tag,
  BadgeCheck,
  Eye,
  ShoppingCart,
  Receipt,
  RotateCcw,
  ArrowRight,
  Layers,
  HardDrive,
  Zap,
  Fan,
  CircuitBoard,
  Monitor,
  Circle,
  TrendingUp,
} from 'lucide-react';
import AssembleProductCard from './AssembleProductCard';
import TelemetryDashboard from './TelemetryDashboard';
import InvoiceModal from './InvoiceModal';
import { useAddBulkCart } from '@/hooks/cart/useAddBulkCart';
import './assemble.css';

/* Types */
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
  errors: { severity: string; message: string }[];
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
  detectedUseCase?: string;
};

const USE_CASES = [
  { key: 'gaming', label: 'گیمینگ', desc: 'بازی‌های روز', icon: Gamepad2 },
  { key: 'office', label: 'اداری', desc: 'آفیس و حسابداری', icon: Briefcase },
  { key: 'editing', label: 'ادیت و تدوین', desc: 'پریمیر، فتوشاپ', icon: Clapperboard },
  { key: 'rendering', label: 'رندرینگ', desc: 'بلندر، 3D', icon: Box },
  { key: 'programming', label: 'برنامه‌نویسی', desc: 'کد و داکر', icon: Code2 },
  { key: 'streaming', label: 'استریم', desc: 'OBS و یوتیوب', icon: Radio },
  { key: 'server', label: 'سرور', desc: 'مجازی‌سازی', icon: Server },
  { key: 'home', label: 'خانگی', desc: 'فیلم و وب‌گردی', icon: Home },
  { key: 'custom', label: 'دلخواه', desc: 'خودت بنویس', icon: Wand2 },
];

const CATEGORY_TABS: Record<string, { label: string; icon: any }> = {
  cpu: { label: 'پردازنده', icon: Cpu },
  motherboard: { label: 'مادربرد', icon: CircuitBoard },
  ram: { label: 'رم', icon: Layers },
  gpu: { label: 'گرافیک', icon: Monitor },
  storage: { label: 'حافظه', icon: HardDrive },
  psu: { label: 'پاور', icon: Zap },
  case: { label: 'کیس', icon: Box },
  cooler: { label: 'خنک‌کننده', icon: Fan },
};

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

const toman = (n: number) => `${Math.round(n).toLocaleString('fa-IR')} تومان`;
const shortToman = (n: number) => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} میلیارد`;
  if (n >= 1_000_000) return `${Math.round(n / 1_000_000).toLocaleString('fa-IR')} میلیون`;
  return n.toLocaleString('fa-IR');
};

export default function AssembleOnlineWizard() {
  const router = useRouter();
  const { mutate: addBulk, isPending: buying } = useAddBulkCart();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [useCase, setUseCase] = useState<string>('gaming');
  const [customDesc, setCustomDesc] = useState('');
  const [budget, setBudget] = useState<number>(65_000_000);
  const [range, setRange] = useState<{ min: number; max: number; recommended: number; presets: number[] } | null>(null);
  const [rangeLoading, setRangeLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [result, setResult] = useState<AssembleResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parts, setParts] = useState<Part[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [bought, setBought] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('cpu');

  useEffect(() => {
    if (step !== 2) return;
    let cancelled = false;
    setRangeLoading(true);
    const qs = new URLSearchParams({ useCase });
    if (customDesc.trim()) qs.set('customDesc', customDesc.trim());
    fetch(`/api/assemble/budget-range?${qs.toString()}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const min = Number(data.min) || 15_000_000;
        const max = Number(data.max) || 200_000_000;
        const recommended = Number(data.recommended) || 50_000_000;
        const presets = Array.isArray(data.presets) && data.presets.length ? data.presets : FALLBACK_PRESETS[useCase] || FALLBACK_PRESETS.gaming;
        setRange({ min, max, recommended, presets });
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
    return () => { cancelled = true; };
  }, [step, useCase, customDesc]);

  useEffect(() => {
    if (!loading) return;
    setLoadStep(0);
    const iv = setInterval(() => setLoadStep((s) => (s < 4 ? s + 1 : s)), 1200);
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
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch('/api/assemble', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ useCase, budget, customDesc }),
          signal: AbortSignal.timeout(25000),
        });
        const data = (await res.json()) as AssembleResult;
        if (!res.ok || !data.ok) throw new Error((data as any)?.error || `خطای سرور ${res.status}`);
        setResult(data);
        const p = Array.isArray(data.parts) ? data.parts : [];
        setParts(p);
        if (p.length) setActiveTab(p[0].category);
        setLoading(false);
        return;
      } catch (e: any) {
        if (attempt === 3) {
          setError(e?.message || 'خطا در ارتباط با موتور اسمبل.');
          setLoading(false);
        } else await new Promise((r) => setTimeout(r, 600 * attempt));
      }
    }
  }, [useCase, budget, customDesc]);

  const restart = () => {
    setResult(null); setParts([]); setError(null); setBought(false); setExpanded(new Set()); setStep(1);
  };

  const toggleExpand = (id: string) => setExpanded((prev) => {
    const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n;
  });

  const selectAlternative = (partId: string, alt: Part) => {
    setParts((prev) => prev.map((p) => String(p.id) === String(partId) ? { ...alt, alternatives: p.alternatives, isOptional: p.isOptional } : p));
    setExpanded((prev) => { const n = new Set(prev); n.delete(String(partId)); return n; });
  };

  const removeOptional = (id: string) => setParts((prev) => prev.filter((p) => String(p.id) !== String(id)));

  const updateQuantity = (id: string, delta: number) => {
    setParts((prev) => {
      const mb = prev.find((p) => p.category === 'motherboard');
      const ramSlots = Number((mb?.specs as any)?.ramSlots || 4);
      const m2Slots = Number((mb?.specs as any)?.m2Slots || 2);
      const sataPorts = Number((mb?.specs as any)?.sataPorts || 4);
      return prev.map((p) => {
        if (String(p.id) !== String(id)) return p;
        if (p.category !== 'ram' && p.category !== 'storage') return p;
        const cur = Math.max(1, Number(p.quantity || 1));
        let next = cur + delta;
        if (next < 1) next = 1;
        if (p.category === 'ram') {
          const modulesPerKit = Number((p.specs as any)?.moduleCount || 1);
          if (next * modulesPerKit > ramSlots) { alert(`مادربرد فقط ${ramSlots} اسلات RAM دارد`); return p; }
        }
        if (p.category === 'storage') {
          const isNVMe = (p.specs as any)?.isM2 || (p.specs as any)?.isNVMe;
          const maxAllowed = isNVMe ? m2Slots : sataPorts;
          if (next > maxAllowed) { alert(`${p.categoryLabel} فقط ${maxAllowed} اسلات دارد`); return p; }
        }
        return { ...p, quantity: next, quantityLabel: `${next} عدد` } as Part;
      });
    });
  };

  const buyAll = () => {
    const available = parts.filter((p) => p.inStock && p.finalPrice > 0);
    if (!available.length) { alert('هیچ قطعهٔ موجودی نیست.'); return; }
    addBulk(available.map((p) => ({ id: p.id, qty: Math.max(1, Number(p.quantity || 1)) })), { onSuccess: () => setBought(true) });
  };

  const blockedIds = useMemo(() => new Set(result?.compatibilityMatrix?.blockedPartIds || []), [result?.compatibilityMatrix]);
  const unavailableIds = useMemo(() => new Set(result?.compatibilityMatrix?.unavailablePartIds || []), [result?.compatibilityMatrix]);
  const isIncompatible = result?.compatibilityMatrix?.status === 'incompatible';

  const summary = useMemo(() => {
    if (parts.length) {
      const totalBefore = parts.reduce((s, p) => s + Number(p.price || 0) * Math.max(1, Number(p.quantity || 1)), 0);
      const totalAfter = parts.reduce((s, p) => s + Number(p.finalPrice || 0) * Math.max(1, Number(p.quantity || 1)), 0);
      const saving = Math.max(0, totalBefore - totalAfter);
      return { totalBefore, totalAfter, totalSaving: saving, savingPercent: totalBefore ? Math.round((saving / totalBefore) * 100) : 0, itemCount: parts.length };
    }
    return result?.summary ? { ...result.summary, itemCount: result.summary.itemCount } as any : null;
  }, [parts, result?.summary]);

  const activePart = parts.find((p) => p.category === activeTab) || parts[0];

  return (
    <div className="asm font-[Vazirmatn] dir-rtl" dir="rtl" style={{ ['--font-vazir' as any]: 'Vazirmatn, sans-serif' }}>
      {/* HERO — Glassmorphism + Aurora */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#2563EB] via-[#3B82F6] to-[#7C3AED] p-8 md:p-10 text-white shadow-[0_20px_60px_-20px_rgba(37,99,235,.35)]"
      >
        {/* Aurora glows */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-[#60A5FA]/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-[#A78BFA]/25 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.15),transparent_60%)]" />
        {/* dot grid */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 shadow-lg">
            <Cpu className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">سیستم دلخواهت رو هوشمند بچین</h1>
          <p className="mt-3 max-w-2xl text-sm md:text-[15px] leading-7 text-white/90">
            فقط بگو سیستم رو برای چی می‌خوای و چقدر بودجه داری. ما بهترین قطعات رو با قیمت و موجودی لحظه‌ای برات می‌چینیم و خیالت رو از سازگاری کامل همه‌چیز راحت می‌کنیم.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            {[
              { icon: Wallet, text: 'قیمت و موجودی زنده‌ی بازار' },
              { icon: ShieldCheck, text: 'تضمین سازگاری ۱۰۰٪' },
              { icon: BrainCircuit, text: 'پیشنهاد هوش مصنوعی' },
              { icon: LayoutGrid, text: '۸ نوع کاربری حرفه‌ای' },
            ].map(({ icon: Icon, text }) => (
              <span key={text} className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20 px-3.5 py-2 text-xs font-medium text-white">
                <Icon className="h-4 w-4" /> {text}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* STEPER */}
      <div className="mt-6 flex items-center justify-between gap-2">
        {[
          { n: 1, label: 'کاربری', icon: MousePointerClick, active: step === 1, done: step > 1 },
          { n: 2, label: 'بودجه', icon: Wallet, active: step === 2, done: step > 2 },
          { n: 3, label: 'پیشنهاد موتور', icon: Sparkles, active: step === 3, done: false },
        ].map((s, idx, arr) => (
          <React.Fragment key={s.n}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.07, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className={`flex flex-1 items-center gap-2.5 rounded-2xl border px-3 py-2.5 md:px-4 md:py-3 ${s.active ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-[0_8px_24px_rgba(37,99,235,.3)]' : s.done ? 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]' : 'bg-white text-[#64748B] border-[#E2E8F0]'}`}
            >
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${s.active ? 'bg-white/20 text-white' : s.done ? 'bg-[#10B981] text-white' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                {s.done ? <Check className="h-4 w-4" /> : s.n}
              </span>
              <s.icon className="h-4 w-4 hidden md:block" />
              <span className="text-xs md:text-sm font-bold">{s.label}</span>
            </motion.div>
            {idx < arr.length - 1 && <div className={`h-px flex-1 ${s.done ? 'bg-[#10B981]' : 'bg-[#E2E8F0]'}`} />}
          </React.Fragment>
        ))}
      </div>

      {/* STEP 1 */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 rounded-[24px] border border-[#E2E8F0] bg-white/80 backdrop-blur-xl p-6 shadow-[0_8px_32px_rgba(15,23,42,0.06)]"
          >
            <h2 className="text-[17px] font-black text-[#0F172A]">برای چه کاری می‌خوای؟</h2>
            <p className="mt-1 text-sm text-[#64748B]">کاربری رو انتخاب کن — موتور قیمت و قطعات مخصوص همین کاربری رو می‌چینه.</p>
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
              {USE_CASES.map((u, idx) => {
                const Icon = u.icon as any;
                const active = useCase === u.key;
                return (
                  <motion.button
                    key={u.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.3 }}
                    whileHover={{ y: -3, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setUseCase(u.key)}
                    className={`relative flex flex-col items-center gap-2 rounded-2xl border p-5 text-center transition-all ${active ? 'border-[#2563EB] bg-gradient-to-br from-white to-[#EFF6FF] shadow-[0_12px_32px_rgba(37,99,235,.15)]' : 'border-[#E2E8F0] bg-white hover:border-[#BFDBFE] hover:shadow-[0_8px_24px_rgba(37,99,235,.08)]'}`}
                  >
                    {active && <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#2563EB] text-white"><Check className="h-3.5 w-3.5" /></span>}
                    <span className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${active ? 'bg-[#2563EB] text-white border-transparent shadow-md' : 'bg-[#F8FAFC] text-[#2563EB] border-[#E2E8F0]'}`}>
                      <Icon className="h-7 w-7" />
                    </span>
                    <span className="text-sm font-black text-[#0F172A]">{u.label}</span>
                    <span className="text-xs text-[#64748B]">{u.desc}</span>
                  </motion.button>
                );
              })}
            </div>
            {useCase === 'custom' && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 rounded-2xl border border-[#E9D5FF] bg-gradient-to-br from-[#FAF5FF] to-white p-4 shadow-sm">
                <label className="flex items-center gap-2 text-sm font-bold text-[#6D28D9]"><Wand2 className="h-4 w-4" /> چی می‌خوای؟ بنویس تا AI بفهمه</label>
                <textarea
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  placeholder="مثال: می‌خوام هم گیم 1440p بازی کنم هم با پریمیر ادیت کنم — بودجه متوسط"
                  maxLength={300}
                  rows={4}
                  autoFocus
                  className="mt-3 w-full resize-none rounded-xl border bg-white p-3 text-sm leading-6 outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#E9D5FF]"
                  style={{ borderColor: customDesc.trim().length < 3 ? '#F59E0B' : '#7C3AED' }}
                />
                <div className="mt-2 flex justify-between text-xs text-[#64748B]">
                  <span>{customDesc.trim().length < 3 ? 'حداقل ۳ حرف' : 'AI تشخیص می‌دهد'}</span><span>{customDesc.length}/300</span>
                </div>
              </motion.div>
            )}
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setStep(2)}
              disabled={useCase === 'custom' && customDesc.trim().length < 3}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] py-4 text-[15px] font-black text-white shadow-[0_12px_32px_rgba(37,99,235,.3)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ادامه <ArrowRight className="h-5 w-5 rotate-180" />
            </motion.button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="mt-6 rounded-[24px] border border-[#E2E8F0] bg-white/80 backdrop-blur-xl p-6 shadow-[0_8px_32px_rgba(15,23,42,0.06)]"
          >
            <h2 className="text-[17px] font-black text-[#0F172A]">بودجه‌ات چقدره؟</h2>
            {rangeLoading ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-[#2563EB]"><span className="h-4 w-4 animate-spin rounded-full border-2 border-[#BFDBFE] border-t-[#2563EB]" /> در حال گرفتن بازه‌ی واقعی…</div>
            ) : range ? (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[#64748B]">
                <span>بازه موتور: <b className="text-[#0F172A]">{shortToman(range.min)}</b> تا <b className="text-[#0F172A]">{shortToman(range.max)}</b></span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF3C7] px-3 py-1 text-xs font-bold text-[#92400E]"><BadgeCheck className="h-3.5 w-3.5" /> پیشنهادی: {shortToman(range.recommended)}</span>
              </div>
            ) : null}

            {rangeLoading || !range ? (
              <div className="mt-6 space-y-4">
                <div className="h-8 w-2/3 animate-pulse rounded bg-[#F1F5F9] mx-auto" />
                <div className="h-2 w-full animate-pulse rounded bg-[#E2E8F0]" />
                <div className="flex gap-2 justify-center">{[1,2,3,4,5,6].map(i=><div key={i} className="h-9 w-20 animate-pulse rounded-full bg-[#F1F5F9]" />)}</div>
              </div>
            ) : (
              <>
                <div className="mt-6 text-center">
                  <div className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] bg-clip-text text-3xl font-black text-transparent">
                    <Wallet className="h-6 w-6 text-[#2563EB]" /> {budget.toLocaleString('fa-IR')} <span className="text-sm font-medium text-[#64748B]">تومان</span>
                  </div>
                </div>
                <div dir="rtl" className="relative mt-6">
                  <input
                    type="range"
                    dir="rtl"
                    min={range.min}
                    max={range.max}
                    step={Math.max(1_000_000, Math.round((range.max - range.min) / 100))}
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="h-2 w-full appearance-none rounded-full accent-[#2563EB] [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_4px_16px_rgba(37,99,235,.3)] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#2563EB]"
                    style={{ background: `linear-gradient(to left, #2563EB 0%, #7C3AED ${(budget - range.min) / (range.max - range.min) * 100}%, #E2E8F0 ${(budget - range.min) / (range.max - range.min) * 100}%, #E2E8F0 100%)` }}
                  />
                  <div className="mt-2 flex justify-between text-xs text-[#64748B]">
                    <span>{shortToman(range.min)}</span>
                    <button onClick={() => setBudget(range.recommended)} className="rounded-full bg-[#2563EB] px-3 py-1 text-xs font-bold text-white shadow">پیشنهادی {shortToman(range.recommended)}</button>
                    <span>{shortToman(range.max)}</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {range.presets.map((v) => (
                    <button
                      key={v}
                      onClick={() => setBudget(v)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold transition-all ${budget === v ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-[0_8px_20px_rgba(37,99,235,.3)]' : 'bg-white text-[#0F172A] border-[#E2E8F0] hover:border-[#BFDBFE] hover:shadow'}`}
                    >
                      <Tag className="h-3.5 w-3.5" /> {shortToman(v)}
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="mt-6 flex gap-3">
              <button onClick={() => setStep(1)} className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[#E2E8F0] bg-white py-3.5 text-sm font-bold text-[#0F172A] hover:border-[#2563EB] hover:text-[#2563EB]">
                <ArrowRight className="h-4 w-4" /> بازگشت
              </button>
              <button
                onClick={build}
                disabled={!range || rangeLoading}
                className="flex-[2] inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] py-4 text-[15px] font-black text-white shadow-[0_12px_32px_rgba(37,99,235,.3)] disabled:opacity-50"
              >
                <Wand2 className="h-5 w-5" /> بچین برام
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-[24px] border border-[#E2E8F0] bg-white/80 backdrop-blur-xl p-6 shadow-[0_8px_32px_rgba(15,23,42,0.06)]"
          >
            {loading && (
              <div className="py-10 text-center">
                <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-[#E0E7FF] border-t-[#2563EB]" />
                <p className="mt-4 font-bold text-[#0F172A]">موتور دارد سیستم می‌چیند…</p>
                <div className="mx-auto mt-4 max-w-sm space-y-2 text-right text-sm text-[#64748B]">
                  {['تحلیل کاربری','موجودی زنده','سازگاری','انتخاب بهینه','تحلیل AI'].map((t,i)=>(
                    <div key={t} className={`flex items-center gap-2 ${i<=loadStep?'text-[#0F172A] opacity-100':'opacity-40'}`}>
                      <span className={`h-2 w-2 rounded-full ${i<=loadStep?'bg-[#10B981] shadow-[0_0_0_4px_rgba(16,185,129,.15)]':'bg-[#E2E8F0]'}`} /> {t}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!loading && error && (
              <div className="py-10 text-center">
                <p className="font-bold text-[#DC2626]">{error}</p>
                <div className="mt-4 flex justify-center gap-2">
                  <button onClick={build} className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-bold text-white"><RotateCcw className="h-4 w-4" /> تلاش دوباره</button>
                  <button onClick={restart} className="rounded-xl border px-4 py-2 text-sm font-bold">شروع دوباره</button>
                </div>
              </div>
            )}

            {!loading && result?.ok && (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2563EB] text-white"><Cpu className="h-5 w-5" /></span>
                  <h2 className="text-lg font-black text-[#0F172A]">سیستم {result.useCaseLabel}</h2>
                  <span className="rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-bold text-[#2563EB]">{result.tier}</span>
                  <span className="rounded-full bg-[#F1F5F9] px-3 py-1 text-xs text-[#64748B]">{summary?.itemCount} قطعه • {toman(summary?.totalAfter || 0)}</span>
                </div>

                {/* ===== LIST PARTS VERTICAL — clean rows ===== */}
                <div className="asm-list mt-6 flex flex-col gap-3">
                  {parts.map((p, idx) => {
                    const blocked = blockedIds.has(String(p.id));
                    const unavailable = unavailableIds.has(String(p.id));
                    const qty = Math.max(1, Number((p as any).quantity || 1));
                    return (
                      <motion.div
                        key={`${p.category}-${p.id}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05, duration: 0.3, ease: [0.22,1,0.36,1] }}
                        className="asm-row group flex flex-col gap-3 rounded-2xl border bg-card p-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all md:grid md:grid-cols-[96px_1fr_auto] md:items-center"
                      >
                        <div className="asm-row__img flex h-24 w-24 items-center justify-center rounded-xl bg-muted mx-auto md:mx-0 overflow-hidden">
                          {p.image ? <img src={p.image} alt={p.name} className="h-full w-full object-contain p-2" /> : <Cpu className="h-8 w-8 text-muted-foreground" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                              {(() => { const Icon = (CATEGORY_TABS[p.category]?.icon || Cpu) as any; return <Icon className="h-3.5 w-3.5" />; })()} {CATEGORY_TABS[p.category]?.label || p.categoryLabel}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-600"><BadgeCheck className="h-3.5 w-3.5" /> موجود</span>
                            {qty > 1 && <span className="rounded-full bg-muted px-2 py-0.5 text-xs">× {qty.toLocaleString('fa-IR')}</span>}
                          </div>
                          <div className="mt-1 line-clamp-2 text-sm font-bold text-foreground">{p.name}</div>
                          <div className="text-xs text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>{p.name}</div>
                          {(p.category==='ram' || p.category==='storage') && (
                            <div className="mt-2 flex items-center gap-1.5">
                              <button onClick={()=>updateQuantity(String(p.id), -1)} disabled={qty<=1} className="flex h-7 w-7 items-center justify-center rounded-full border bg-card text-foreground disabled:opacity-40">−</button>
                              <span className="min-w-10 rounded-full border bg-card px-2 py-1 text-center text-xs font-bold">× {qty.toLocaleString('fa-IR')}</span>
                              <button onClick={()=>updateQuantity(String(p.id), 1)} className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">+</button>
                            </div>
                          )}
                        </div>
                        <div className="asm-row__price flex flex-col items-stretch gap-2 md:items-end">
                          <div className="flex items-baseline gap-2">
                            {p.discountPercent>0 && <span className="text-xs line-through text-muted-foreground">{toman(p.price * qty)}</span>}
                            <span className="text-base font-black text-emerald-600">{toman(p.finalPrice * qty)}</span>
                          </div>
                          <div className="flex gap-1.5">
                            <a href={p.url} target="_blank" className="inline-flex items-center gap-1.5 rounded-xl border bg-card px-3 py-2 text-xs font-bold hover:border-primary hover:text-primary"><Eye className="h-4 w-4" /> مشاهده</a>
                            <button onClick={buyAll} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:opacity-90"><ShoppingCart className="h-4 w-4" /> افزودن</button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Sticky total bar */}
                {summary && (
                  <div className="sticky bottom-4 z-20 mt-6 flex flex-col gap-3 rounded-2xl border border-[#E2E8F0] bg-white/90 backdrop-blur-xl p-4 shadow-[0_16px_40px_rgba(15,23,42,.12)] md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#0F172A]"><Receipt className="h-5 w-5 text-[#2563EB]" /> جمع کل: <span className="text-lg font-black text-[#10B981]">{toman(summary.totalAfter)}</span> {summary.savingPercent>0 && <span className="rounded-full bg-[#FEF2F2] px-2 py-0.5 text-xs text-[#DC2626]">صرفه‌جویی {toman(summary.totalSaving)}</span>}</div>
                    <div className="flex gap-2">
                      <button onClick={restart} className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-bold"><RotateCcw className="h-4 w-4" /> شروع دوباره</button>
                      <button onClick={buyAll} disabled={buying || isIncompatible} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] px-6 py-3 text-sm font-black text-white shadow disabled:opacity-50"><ShoppingCart className="h-4 w-4" /> افزودن همه به سبد</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <InvoiceModal open={invoiceOpen} onClose={()=>setInvoiceOpen(false)} parts={parts as any} useCaseLabel={result?.useCaseLabel} budget={budget} />
    </div>
  );
}

function Step({ n, label, active, done }: { n:number; label:string; active:boolean; done:boolean }) {
  return <div className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold ${active ? 'bg-[#2563EB] text-white border-[#2563EB]' : done ? 'bg-[#10B981] text-white border-[#10B981]' : 'bg-white text-[#64748B] border-[#E2E8F0]'}`}><span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">{done?<Check className="h-3 w-3"/>:n}</span>{label}</div>;
}
