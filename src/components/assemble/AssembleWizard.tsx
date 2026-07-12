'use client';

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import './assemble.css';
import {
  PART_ICONS,
  USECASE_ICONS,
  CpuIcon,
  RamIcon,
  SsdIcon,
  PsuIcon,
  GpuIcon,
  CustomIcon,
  CartIcon,
  ArrowIcon,
  RefreshIcon,
  EditIcon,
  CheckIcon,
  ShieldIcon,
  InfoIcon,
  WarningIcon,
  EyeIcon,
  ExpandIcon,
  CollapseIcon,
} from './PartIcons';
import AssembleProductCard from './AssembleProductCard';
import { useAddBulkCart } from '@/hooks/cart/useAddBulkCart';
import InvoiceModal from './InvoiceModal';
import ThemeSelector, { type AssembleTheme } from './ThemeSelector';
import BuildIdentityCard from './BuildIdentityCard';
import RadialGauge from './RadialGauge';
import SpecRadar from './SpecRadar';
import PcBuildVisual from './PcBuildVisual';
import BudgetBreakdown from './BudgetBreakdown';
import Collapsible from './Collapsible';

// ════════════════════════════════════════════════════════════════
// 📋 نوع‌ها
// ════════════════════════════════════════════════════════════════

type Specs = {
  cores?: number;
  threads?: number;
  vram?: number;
  socket?: string;
  ramType?: string;
  capacity?: number;
  wattage?: number;
  frequency?: number;
  size?: number;
  isNVMe?: boolean;
  tier?: string;
  brand?: string;
  tdp?: number;
  formFactor?: string;
  tdpRating?: number;
  moduleCount?: number;
  moduleSize?: number;
  totalModules?: number;
  usedRamSlots?: number;
  ramSlots?: number;
  m2Slots?: number;
  sataPorts?: number;
  type?: string;
  chipset?: string;
  rating?: string;
  rgb?: boolean;
  [k: string]: any;
};

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
  quantityLabel?: string;
  alternatives: Part[];
  pickReason?: string;
};

type CompatibilityIssue = {
  severity: 'error' | 'warning' | 'info' | 'success';
  message: string;
  reason?: string;
  solution?: string;
  category?: string;
  blocking?: boolean;
  affectedParts?: string[];
};

type CompatibilityMatrix = {
  buildable: boolean;
  score: number;
  status: 'compatible' | 'warning' | 'incompatible' | 'unavailable';
  errors: CompatibilityIssue[];
  warnings: CompatibilityIssue[];
  info: CompatibilityIssue[];
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

  type ResolutionAction = {
  type: 'replace' | 'remove' | 'keep' | 'suggest';
  current?: Part;
  suggested?: any;
  reason: string;
  userMessage: string;
  resolved: boolean;
  removedPartId?: string | number;
  newPartId?: string | number;
};

  type SuggestedPart = {
  name: string;
  model: string;
  reason: string;
  socket?: string;
  ramType?: string;
  estimatedPrice?: string;
  availability: 'in_stock' | 'coming_soon' | 'check_website';
};

  type Resolution = {
  resolved: boolean;
  actionsCount: number;
  removedCount: number;
  suggestionCount: number;
  actions: ResolutionAction[];
  removedParts: Array<{
    id: string | number;
    name: string;
    category: string;
    categoryLabel: string;
    reason: string;
  }>;
  suggestions: SuggestedPart[];
  messages: Array<{
    severity: 'error' | 'warning' | 'info' | 'success';
    text: string;
  }>;
};

  type Result = {
  ok: boolean;
  useCaseLabel: string;
  budget: number;
  reason: string;
  details?: string[];
  parts: Part[];
  summary: Summary;
  tier: string;
  compatibilityScore: number;
  compatibilityIssues?: CompatibilityIssue[];
  compatibilityWarnings?: CompatibilityIssue[];
  compatibilityMatrix?: CompatibilityMatrix;
  compatibilityDetails?: any;
  description: string;
  recommendation?: {
    overallScore: number;
    compatibilityNotes: string[];
    upgradeSuggestions: string[];
    performanceEstimates: Record<string, string>;
    estimatedFps?: Record<string, string>;
  };
  partsStatus?: {
    cpu: string;
    gpu: string;
    ram: string;
    motherboard: string;
  };
  unavailableMessages?: string[];
  resolution?: Resolution;
  debug?: any;
  error?: string;
  ai?: {
    name: string;
    tagline: string;
    emoji: string;
    color: string;
    providerId: string;
    providerName: string;
    model: string;
    free: boolean;
  };
};

// ════════════════════════════════════════════════════════════════
// 📋 ثابت‌ها
// ════════════════════════════════════════════════════════════════

const USE_CASES = [
  { key: 'gaming', label: 'گیمینگ', desc: 'اجرای روان بازی‌های سنگین', icon: 'gaming' },
  { key: 'office', label: 'اداری', desc: 'کارهای روزمره و آفیس', icon: 'office' },
  { key: 'editing', label: 'ادیت و رندر', desc: 'ادیت ویدیو و طراحی', icon: 'editing' },
  { key: 'streaming', label: 'استریم', desc: 'استریم و تولید محتوا', icon: 'streaming' },
  { key: 'custom', label: 'دلخواه', desc: 'کارت رو خودت توضیح بده', icon: 'custom' },
];

const BUDGET_PRESETS = [
  { label: '۱۵ میلیون', value: 15_000_000 },
  { label: '۲۵ میلیون', value: 25_000_000 },
  { label: '۳۵ میلیون', value: 35_000_000 },
  { label: '۵۰ میلیون', value: 50_000_000 },
  { label: '۸۰ میلیون', value: 80_000_000 },
  { label: '۱۲۰ میلیون', value: 120_000_000 },
  { label: '۱۵۰ میلیون', value: 150_000_000 },
  { label: '۲۰۰ میلیون', value: 200_000_000 },
];

const toman = (n: number) => `${Math.round(n).toLocaleString('fa-IR')} تومان`;
const shortToman = (n: number) => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} میلیارد`;
  if (n >= 1_000_000) return `${Math.round(n / 1_000_000).toLocaleString('fa-IR')} میلیون`;
  return `${n.toLocaleString('fa-IR')}`;
};

const makeSummary = (items: Part[]): Summary => {
  const qty = (p: Part) => Math.max(1, Number(p.quantity || 1));
  const totalBefore = items.reduce((sum, p) => sum + (Number(p.price) || 0) * qty(p), 0);
  const totalAfter = items.reduce((sum, p) => sum + (Number(p.finalPrice) || 0) * qty(p), 0);
  const totalSaving = Math.max(0, totalBefore - totalAfter);
  const mandatory = items.filter(p => !p.isOptional);
  const optional = items.filter(p => p.isOptional);

  return {
    totalBefore,
    totalAfter,
    totalSaving,
    savingPercent: totalBefore > 0 ? Math.round((totalSaving / totalBefore) * 100) : 0,
    itemCount: items.reduce((sum, p) => sum + qty(p), 0),
    mandatoryCount: mandatory.reduce((sum, p) => sum + qty(p), 0),
    optionalCount: optional.reduce((sum, p) => sum + qty(p), 0),
    totalTdp: items.reduce((sum, p) => sum + (['cpu', 'gpu'].includes(p.category) ? Number(p.specs?.tdp || 0) * qty(p) : 0), 0),
  };
};

const isRealPart = (value: any): value is Part =>
  Boolean(value && typeof value === 'object' && value.id !== undefined && value.name && value.category && Number(value.finalPrice) > 0);

const partQty = (part?: Part) => Math.max(1, Number(part?.quantity || 1));
const ramModuleCount = (part?: Part) => Math.max(1, Number(part?.specs?.moduleCount || (String(part?.specs?.channel || '').toLowerCase() === 'dual' ? 2 : 1)));
const storageSizeGb = (part?: Part) => Number(part?.specs?.size || 0) || Number(part?.specs?.sizeTB || 0) * 1000 || 0;
const cleanPublicText = (text?: string) => String(text || '').replace(/[✅❌⚠️💡⏳🎮⭐📦🚫ℹ️💾⚡🔌🔥🚀🧠🏷️📐📡🌈💧🌪️🏅🔧🗑️💰❄️✨🌬️🏢🎬📹🎨🏆📌]/gu, '').replace(/\s+/g, ' ').trim();

// ════════════════════════════════════════════════════════════════
// 💾 ذخیره‌سازی محلی ساخت (جلوگیری از از دست رفتن با رفرش)
// ════════════════════════════════════════════════════════════════
const ASSEMBLE_STORAGE_KEY = 'assemble_build_v1';
const loadSavedBuild = (): any => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(ASSEMBLE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};
const saveSavedBuild = (data: any) => {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(ASSEMBLE_STORAGE_KEY, JSON.stringify(data)); } catch { /* ظرفیت پر یا غیرقابل سریال */ }
};
const clearSavedBuild = () => {
  if (typeof window === 'undefined') return;
  try { window.localStorage.removeItem(ASSEMBLE_STORAGE_KEY); } catch {}
};

type SmartSuggestion = {
  id: string;
  mode: 'replace' | 'add' | 'quantity';
  current?: Part;
  suggested: Part;
  title: string;
  reason: string;
  quantityDelta?: number;
};

const partPowerScore = (part: Part) => {
  const s = part.specs || {};
  let score = Number(part.confidence || 50);
  if (part.category === 'ram') score += Number(s.capacity || 0) * 2 + (Number(s.frequency || 0) / 1000) + (s.ramType === 'DDR5' ? 8 : 0);
  if (part.category === 'storage') score += storageSizeGb(part) / 120 + (s.isNVMe ? 18 : 0) + (s.pcie === '5.0' ? 8 : s.pcie === '4.0' ? 5 : 0);
  if (part.category === 'gpu') score += Number(s.vram || 0) * 7 + (s.tier === 'ultra' ? 35 : s.tier === 'high' ? 22 : 0);
  if (part.category === 'cpu') score += Number(s.cores || 0) * 6 + Number(s.threads || 0) * 2;
  if (part.category === 'motherboard') score += Number(s.ramSlots || 4) * 4 + Number(s.m2Slots || 2) * 5;
  if (part.category === 'psu') score += Number(s.wattage || 0) / 30;
  return score;
};

const buildSmartSuggestions = (items: Part[], budget: number): SmartSuggestion[] => {
  const currentTotal = makeSummary(items).totalAfter;
  const remaining = Math.max(0, budget - currentTotal);
  const suggestions: SmartSuggestion[] = [];
  const seen = new Set<string>();
  const mb = items.find(p => p.category === 'motherboard');
  const ram = items.find(p => p.category === 'ram');
  const storages = items.filter(p => p.category === 'storage');

  const ramSlots = Number(mb?.specs?.ramSlots || (String(mb?.specs?.formFactor || '').toLowerCase().includes('mini') ? 2 : 4));
  const usedRamSlots = ram ? ramModuleCount(ram) * partQty(ram) : 0;
  const ramGb = ram ? Number(ram.specs?.capacity || 0) * partQty(ram) : 0;
  const targetRam = budget >= 160_000_000 ? 64 : budget >= 70_000_000 ? 32 : 16;

  if (ram && usedRamSlots < ramSlots && ram.finalPrice <= Math.max(remaining, budget * 0.30)) {
    const nextQty = partQty(ram) + 1;
    const nextGb = Number(ram.specs?.capacity || 0) * nextQty;
    if (nextGb > ramGb && (ramGb < targetRam || remaining >= ram.finalPrice)) {
      suggestions.push({
        id: `qty-ram-${ram.id}`,
        mode: 'quantity',
        current: ram,
        suggested: ram,
        quantityDelta: 1,
        title: 'افزودن کیت RAM',
        reason: `اسلات RAM آزاد است و ظرفیت سیستم به ${nextGb}GB می‌رسد.`,
      });
      seen.add(`qty-${ram.id}`);
    }
  }

  const m2Slots = Number(mb?.specs?.m2Slots || 0) || (['Z790', 'Z890', 'X670E', 'X870E'].includes(String(mb?.specs?.chipset || '').toUpperCase()) ? 4 : 2);
  const usedM2 = storages.filter(s => s.specs?.formFactor === 'M.2' || s.specs?.isNVMe).reduce((sum, s) => sum + partQty(s), 0);
  const primaryStorage = storages.find(s => (s.specs?.formFactor === 'M.2' || s.specs?.isNVMe) && s.inStock && s.finalPrice > 0) || storages[0];
  if (primaryStorage && usedM2 < m2Slots && primaryStorage.finalPrice <= Math.max(remaining, budget * 0.30)) {
    suggestions.push({
      id: `qty-storage-${primaryStorage.id}`,
      mode: 'quantity',
      current: primaryStorage,
      suggested: primaryStorage,
      quantityDelta: 1,
      title: 'افزودن SSD',
      reason: `اسلات M.2 آزاد است و ظرفیت ذخیره‌سازی بدون تغییر قطعات اصلی بیشتر می‌شود.`,
    });
    seen.add(`qty-${primaryStorage.id}`);
  }

  for (const part of items) {
    const alts = (part.alternatives || [])
      .filter(alt => alt?.inStock !== false && Number(alt.finalPrice || 0) > 0)
      .filter(alt => !items.some(p => String(p.id) === String(alt.id)))
      .map(alt => ({ alt, delta: Number(alt.finalPrice || 0) - Number(part.finalPrice || 0), gain: partPowerScore(alt) - partPowerScore(part) }))
      .filter(x => x.gain > 4 || ['ram', 'storage', 'motherboard', 'psu'].includes(part.category))
      .filter(x => x.delta <= Math.max(remaining, budget * 0.18))
      .sort((a, b) => (b.gain - a.gain) || (a.delta - b.delta));

    const best = alts[0];
    if (!best) continue;
    const mode: 'replace' | 'add' = ['storage', 'case_fan'].includes(part.category) && best.alt.finalPrice <= Math.max(remaining, budget * 0.12) ? 'add' : 'replace';
    const key = `${mode}-${part.id}-${best.alt.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    suggestions.push({
      id: key,
      mode,
      current: part,
      suggested: best.alt,
      title: mode === 'add' ? `افزودن ${best.alt.categoryLabel}` : `ارتقای ${part.categoryLabel}`,
      reason: mode === 'add'
        ? `با سیستم فعلی هماهنگ است و ظرفیت یا کارایی را بدون حذف قطعه افزایش می‌دهد.`
        : `گزینه هماهنگ‌تر با همین سیستم است و امتیاز فنی بهتری دارد.`,
    });
    if (suggestions.length >= 5) break;
  }

  return suggestions.slice(0, 5);
};

const buildInsights = (items: Part[], budget: number, useCase: string) => {
  const mb = items.find(p => p.category === 'motherboard');
  const ram = items.find(p => p.category === 'ram');
  const storages = items.filter(p => p.category === 'storage');
  const gpu = items.find(p => p.category === 'gpu');
  const cpu = items.find(p => p.category === 'cpu');
  const psu = items.find(p => p.category === 'psu');

  const ramSlots = Number(mb?.specs?.ramSlots || (String(mb?.specs?.formFactor || '').toLowerCase().includes('mini') ? 2 : 4));
  const usedRamSlots = ram ? ramModuleCount(ram) * partQty(ram) : 0;
  const ramGb = ram ? Number(ram.specs?.capacity || 0) * partQty(ram) : 0;
  const targetRam = useCase === 'editing' ? (budget >= 140_000_000 ? 64 : 32) : ['gaming', 'streaming'].includes(useCase) ? (budget >= 70_000_000 ? 32 : 16) : 16;
  const m2Slots = Number(mb?.specs?.m2Slots || 0) || (['Z790', 'Z890', 'X670E', 'X870E'].includes(String(mb?.specs?.chipset || '').toUpperCase()) ? 4 : 2);
  const usedM2 = storages.filter(s => s.specs?.formFactor === 'M.2' || s.specs?.isNVMe).reduce((sum, s) => sum + partQty(s), 0);
  const totalStorage = storages.reduce((sum, s) => sum + storageSizeGb(s) * partQty(s), 0);
  const totalWatt = Number(cpu?.specs?.tdp || 95) + Number(gpu?.specs?.tdp || 150) + 100;
  const psuHeadroom = psu?.specs?.wattage ? Math.max(0, Math.round(((Number(psu.specs.wattage) - totalWatt) / totalWatt) * 100)) : null;

  return [
    { icon: 'RAM', title: 'RAM هوشمند', value: ram ? `${ramGb}GB` : '—', meta: ram ? `${usedRamSlots}/${ramSlots} اسلات · هدف ${targetRam}GB` : 'در انتظار انتخاب', tone: ramGb >= targetRam ? 'good' : 'warn' },
    { icon: 'M.2', title: 'SSD / M.2', value: totalStorage ? `${(totalStorage / 1000).toLocaleString('fa-IR', { maximumFractionDigits: 1 })}TB` : '—', meta: `${usedM2}/${m2Slots} اسلات M.2 استفاده شده`, tone: usedM2 <= m2Slots ? 'good' : 'bad' },
    { icon: 'PSU', title: 'حاشیه پاور', value: psuHeadroom !== null ? `${psuHeadroom}%` : '—', meta: psu ? `${psu.specs?.wattage || '—'}W انتخاب شده` : 'پاور انتخاب نشده', tone: psuHeadroom === null ? 'warn' : psuHeadroom >= 25 ? 'good' : 'warn' },
    { icon: 'CPU', title: 'توازن CPU/GPU', value: gpu?.specs?.vram ? `${gpu.specs.vram}GB VRAM` : 'تحلیل', meta: cpu?.specs?.cores ? `${cpu.specs.cores} هسته CPU` : 'بررسی گلوگاه', tone: 'info' },
  ];
};

const LOADING_STEPS = [
  'بررسی دقیق کاربری و بودجه…',
  'اتصال به API آفلند و دریافت موجودی…',
  'جستجوی قطعات موجود و قابل خرید…',
  'محاسبهٔ سازگاری فنی قطعات…',
  'انتخاب بهینه‌ترین ترکیب حرفه‌ای…',
  'تولید تحلیل، قیمت و پیشنهاد ارتقاء…',
];

const TIER_LABELS: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  ultra: { label: 'رده‌بالا', color: '#ffd700', bg: 'rgba(255, 215, 0, 0.15)', icon: 'ultra' },
  high: { label: 'قوی', color: '#386bf9', bg: 'rgba(56, 107, 249, 0.15)', icon: 'high' },
  medium: { label: 'متعادل', color: '#059669', bg: 'rgba(5, 150, 105, 0.15)', icon: 'medium' },
  entry: { label: 'ابتدایی', color: '#6b7790', bg: 'rgba(107, 119, 144, 0.15)', icon: 'entry' },
};

const STATUS_META: Record<string, { label: string; emoji: string; color: string; bg: string; description: string }> = {
  compatible: {
    label: 'سازگار', emoji: '', color: '#059669',
    bg: 'rgba(5, 150, 105, 0.15)',
    description: 'همهٔ قطعات کاملاً سازگار هستند. سیستم آمادهٔ اسمبل است!',
  },
  warning: {
    label: 'هشدار', emoji: '', color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.15)',
    description: 'سیستم قابل اسمبل است ولی برخی قطعات بهینه نیستند.',
  },
  incompatible: {
    label: 'ناسازگار', emoji: '', color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.15)',
    description: 'برخی قطعات با هم سازگار نیستند. باید جایگزین شوند.',
  },
  unavailable: {
    label: 'موجود نیست', emoji: '', color: '#6b7790',
    bg: 'rgba(107, 119, 144, 0.15)',
    description: 'برخی قطعات در حال حاضر موجود نیستند. به زودی موجود می‌شوند.',
  },
};

// ════════════════════════════════════════════════════════════════
// 🧩 کامپوننت‌های کمکی
// ════════════════════════════════════════════════════════════════

const SpecBadge = ({ label, value, color }: { label: string; value: any; color?: string }) => {
  if (value === undefined || value === null || value === false || value === '') return null;
  return (
    <span className="asm__spec-badge" title={label} style={color ? { color, borderColor: color } : undefined}>
      {value}
    </span>
  );
};

const ConfidenceBadge = ({ confidence }: { confidence: number }) => {
  const color = confidence >= 90 ? '#059669' : confidence >= 75 ? '#386bf9' : '#f59e0b';
  const text = confidence >= 90 ? 'تأییدشده' : confidence >= 75 ? 'بالا' : 'متوسط';
  return (
    <span className="asm__confidence-badge" style={{ color, borderColor: color }} title={`تشخیص: ${confidence}% - ${text}`}>
      {confidence}%
    </span>
  );
};

const getSpecList = (part: Part): Array<{ label: string; value: string; icon: string }> => {
  const list: Array<{ label: string; value: string; icon: string }> = [];
  const s = part.specs;

  if (part.category === 'cpu') {
    if (s.cores) list.push({ label: 'هسته', value: `${s.cores} هسته`, icon: 'PWR' });
    if (s.threads) list.push({ label: 'رشته', value: `${s.threads} رشته`, icon: 'THR' });
    if (s.socket) list.push({ label: 'سوکت', value: s.socket, icon: 'SOC' });
    if (s.tdp) list.push({ label: 'توان', value: `${s.tdp}W`, icon: 'TDP' });
    if (s.frequency) list.push({ label: 'بوست', value: `${s.frequency}GHz`, icon: 'SPD' });
  } else if (part.category === 'gpu') {
    if (s.vram) list.push({ label: 'VRAM', value: `${s.vram}GB`, icon: 'VRAM' });
    if (s.tdp) list.push({ label: 'توان', value: `${s.tdp}W`, icon: 'TDP' });
    if (s.brand) list.push({ label: 'برند', value: s.brand, icon: 'BR' });
  } else if (part.category === 'motherboard') {
    if (s.socket) list.push({ label: 'سوکت', value: s.socket, icon: 'SOC' });
    if (s.chipset) list.push({ label: 'چیپ‌ست', value: s.chipset, icon: 'CFG' });
    if (s.ramType) list.push({ label: 'رم', value: s.ramType, icon: 'MEM' });
    if (s.formFactor) list.push({ label: 'فرم‌فکتور', value: s.formFactor, icon: 'FF' });
    if (s.wifi) list.push({ label: 'WiFi', value: 'دارد', icon: 'WIFI' });
  } else if (part.category === 'ram') {
    if (s.capacity) list.push({ label: 'ظرفیت', value: `${s.capacity}GB`, icon: 'MEM' });
    if (s.ramType) list.push({ label: 'نوع', value: s.ramType, icon: 'CFG' });
    if (s.frequency) list.push({ label: 'فرکانس', value: `${s.frequency}MHz`, icon: 'PWR' });
    if (s.rgb) list.push({ label: 'نورپردازی', value: 'RGB', icon: 'RGB' });
  } else if (part.category === 'storage') {
    if (s.size) list.push({ label: 'ظرفیت', value: s.sizeTB ? `${s.sizeTB}TB` : `${s.size}GB`, icon: 'MEM' });
    if (s.isNVMe) list.push({ label: 'نوع', value: 'NVMe M.2', icon: 'PWR' });
    if (s.formFactor) list.push({ label: 'فرم', value: s.formFactor, icon: 'FF' });
    if (s.pcie) list.push({ label: 'PCIe', value: s.pcie, icon: 'SPD' });
  } else if (part.category === 'psu') {
    if (s.wattage) list.push({ label: 'توان', value: `${s.wattage}W`, icon: 'PWR' });
    if (s.rating) list.push({ label: 'گواهی', value: s.rating, icon: 'CERT' });
    if (s.modular) list.push({ label: 'ماژولار', value: s.modular, icon: 'CFG' });
    if (s.atx) list.push({ label: 'ATX', value: s.atx, icon: 'SOC' });
  } else if (part.category === 'case') {
    if (s.formFactor) list.push({ label: 'فرم‌فکتور', value: s.formFactor, icon: 'FF' });
    if (s.rgb) list.push({ label: 'نورپردازی', value: 'RGB', icon: 'RGB' });
  } else if (part.category === 'cooler') {
    if (s.type === 'aio') list.push({ label: 'نوع', value: `AIO ${s.size}mm`, icon: 'AIO' });
    else list.push({ label: 'نوع', value: 'Air Cooler', icon: 'FAN' });
    if (s.tdpRating) list.push({ label: 'تا توان', value: `${s.tdpRating}W`, icon: 'TDP' });
  } else if (part.category === 'case_fan') {
    if (s.size) list.push({ label: 'سایز', value: `${s.size}mm`, icon: 'FF' });
    if (s.rgb) list.push({ label: 'نور', value: 'RGB', icon: 'RGB' });
  }

  return list;
};

const PartCard = ({
  part,
  onSelectAlternative,
  expanded,
  onToggle,
  onRemoveOptional,
  blocked,
  unavailable,
  blockingReason,
}: {
  part: Part;
  onSelectAlternative?: (alt: Part) => void;
  expanded: boolean;
  onToggle: () => void;
  onRemoveOptional?: () => void;
  blocked?: boolean;
  unavailable?: boolean;
  blockingReason?: string;
}) => {
  const Icon = PART_ICONS[part.category] || CpuIcon;
  const specList = getSpecList(part);
  const isDisabled = blocked || unavailable;

  return (
    <div className={`asm__part-card ${part.isOptional ? 'asm__part-card--optional' : ''} ${blocked ? 'asm__part-card--blocked' : ''} ${unavailable ? 'asm__part-card--unavailable' : ''}`}>
      {blocked && (
        <div className="asm__part-blocked-banner">
          این قطعه با بقیهٔ سیستم سازگار نیست — انتخاب غیرفعال است
        </div>
      )}
      {unavailable && (
        <div className="asm__part-unavailable-banner">
          این قطعه الان موجود نیست — به زودی موجود می‌شود
        </div>
      )}
      <div className="asm__part-main">
        <div className="asm__part-cat">
          <span className="asm__part-cat-ic"><Icon /></span>
          <div>
            <span className="asm__part-cat-label">{part.categoryLabel}</span>
            {part.isOptional ? (
              <span className="asm__part-optional-tag">اختیاری</span>
            ) : (
              <span className="asm__part-mandatory-tag">اجباری</span>
            )}
          </div>
        </div>

        <div className="asm__part-media">
          {part.image && !isDisabled ? (
            <div className="asm__part-img-wrap">
              <img
                className="asm__part-img"
                src={part.image}
                alt={part.name}
                loading="lazy"
                onError={e => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const fb = (e.target as HTMLImageElement).parentElement?.querySelector('.asm__part-ph') as HTMLElement;
                  if (fb) fb.style.display = 'flex';
                }}
              />
              <span className="asm__part-ph" style={{ display: 'none' }}><Icon /></span>
            </div>
          ) : (
            <span className={`asm__part-img asm__part-ph ${isDisabled ? 'asm__part-ph--disabled' : ''}`}><Icon /></span>
          )}
          {part.discountPercent > 0 && !isDisabled && (
            <span className="asm__part-badge">{part.discountPercent}% تخفیف</span>
          )}
          {isDisabled && <span className="asm__part-badge asm__part-badge--gray">{blocked ? 'ناسازگار' : 'ناموجود'}</span>}
        </div>

        <div className="asm__part-info">
          {part.brand && <div className="asm__part-brand">{part.brand}</div>}
          <div className="asm__part-name">{part.name}</div>
          {part.shortSpec && <div className="asm__part-spec">{part.shortSpec}</div>}

          {specList.length > 0 && (
            <div className="asm__part-specs-list">
              {specList.map((spec, i) => (
                <span key={i} className="asm__part-spec-tag" title={spec.label}>
                  <span style={{ marginLeft: 4 }}>{spec.icon}</span>
                  {spec.value}
                </span>
              ))}
              <ConfidenceBadge confidence={part.confidence} />
            </div>
          )}

          {blockingReason && (
            <div className="asm__part-block-reason">
              {cleanPublicText(blockingReason)}
            </div>
          )}

          {part.pickReason && !isDisabled && (
            <div className="asm__part-pickreason" title="چرا این قطعه انتخاب شد؟">
              {part.pickReason}
            </div>
          )}
        </div>

        <div className="asm__part-prices">
          {!isDisabled && part.discountPercent > 0 && (
            <div className="asm__part-old">{toman(part.price)}</div>
          )}
          <div className={`asm__part-price ${isDisabled ? 'asm__part-price--disabled' : ''}`}>
            {isDisabled ? '—' : toman(part.finalPrice)}
          </div>
          {!isDisabled && part.warranty && (
            <div className="asm__part-warranty-mini">
              <ShieldIcon /> {part.warranty}
            </div>
          )}
        </div>

        <div className="asm__part-actions">
          <a className={`asm__icon-link ${isDisabled ? 'asm__icon-link--disabled' : ''}`}
             href={part.url}
             target="_blank"
             rel="noopener noreferrer"
             title={isDisabled ? 'غیرفعال' : 'مشاهده محصول'}>
            <EyeIcon />
          </a>
          {!isDisabled && part.alternatives && part.alternatives.length > 0 && (
            <button className="asm__icon-btn" onClick={onToggle} title={expanded ? 'پنهان کردن' : `${part.alternatives.length} جایگزین`}>
              {expanded ? <CollapseIcon /> : <ExpandIcon />}
            </button>
          )}
          {!isDisabled && part.isOptional && onRemoveOptional && (
            <button className="asm__icon-btn asm__icon-btn--remove" onClick={onRemoveOptional} title="حذف">
              ×
            </button>
          )}
        </div>
      </div>

      {!isDisabled && expanded && part.alternatives && part.alternatives.length > 0 && (
        <div className="asm__part-alternatives">
          <div className="asm__alt-title">
            {part.alternatives.length} جایگزین سازگار — برای جایگزینی انتخاب کنید:
          </div>
          <div className="asm__alt-list">
            {part.alternatives.map((alt, i) => (
              <div key={`${alt.id}-${i}`} className="asm__alt-item">
                <div className="asm__alt-name-wrap">
                  <span className="asm__alt-name">{alt.name}</span>
                  {alt.shortSpec && <span className="asm__alt-spec">{alt.shortSpec}</span>}
                </div>
                <span className="asm__alt-confidence">{alt.confidence}%</span>
                <span className="asm__alt-price">{toman(alt.finalPrice)}</span>
                <button className="asm__alt-select" onClick={() => onSelectAlternative?.(alt)}>
                  انتخاب
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// 🧩 پنل سازگاری حرفه‌ای v3
// ════════════════════════════════════════════════════════════════

const CompatibilityPanelV3 = ({
  matrix,
  unavailableMessages,
  parts,
}: {
  matrix: CompatibilityMatrix;
  unavailableMessages?: string[];
  parts?: Part[];
}) => {
  const meta = STATUS_META[matrix.status] || STATUS_META.warning;
  const nameById = useMemo(() => {
    const m = new Map<string, string>();
    (parts || []).forEach(p => m.set(String(p.id), p.name));
    return m;
  }, [parts]);

  return (
    <div className="asm__compat-panel-v3">
      {/* پیام‌های "موجود نیست" */}
      {unavailableMessages && unavailableMessages.length > 0 && (
        <div className="asm__unavailable-banner">
          <div className="asm__unavailable-banner-icon"><WarningIcon /></div>
          <div className="asm__unavailable-banner-content">
            <div className="asm__unavailable-banner-title">برخی قطعات الان موجود نیستن</div>
            <ul className="asm__unavailable-banner-list">
              {unavailableMessages.map((msg, i) => (
                <li key={i}>{cleanPublicText(msg)}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* هدر */}
      <div className="asm__compat-v3-head" style={{ background: meta.bg, borderColor: meta.color }}>
        <div className="asm__compat-v3-score-circle" style={{ borderColor: meta.color, color: meta.color }}>
          <span className="asm__compat-v3-score-num">{matrix.score}</span>
          <span className="asm__compat-v3-score-max">/100</span>
        </div>
        <div className="asm__compat-v3-status">
          <div className="asm__compat-v3-status-label" style={{ color: meta.color }}>
            {meta.label}
          </div>
          <div className="asm__compat-v3-status-desc">{meta.description}</div>
        </div>
      </div>

      {/* خطاها (بحرانی) */}
      {matrix.errors.length > 0 && (
        <div className="asm__compat-v3-section asm__compat-v3-section--error">
          <div className="asm__compat-v3-section-title">
            مشکلات بحرانی ({matrix.errors.length})
          </div>
          {matrix.errors.map((issue, i) => (
            <div key={i} className="asm__compat-v3-row">
              <div className="asm__compat-v3-row-header">
                <span className="asm__compat-v3-row-icon"><WarningIcon /></span>
                <span className="asm__compat-v3-row-message">{cleanPublicText(issue.message)}</span>
              </div>
              {issue.reason && (
                <div className="asm__compat-v3-row-reason">
                  دلیل: {cleanPublicText(issue.reason)}
                </div>
              )}
              {issue.solution && (
                <div className="asm__compat-v3-row-solution">
                  راه‌حل: {cleanPublicText(issue.solution)}
                </div>
              )}
              {issue.affectedParts && issue.affectedParts.length > 0 && (
                <div className="asm__compat-v3-row-affected">
                  {issue.affectedParts.map(id => (
                    <span key={id} className="asm__compat-v3-chip">{cleanPublicText(nameById.get(String(id)) || String(id))}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* هشدارها */}
      {matrix.warnings.length > 0 && (
        <div className="asm__compat-v3-section asm__compat-v3-section--warning">
          <div className="asm__compat-v3-section-title">
            هشدارها ({matrix.warnings.length})
          </div>
          {matrix.warnings.map((issue, i) => (
            <div key={i} className="asm__compat-v3-row">
              <div className="asm__compat-v3-row-header">
                <span className="asm__compat-v3-row-icon"><InfoIcon /></span>
                <span className="asm__compat-v3-row-message">{cleanPublicText(issue.message)}</span>
              </div>
              {issue.reason && (
                <div className="asm__compat-v3-row-reason">{cleanPublicText(issue.reason)}</div>
              )}
              {issue.solution && (
                <div className="asm__compat-v3-row-solution">{cleanPublicText(issue.solution)}</div>
              )}
              {issue.affectedParts && issue.affectedParts.length > 0 && (
                <div className="asm__compat-v3-row-affected">
                  {issue.affectedParts.map(id => (
                    <span key={id} className="asm__compat-v3-chip">{cleanPublicText(nameById.get(String(id)) || String(id))}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* اطلاعات */}
      {matrix.info.length > 0 && (
        <div className="asm__compat-v3-section asm__compat-v3-section--info">
          <div className="asm__compat-v3-section-title">نکات ({matrix.info.length})</div>
          {matrix.info.map((issue, i) => (
            <div key={i} className="asm__compat-v3-row">
              <span className="asm__compat-v3-row-icon"><InfoIcon /></span>
              <span className="asm__compat-v3-row-message">{cleanPublicText(issue.message)}</span>
            </div>
          ))}
        </div>
      )}

      {/* همه چی سازگار */}
      {matrix.errors.length === 0 && matrix.warnings.length === 0 && matrix.status === 'compatible' && (
        <div className="asm__compat-v3-section asm__compat-v3-section--ok">
          <div className="asm__compat-v3-row">
            <span className="asm__compat-v3-row-icon"><CheckIcon /></span>
            <span className="asm__compat-v3-row-message">
              همهٔ قوانین سازگاری بررسی شدند و سیستم آمادهٔ اسمبل است.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// 🧩 کامپوننت اصلی
// ════════════════════════════════════════════════════════════════

export default function AssembleWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [useCase, setUseCase] = useState('gaming');
  const [customDesc, setCustomDesc] = useState('');
  const [budget, setBudget] = useState(35_000_000);
  const [note, setNote] = useState('');
  const [includeOptional, setIncludeOptional] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [bought, setBought] = useState(false);
  const [showDesc, setShowDesc] = useState(false);
  const [showCompat, setShowCompat] = useState(true);
  const [showFps, setShowFps] = useState(true);
  const [expandedParts, setExpandedParts] = useState<Set<string>>(new Set());
  const [range, setRange] = useState<{ min: number; max: number; recommended: number } | null>(null);
  const [rangeLoading, setRangeLoading] = useState(false);
  const [parts, setParts] = useState<Part[]>([]);
  const [blockedPartIds, setBlockedPartIds] = useState<Set<string>>(new Set());
  const [unavailablePartIds, setUnavailablePartIds] = useState<Set<string>>(new Set());
  const [aiAnalysis, setAiAnalysis] = useState<{
    enabled: boolean;
    text: string;
    provider?: string;
    loading: boolean;
    name?: string;
    tagline?: string;
    emoji?: string;
    color?: string;
  }>({ enabled: false, text: '', loading: false });

  // ═════ استیت‌های جدید نسخهٔ Ultimate AI Master ═════
  const [assembleTheme, setAssembleTheme] = useState<AssembleTheme>('stealth');
  const [invoiceOpen, setInvoiceOpen] = useState<boolean>(false);
  const [resultTab, setResultTab] = useState<'parts' | 'analysis'>('parts');

  const { mutate: addBulk, isPending: buying } = useAddBulkCart();

  // ═════ وضعیت ساخت ذخیره‌شده (localStorage) ═════
  const [savedBuild, setSavedBuild] = useState<any>(null);

  useEffect(() => {
    setSavedBuild(loadSavedBuild());
  }, []);

  // ذخیرهٔ خودکار ساخت هنگام تغییر در نتایج (فقط در مرحلهٔ سیستم)
  const persistBuild = useCallback(() => {
    if (step !== 3 || !parts.length || !result) return;
    saveSavedBuild({
      savedAt: Date.now(),
      useCase, budget, includeOptional,
      parts,
      result: { ...result, parts: [] }, // جلوگیری از تکرار آرایهٔ parts
      blocked: Array.from(blockedPartIds),
      unavailable: Array.from(unavailablePartIds),
    });
  }, [step, parts, result, blockedPartIds, unavailablePartIds, useCase, budget, includeOptional]);

  useEffect(() => { persistBuild(); }, [persistBuild]);

  const restoreBuild = () => {
    const b = savedBuild;
    if (!b) return;
    setResult(b.result || null);
    setParts(b.parts || []);
    setBlockedPartIds(new Set(b.blocked || []));
    setUnavailablePartIds(new Set(b.unavailable || []));
    setUseCase(b.useCase || 'gaming');
    setBudget(b.budget || 0);
    setIncludeOptional(b.includeOptional ?? true);
    setExpandedParts(new Set());
    setAiAnalysis({ enabled: false, text: '', loading: false });
    setStep(3);
  };

  const discardSaved = () => {
    clearSavedBuild();
    setSavedBuild(null);
  };

  useEffect(() => {
    if (!loading) return;
    setLoadStep(0);
    const iv = setInterval(() => setLoadStep(s => s < LOADING_STEPS.length - 1 ? s + 1 : s), 1500);
    return () => clearInterval(iv);
  }, [loading]);

  useEffect(() => {
    if (step !== 2) return;
    let cancelled = false;
    setRangeLoading(true);
    fetch(`/api/assemble/budget-range?useCase=${encodeURIComponent(useCase === 'custom' ? 'gaming' : useCase)}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled || !data) return;
        const min = Number(data.min) || 10_000_000;
        const max = Number(data.max) || 200_000_000;
        const recommended = Number(data.recommended) || Math.round((min + max) / 2);
        setRange({ min, max, recommended });
        setBudget(b => b < min || b > max ? recommended : b);
      })
      .catch(() => setRange({ min: 10_000_000, max: 200_000_000, recommended: 35_000_000 }))
      .finally(() => { if (!cancelled) setRangeLoading(false); });
    return () => { cancelled = true; };
  }, [step, useCase]);

  const build = async () => {
    setLoading(true);
    setResult(null);
    setBought(false);
    setShowDesc(false);
    setParts([]);
    setBlockedPartIds(new Set());
    setUnavailablePartIds(new Set());
    setExpandedParts(new Set());
    setAiAnalysis({ enabled: false, text: '', loading: true });
    setStep(3);
    try {
      const res = await fetch('/api/assemble', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useCase, budget, note, customDesc, includeOptional, verifyStock: true }),
      });
      const data = await res.json() as Result;
      setResult(data);
      if (data.parts) setParts(data.parts);
      if (data.compatibilityMatrix) {
        setBlockedPartIds(new Set(data.compatibilityMatrix.blockedPartIds));
        setUnavailablePartIds(new Set(data.compatibilityMatrix.unavailablePartIds));
      }

      // ═══════ فراخوانی AI تحلیل (موازی) ═══════
      if (data.ok && data.parts?.length) {
        fetch('/api/assemble/ai-analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            useCase: customDesc ? 'custom' : useCase,
            budget,
            useCaseLabel: data.useCaseLabel,
            compatibilityScore: data.compatibilityScore,
            parts: data.parts.map(p => ({
              category: p.category,
              categoryLabel: p.categoryLabel,
              name: p.name,
              shortSpec: p.shortSpec,
              specs: p.specs,
              quantity: p.quantity,
              quantityLabel: p.quantityLabel,
              price: p.finalPrice,
            })),
          }),
        })
          .then(r => r.json())
          .then(aiData => {
            setAiAnalysis({
              enabled: aiData.enabled !== false,
              text: aiData.analysis || aiData.fallback || '',
              provider: aiData.provider,
              name: aiData.ai?.name,
              tagline: aiData.ai?.tagline,
              emoji: aiData.ai?.emoji,
              color: aiData.ai?.color,
              loading: false,
            });
          })
          .catch(() => {
            setAiAnalysis({ enabled: false, text: '', loading: false });
          });
      } else {
        setAiAnalysis({ enabled: false, text: '', loading: false });
      }
    } catch (err) {
      console.error('Build error:', err);
      setResult({ ok: false, error: 'خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.' } as Result);
      setAiAnalysis({ enabled: false, text: '', loading: false });
    } finally {
      setLoading(false);
    }
  };

  const restart = () => {
    setResult(null);
    setBought(false);
    setShowDesc(false);
    setParts([]);
    setBlockedPartIds(new Set());
    setUnavailablePartIds(new Set());
    setStep(1);
  };

  const buyAll = () => {
    if (!parts.length) return;
    const availableParts = parts.filter(p => !unavailablePartIds.has(String(p.id)));
    if (!availableParts.length) {
      alert('هیچ قطعهٔ موجودی برای افزودن به سبد وجود ندارد.');
      return;
    }
    addBulk(availableParts.map(p => ({ id: p.id, qty: Math.max(1, Number(p.quantity || 1)) })), {
      onSuccess: () => setBought(true),
    });
  };

  const togglePartExpand = (partId: string) => {
    setExpandedParts(prev => {
      const next = new Set(prev);
      if (next.has(partId)) next.delete(partId);
      else next.add(partId);
      return next;
    });
  };

  // ═════ بررسی مجدد سازگاری بعد از هر ویرایش (رفع باگ دکمهٔ خرید گیر‌کرده) ═════
  const compatReqId = useRef(0);
  const recomputeCompatibility = useCallback(async (nextParts: Part[]) => {
    const reqId = ++compatReqId.current;
    try {
      const res = await fetch('/api/assemble/compatibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parts: nextParts.map(p => ({ category: p.category, id: p.id, specs: p.specs })),
        }),
      });
      const data = await res.json();
      if (reqId !== compatReqId.current) return; // پاسخ قدیمی را نادیده بگیر
      if (data?.matrix) {
        setBlockedPartIds(new Set(data.matrix.blockedPartIds || []));
        setUnavailablePartIds(new Set(data.matrix.unavailablePartIds || []));
      }
    } catch {
      // در صورت خطا، set های قبلی حفظ می‌شوند
    }
  }, []);

  const commitParts = (next: Part[]) => {
    setParts(next);
    void recomputeCompatibility(next);
  };

  const selectAlternative = (partId: string, alt: Part) => {
    const next = parts.map(p => String(p.id) === String(partId)
      ? { ...alt, alternatives: p.alternatives, isOptional: p.isOptional }
      : p);
    commitParts(next);
    setExpandedParts(prev => {
      const n = new Set(prev);
      n.delete(partId);
      return n;
    });
  };

  const applySmartSuggestion = (suggestion: SmartSuggestion) => {
    const suggested = suggestion.suggested;
    if (!isRealPart(suggested)) return;

    const currentId = suggestion.current?.id;
    let next: Part[];

    if (suggestion.mode === 'quantity' && currentId !== undefined) {
      next = parts.map(p => {
        if (String(p.id) !== String(currentId)) return p;
        const nextQty = partQty(p) + Math.max(1, Number(suggestion.quantityDelta || 1));
        const nextSpecs = { ...p.specs };
        if (p.category === 'ram') {
          const modules = ramModuleCount(p);
          const slots = Number(p.specs?.ramSlots || 4); // تعداد اسلات واقعی (نه usedRamSlots)
          nextSpecs.totalModules = Math.min(slots, modules * nextQty);
          nextSpecs.usedRamSlots = nextSpecs.totalModules;
        }
        return {
          ...p,
          quantity: nextQty,
          specs: nextSpecs,
          quantityLabel: p.category === 'ram'
            ? `${nextQty.toLocaleString('fa-IR')} کیت RAM · مجموع ${Number(p.specs?.capacity || 0) * nextQty}GB`
            : `${nextQty.toLocaleString('fa-IR')} عدد برای ظرفیت بیشتر`,
        };
      });
    } else if (suggestion.mode === 'add') {
      if (parts.some(p => String(p.id) === String(suggested.id))) {
        next = parts.map(p => String(p.id) === String(suggested.id) ? { ...p, quantity: partQty(p) + 1 } : p);
      } else {
        next = [...parts, { ...suggested, alternatives: suggested.alternatives || [], isOptional: suggested.isOptional ?? true, quantity: suggested.quantity || 1 }];
      }
    } else {
      if (parts.some(p => String(p.id) === String(suggested.id))) {
        next = parts;
      } else {
        next = parts.map(p => String(p.id) === String(currentId)
          ? { ...suggested, alternatives: p.alternatives || suggested.alternatives || [], isOptional: p.isOptional, quantity: suggested.quantity || 1 }
          : p
        );
      }
    }
    commitParts(next);
  };

  const addSuggestedAction = (action: ResolutionAction) => {
    const suggested = action.suggested;
    if (!isRealPart(suggested)) return;

    const currentId = action.current?.id;
    let next: Part[];

    const exists = parts.some(p => String(p.id) === String(suggested.id));
    if (exists) {
      next = parts;
    } else if (currentId !== undefined && parts.some(p => String(p.id) === String(currentId))) {
      next = parts.map(p => String(p.id) === String(currentId)
        ? { ...suggested, alternatives: p.alternatives || suggested.alternatives || [], isOptional: p.isOptional }
        : p
      );
    } else {
      const sameCategoryIndex = parts.findIndex(p => p.category === suggested.category);
      if (sameCategoryIndex >= 0) {
        next = parts.map((p, idx) => idx === sameCategoryIndex
          ? { ...suggested, alternatives: p.alternatives || suggested.alternatives || [], isOptional: p.isOptional }
          : p
        );
      } else {
        next = [...parts, { ...suggested, alternatives: suggested.alternatives || [], isOptional: suggested.isOptional || false }];
      }
    }
    commitParts(next);
  };

  const removeOptional = (partId: string) => {
    commitParts(parts.filter(p => String(p.id) !== String(partId)));
  };

  const tierInfo = result?.tier ? TIER_LABELS[result.tier] || TIER_LABELS.medium : TIER_LABELS.medium;
  const scoreColor =
    (result?.compatibilityScore || 0) >= 85
      ? 'var(--asm-green)'
      : (result?.compatibilityScore || 0) >= 60
        ? 'var(--asm-primary)'
        : 'var(--aw-warn)';

  const estimatedFps = useMemo(() => {
    if (!parts.length || useCase !== 'gaming') return null;
    const cpu = parts.find(p => p.category === 'cpu');
    const gpu = parts.find(p => p.category === 'gpu');
    const ram = parts.find(p => p.category === 'ram');
    let score = 0;
    if (gpu?.specs?.vram) score += gpu.specs.vram * 5;
    if (gpu?.specs?.tier === 'ultra') score += 40;
    if (gpu?.specs?.tier === 'high') score += 20;
    if (cpu?.specs?.cores) score += cpu.specs.cores * 2;
    if (ram?.specs?.capacity && ram.specs.capacity < 16) score -= 15;
    return score >= 100 ? '60-120 FPS در 4K' : score >= 60 ? '60-100 FPS در 1440p' : '60-80 FPS در 1080p';
  }, [parts, useCase]);

  const currentSummary = useMemo(() => makeSummary(parts), [parts]);
  const displaySummary = parts.length ? currentSummary : result?.summary;
  const radarAxes = useMemo(() => buildRadarAxes(parts, budget, result?.compatibilityScore || 0), [parts, budget, result]);
  const insights = useMemo(() => buildInsights(parts, budget, useCase), [parts, budget, useCase]);
  const smartSuggestions = useMemo(() => buildSmartSuggestions(parts, budget), [parts, budget]);
  const quickRamSuggestion = smartSuggestions.find(s => s.mode === 'quantity' && s.suggested.category === 'ram');
  const quickStorageSuggestion = smartSuggestions.find(s => s.mode === 'quantity' && s.suggested.category === 'storage');

  const hasIncompatible = blockedPartIds.size > 0;
  const hasUnavailable = unavailablePartIds.size > 0;

  return (
    <div className="asm aw">
      {/* هیرو */}
      <header className="aw-hero">
        <div className="aw-hero__bg" aria-hidden="true">
          <span className="aw-hero__orb aw-hero__orb--1" />
          <span className="aw-hero__orb aw-hero__orb--2" />
          <span className="aw-hero__grid" />
          <span className="aw-hero__scan" />
        </div>
        <div className="aw-hero__content">
          <span className="aw-hero__badge"><CpuIcon /> اسمبلر آفلند</span>
          <h1 className="aw-hero__title">
            سیستم رو<span className="aw-hero__title-grad"> دقیق و به‌صرفه</span> برات می‌چینم
          </h1>
          <p className="aw-hero__sub">
            کاربری و بودجه‌ت رو بگو؛ من با بررسی لحظه‌ای موجودی، محاسبهٔ سازگاری فنی و اولویت‌بندی قطعات، بهینه‌ترین ترکیب رو با قیمت دقیق برات می‌سازم.
          </p>
          <div className="aw-hero__stats">
            <span className="aw-hero__stat"><b>چندکیت</b> RAM/M.2</span>
            <span className="aw-hero__stat"><b>لحظه‌ای</b> قیمت و موجودی</span>
            <span className="aw-hero__stat"><b>بهینه‌سازی</b> بودجه</span>
            <span className="aw-hero__stat"><b>بررسی</b> سازگاری و دما</span>
          </div>
        </div>
      </header>

      <nav className="aw-steps" aria-label="مراحل اسمبل">
        <span className="aw-steps__track">
          <span className="aw-steps__fill" style={{ width: step >= 3 ? '100%' : step >= 2 ? '50%' : '0%' }} />
        </span>
        <Step n={1} label="کاربری" active={step === 1} done={step > 1} />
        <Step n={2} label="بودجه" active={step === 2} done={step > 2} />
        <Step n={3} label="سیستم" active={step === 3} done={false} />
      </nav>

      {step === 1 && (
        <div className="aw-panel aw-rise">
          <div className="aw-panel__head">
            <h2 className="aw-panel__title">سیستم رو برای چه کاری می‌خوای؟</h2>
            <p className="aw-panel__sub">با انتخاب کاربری، قطعات مناسب و وزن هر دسته متناسب با نیازت تنظیم می‌شه.</p>
          </div>

          {savedBuild?.parts?.length > 0 && (
            <div className="aw-restore-banner">
              <div className="aw-restore-banner__info">
                <b>ساخت قبلی ذخیره شده</b>
                <span>{savedBuild.parts.length} قطعه · {savedBuild.result?.useCaseLabel || ''}{savedBuild.budget ? ` · ${toman(savedBuild.budget)}` : ''}</span>
              </div>
              <div className="aw-actions">
                <button type="button" className="aw-cta" onClick={restoreBuild}>ادامه ساخت</button>
                <button type="button" className="aw-ghost" onClick={discardSaved}>شروع جدید</button>
              </div>
            </div>
          )}

          <div className="aw-usecases">
            {USE_CASES.map(u => {
              const Icon = USECASE_ICONS[u.key] || CpuIcon;
              const active = useCase === u.key;
              return (
                <button
                  key={u.key}
                  type="button"
                  className={`aw-usecase${active ? ' aw-usecase--active' : ''}`}
                  onClick={() => setUseCase(u.key)}
                >
                  <span className="aw-usecase__glow" aria-hidden="true" />
                  <span className="aw-usecase__check"><CheckIcon /></span>
                  <span className="aw-usecase__icon"><Icon /></span>
                  <span className="aw-usecase__label">{u.label}</span>
                  <span className="aw-usecase__desc">{u.desc}</span>
                </button>
              );
            })}
          </div>

          {useCase === 'custom' && (
            <div className="aw-custom">
              <label className="aw-custom__label"><CustomIcon /> توضیح بده چه کاری می‌خوای بکنی:</label>
              <textarea
                className="aw-custom__input"
                value={customDesc}
                onChange={e => setCustomDesc(e.target.value)}
                placeholder="مثلاً: هم گیمینگ سنگین، هم ادیت ویدیو ۴K، هم استریم همزمان"
                maxLength={300}
              />
              <span className="aw-custom__count">{customDesc.length}/300</span>
            </div>
          )}

          <button
            className="aw-cta"
            style={{ marginTop: 22 }}
            onClick={() => setStep(2)}
            disabled={useCase === 'custom' && customDesc.trim().length < 3}
          >
            ادامه <ArrowIcon />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="aw-panel aw-rise">
          <div className="aw-panel__head">
            <h2 className="aw-panel__title">بودجه‌ات چقدره؟</h2>
            <p className="aw-panel__sub">
              {rangeLoading ? (
                <span className="aw-budget__loading-inline">
                  <span className="aw-spin aw-spin--sm" /> در حال بررسی قیمت‌های واقعی فروشگاه…
                </span>
              ) : range ? (
                <span className="aw-budget__rangeinfo">
                  <span className="aw-budget__rangeinfo-ico">📊</span>
                  بازهٔ واقعی: <b>{shortToman(range.min)}</b> تا <b>{shortToman(range.max)}</b>
                  {range.recommended && (
                    <span className="aw-budget__rangeinfo-rec">پیشنهادی: <b>{shortToman(range.recommended)}</b></span>
                  )}
                </span>
              ) : (
                'با اسلایدر تنظیم کن.'
              )}
            </p>
          </div>

          {rangeLoading || !range ? (
            // ═══════ لودینگ حرفه‌ای اسلایدر ═══════
            <div className="aw-budget-loading">
              <div className="aw-budget-loading__skeleton">
                <div className="aw-skeleton aw-skeleton--value" />
                <div className="aw-skeleton aw-skeleton--range" />
                <div className="aw-skeleton aw-skeleton--labels" />
                <div className="aw-skeleton__presets">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <div key={i} className="aw-skeleton__preset" />
                  ))}
                </div>
              </div>
              <div className="aw-budget-loading__message">
                <span className="aw-spin" />
                در حال جستجوی کمترین و بیشترین قیمت قطعات در فروشگاه…
              </div>
            </div>
          ) : (
            // ═══════ اسلایدر با داده واقعی ═══════
            <>
              <div className="aw-budget">
                <div className="aw-budget__val">
                  {budget.toLocaleString('fa-IR')} <span>تومان</span>
                </div>

                <div className="aw-range">
                  <input
                    className="aw-range__input"
                    type="range"
                    min={range.min}
                    max={range.max}
                    step={Math.max(1_000_000, Math.round((range.max - range.min) / 100))}
                    value={budget}
                    onChange={e => setBudget(Number(e.target.value))}
                    style={{
                      background: `linear-gradient(90deg, var(--aw-accent-b) 0%, var(--asm-cyan) ${((budget - range.min) / (range.max - range.min)) * 100}%, var(--asm-track) ${((budget - range.min) / (range.max - range.min)) * 100}%)`,
                    }}
                  />
                </div>

                <div className="aw-range__labels">
                  <span>{shortToman(range.min)}</span>
                  <span className="aw-range__rec" onClick={() => setBudget(range.recommended)}>
                    پیشنهادی: {shortToman(range.recommended)}
                  </span>
                  <span>{shortToman(range.max)}</span>
                </div>

                {/* پریست‌ها */}
                <div className="aw-presets">
                  {BUDGET_PRESETS
                    .filter(p => p.value >= range.min && p.value <= range.max * 1.15)
                    .map(p => (
                      <button
                        key={p.value}
                        type="button"
                        className={`aw-preset${budget === p.value ? ' aw-preset--active' : ''}`}
                        onClick={() => setBudget(p.value)}
                      >
                        {p.label}
                      </button>
                    ))}
                  {BUDGET_PRESETS.filter(p => p.value >= range.min && p.value <= range.max * 1.15).length === 0 && (
                    <span className="aw-presets__empty">برای این کاربری پریستی در بازه نیست — اسلایدر رو تنظیم کن.</span>
                  )}
                </div>
                <p className="aw-presets__hint">
                  حداقل قیمت ممکن: {shortToman(range.min)} — کمتر از این نمی‌تونیم سیستم سازگار بسازیم
                </p>
              </div>
            </>
          )}

          <div className="aw-options">
            <h3 className="aw-options__title">⚙️ تنظیمات اضافی</h3>
            <label className="aw-check">
              <input
                type="checkbox"
                checked={includeOptional}
                onChange={e => setIncludeOptional(e.target.checked)}
              />
              <span className="aw-check__box"><CheckIcon /></span>
              <span>شامل قطعات اختیاری (کولر، فن RGB، نوار نور)</span>
            </label>
            <p className="aw-options__hint">
              قطعات <b>اجباری</b> (CPU، GPU، مادربرد، رم، SSD، پاور، کیس) همیشه انتخاب می‌شن.
              سیستم به‌طور real-time موجودی و سازگاری رو چک می‌کنه و قطعات ناسازگار یا ناموجود رو <b>غیرفعال</b> نشون می‌ده.
            </p>
          </div>

          <div className="aw-actions" style={{ marginTop: 22 }}>
            <button className="aw-ghost" onClick={() => setStep(1)}>
              <ArrowIcon /> بازگشت
            </button>
            <button
              className="aw-cta"
              style={{ flex: 2 }}
              onClick={build}
              disabled={!range || rangeLoading}
            >
              {rangeLoading ? (
                <>
                  <span className="aw-spin" /> در حال بارگذاری…
                </>
              ) : (
                <>
                  <CpuIcon /> سیستم رو بچین
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="asm__panel">
          {loading && (
            <div className="aw-loading">
              <div className="aw-loading__cores">
                <span className="aw-loading__core" /><span className="aw-loading__core" /><span className="aw-loading__core" />
              </div>
              <div className="aw-loading__title">در حال چیدن سیستم…</div>
              <div className="aw-loading__bar"><span /></div>
              <div className="aw-loading__steps">
                {LOADING_STEPS.map((s, i) => (
                  <div key={i} className={`aw-loading__step${i <= loadStep ? ' aw-loading__step--on' : ''}`}>
                    <span className="aw-loading__dot" />{s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && result?.error && (
            <div className="aw-error">
              <span className="aw-error__ico"><WarningIcon /></span>
              <p>{result.error}</p>
              <button className="aw-ghost" style={{ marginTop: 16 }} onClick={restart}>
                <RefreshIcon /> شروع دوباره
              </button>
            </div>
          )}

          {!loading && result?.ok && (
            <>
              <div className="aw-result-head">
                <div className="aw-result-head__main">
                  <span className="aw-result-head__icon">
                    {React.createElement(USECASE_ICONS[useCase] || CpuIcon)}
                  </span>
                  <div className="aw-result-head__text">
                    <span className="aw-result-head__eyebrow">سیستم پیشنهادی</span>
                    <h2 className="aw-result-head__title">اسمبل {result.useCaseLabel}</h2>
                  </div>
                </div>
                <div className="aw-result-head__gauges">
                  <RadialGauge
                    value={result.compatibilityScore || 0}
                    label={`${result.compatibilityScore || 0}`}
                    sublabel="سازگاری"
                    color={scoreColor}
                    size={108}
                  />
                  <div className="aw-result-head__chips">
                    <span className="aw-chip aw-chip--tier" style={{ backgroundColor: tierInfo.bg, color: tierInfo.color }}>{tierInfo.label}</span>
                    <span className="aw-chip">
                      <b>{displaySummary?.mandatoryCount || 0}</b> اصلی
                      {(displaySummary?.optionalCount || 0) > 0 && <> + <b>{displaySummary?.optionalCount || 0}</b> اختیاری</>}
                    </span>
                    <span className="aw-chip aw-chip--ok">{displaySummary?.itemCount || parts.length} قطعه</span>
                  </div>
                </div>
              </div>

              {/* ═════ تِم ظاهری + حالت نمایش + پیش‌فاکتور ═════ */}
              <div className={`aw-toolbar asm__toolbar--${assembleTheme}`}>
                <ThemeSelector value={assembleTheme} onChange={setAssembleTheme} />
                <div className="aw-toolbar__right">
                  <button
                    className="aw-invoice-btn"
                    onClick={() => setInvoiceOpen(true)}
                    type="button"
                    title="مشاهده و پرینت پیش‌فاکتور رسمی"
                  >🧾 پیش‌فاکتور</button>
                </div>
              </div>

              {/* تب‌های نتایج — کاهش شلوغی صفحه */}
              <div className="aw-result-tabs" role="tablist">
                {(['parts', 'analysis'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="tab"
                    aria-selected={resultTab === t}
                    className={`aw-result-tab${resultTab === t ? ' aw-result-tab--active' : ''}`}
                    onClick={() => setResultTab(t)}
                  >
                    {t === 'parts' ? 'قطعات' : 'تحلیل و سازگاری'}
                  </button>
                ))}
              </div>

              {/* ═════ شوی کیس + رادار + امتیاز ═════ */}
              {resultTab === 'analysis' && (
              <div className="aw-showcase">
                <div className="aw-showcase__visual">
                  <PcBuildVisual
                    parts={parts as any}
                    theme={assembleTheme}
                    blockedIds={blockedPartIds}
                    unavailableIds={unavailablePartIds}
                  />
                </div>
                <div className="aw-showcase__side">
                  <div className="aw-scorecard">
                    <div className="aw-scorecard__row">
                      <span>قیمت نهایی</span>
                      <b>{shortToman(displaySummary?.totalAfter || 0)}</b>
                    </div>
                    <div className="aw-scorecard__row">
                      <span>صرفه‌جویی</span>
                      <b className="aw-scorecard__save">−{shortToman(displaySummary?.totalSaving || 0)}</b>
                    </div>
                    <div className="aw-scorecard__row">
                      <span>توان کل</span>
                      <b>{currentSummary.totalTdp}W</b>
                    </div>
                    <div className="aw-scorecard__row">
                      <span>تعداد قطعات</span>
                      <b>{displaySummary?.itemCount || parts.length}</b>
                    </div>
                  </div>
                  <BudgetBreakdown parts={parts as any} budget={budget} />
                  <div className="aw-radar-card">
                    <div className="aw-radar-card__head">نقشهٔ توانمندی سیستم</div>
                    <SpecRadar axes={radarAxes} size={236} />
                  </div>
                </div>
              </div>

              )}

              {/* ═════ داشبورد تله‌متری زندهٔ Ultimate AI Master ═════ */}
              {/* ═════ شناسنامه گرافیکی سیستم + QR ═════ */}
              {resultTab === 'analysis' && (
              <BuildIdentityCard
                parts={parts as any}
                useCaseLabel={result?.useCaseLabel}
                totalPrice={displaySummary?.totalAfter || 0}
                title={result?.useCaseLabel ? `سیستم ${result.useCaseLabel} — آفلند` : undefined}
              />
              )}

              {resultTab === 'analysis' && (
              <div className="aw-layout-visual">
                <PcBuildVisual
                  parts={parts as any}
                  theme={assembleTheme}
                  blockedIds={blockedPartIds}
                  unavailableIds={unavailablePartIds}
                />
              </div>
              )}

              {resultTab === 'analysis' && (
              <>
              <Collapsible title="داشبورد تصمیم‌گیری" icon={<InfoIcon />} defaultOpen>
                <div className="asm__smart-dashboard">
                  <div className="asm__smart-dashboard-head">
                    <div>
                      <strong>داشبورد تصمیم‌گیری</strong>
                      <span>جزئیات استفاده از اسلات‌ها، ظرفیت و توازن سیستم</span>
                    </div>
                    <em>{result.compatibilityScore || 0}% سازگاری</em>
                  </div>
                  <div className="asm__smart-grid">
                    {insights.map((item, i) => (
                      <div key={i} className={`asm__smart-card asm__smart-card--${item.tone}`}>
                        <span className="asm__smart-icon">{item.icon}</span>
                        <div>
                          <small>{item.title}</small>
                          <b>{item.value}</b>
                          <span>{item.meta}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Collapsible>

              {/* پنل Auto-Resolver — اقدامات هوشمند */}
              {result.resolution && (result.resolution.actions.length > 0 || result.resolution.suggestions.length > 0) && (
                <Collapsible title="اقدامات اصلاح سازگاری" icon={<InfoIcon />}>
                <div className="asm__resolver-panel">
                  <div className="asm__resolver-head">
                    <span className="asm__resolver-icon"><InfoIcon /></span>
                    <div>
                      <div className="asm__resolver-title">
                        {result.resolution.resolved ? 'سیستم با موفقیت سازگار شد' : 'برخی قطعات نیاز به جایگزین دارند'}
                      </div>
                      <div className="asm__resolver-subtitle">
                        سیستم هوشمند {result.resolution.actionsCount} اقدام انجام داد و {result.resolution.suggestionCount} پیشنهاد جایگزین داد
                      </div>
                    </div>
                  </div>

                  {/* پیشنهادهای قابل اعمال */}
                  {result.resolution.actions.some(action => isRealPart(action.suggested)) && (
                    <div className="asm__resolver-actions">
                      <div className="asm__resolver-section-title">پیشنهادهای قابل اعمال روی همین سیستم</div>
                      {result.resolution.actions.filter(action => isRealPart(action.suggested)).map((action, i) => {
                        const suggested = action.suggested as Part;
                        const alreadyAdded = parts.some(p => String(p.id) === String(suggested.id));
                        return (
                          <div key={`${suggested.id}-${i}`} className="asm__resolver-action-item">
                            <div className="asm__resolver-action-info">
                              <strong>{suggested.categoryLabel}: {suggested.name}</strong>
                              <span>{action.userMessage || action.reason}</span>
                              <em>{toman(suggested.finalPrice)}</em>
                            </div>
                            <button
                              type="button"
                              className="asm__resolver-action-add"
                              onClick={() => addSuggestedAction(action)}
                              disabled={alreadyAdded}
                            >
                              {alreadyAdded ? 'اضافه شد' : 'افزودن به سیستم'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* پیام‌های اقدامات */}
                  {result.resolution.messages.length > 0 && (
                    <div className="asm__resolver-messages">
                      {result.resolution.messages.map((msg, i) => (
                        <div key={i} className={`asm__resolver-message asm__resolver-message--${msg.severity}`}>
                          <span className="asm__resolver-message-icon">
                            {msg.severity === 'success' ? <CheckIcon /> : msg.severity === 'warning' ? <WarningIcon /> : msg.severity === 'error' ? <WarningIcon /> : <InfoIcon />}
                          </span>
                          <span>{cleanPublicText(msg.text)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* قطعات حذف‌شده */}
                  {result.resolution.removedParts.length > 0 && (
                    <div className="asm__resolver-removed">
                      <div className="asm__resolver-section-title">قطعات حذف‌شده</div>
                      {result.resolution.removedParts.map((rp, i) => (
                        <div key={i} className="asm__resolver-removed-item">
                          <div className="asm__resolver-removed-header">
                            <span className="asm__resolver-removed-icon"><WarningIcon /></span>
                            <span className="asm__resolver-removed-name">{rp.categoryLabel}: {rp.name}</span>
                          </div>
                          <div className="asm__resolver-removed-reason">{cleanPublicText(rp.reason)}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* پیشنهادات جایگزین */}
                  {result.resolution.suggestions.length > 0 && (
                    <div className="asm__resolver-suggestions">
                      <div className="asm__resolver-section-title">پیشنهادات جایگزین</div>
                      {result.resolution.suggestions.map((sug, i) => (
                        <div key={i} className="asm__resolver-suggestion-item">
                          <div className="asm__resolver-suggestion-header">
                            <span className="asm__resolver-suggestion-badge"><InfoIcon /></span>
                            <span className="asm__resolver-suggestion-name">{sug.name}</span>
                            <span className="asm__resolver-suggestion-status">
                              {sug.availability === 'coming_soon' ? 'به زودی' : sug.availability}
                            </span>
                          </div>
                          <div className="asm__resolver-suggestion-model">مدل: {sug.model}</div>
                          <div className="asm__resolver-suggestion-reason">{cleanPublicText(sug.reason)}</div>
                          {sug.estimatedPrice && (
                            <div className="asm__resolver-suggestion-price">قیمت تخمینی: {sug.estimatedPrice}</div>
                          )}
                          {sug.socket && (
                            <div className="asm__resolver-suggestion-spec">سوکت: {sug.socket}</div>
                          )}
                          {sug.ramType && (
                            <div className="asm__resolver-suggestion-spec">رم: {sug.ramType}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                </Collapsible>
              )}

              {/* پنل سازگاری v3 */}
              {showCompat && result.compatibilityMatrix && (
                <Collapsible title="بررسی سازگاری قطعات" icon={<ShieldIcon />} defaultOpen>
                  <CompatibilityPanelV3
                    matrix={result.compatibilityMatrix}
                    unavailableMessages={result.unavailableMessages}
                    parts={parts}
                  />
                </Collapsible>
              )}

              {showFps && useCase === 'gaming' && estimatedFps && (
                <div className="asm__fps-estimate">
                  <span className="asm__fps-icon"><GpuIcon /></span>
                  <div className="asm__fps-content">
                    <div className="asm__fps-title">تخمین عملکرد گیمینگ</div>
                    <div className="asm__fps-text">{estimatedFps}</div>
                  </div>
                </div>
              )}
              </>
              )}

              {/* تب قطعات — پیشنهادها + کارت‌های قطعات */}
              {resultTab === 'parts' && (
              <>
              {smartSuggestions.length > 0 && (
                <div className="asm__public-suggestions">
                  <div className="asm__public-suggestions-head">
                    <span className="asm__public-suggestions-icon"><InfoIcon /></span>
                    <div>
                      <strong>پیشنهادهای هماهنگ با این سیستم</strong>
                      <small>ارتقاهای سازگار و قابل اعمال</small>
                    </div>
                  </div>
                  <div className="asm__public-suggestions-grid">
                    {smartSuggestions.map(sug => {
                      const alreadyAdded = parts.some(p => String(p.id) === String(sug.suggested.id));
                      return (
                        <div key={sug.id} className="asm__public-suggestion-card">
                          <div className="asm__public-suggestion-main">
                            <span className="asm__public-suggestion-cat">{sug.suggested.categoryLabel}</span>
                            <strong>{sug.suggested.name}</strong>
                            <small>{sug.reason}</small>
                          </div>
                          <div className="asm__public-suggestion-side">
                            <b>{toman(sug.suggested.finalPrice)}</b>
                            <button type="button" onClick={() => applySmartSuggestion(sug)} disabled={sug.mode !== 'quantity' && alreadyAdded}>
                              {sug.mode === 'quantity' ? <><CartIcon /> افزودن یک عدد</> : alreadyAdded ? <><CheckIcon /> اعمال شد</> : sug.mode === 'add' ? <><CartIcon /> افزودن</> : <><RefreshIcon /> جایگزینی</>}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}


              <div className="asm__parts-section">
                <h3 className="asm__parts-title">
                  قطعات سیستم
                  <span className="asm__parts-count">{displaySummary?.itemCount || parts.length} قطعه</span>
                </h3>

                <div className="asm__parts-mandatory">
                  <h4 className="asm__parts-subtitle">
                    قطعات اصلی ({parts.filter(p => !p.isOptional).length})
                    {hasIncompatible && <span className="asm__parts-warning-tag">— برخی ناسازگار</span>}
                    {hasUnavailable && <span className="asm__parts-warning-tag">— برخی ناموجود</span>}
                  </h4>
                  <div className="asm__parts-cards-grid">
                    {parts.filter(p => !p.isOptional).map((p, idx) => {
                      const blocked = blockedPartIds.has(String(p.id));
                      const unavailable = unavailablePartIds.has(String(p.id));
                      const blockingIssue = result.compatibilityMatrix?.errors.find(
                        e => e.affectedParts?.includes(String(p.id))
                      );
                      return (
                        <AssembleProductCard
                          key={`${p.category}-${p.id}`}
                          part={p}
                          index={idx}
                          expanded={expandedParts.has(String(p.id))}
                          onToggleExpand={() => togglePartExpand(String(p.id))}
                          onSelectAlternative={(alt) => selectAlternative(String(p.id), alt)}
                          blocked={blocked}
                          unavailable={unavailable}
                          blockingReason={blocked ? blockingIssue?.message : (unavailable ? 'این قطعه الان موجود نیست' : undefined)}
                        />
                      );
                    })}
                  </div>
                </div>

                {parts.filter(p => p.isOptional).length > 0 && (
                  <div className="asm__parts-optional">
                    <h4 className="asm__parts-subtitle">
                      قطعات تکمیلی ({parts.filter(p => p.isOptional).length})
                    </h4>
                    <div className="asm__parts-cards-grid">
                      {parts.filter(p => p.isOptional).map((p, idx) => {
                        const blocked = blockedPartIds.has(String(p.id));
                        const unavailable = unavailablePartIds.has(String(p.id));
                        return (
                          <AssembleProductCard
                            key={`${p.category}-${p.id}`}
                            part={p}
                            index={idx + 100}
                            expanded={expandedParts.has(String(p.id))}
                            onToggleExpand={() => togglePartExpand(String(p.id))}
                            onSelectAlternative={(alt) => selectAlternative(String(p.id), alt)}
                            onRemoveOptional={() => removeOptional(String(p.id))}
                            blocked={blocked}
                            unavailable={unavailable}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              </>

              )}

              {/* حذف توضیحات تکنیکال طولانی - AI توضیح می‌ده */}


              {/* ═══════ پنل تحلیل AI (تب نمای کلی) ═══════ */}
              {resultTab === 'analysis' && (aiAnalysis.loading || aiAnalysis.text) && (
                <div className="asm__ai-panel">
                  <div className="asm__ai-head">
                    <span className="asm__ai-icon"><CheckIcon /></span>
                    <div className="asm__ai-info">
                      <div className="asm__ai-title">
                        بررسی سیستم
                      </div>
                      <div className="asm__ai-subtitle">
                        {aiAnalysis.loading ? 'در حال بررسی هماهنگی قطعات...' : (aiAnalysis.tagline || 'تحلیل سیستم آماده است')}
                      </div>
                    </div>
                  </div>
                  <div className="asm__ai-content">
                    {aiAnalysis.loading ? (
                      <div className="asm__ai-loading">
                        <span className="asm__ai-loader" />
                        <span className="asm__ai-loader" style={{ animationDelay: '0.15s' }} />
                        <span className="asm__ai-loader" style={{ animationDelay: '0.3s' }} />
                      </div>
                    ) : (
                      <div className="asm__ai-text">
                        {aiAnalysis.text.split('\n').filter(Boolean).slice(0, 4).map((line, i) => (
                          <p key={i}>{line}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="asm__summary">
                <div className="asm__sum-row">
                  <span>قیمت کل بدون تخفیف</span>
                  <span className="asm__sum-before">{toman(displaySummary?.totalBefore || 0)}</span>
                </div>
                <div className="asm__sum-row">
                  <span className="asm__sum-saving-label"><span className="asm__sum-saving-icon"><ShieldIcon /></span> صرفه‌جویی</span>
                  <span className="asm__sum-saving">− {toman(displaySummary?.totalSaving || 0)} ({displaySummary?.savingPercent || 0}٪)</span>
                </div>
                <div className="asm__sum-row asm__sum-total">
                  <span>قیمت نهایی</span>
                  <span>{toman(displaySummary?.totalAfter || 0)}</span>
                </div>

                {(quickRamSuggestion || quickStorageSuggestion) && (
                  <div className="asm__quick-adds">
                    {quickRamSuggestion && (
                      <button type="button" onClick={() => applySmartSuggestion(quickRamSuggestion)}>
                        <RamIcon /> افزودن RAM سازگار
                      </button>
                    )}
                    {quickStorageSuggestion && (
                      <button type="button" onClick={() => applySmartSuggestion(quickStorageSuggestion)}>
                        <SsdIcon /> افزودن SSD سازگار
                      </button>
                    )}
                  </div>
                )}

                {bought ? (
                  <div className="asm__bought">
                    <CheckIcon /> همه قطعات اضافه شد!
                    <button className="asm__btn-ghost" style={{ flex: 'none', marginInlineStart: 8 }} onClick={() => router.push('/cart')}>
                      <CartIcon /> مشاهده سبد
                    </button>
                  </div>
                ) : (
                  <button className="asm__buy" onClick={buyAll} disabled={buying || hasIncompatible}>
                    {buying ? <><span className="asm__buy-spin" /> در حال افزودن…</> : <><CartIcon /> افزودن قطعات موجود به سبد</>}
                  </button>
                )}

                <div className="asm__sum-actions">
                  <button className="asm__btn-ghost" onClick={() => setStep(2)}><EditIcon /> تغییر بودجه</button>
                  <button className="asm__btn-ghost" onClick={build}><RefreshIcon /> پیشنهاد دیگر</button>
                  <button className="asm__btn-ghost" onClick={restart}><RefreshIcon /> شروع دوباره</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ═════ مودال پیش‌فاکتور رسمی قابل پرینت ═════ */}
      <InvoiceModal
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        parts={parts as any}
        useCaseLabel={result?.useCaseLabel}
        budget={budget}
      />
    </div>
  );
}

const buildRadarAxes = (items: Part[], budget: number, score: number): Array<{ label: string; value: number }> => {
  const cpu = items.find(p => p.category === 'cpu');
  const gpu = items.find(p => p.category === 'gpu');
  const ram = items.find(p => p.category === 'ram');
  const storages = items.filter(p => p.category === 'storage');
  const psu = items.find(p => p.category === 'psu');
  const cooler = items.find(p => p.category === 'cooler');

  const cpuScore = cpu
    ? Math.min(10, ((Number(cpu.specs?.cores || 0) * 1.4 + Number(cpu.specs?.threads || 0) * 0.5) / 4.4))
    : 0;
  const gpuScore = gpu
    ? Math.min(10, (Number(gpu.specs?.vram || 0) / 2.4) + (gpu.specs?.tier === 'ultra' ? 2.5 : gpu.specs?.tier === 'high' ? 1.4 : 0))
    : 0;
  const ramScore = ram ? Math.min(10, (Number(ram.specs?.capacity || 0) * partQty(ram)) / 12.8) : 0;
  const storageScore = storages.length
    ? Math.min(10, storages.reduce((s, x) => s + storageSizeGb(x) * partQty(x), 0) / 800)
    : 0;
  const totalStorageTB = storages.reduce((s, x) => s + storageSizeGb(x) * partQty(x), 0) / 1000;
  const psuHeadroom = psu?.specs?.wattage
    ? Math.max(0, Math.min(1, ((Number(psu.specs.wattage) - (Number(cpu?.specs?.tdp || 95) + Number(gpu?.specs?.tdp || 150) + 100)) / (Number(cpu?.specs?.tdp || 95) + Number(gpu?.specs?.tdp || 150) + 100))))
    : 0;
  const coolingScore = Math.min(10, (cooler ? 6 : 2) + psuHeadroom * 4 + (totalStorageTB > 2 ? 1 : 0));
  const valueScore = Math.min(10, (score / 10) * 0.6 + (budget > 0 ? Math.min(1, makeSummary(items).totalAfter / budget) * 4 : 2));

  return [
    { label: 'پردازش', value: Math.round(cpuScore * 10) / 10 },
    { label: 'گرافیک', value: Math.round(gpuScore * 10) / 10 },
    { label: 'حافظه', value: Math.round(ramScore * 10) / 10 },
    { label: 'ذخیره', value: Math.round(storageScore * 10) / 10 },
    { label: 'خنک‌سازی', value: Math.round(coolingScore * 10) / 10 },
    { label: 'ارزش', value: Math.round(valueScore * 10) / 10 },
  ];
};

function Step({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className={`aw-step${active ? ' aw-step--active' : ''}${done ? ' aw-step--done' : ''}`}>
      <span className="aw-step__num">{done ? <CheckIcon /> : n}</span>
      <span className="aw-step__label">{label}</span>
    </div>
  );
}
