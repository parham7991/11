'use client';

import React, { useState } from 'react';
import './smartbuild.css';

type UseCase = 'gaming' | 'office' | 'rendering' | 'streaming' | 'home';

interface Part {
  id: number;
  name: string;
  category: string;
  categoryName: string;
  categoryIcon: string;
  price: number;
  finalPrice: number;
  discountPercent: number;
  inStock: boolean;
  image: string | null;
  url: string;
  specs: Record<string, any>;
  pickReason?: string;
}

interface BuildResult {
  ok: boolean;
  useCase: UseCase;
  useCaseName: string;
  useCaseIcon: string;
  budget: number;
  totalPrice: number;
  totalBefore: number;
  totalAfter: number;
  totalSaving: number;
  savingPercent: number;
  parts: Part[];
  compatibility: {
    score: number;
    issues: any[];
    warnings: any[];
    buildable: boolean;
    summary: {
      errors: number;
      warnings: number;
      grade: string;
    };
  };
  performance: {
    total: number;
    breakdown: Record<string, any>;
    grade: string;
  };
  bottlenecks: any[];
  priceRanges: Record<string, any>;
  optimizations: any[];
  aiUsed: boolean;
  metadata: {
    requestId: string;
    timestamp: string;
    totalComponents: number;
    selectedCount: number;
    latencyMs: number;
  };
}

const USE_CASES: Record<UseCase, { name: string; icon: string; description: string }> = {
  gaming: {
    name: 'گیمینگ',
    icon: '🎮',
    description: 'بازی‌های سنگین با کیفیت بالا'
  },
  office: {
    name: 'اداری',
    icon: '💼',
    description: 'کارهای روزمره و اداری'
  },
  rendering: {
    name: 'رندرینگ',
    icon: '🎨',
    description: 'طراحی سه‌بعدی و رندر'
  },
  streaming: {
    name: 'استریم',
    icon: '📹',
    description: 'پخش زنده و تولید محتوا'
  },
  home: {
    name: 'خانگی',
    icon: '🏠',
    description: 'استفاده خانگی و مالتی‌مدیا'
  }
};

const BUDGET_PRESETS = [
  { label: 'اقتصادی', value: 30000000, icon: '💰' },
  { label: 'میان‌رده', value: 50000000, icon: '💎' },
  { label: 'بالارده', value: 80000000, icon: '🚀' },
  { label: 'حرفه‌ای', value: 120000000, icon: '⭐' }
];

export default function SmartBuildWizard() {
  const [step, setStep] = useState(1);
  const [useCase, setUseCase] = useState<UseCase>('gaming');
  const [budget, setBudget] = useState(50000000);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BuildResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBuild = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/assemble', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useCase, budget })
      });

      const data = await response.json();
      
      if (data.ok) {
        setResult(data);
        setStep(3);
      } else {
        setError(data.error || 'خطا در ساخت سیستم');
      }
    } catch (err) {
      setError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('fa-IR') + ' تومان';
  };

  return (
    <div className="smartbuild-container">
      <div className="smartbuild-header">
        <h1 className="smartbuild-title">
          <span className="smartbuild-title-icon">🔧</span>
          اسمبل هوشمند SmartBuild Pro
        </h1>
        <p className="smartbuild-subtitle">
          سیستم کامپیوتر رویایی خود را با هوش مصنوعی بسازید
        </p>
      </div>

      {/* Progress Bar */}
      <div className="smartbuild-progress">
        <div className="smartbuild-progress-bar">
          <div 
            className="smartbuild-progress-fill" 
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
        <div className="smartbuild-progress-steps">
          <div className={`smartbuild-progress-step ${step >= 1 ? 'active' : ''}`}>
            <div className="smartbuild-progress-step-number">1</div>
            <div className="smartbuild-progress-step-label">انتخاب کاربری</div>
          </div>
          <div className={`smartbuild-progress-step ${step >= 2 ? 'active' : ''}`}>
            <div className="smartbuild-progress-step-number">2</div>
            <div className="smartbuild-progress-step-label">تنظیم بودجه</div>
          </div>
          <div className={`smartbuild-progress-step ${step >= 3 ? 'active' : ''}`}>
            <div className="smartbuild-progress-step-number">3</div>
            <div className="smartbuild-progress-step-label">نتیجه</div>
          </div>
        </div>
      </div>

      {/* Step 1: Use Case Selection */}
      {step === 1 && (
        <div className="smartbuild-step">
          <h2 className="smartbuild-step-title">
            <span className="smartbuild-step-icon">🎯</span>
            نوع کاربری خود را انتخاب کنید
          </h2>
          
          <div className="smartbuild-usecases">
            {Object.entries(USE_CASES).map(([key, config]) => (
              <button
                key={key}
                className={`smartbuild-usecase ${useCase === key ? 'active' : ''}`}
                onClick={() => setUseCase(key as UseCase)}
              >
                <div className="smartbuild-usecase-icon">{config.icon}</div>
                <div className="smartbuild-usecase-content">
                  <div className="smartbuild-usecase-name">{config.name}</div>
                  <div className="smartbuild-usecase-desc">{config.description}</div>
                </div>
                {useCase === key && (
                  <div className="smartbuild-usecase-check">✓</div>
                )}
              </button>
            ))}
          </div>

          <div className="smartbuild-actions">
            <button 
              className="smartbuild-btn smartbuild-btn-primary"
              onClick={() => setStep(2)}
            >
              مرحله بعد
              <span className="smartbuild-btn-icon">←</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Budget Selection */}
      {step === 2 && (
        <div className="smartbuild-step">
          <h2 className="smartbuild-step-title">
            <span className="smartbuild-step-icon">💰</span>
            بودجه خود را مشخص کنید
          </h2>

          <div className="smartbuild-budget-presets">
            {BUDGET_PRESETS.map((preset) => (
              <button
                key={preset.value}
                className={`smartbuild-budget-preset ${budget === preset.value ? 'active' : ''}`}
                onClick={() => setBudget(preset.value)}
              >
                <div className="smartbuild-budget-preset-icon">{preset.icon}</div>
                <div className="smartbuild-budget-preset-label">{preset.label}</div>
                <div className="smartbuild-budget-preset-value">
                  {formatPrice(preset.value)}
                </div>
              </button>
            ))}
          </div>

          <div className="smartbuild-budget-custom">
            <label className="smartbuild-budget-label">
              یا بودجه دلخواه خود را وارد کنید:
            </label>
            <div className="smartbuild-budget-input-wrapper">
              <input
                type="number"
                className="smartbuild-budget-input"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                min={10000000}
                max={500000000}
                step={1000000}
              />
              <span className="smartbuild-budget-currency">تومان</span>
            </div>
            <div className="smartbuild-budget-range">
              <input
                type="range"
                className="smartbuild-budget-slider"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                min={10000000}
                max={500000000}
                step={1000000}
              />
              <div className="smartbuild-budget-slider-labels">
                <span>۱۰ میلیون</span>
                <span>۵۰۰ میلیون</span>
              </div>
            </div>
          </div>

          <div className="smartbuild-budget-summary">
            <div className="smartbuild-budget-summary-item">
              <span className="smartbuild-budget-summary-label">کاربری:</span>
              <span className="smartbuild-budget-summary-value">
                {USE_CASES[useCase].icon} {USE_CASES[useCase].name}
              </span>
            </div>
            <div className="smartbuild-budget-summary-item">
              <span className="smartbuild-budget-summary-label">بودجه:</span>
              <span className="smartbuild-budget-summary-value">
                {formatPrice(budget)}
              </span>
            </div>
          </div>

          <div className="smartbuild-actions">
            <button 
              className="smartbuild-btn smartbuild-btn-secondary"
              onClick={() => setStep(1)}
            >
              <span className="smartbuild-btn-icon">→</span>
              مرحله قبل
            </button>
            <button 
              className="smartbuild-btn smartbuild-btn-primary"
              onClick={handleBuild}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="smartbuild-btn-spinner" />
                  در حال ساخت...
                </>
              ) : (
                <>
                  ساخت سیستم
                  <span className="smartbuild-btn-icon">⚡</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="smartbuild-error">
              <span className="smartbuild-error-icon">⚠️</span>
              {error}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Result */}
      {step === 3 && result && (
        <div className="smartbuild-step">
          <div className="smartbuild-result-header">
            <div className="smartbuild-result-badge">
              <span className="smartbuild-result-badge-icon">{result.useCaseIcon}</span>
              <span className="smartbuild-result-badge-text">
                سیستم {result.useCaseName}
              </span>
            </div>
            
            <div className="smartbuild-result-scores">
              <div className="smartbuild-result-score">
                <div className="smartbuild-result-score-circle" data-score={result.compatibility.score}>
                  <span className="smartbuild-result-score-value">{result.compatibility.score}</span>
                </div>
                <div className="smartbuild-result-score-label">سازگاری</div>
                <div className="smartbuild-result-score-grade">{result.compatibility.summary.grade}</div>
              </div>
              
              <div className="smartbuild-result-score">
                <div className="smartbuild-result-score-circle" data-score={result.performance.total}>
                  <span className="smartbuild-result-score-value">{result.performance.total}</span>
                </div>
                <div className="smartbuild-result-score-label">عملکرد</div>
                <div className="smartbuild-result-score-grade">{result.performance.grade}</div>
              </div>
            </div>
          </div>

          <div className="smartbuild-result-summary">
            <div className="smartbuild-result-summary-item">
              <div className="smartbuild-result-summary-label">قیمت کل:</div>
              <div className="smartbuild-result-summary-value smartbuild-result-summary-price">
                {formatPrice(result.totalPrice)}
              </div>
            </div>
            
            {result.totalSaving > 0 && (
              <div className="smartbuild-result-summary-item smartbuild-result-summary-saving">
                <div className="smartbuild-result-summary-label">تخفیف:</div>
                <div className="smartbuild-result-summary-value">
                  {formatPrice(result.totalSaving)} ({result.savingPercent}%)
                </div>
              </div>
            )}

            <div className="smartbuild-result-summary-item">
              <div className="smartbuild-result-summary-label">تعداد قطعات:</div>
              <div className="smartbuild-result-summary-value">
                {result.parts.length} قطعه
              </div>
            </div>
          </div>

          <div className="smartbuild-parts-list">
            {result.parts.map((part) => (
              <div key={part.id} className="smartbuild-part">
                <div className="smartbuild-part-header">
                  <div className="smartbuild-part-icon">{part.categoryIcon}</div>
                  <div className="smartbuild-part-info">
                    <div className="smartbuild-part-category">{part.categoryName}</div>
                    <div className="smartbuild-part-name">{part.name}</div>
                  </div>
                  <div className="smartbuild-part-price">
                    {part.discountPercent > 0 && (
                      <div className="smartbuild-part-price-old">
                        {formatPrice(part.price)}
                      </div>
                    )}
                    <div className="smartbuild-part-price-final">
                      {formatPrice(part.finalPrice)}
                    </div>
                    {part.discountPercent > 0 && (
                      <div className="smartbuild-part-discount">
                        {part.discountPercent}% تخفیف
                      </div>
                    )}
                  </div>
                </div>
                
                {part.pickReason && (
                  <div className="smartbuild-part-reason">
                    <span className="smartbuild-part-reason-icon">💡</span>
                    {part.pickReason}
                  </div>
                )}

                {Object.keys(part.specs).length > 0 && (
                  <div className="smartbuild-part-specs">
                    {Object.entries(part.specs).map(([key, value]) => (
                      <div key={key} className="smartbuild-part-spec">
                        <span className="smartbuild-part-spec-label">{key}:</span>
                        <span className="smartbuild-part-spec-value">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {result.bottlenecks.length > 0 && (
            <div className="smartbuild-bottlenecks">
              <h3 className="smartbuild-bottlenecks-title">
                <span className="smartbuild-bottlenecks-icon">⚠️</span>
                گلوگاه‌های شناسایی شده
              </h3>
              {result.bottlenecks.map((bottleneck, index) => (
                <div key={index} className="smartbuild-bottleneck">
                  <div className="smartbuild-bottleneck-message">{bottleneck.message}</div>
                  <div className="smartbuild-bottleneck-suggestion">{bottleneck.suggestion}</div>
                </div>
              ))}
            </div>
          )}

          <div className="smartbuild-actions">
            <button 
              className="smartbuild-btn smartbuild-btn-secondary"
              onClick={() => {
                setStep(1);
                setResult(null);
              }}
            >
              <span className="smartbuild-btn-icon">🔄</span>
              ساخت سیستم جدید
            </button>
            <button className="smartbuild-btn smartbuild-btn-primary">
              <span className="smartbuild-btn-icon">🛒</span>
              افزودن به سبد خرید
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
