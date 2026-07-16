'use client';

/**
 * ════════════════════════════════════════════════════════════════
 * 📊 TelemetryDashboard.tsx — داشبورد تله‌متری زندهٔ آفلند v4.0
 * ════════════════════════════════════════════════════════════════
 *
 * ویجت‌های بلادرنگ (کاملاً Dark/Light aware):
 *   ⚡  گیج توان مصرفی و سلامت PSU
 *   🎯  محاسبه‌گر Bottleneck تفصیلی در ۳ رزولوشن
 *   🎮  تخمین FPS در ۴ بازی محبوب
 *   🌡️  شبیه‌ساز ترمودینامیک و دمای کاری
 *   💡  تخمین قبض برق ماهانه (با اسلایدر ساعت مصرف)
 *   ✨  دکمهٔ Auto-Balance رفع خودکار گلوگاه
 *   📚  بنچمارک سفارشی ۲۰+ عنوان
 *   🚀  آینده‌نگری + آکوستیک + هشدارهای تداخل
 * ════════════════════════════════════════════════════════════════
 */

import React, { useMemo, useState } from 'react';
import {
  buildFullTelemetry,
  estimateMonthlyElectricity,
  performLiveAiValidation,
  type TelemetryPart,
  type PsuStatus,
  type BottleneckReport,
  type ThermalStatus,
  type LiveAiStatus,
} from '@/lib/ai-chat/telemetry';
import {
  COMPLETE_BENCHMARK_LIBRARY,
  BENCHMARK_CATEGORY_LABELS,
  estimateBenchmark,
  type BenchmarkCategory,
} from '@/lib/ai-chat/benchmark-library';

type Props = {
  parts: TelemetryPart[];
  compact?: boolean;
  onAutoBalance?: (targetCategory: 'cpu' | 'gpu' | 'ram' | null) => void;
};

const PSU_COLORS: Record<PsuStatus, { bg: string }> = {
  GREEN: { bg: '#10b981' },
  YELLOW: { bg: '#f59e0b' },
  RED: { bg: '#ef4444' },
};

const THERMAL_LABEL: Record<ThermalStatus, string> = {
  OPTIMAL: '❄️ عملکرد بسیار خنک',
  WARM: '⚡ دمای استاندارد کاری',
  THROTTLING_DANGER: '🔥 هشدار داغی شدید',
};

function BottleneckPill({ report }: { report: BottleneckReport }) {
  const color =
    report.severity === 'BALANCED'
      ? '#10b981'
      : report.severity === 'LOW'
        ? '#3b82f6'
        : report.severity === 'MEDIUM'
          ? '#f59e0b'
          : '#ef4444';
  return (
    <div className="asm-tele__bnpill" style={{ borderColor: color }}>
      <span className="asm-tele__bnpill-res">{report.resolution}</span>
      <span className="asm-tele__bnpill-val" style={{ color }}>
        {report.severity === 'BALANCED'
          ? 'توازن'
          : `${report.percentage}٪ ${report.limitingComponent === 'CPU' ? 'CPU' : report.limitingComponent === 'GPU' ? 'GPU' : ''}`}
      </span>
    </div>
  );
}

export default function TelemetryDashboard({ parts, compact = false, onAutoBalance }: Props) {
  const [dailyHours, setDailyHours] = useState<number>(6);
  const [activeBenchTab, setActiveBenchTab] = useState<BenchmarkCategory>('GAME_AAA');

  const t = useMemo(() => buildFullTelemetry(parts || []), [parts]);
  const liveCheck = useMemo(() => performLiveAiValidation(parts || []), [parts]);
  const electricity = useMemo(
    () => estimateMonthlyElectricity(parts || [], dailyHours),
    [parts, dailyHours]
  );
  const benchmarks = useMemo(
    () => COMPLETE_BENCHMARK_LIBRARY.filter((b) => b.category === activeBenchTab),
    [activeBenchTab]
  );

  if (!parts?.length) return null;

  const liveBadgeClass: Record<LiveAiStatus, string> = {
    VERIFIED_PERFECT: 'asm-tele__live--ok',
    WARNING: 'asm-tele__live--warn',
    CRITICAL_ERROR: 'asm-tele__live--danger',
  };

  const psuColor = PSU_COLORS[t.power.status];
  const loadPct = Math.min(100, Math.max(0, t.power.loadPercentage));
  const cpuLoad = t.thermal.estimatedCpuLoadTempC;
  const gpuLoad = t.thermal.estimatedGpuLoadTempC;

  const cpuTempClass =
    cpuLoad >= 90
      ? 'asm-tele__temp-cell asm-tele__temp-cell--danger'
      : cpuLoad >= 78
        ? 'asm-tele__temp-cell asm-tele__temp-cell--warm'
        : 'asm-tele__temp-cell asm-tele__temp-cell--ok';

  const gpuTempClass =
    gpuLoad >= 88
      ? 'asm-tele__temp-cell asm-tele__temp-cell--danger'
      : gpuLoad >= 76
        ? 'asm-tele__temp-cell asm-tele__temp-cell--warm'
        : 'asm-tele__temp-cell asm-tele__temp-cell--ok';

  return (
    <div className={`asm-tele${compact ? 'asm-tele--compact' : ''}`}>
      <div className="asm-tele__header">
        <span className="asm-tele__title">
          <span className="asm-tele__pulse" /> داشبورد تله‌متری زنده
        </span>
        <span className="asm-tele__sub">تحلیل بلادرنگ سیستم اسمبل‌شده</span>
      </div>

      {/* ═════ v6.0: بنر بررسی زندهٔ هوش مصنوعی ═════ */}
      <div className={`asm-tele__live ${liveBadgeClass[liveCheck.status]}`}>
        <div className="asm-tele__live-head">
          <span className="asm-tele__live-ico">
            {liveCheck.status === 'VERIFIED_PERFECT'
              ? '🤖✅'
              : liveCheck.status === 'CRITICAL_ERROR'
                ? '🤖❌'
                : '🤖⚠️'}
          </span>
          <span className="asm-tele__live-txt">{liveCheck.aiLiveSummaryFa}</span>
        </div>
        {liveCheck.issues.length > 0 && (
          <ul className="asm-tele__live-list">
            {liveCheck.issues.slice(0, 5).map((iss, i) => (
              <li
                key={i}
                className={`asm-tele__live-item asm-tele__live-item--${iss.severity.toLowerCase()}`}
              >
                <b>
                  {iss.severity === 'CRITICAL'
                    ? '⛔ بحرانی'
                    : iss.severity === 'WARNING'
                      ? '⚠️ هشدار'
                      : 'ℹ️'}
                </b>{' '}
                [{iss.partCategory}] {iss.message}
                <small>💡 راهکار: {iss.suggestedFix}</small>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="asm-tele__grid">
        {/* ═════ کارت ۱: گیج توان ═════ */}
        <div className="asm-tele__card">
          <div className="asm-tele__card-head">
            <span className="asm-tele__ico">⚡</span>
            <span className="asm-tele__cap">مصرف توان و سلامت پاور</span>
          </div>
          <div className="asm-tele__gauge">
            <div className="asm-tele__gauge-track">
              <div
                className="asm-tele__gauge-fill progress-bar-smooth"
                style={{ width: `${loadPct}%`, background: psuColor.bg }}
              />
              <div className="asm-tele__gauge-marker" style={{ left: '75%' }} title="آستانه ۷۵٪" />
              <div
                className="asm-tele__gauge-marker asm-tele__gauge-marker--danger"
                style={{ left: '90%' }}
                title="آستانه ۹۰٪"
              />
            </div>
            <div className="asm-tele__gauge-values">
              <span>
                <b>{t.power.totalTdp}W</b> مصرف کل
              </span>
              <span style={{ color: psuColor.bg }}>
                <b>{loadPct}٪</b> بار
              </span>
              <span>
                <b>{t.power.currentPsuWattage || '—'}</b>W پاور
              </span>
            </div>
          </div>
          <div className="asm-tele__msg" style={{ color: psuColor.bg }}>
            {t.power.message}
          </div>
          <div className="asm-tele__hint">
            پیشنهاد حداقل: <b>{t.power.recommendedPsuWattage.toLocaleString('fa-IR')}W</b>
            {t.power.currentPsuWattage > 0 && (
              <>
                {' '}
                | حاشیهٔ امن: <b>{t.power.headroomPercent}٪</b>
              </>
            )}
          </div>
        </div>

        {/* ═════ کارت ۲: Bottleneck ═════ */}
        <div className="asm-tele__card">
          <div className="asm-tele__card-head">
            <span className="asm-tele__ico">🎯</span>
            <span className="asm-tele__cap">تحلیل گلوگاه CPU/GPU</span>
          </div>
          <div className="asm-tele__bnrow">
            <BottleneckPill report={t.bottleneck.resolution1080p} />
            <BottleneckPill report={t.bottleneck.resolution1440p} />
            <BottleneckPill report={t.bottleneck.resolution4K} />
          </div>
          <div className="asm-tele__bnmsg">{t.bottleneck.resolution1440p.description}</div>
        </div>

        {/* ═════ کارت ۳: FPS ═════ */}
        <div className="asm-tele__card">
          <div className="asm-tele__card-head">
            <span className="asm-tele__ico">🎮</span>
            <span className="asm-tele__cap">تخمین فریم‌ریت در بازی‌های محبوب</span>
          </div>
          <div className="asm-tele__fpslist">
            <div className="asm-tele__fpsitem">
              <span className="asm-tele__fps-name">Cyberpunk 2077</span>
              <span className="asm-tele__fps-set">RT Ultra @ 1440p</span>
              <span className="asm-tele__fps-val">{t.fps.cyberpunk_1440p_rt} FPS</span>
            </div>
            <div className="asm-tele__fpsitem">
              <span className="asm-tele__fps-name">Warzone</span>
              <span className="asm-tele__fps-set">High @ 1080p</span>
              <span className="asm-tele__fps-val">{t.fps.warzone_1080p_high} FPS</span>
            </div>
            <div className="asm-tele__fpsitem">
              <span className="asm-tele__fps-name">CS 2</span>
              <span className="asm-tele__fps-set">Competitive @ 1080p</span>
              <span className="asm-tele__fps-val">{t.fps.cs2_1080p_pro} FPS</span>
            </div>
            <div className="asm-tele__fpsitem">
              <span className="asm-tele__fps-name">Forza Horizon 5</span>
              <span className="asm-tele__fps-set">Extreme @ 1440p</span>
              <span className="asm-tele__fps-val">{t.fps.forza_1440p_extreme} FPS</span>
            </div>
          </div>
          <div className="asm-tele__renderscore">
            امتیاز رندر (Blender / Premiere): <b>{t.renderScore}</b> از ۱۰
          </div>
        </div>

        {/* ═════ کارت ۴: Thermal Simulator ═════ */}
        <div className="asm-tele__card">
          <div className="asm-tele__card-head">
            <span className="asm-tele__ico">🌡️</span>
            <span className="asm-tele__cap">شبیه‌ساز ترمودینامیک زیر بار</span>
            <span
              className={`asm-tele__thermal-badge asm-tele__thermal-badge--${t.thermal.thermalStatus === 'OPTIMAL' ? 'optimal' : t.thermal.thermalStatus === 'WARM' ? 'warm' : 'danger'}`}
            >
              {THERMAL_LABEL[t.thermal.thermalStatus]}
            </span>
          </div>
          <div className="asm-tele__thermal-grid">
            <div className={cpuTempClass}>
              <small>دمای پردازنده (CPU)</small>
              <b>{cpuLoad}°C</b>
            </div>
            <div className={gpuTempClass}>
              <small>هات‌اسپات گرافیک (GPU)</small>
              <b>{gpuLoad}°C</b>
            </div>
          </div>
          {t.thermal.thermalPasteRecommendation && (
            <div className="asm-tele__paste-tip">🚨 {t.thermal.thermalPasteRecommendation}</div>
          )}
          <div className="asm-tele__airflow">
            <span>شاخص تهویه هوای کیس:</span>
            <span>
              <b>{t.thermal.airflowScore}</b> / ۱۰۰
            </span>
          </div>
        </div>

        {/* ═════ کارت ۵: Electricity ═════ */}
        <div className="asm-tele__card">
          <div className="asm-tele__card-head">
            <span className="asm-tele__ico">💡</span>
            <span className="asm-tele__cap">تخمین قبض برق ماهانه</span>
          </div>
          <div className="asm-tele__elec-row">
            <div className="asm-tele__elec-cell">
              <small>توان AC از پریز</small>
              <b>{electricity.acPullWatts.toLocaleString('fa-IR')} W</b>
            </div>
            <div className="asm-tele__elec-cell">
              <small>مصرف ماهانه</small>
              <b>{electricity.monthlyKWh.toLocaleString('fa-IR')} kWh</b>
            </div>
            <div className="asm-tele__elec-cell">
              <small>هزینهٔ برق ماهانه</small>
              <b>{electricity.monthlyCostToman.toLocaleString('fa-IR')} تومان</b>
            </div>
            <div className="asm-tele__elec-cell">
              <small>هزینهٔ برق سالانه</small>
              <b>{electricity.yearlyCostToman.toLocaleString('fa-IR')} تومان</b>
            </div>
          </div>
          <div className="asm-tele__elec-slider">
            <span>ساعت مصرف روزانه:</span>
            <input
              type="range"
              min={1}
              max={24}
              step={1}
              value={dailyHours}
              onChange={(e) => setDailyHours(Number(e.target.value))}
              aria-label="ساعت مصرف روزانه"
            />
            <b style={{ color: 'var(--at-primary)' }}>{dailyHours.toLocaleString('fa-IR')} ساعت</b>
          </div>
          <div className="asm-tele__elec-cert">
            گواهی پاور: <b>{electricity.psuCertification}</b> — راندمان{' '}
            {electricity.psuEfficiencyPercent}٪
          </div>
        </div>

        {/* ═════ کارت ۶: Future-Proof + Acoustic ═════ */}
        <div className="asm-tele__card">
          <div className="asm-tele__card-head">
            <span className="asm-tele__ico">🚀</span>
            <span className="asm-tele__cap">آینده‌نگری و آکوستیک</span>
          </div>
          <div className="asm-tele__futurescore">
            <div
              className="asm-tele__scoreCircle"
              style={{ '--score': t.futureProofing.score } as React.CSSProperties}
            >
              <span>{t.futureProofing.score}</span>
              <small>از ۱۰</small>
            </div>
            <ul className="asm-tele__reasons">
              {t.futureProofing.reasons.slice(0, 3).map((r, i) => (
                <li key={i}>{r}</li>
              ))}
              {t.futureProofing.reasons.length === 0 && (
                <li>ترکیب فعلی برای آینده‌نگری استاندارد است.</li>
              )}
            </ul>
          </div>
          <div className="asm-tele__acoustic">
            <span className="asm-tele__ac-ico">
              {t.acoustic.rating === 'Ultra Silent'
                ? '🔇'
                : t.acoustic.rating === 'Balanced Airflow'
                  ? '🔉'
                  : '🔊'}
            </span>
            <span className="asm-tele__ac-txt">
              <b>{t.acoustic.rating}</b> — حدود <b>{t.acoustic.estimatedDB} dB</b>
              <span className="asm-tele__ac-desc">{t.acoustic.description}</span>
            </span>
          </div>
        </div>
      </div>

      {/* ═════ دکمه Auto-Balance ═════ */}
      {t.autoBalance.needsBalance && (
        <div className="asm-tele__autobalance">
          <div className="asm-tele__autobalance-text">
            {t.autoBalance.reason}
            <small>هوش مصنوعی می‌تواند بدون تغییر جمع کل، قطعهٔ نامتعادل را جایگزین کند.</small>
          </div>
          {onAutoBalance && (
            <button
              type="button"
              className="asm-tele__autobalance-btn"
              onClick={() => onAutoBalance(t.autoBalance.targetCategory)}
            >
              {t.autoBalance.ctaText}
            </button>
          )}
        </div>
      )}

      {/* ═════ بنچمارک سفارشی ═════ */}
      <div className="asm-tele__benchmarks">
        <div
          className="asm-tele__card-head"
          style={{ borderBottom: 0, paddingBottom: 0, marginBottom: 8 }}
        >
          <span className="asm-tele__ico">📚</span>
          <span className="asm-tele__cap">
            کتابخانهٔ بنچمارک زنده — {COMPLETE_BENCHMARK_LIBRARY.length}+ عنوان
          </span>
        </div>
        <div className="asm-tele__bench-tabs">
          {(Object.keys(BENCHMARK_CATEGORY_LABELS) as BenchmarkCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              className={`asm-tele__bench-tab${activeBenchTab === cat ? 'asm-tele__bench-tab--active' : ''}`}
              onClick={() => setActiveBenchTab(cat)}
            >
              {BENCHMARK_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
        <div className="asm-tele__bench-list">
          {benchmarks.map((bench) => {
            const est = estimateBenchmark(bench, parts);
            return (
              <div key={bench.id} className="asm-tele__bench-item">
                <div className="asm-tele__bench-title">{bench.title}</div>
                <div className="asm-tele__bench-desc">{bench.descriptionFa}</div>
                <div className="asm-tele__bench-result">
                  <span className="asm-tele__bench-value">{est.formatted}</span>
                  <span className={`asm-tele__bench-ready asm-tele__bench-ready--${est.readiness}`}>
                    {est.readiness === 'excellent'
                      ? 'عالی'
                      : est.readiness === 'good'
                        ? 'مناسب'
                        : est.readiness === 'fair'
                          ? 'قابل‌قبول'
                          : 'ناکافی'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═════ هشدارهای تداخل فیزیکی ═════ */}
      {t.physicalClearances.length > 0 && (
        <div className="asm-tele__issues">
          <div className="asm-tele__issues-head">
            <span>📐</span> بررسی تداخل‌های فیزیکی ({t.physicalClearances.length})
          </div>
          {t.physicalClearances.map((iss, i) => (
            <div key={i} className={`asm-tele__issue asm-tele__issue--${iss.type.toLowerCase()}`}>
              <div className="asm-tele__issue-title">
                {iss.type === 'CRITICAL'
                  ? '⛔ بحرانی'
                  : iss.type === 'WARNING'
                    ? '⚠️ هشدار'
                    : 'ℹ️ اطلاع'}{' '}
                — {iss.category}
              </div>
              <div className="asm-tele__issue-msg">{iss.message}</div>
              {iss.resolution && (
                <div className="asm-tele__issue-fix">راهکار: {iss.resolution}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
