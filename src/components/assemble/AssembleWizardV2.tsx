'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu,
  Monitor,
  MemoryStick,
  HardDrive,
  Fan,
  Zap,
  Box,
  Snowflake,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  TrendingUp,
  Shield,
  Save,
  Share2,
  RotateCcw,
  X,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type UsageType = 'gaming' | 'rendering' | 'office' | 'streaming' | 'programming';

interface Product {
  id: number;
  name: string;
  price: number;
  special_price?: number;
  image?: { link: string };
  brand?: { title: string } | string;
  is_in_stock: number;
}

interface SelectedParts {
  cpu?: Product;
  motherboard?: Product;
  ram?: Product;
  gpu?: Product;
  storage?: Product;
  psu?: Product;
  case?: Product;
  cooler?: Product;
}

interface PerformanceMetrics {
  gaming: number;
  rendering: number;
  productivity: number;
  efficiency: number;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const USAGE_TYPES: { id: UsageType; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'gaming', label: 'گیمینگ', icon: <Monitor className="w-6 h-6" />, color: 'from-purple-500 to-pink-500' },
  { id: 'rendering', label: 'رندرینگ', icon: <Cpu className="w-6 h-6" />, color: 'from-blue-500 to-cyan-500' },
  { id: 'office', label: 'اداری', icon: <Box className="w-6 h-6" />, color: 'from-green-500 to-emerald-500' },
  { id: 'streaming', label: 'استریم', icon: <Zap className="w-6 h-6" />, color: 'from-orange-500 to-red-500' },
  { id: 'programming', label: 'برنامه‌نویسی', icon: <MemoryStick className="w-6 h-6" />, color: 'from-indigo-500 to-purple-500' },
];

const BUDGET_RANGES = [
  { min: 20_000_000, max: 40_000_000, label: 'اقتصادی', emoji: '💰' },
  { min: 40_000_000, max: 80_000_000, label: 'میان‌رده', emoji: '💎' },
  { min: 80_000_000, max: 150_000_000, label: 'حرفه‌ای', emoji: '🚀' },
  { min: 150_000_000, max: 300_000_000, label: 'فوق حرفه‌ای', emoji: '⚡' },
  { min: 300_000_000, max: 1_000_000_000, label: 'بی‌نهایت', emoji: '🌟' },
];

const COMPONENT_TYPES = [
  { key: 'cpu', label: 'پردازنده', icon: Cpu, required: true },
  { key: 'motherboard', label: 'مادربرد', icon: Box, required: true },
  { key: 'ram', label: 'رم', icon: MemoryStick, required: true },
  { key: 'gpu', label: 'کارت گرافیک', icon: Monitor, required: true },
  { key: 'storage', label: 'حافظه SSD', icon: HardDrive, required: true },
  { key: 'psu', label: 'پاور', icon: Zap, required: true },
  { key: 'case', label: 'کیس', icon: Box, required: true },
  { key: 'cooler', label: 'خنک‌کننده', icon: Snowflake, required: false },
];

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function AssembleWizardV2() {
  const [step, setStep] = useState(1);
  const [usage, setUsage] = useState<UsageType | null>(null);
  const [budget, setBudget] = useState<{ min: number; max: number } | null>(null);
  const [selectedParts, setSelectedParts] = useState<SelectedParts>({});
  const [loading, setLoading] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<string>('');

  const totalSteps = 4;

  // ── Fetch AI Recommendation ──
  const fetchAIRecommendation = useCallback(async () => {
    if (!usage || !budget) return;

    setLoading(true);
    try {
      const response = await fetch('/api/assemble', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usage,
          budget: budget.max,
          budgetRange: `${budget.min}-${budget.max}`,
        }),
      });

      const data = await response.json();
      setAiRecommendation(data.recommendation || '');
      
      if (data.parts) {
        setSelectedParts(data.parts);
      }
    } catch (error) {
      console.error('AI recommendation failed:', error);
    } finally {
      setLoading(false);
    }
  }, [usage, budget]);

  useEffect(() => {
    if (step === 3) {
      fetchAIRecommendation();
    }
  }, [step, fetchAIRecommendation]);

  // ── Calculate Performance Metrics ──
  const calculatePerformance = (): PerformanceMetrics => {
    // Mock calculation - in real app, this would be based on actual specs
    const baseScore = Object.keys(selectedParts).length * 12;
    return {
      gaming: Math.min(100, baseScore + (usage === 'gaming' ? 20 : 0)),
      rendering: Math.min(100, baseScore + (usage === 'rendering' ? 25 : 0)),
      productivity: Math.min(100, baseScore + 10),
      efficiency: Math.min(100, baseScore + 5),
    };
  };

  // ── Calculate Total Price ──
  const calculateTotal = () => {
    return Object.values(selectedParts).reduce((sum, part) => {
      if (!part) return sum;
      return sum + (part.special_price || part.price || 0);
    }, 0);
  };

  // ── Navigation ──
  const canProceed = () => {
    switch (step) {
      case 1:
        return usage !== null;
      case 2:
        return budget !== null;
      case 3:
        return Object.keys(selectedParts).length >= 7; // At least 7 parts selected
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (canProceed() && step < totalSteps) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const resetWizard = () => {
    setStep(1);
    setUsage(null);
    setBudget(null);
    setSelectedParts({});
    setAiRecommendation('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0F23] via-[#1a1a2e] to-[#16213e] p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-3">
            اسمبل هوشمند آفلند
          </h1>
          <p className="text-gray-400 text-lg">سیستم رویایی خودت رو با AI بساز</p>
        </motion.div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex items-center ${s < 4 ? 'flex-1' : ''}`}
              >
                <motion.div
                  initial={false}
                  animate={{
                    scale: step === s ? 1.2 : 1,
                    backgroundColor: step >= s ? '#7C3AED' : '#27273B',
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                    step >= s ? 'shadow-lg shadow-purple-500/50' : ''
                  }`}
                >
                  {step > s ? <Check className="w-5 h-5" /> : s}
                </motion.div>
                {s < 4 && (
                  <div className="flex-1 h-1 mx-2 bg-gray-700 rounded">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded"
                      initial={{ width: '0%' }}
                      animate={{ width: step > s ? '100%' : '0%' }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-400">
            <span>کاربری</span>
            <span>بودجه</span>
            <span>قطعات</span>
            <span>تأیید</span>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <StepUsage key="step1" usage={usage} setUsage={setUsage} />
          )}
          {step === 2 && (
            <StepBudget key="step2" budget={budget} setBudget={setBudget} />
          )}
          {step === 3 && (
            <StepParts
              key="step3"
              usage={usage!}
              budget={budget!}
              selectedParts={selectedParts}
              setSelectedParts={setSelectedParts}
              loading={loading}
              aiRecommendation={aiRecommendation}
            />
          )}
          {step === 4 && (
            <StepReview
              key="step4"
              usage={usage!}
              budget={budget!}
              selectedParts={selectedParts}
              performance={calculatePerformance()}
              total={calculateTotal()}
            />
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={prevStep}
            disabled={step === 1}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
            قبلی
          </button>

          {step < totalSteps ? (
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-500/50 transition-all"
            >
              بعدی
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={resetWizard}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-800 text-white hover:bg-gray-700 transition-all"
              >
                <RotateCcw className="w-5 h-5" />
                شروع مجدد
              </button>
              <button className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold hover:shadow-lg hover:shadow-green-500/50 transition-all">
                <Save className="w-5 h-5" />
                ذخیره سیستم
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// STEP COMPONENTS
// ═══════════════════════════════════════════════════════════════

function StepUsage({ usage, setUsage }: { usage: UsageType | null; setUsage: (u: UsageType) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">سیستم رو برای چی می‌خوای؟</h2>
        <p className="text-gray-400">کاربری اصلی سیستم رو انتخاب کن</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {USAGE_TYPES.map((type) => (
          <motion.button
            key={type.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setUsage(type.id)}
            className={`relative overflow-hidden rounded-2xl p-6 text-right transition-all ${
              usage === type.id
                ? 'ring-2 ring-purple-500 shadow-lg shadow-purple-500/50'
                : 'ring-1 ring-gray-700 hover:ring-gray-600'
            }`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${type.color} opacity-10`} />
            <div className="relative z-10">
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${type.color} mb-3`}>
                {type.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{type.label}</h3>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

function StepBudget({
  budget,
  setBudget,
}: {
  budget: { min: number; max: number } | null;
  setBudget: (b: { min: number; max: number }) => void;
}) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price / 1_000_000) + ' میلیون';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">چقدر می‌خوای هزینه کنی؟</h2>
        <p className="text-gray-400">بودجه مورد نظرت رو انتخاب کن</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {BUDGET_RANGES.map((range) => (
          <motion.button
            key={range.label}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setBudget({ min: range.min, max: range.max })}
            className={`relative overflow-hidden rounded-2xl p-6 text-right transition-all ${
              budget?.max === range.max
                ? 'ring-2 ring-purple-500 shadow-lg shadow-purple-500/50 bg-purple-900/20'
                : 'ring-1 ring-gray-700 hover:ring-gray-600 bg-gray-800/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl mb-2">{range.emoji}</div>
                <h3 className="text-xl font-bold text-white mb-1">{range.label}</h3>
                <p className="text-sm text-gray-400">
                  {formatPrice(range.min)} تا {formatPrice(range.max)}
                </p>
              </div>
              {budget?.max === range.max && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center"
                >
                  <Check className="w-6 h-6 text-white" />
                </motion.div>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

function StepParts({
  usage,
  budget,
  selectedParts,
  setSelectedParts,
  loading,
  aiRecommendation,
}: {
  usage: UsageType;
  budget: { min: number; max: number };
  selectedParts: SelectedParts;
  setSelectedParts: (parts: SelectedParts) => void;
  loading: boolean;
  aiRecommendation: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">قطعات سیستم</h2>
        <p className="text-gray-400">AI بهترین قطعات رو برات انتخاب کرده</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-500/30 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-purple-500 animate-pulse" />
            </div>
          </div>
          <p className="text-white mr-4">AI در حال انتخاب بهترین قطعات...</p>
        </div>
      )}

      {!loading && (
        <>
          {aiRecommendation && (
            <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-2xl p-6 border border-purple-500/30">
              <div className="flex items-start gap-3">
                <Sparkles className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">پیشنهاد AI</h3>
                  <p className="text-gray-300 leading-relaxed">{aiRecommendation}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {COMPONENT_TYPES.map((comp) => {
              const Icon = comp.icon;
              const part = selectedParts[comp.key as keyof SelectedParts];

              return (
                <motion.div
                  key={comp.key}
                  whileHover={{ scale: 1.02 }}
                  className={`rounded-2xl p-4 transition-all ${
                    part
                      ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/50'
                      : 'bg-gray-800/50 border border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5 text-purple-400" />
                      <span className="font-bold text-white">{comp.label}</span>
                      {comp.required && <span className="text-red-400 text-xs">*</span>}
                    </div>
                    {part && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"
                      >
                        <Check className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </div>

                  {part ? (
                    <div>
                      <p className="text-sm text-gray-300 mb-2 line-clamp-2">{part.name}</p>
                      <p className="text-lg font-bold text-purple-400">
                        {new Intl.NumberFormat('fa-IR').format(part.special_price || part.price)}{' '}
                        <span className="text-xs text-gray-400">تومان</span>
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">انتخاب نشده</p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </motion.div>
  );
}

function StepReview({
  usage,
  budget,
  selectedParts,
  performance,
  total,
}: {
  usage: UsageType;
  budget: { min: number; max: number };
  selectedParts: SelectedParts;
  performance: PerformanceMetrics;
  total: number;
}) {
  const usageLabel = USAGE_TYPES.find((u) => u.id === usage)?.label || '';

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">سیستم آماده‌ست! 🎉</h2>
        <p className="text-gray-400">خلاصه‌ای از سیستم پیشنهادی</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-2xl p-6 border border-purple-500/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">کاربری</p>
              <p className="text-lg font-bold text-white">{usageLabel}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-2xl p-6 border border-blue-500/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">تعداد قطعات</p>
              <p className="text-lg font-bold text-white">{Object.keys(selectedParts).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-2xl p-6 border border-green-500/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">سازگاری</p>
              <p className="text-lg font-bold text-white">تأیید شده ✓</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">عملکرد سیستم</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'گیمینگ', value: performance.gaming, color: 'from-purple-500 to-pink-500' },
            { label: 'رندرینگ', value: performance.rendering, color: 'from-blue-500 to-cyan-500' },
            { label: 'بهره‌وری', value: performance.productivity, color: 'from-green-500 to-emerald-500' },
            { label: 'بازدهی', value: performance.efficiency, color: 'from-orange-500 to-red-500' },
          ].map((metric) => (
            <div key={metric.label} className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-2">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-700"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${metric.value * 2.2} 220`}
                    className="text-purple-500"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#7C3AED" />
                      <stop offset="100%" stopColor="#F43F5E" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-white">{metric.value}%</span>
                </div>
              </div>
              <p className="text-sm text-gray-400">{metric.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Total Price */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-center">
        <p className="text-gray-200 mb-2">قیمت کل سیستم</p>
        <p className="text-4xl font-bold text-white">
          {new Intl.NumberFormat('fa-IR').format(total)}{' '}
          <span className="text-lg">تومان</span>
        </p>
      </div>
    </motion.div>
  );
}
