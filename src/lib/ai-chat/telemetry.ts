import { isGenuineCpuCooler, validatePartCategory } from './guardrails';

/**
 * ════════════════════════════════════════════════════════════════
 * 📊 telemetry.ts — موتور تله‌متری زندهٔ اسمبل هوشمند آفلند
 * ════════════════════════════════════════════════════════════════
 *
 * محاسبات ریاضی برای:
 *   • توان مصرفی و سلامت PSU (با ۳۰٪ حاشیهٔ امن)
 *   • تشخیص Bottleneck در ۳ رزولوشن (1080p/1440p/4K)
 *   • تخمین FPS در ۴ بازی محبوب + امتیاز رندر
 *   • تشخیص تداخل فیزیکی (GPU/Cooler vs Case)
 *   • تخمین سطح نویز آکوستیک
 *   • امتیاز آینده‌نگری (Future-Proofing)
 *
 * همه توابع pure و سبک هستند تا در فرانت (memoized) با هر تغییر
 * قطعه در چند میلی‌ثانیه اجرا شوند.
 * ════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────
// 🧩 تایپ‌ها (سازگار با AssembleWizard.tsx و assembler.ts)
// ─────────────────────────────────────────────────────────────────

export interface TelemetryPart {
  id?: string | number;
  name?: string;
  category: string;
  price?: number;
  finalPrice?: number;
  quantity?: number;
  specs?: {
    // مشترک‌ها
    tdp?: number;
    tier?: string;
    // CPU
    cores?: number;
    threads?: number;
    socket?: string;
    // GPU
    vram?: number | string;
    gpuChipset?: string;
    length?: number;
    lengthMM?: number;
    wattage?: number;
    // RAM
    ramType?: string;
    capacity?: number;
    frequency?: number;
    frequencyMHz?: number;
    moduleCount?: number;
    // Storage
    size?: number;
    isNVMe?: boolean;
    pcie?: string;
    // PSU
    certification?: string;
    rating?: string;
    // Case
    formFactor?: string;
    maxGpuLength?: number;
    maxGpuLengthMM?: number;
    maxCoolerHeight?: number;
    maxCoolerHeightMM?: number;
    airflow?: boolean;
    gamingCase?: boolean;
    // Cooler
    coolerType?: string;
    coolerHeight?: number;
    type?: string;
    tdpRating?: number;
    // Motherboard
    chipset?: string;
    ramSlots?: number;
    m2Slots?: number;
    // Aesthetics
    color?: string;
    hasRGB?: boolean;
    rgb?: boolean;
    // Acoustics
    noiseLevelDB?: number;
    [k: string]: any;
  };
  [k: string]: any;
}

export type PsuStatus = 'GREEN' | 'YELLOW' | 'RED';
export type BottleneckSeverity = 'BALANCED' | 'LOW' | 'MEDIUM' | 'HIGH';
export type AcousticRating = 'Ultra Silent' | 'Balanced Airflow' | 'Performance Turbo';

export interface PowerTelemetry {
  totalTdp: number;
  recommendedPsuWattage: number;
  currentPsuWattage: number;
  loadPercentage: number;
  status: PsuStatus;
  message: string;
  headroomPercent: number;
}

export interface BottleneckReport {
  resolution: '1080p' | '1440p' | '4K';
  percentage: number;
  severity: BottleneckSeverity;
  limitingComponent: 'CPU' | 'GPU' | 'BALANCED';
  description: string;
}

export interface FpsEstimates {
  cyberpunk_1440p_rt: number;
  warzone_1080p_high: number;
  cs2_1080p_pro: number;
  forza_1440p_extreme: number;
}

export interface PhysicalClearanceIssue {
  type: 'CRITICAL' | 'WARNING' | 'INFO';
  category: string;
  message: string;
  resolution?: string;
}

// ─────────────────────────────────────────────────────────────────
// 🔧 توابع کمکی
// ─────────────────────────────────────────────────────────────────

function partByCat(parts: TelemetryPart[], category: string): TelemetryPart | undefined {
  return parts.find(p => p.category === category);
}
function partsByCat(parts: TelemetryPart[], category: string): TelemetryPart[] {
  return parts.filter(p => p.category === category);
}
function qty(p?: TelemetryPart): number {
  return Math.max(1, Number(p?.quantity || 1));
}
function nameLower(p?: TelemetryPart): string {
  return String(p?.name || '').toLowerCase();
}

/**
 * تخمین TDP پردازنده بر اساس نام (اگر specs.tdp نبود)
 */
function estimateCpuTdp(cpu?: TelemetryPart): number {
  if (!cpu) return 0;
  const spec = Number(cpu.specs?.tdp || 0);
  if (spec > 0) return spec;
  const n = nameLower(cpu);
  // Intel/AMD flagship
  if (/i9|ryzen\s*9|r9\b/.test(n)) return 250;
  if (/i7|ryzen\s*7|r7\b/.test(n)) return 180;
  if (/i5|ryzen\s*5|r5\b/.test(n)) return 125;
  if (/i3|ryzen\s*3|r3\b/.test(n)) return 90;
  if (/pentium|celeron/.test(n)) return 65;
  return 95; // پیش‌فرض ایمن
}

/**
 * تخمین TGP کارت گرافیک بر اساس نام/رده
 */
function estimateGpuTgp(gpu?: TelemetryPart): number {
  if (!gpu) return 0;
  const spec = Number(gpu.specs?.wattage || gpu.specs?.tdp || 0);
  if (spec > 0) return spec;
  const n = nameLower(gpu);
  if (/rtx\s*40?90/.test(n)) return 450;
  if (/rtx\s*40?80/.test(n)) return 320;
  if (/rtx\s*40?70\s*ti/.test(n)) return 285;
  if (/rtx\s*40?70/.test(n)) return 220;
  if (/rtx\s*40?60\s*ti/.test(n)) return 165;
  if (/rtx\s*40?60/.test(n)) return 115;
  if (/rtx\s*50?90/.test(n)) return 575;
  if (/rtx\s*50?80/.test(n)) return 360;
  if (/rtx\s*50?70/.test(n)) return 250;
  if (/rtx\s*30?90/.test(n)) return 350;
  if (/rtx\s*30?80/.test(n)) return 320;
  if (/rtx\s*30?70/.test(n)) return 220;
  if (/rtx\s*30?60/.test(n)) return 170;
  if (/rx\s*7900/.test(n)) return 355;
  if (/rx\s*7800/.test(n)) return 263;
  if (/rx\s*7700/.test(n)) return 245;
  if (/rx\s*7600/.test(n)) return 165;
  const tier = String(gpu.specs?.tier || '');
  if (tier === 'ultra') return 320;
  if (tier === 'high') return 250;
  if (tier === 'medium') return 170;
  if (tier === 'entry') return 110;
  return 150;
}

/**
 * امتیاز کارایی نسبی CPU (0–100)
 */
export function cpuPerformanceScore(cpu?: TelemetryPart): number {
  if (!cpu) return 0;
  const n = nameLower(cpu);
  const cores = Number(cpu.specs?.cores || 0);
  const tier = String(cpu.specs?.tier || '');
  let base = 30;
  if (/i9|ryzen\s*9|r9\b/.test(n)) base = 92;
  else if (/i7|ryzen\s*7|r7\b/.test(n)) base = 78;
  else if (/i5|ryzen\s*5|r5\b/.test(n)) base = 62;
  else if (/i3|ryzen\s*3|r3\b/.test(n)) base = 42;
  // نسل مدرن‌تر ⇒ امتیاز بیشتر
  if (/14\d{3}|15\d{3}|9\d{3}|core ultra|arrow/.test(n)) base += 10;
  else if (/13\d{3}|7\d{3}x/.test(n)) base += 6;
  // تعداد هسته
  if (cores >= 16) base += 6;
  else if (cores >= 12) base += 4;
  if (tier === 'ultra') base = Math.max(base, 90);
  else if (tier === 'high') base = Math.max(base, 75);
  return Math.max(0, Math.min(100, base));
}

/**
 * امتیاز کارایی نسبی GPU (0–100)
 */
export function gpuPerformanceScore(gpu?: TelemetryPart): number {
  if (!gpu) return 0;
  const n = nameLower(gpu);
  const tier = String(gpu.specs?.tier || '');
  let base = 20;
  if (/rtx\s*50?90/.test(n)) base = 100;
  else if (/rtx\s*50?80|rtx\s*40?90/.test(n)) base = 96;
  else if (/rtx\s*50?70|rtx\s*40?80/.test(n)) base = 88;
  else if (/rtx\s*40?70\s*ti/.test(n)) base = 82;
  else if (/rtx\s*40?70|rx\s*7900\s*xt/.test(n)) base = 76;
  else if (/rtx\s*40?60\s*ti|rx\s*7800/.test(n)) base = 68;
  else if (/rtx\s*40?60|rtx\s*30?70|rx\s*7700/.test(n)) base = 60;
  else if (/rtx\s*30?60|rx\s*7600|rx\s*6700/.test(n)) base = 52;
  else if (/rtx\s*30?50|gtx\s*16/.test(n)) base = 40;
  if (tier === 'ultra') base = Math.max(base, 92);
  else if (tier === 'high') base = Math.max(base, 72);
  else if (tier === 'medium') base = Math.max(base, 55);
  return Math.max(0, Math.min(100, base));
}

// ─────────────────────────────────────────────────────────────────
// ⚡ ۱) توان مصرفی و سلامت PSU
// ─────────────────────────────────────────────────────────────────

export function calculatePowerTelemetry(parts: TelemetryPart[]): PowerTelemetry {
  const cpu = partByCat(parts, 'cpu');
  const gpu = partByCat(parts, 'gpu');
  const psu = partByCat(parts, 'psu');

  const cpuTdp = estimateCpuTdp(cpu);
  const gpuTgp = estimateGpuTgp(gpu);
  const baseSystem = 90; // مادربرد ~50 + رم ~15 + storage/fans ~25

  const totalTdp = cpuTdp + gpuTgp + baseSystem;
  const recommendedPsuWattage = Math.max(
    450,
    Math.ceil((totalTdp * 1.3) / 50) * 50
  );

  const currentPsuWattage = Number(psu?.specs?.wattage || 0);

  if (!currentPsuWattage) {
    return {
      totalTdp,
      recommendedPsuWattage,
      currentPsuWattage: 0,
      loadPercentage: 0,
      status: 'GREEN',
      message: `حداقل منبع تغذیهٔ پیشنهادی: ${recommendedPsuWattage.toLocaleString('fa-IR')} وات`,
      headroomPercent: 0,
    };
  }

  const loadPercentage = Math.round((totalTdp / currentPsuWattage) * 100);
  const headroomPercent = Math.max(0, 100 - loadPercentage);

  let status: PsuStatus = 'GREEN';
  let message = 'منبع تغذیه دارای راندمان عالی و حاشیهٔ امن مناسب است.';

  if (loadPercentage >= 90) {
    status = 'RED';
    message = `هشدار بحرانی: مصرف سیستم (${totalTdp}W) بسیار نزدیک به ظرفیت پاور (${currentPsuWattage}W) است.`;
  } else if (loadPercentage >= 75) {
    status = 'YELLOW';
    message = `مصرف تحت بار سنگین حدود ${loadPercentage}٪ ظرفیت پاور است؛ ارتقا توصیه می‌شود.`;
  } else if (loadPercentage < 40) {
    status = 'GREEN';
    message = `مصرف زیر ۴۰٪ — راندمان عالی، پاور بسیار خنک کار می‌کند.`;
  }

  return {
    totalTdp,
    recommendedPsuWattage,
    currentPsuWattage,
    loadPercentage,
    status,
    message,
    headroomPercent,
  };
}

// ─────────────────────────────────────────────────────────────────
// 🎯 ۲) تشخیص Bottleneck در ۳ رزولوشن
// ─────────────────────────────────────────────────────────────────

/**
 * محاسبهٔ Bottleneck بر اساس فرمول کلاسیک PCPP:
 *   1080p: CPU sensitive (60/40)
 *   1440p: balanced       (50/50)
 *   4K:    GPU sensitive  (30/70)
 */
export function calculateBottleneck(
  parts: TelemetryPart[],
  resolution: '1080p' | '1440p' | '4K'
): BottleneckReport {
  const cpu = partByCat(parts, 'cpu');
  const gpu = partByCat(parts, 'gpu');
  const cpuScore = cpuPerformanceScore(cpu);
  const gpuScore = gpuPerformanceScore(gpu);

  if (!cpu || !gpu) {
    return {
      resolution,
      percentage: 0,
      severity: 'BALANCED',
      limitingComponent: 'BALANCED',
      description: 'برای تحلیل گلوگاه، CPU و GPU باید انتخاب شوند.',
    };
  }

  // وزن‌ها بر اساس رزولوشن
  const w = resolution === '1080p'
    ? { cpu: 0.6, gpu: 0.4 }
    : resolution === '1440p'
      ? { cpu: 0.5, gpu: 0.5 }
      : { cpu: 0.3, gpu: 0.7 };

  const effectiveCpu = cpuScore * w.cpu;
  const effectiveGpu = gpuScore * w.gpu;
  const total = effectiveCpu + effectiveGpu;
  const diff = Math.abs(effectiveCpu - effectiveGpu);
  const percentage = total > 0 ? Math.round((diff / total) * 100) : 0;

  const limitingComponent: 'CPU' | 'GPU' | 'BALANCED' =
    percentage < 5 ? 'BALANCED' : effectiveCpu < effectiveGpu ? 'CPU' : 'GPU';

  const severity: BottleneckSeverity =
    percentage < 5 ? 'BALANCED' :
    percentage < 10 ? 'LOW' :
    percentage < 18 ? 'MEDIUM' : 'HIGH';

  let description = '';
  if (severity === 'BALANCED') {
    description = `توازن عالی در ${resolution}؛ CPU و GPU هماهنگ کار می‌کنند.`;
  } else if (limitingComponent === 'CPU') {
    description = `در رزولوشن ${resolution}، پردازنده نمی‌تواند از تمام ظرفیت کارت گرافیک استفاده کند و حدود ${percentage}٪ گلوگاه پردازشی ایجاد می‌شود.`;
  } else {
    description = `در رزولوشن ${resolution}، کارت گرافیک نقطهٔ محدودکننده است و حدود ${percentage}٪ گلوگاه گرافیکی وجود دارد.`;
  }

  return { resolution, percentage, severity, limitingComponent, description };
}

/** خلاصهٔ Bottleneck برای هر ۳ رزولوشن */
export function calculateBottleneckSummary(parts: TelemetryPart[]) {
  return {
    resolution1080p: calculateBottleneck(parts, '1080p'),
    resolution1440p: calculateBottleneck(parts, '1440p'),
    resolution4K: calculateBottleneck(parts, '4K'),
  };
}

// ─────────────────────────────────────────────────────────────────
// 🎮 ۳) تخمین FPS در ۴ بازی محبوب + امتیاز رندر
// ─────────────────────────────────────────────────────────────────

export function estimateFps4Games(parts: TelemetryPart[]): FpsEstimates {
  const gpu = partByCat(parts, 'gpu');
  const cpu = partByCat(parts, 'cpu');
  const ram = partByCat(parts, 'ram');

  const gScore = gpuPerformanceScore(gpu);
  const cScore = cpuPerformanceScore(cpu);
  const ramCap = Number(ram?.specs?.capacity || 0) * qty(ram);
  const ramPenalty = ramCap && ramCap < 16 ? 0.8 : 1;

  // Cyberpunk 1440p RT Ultra — بسیار GPU-bound
  const cyberpunk_1440p_rt = Math.max(
    15,
    Math.round((gScore * 0.85 + cScore * 0.15) * 0.9 * ramPenalty)
  );

  // Warzone 1080p High — متوازن
  const warzone_1080p_high = Math.max(
    30,
    Math.round((gScore * 0.55 + cScore * 0.45) * 1.7 * ramPenalty)
  );

  // CS2 1080p Pro — CPU-bound شدید
  const cs2_1080p_pro = Math.max(
    60,
    Math.round((gScore * 0.35 + cScore * 0.65) * 3.2 * ramPenalty)
  );

  // Forza Horizon 5 1440p Extreme — کاملاً متوازن
  const forza_1440p_extreme = Math.max(
    30,
    Math.round((gScore * 0.6 + cScore * 0.4) * 1.4 * ramPenalty)
  );

  return { cyberpunk_1440p_rt, warzone_1080p_high, cs2_1080p_pro, forza_1440p_extreme };
}

/** امتیاز رندر ۱ تا ۱۰ (Blender/Premiere) */
export function renderScore(parts: TelemetryPart[]): number {
  const cpu = partByCat(parts, 'cpu');
  const gpu = partByCat(parts, 'gpu');
  const ram = partByCat(parts, 'ram');
  const storage = partByCat(parts, 'storage');

  const cores = Number(cpu?.specs?.cores || 0);
  const ramCap = Number(ram?.specs?.capacity || 0) * qty(ram);
  const isNvme = Boolean(storage?.specs?.isNVMe);
  const gScore = gpuPerformanceScore(gpu);

  let score = 0;
  score += Math.min(4, cores * 0.25);          // تا 4 امتیاز از CPU cores
  score += Math.min(3, ramCap / 22);           // تا ~3 امتیاز از RAM (64GB=full)
  score += (gScore / 100) * 2.5;               // تا 2.5 از GPU
  score += isNvme ? 0.5 : 0.2;
  return Math.max(1, Math.min(10, Number(score.toFixed(1))));
}

/** امتیاز آینده‌نگری ۱ تا ۱۰ */
export function futureProofingScore(parts: TelemetryPart[]): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let s = 3;
  const mb = partByCat(parts, 'motherboard');
  const ram = partByCat(parts, 'ram');
  const psu = partByCat(parts, 'psu');
  const storage = partByCat(parts, 'storage');
  const cpu = partByCat(parts, 'cpu');

  const ramType = String(ram?.specs?.ramType || mb?.specs?.ramType || '');
  if (ramType.includes('DDR5')) { s += 1.5; reasons.push('پشتیبانی از DDR5'); }

  const chipset = String(mb?.specs?.chipset || '').toUpperCase();
  if (/Z890|Z790|X870|X670E|B860|B850/.test(chipset)) {
    s += 1.2; reasons.push(`چیپست مدرن ${chipset} با پشتیبانی PCIe 5.0`);
  }

  const socket = String(cpu?.specs?.socket || '').toUpperCase();
  if (socket === 'AM5') { s += 1; reasons.push('سوکت AM5 با پشتیبانی رسمی تا سال ۲۰۲۷+'); }
  if (socket === 'LGA1851') { s += 1; reasons.push('سوکت LGA1851 نسل جدید Intel'); }

  const ramSlots = Number(mb?.specs?.ramSlots || 4);
  const modules = Number(ram?.specs?.moduleCount || 2);
  if (ramSlots - modules >= 2) { s += 0.8; reasons.push(`${ramSlots - modules} اسلات RAM آزاد برای ارتقا`); }

  const m2Slots = Number(mb?.specs?.m2Slots || 2);
  if (m2Slots >= 3) { s += 0.6; reasons.push(`${m2Slots} اسلات M.2 برای SSD اضافه`); }

  const pcie = String(storage?.specs?.pcie || '');
  if (pcie === '5.0') { s += 0.6; reasons.push('SSD نسل PCIe 5.0'); }
  else if (pcie === '4.0') { s += 0.3; }

  const psuW = Number(psu?.specs?.wattage || 0);
  if (psuW >= 850) { s += 0.7; reasons.push(`پاور ${psuW}W با حاشیهٔ کافی برای نسل بعدی GPU`); }

  const cert = String(psu?.specs?.certification || psu?.specs?.rating || '').toLowerCase();
  if (/platinum|titanium/.test(cert)) { s += 0.4; reasons.push('گواهی 80Plus Platinum/Titanium'); }

  s = Math.max(1, Math.min(10, Number(s.toFixed(1))));
  return { score: s, reasons };
}

// ─────────────────────────────────────────────────────────────────
// 📐 ۴) بررسی تداخل‌های فیزیکی میلی‌متری
// ─────────────────────────────────────────────────────────────────

export function verifyPhysicalClearances(parts: TelemetryPart[]): PhysicalClearanceIssue[] {
  const issues: PhysicalClearanceIssue[] = [];
  const casePart = partByCat(parts, 'case');
  const gpu = partByCat(parts, 'gpu');
  const cooler = partByCat(parts, 'cooler');
  const ram = partByCat(parts, 'ram');

  // ═════ GPU length vs Case clearance ═════
  if (casePart && gpu) {
    const maxGpu = Number(
      casePart.specs?.maxGpuLength ||
      casePart.specs?.maxGpuLengthMM ||
      (casePart.specs?.formFactor === 'Mini-ITX' ? 320 :
        casePart.specs?.formFactor === 'Micro-ATX' ? 360 : 400)
    );
    const gpuLen = Number(gpu.specs?.length || gpu.specs?.lengthMM || 0);
    if (gpuLen > 0 && gpuLen > maxGpu) {
      issues.push({
        type: 'CRITICAL',
        category: 'gpu-case-clearance',
        message: `تداخل فیزیکی: طول کارت گرافیک (${gpuLen}mm) بیشتر از فضای پشتیبانی‌شدهٔ کیس (${maxGpu}mm) است. کارت داخل کیس جای نمی‌گیرد.`,
        resolution: 'کیس بزرگ‌تر (Full-Tower) انتخاب کنید یا کارت گرافیک با طول کمتر (نسخهٔ Dual-Fan).',
      });
    }
  }

  // ═════ Air cooler height vs Case width ═════
  if (casePart && cooler) {
    const coolerType = String(cooler.specs?.coolerType || cooler.specs?.type || '').toLowerCase();
    if (coolerType.includes('air') || coolerType === '' || coolerType.includes('بادی')) {
      const maxCoolerH = Number(
        casePart.specs?.maxCoolerHeight ||
        casePart.specs?.maxCoolerHeightMM ||
        (casePart.specs?.formFactor === 'Mini-ITX' ? 100 :
          casePart.specs?.formFactor === 'Micro-ATX' ? 155 : 175)
      );
      const coolerH = Number(cooler.specs?.coolerHeight || 0);
      if (coolerH > 0 && coolerH > maxCoolerH) {
        issues.push({
          type: 'CRITICAL',
          category: 'cooler-case-clearance',
          message: `تداخل فیزیکی: ارتفاع خنک‌کنندهٔ بادی (${coolerH}mm) از حداکثر ارتفاع مجاز کیس (${maxCoolerH}mm) بیشتر است. درب کناری بسته نخواهد شد.`,
          resolution: 'خنک‌کننده با ارتفاع کمتر یا خنک‌کنندهٔ آبی (AIO) انتخاب کنید.',
        });
      }
    }
  }

  // ═════ Air cooler (dual-tower) vs high-profile RAM ═════
  if (cooler && ram) {
    const nm = nameLower(cooler);
    const isDualTower = /d15|nh-d15|ak620|dark rock pro|assassin\s*iii|fuma/.test(nm);
    const ramHeight = Number(ram.specs?.height || ram.specs?.moduleHeight || 0);
    const isTallRam = ramHeight > 43 || Boolean(ram.specs?.hasRGB || ram.specs?.rgb);
    if (isDualTower && isTallRam) {
      issues.push({
        type: 'WARNING',
        category: 'cooler-ram-clearance',
        message: 'خنک‌کنندهٔ دوبرجه انتخابی ممکن است با ارتفاع هیت‌سینک رم‌های ARGB تداخل داشته باشد.',
        resolution: 'خنک‌کنندهٔ آبی (AIO) یا رم با پروفایل کوتاه (Low-Profile) انتخاب کنید.',
      });
    }
  }

  // ═════ GPU-PSU cable: 12VHPWR need ═════
  const psu = partByCat(parts, 'psu');
  if (gpu && psu) {
    const tgp = estimateGpuTgp(gpu);
    const psuCert = String(psu.specs?.certification || psu.specs?.rating || '').toLowerCase();
    const isATX3 = /atx\s*3|12vhpwr/i.test(String(psu.name || '')) || psuCert.includes('platinum');
    if (tgp >= 285 && !isATX3) {
      issues.push({
        type: 'WARNING',
        category: 'psu-connector',
        message: `کارت گرافیک انتخابی (${tgp}W) به کابل 12VHPWR ATX 3.0 نیاز دارد اما پاور استاندارد قدیمی است.`,
        resolution: 'پاور با استاندارد ATX 3.0 و کابل 12VHPWR انتخاب کنید یا از آداپتور ۳ به ۱ درون جعبهٔ گرافیک استفاده کنید.',
      });
    }
  }

  return issues;
}

// ─────────────────────────────────────────────────────────────────
// 🔊 ۵) تخمین سطح نویز آکوستیک
// ─────────────────────────────────────────────────────────────────

export function estimateAcoustic(parts: TelemetryPart[]): {
  rating: AcousticRating;
  estimatedDB: number;
  description: string;
} {
  const cooler = partByCat(parts, 'cooler');
  const casePart = partByCat(parts, 'case');
  const gpu = partByCat(parts, 'gpu');
  const nc = nameLower(cooler);
  const nm = nameLower(casePart);

  const isAIO = /aio|water|liquid|آبی|نویس/.test(nc) || String(cooler?.specs?.coolerType || '').toLowerCase().includes('aio');
  const isSilentBrand = /noctua|be quiet|bequiet|arctic/.test(nc);
  const isMesh = /mesh|airflow/.test(nm) || Boolean(casePart?.specs?.airflow);
  const gpuTgp = estimateGpuTgp(gpu);

  let db = 38; // پایه
  if (isSilentBrand) db -= 6;
  if (isAIO && !/360/.test(nc)) db -= 3;
  if (isMesh) db += 2;
  if (gpuTgp > 300) db += 4;
  else if (gpuTgp > 200) db += 2;

  const noiseSpec = Number(cooler?.specs?.noiseLevelDB || 0);
  if (noiseSpec > 0) db = Math.round((db + noiseSpec) / 2);

  let rating: AcousticRating;
  let description: string;
  if (db < 32) {
    rating = 'Ultra Silent';
    description = 'بسیار بی‌صدا — مناسب اتاق خواب و استودیوی صدابرداری';
  } else if (db <= 42) {
    rating = 'Balanced Airflow';
    description = 'متعادل و استاندارد — تجربهٔ راحت روزمره';
  } else {
    rating = 'Performance Turbo';
    description = 'پرقدرت با جریان هوای حداکثر — صدای فن شنیده می‌شود';
  }

  return { rating, estimatedDB: db, description };
}

// ─────────────────────────────────────────────────────────────────
// 📦 ۶) ماتریس کامل تله‌متری (خروجی یک‌جا برای UI/API)
// ─────────────────────────────────────────────────────────────────

export interface FullTelemetry {
  power: PowerTelemetry;
  bottleneck: {
    resolution1080p: BottleneckReport;
    resolution1440p: BottleneckReport;
    resolution4K: BottleneckReport;
  };
  fps: FpsEstimates;
  renderScore: number;
  futureProofing: { score: number; reasons: string[] };
  physicalClearances: PhysicalClearanceIssue[];
  acoustic: {
    rating: AcousticRating;
    estimatedDB: number;
    description: string;
  };
  thermal: ThermalTelemetry;
  electricity: ElectricityEstimate;
  autoBalance: AutoBalanceHint;
}

// ─────────────────────────────────────────────────────────────────
// 🌡️ ۷) شبیه‌ساز ترمودینامیک و دمای کاری
// ─────────────────────────────────────────────────────────────────

export type ThermalStatus = 'OPTIMAL' | 'WARM' | 'THROTTLING_DANGER';

export interface ThermalTelemetry {
  estimatedCpuIdleTempC: number;
  estimatedCpuLoadTempC: number;
  estimatedGpuIdleTempC: number;
  estimatedGpuLoadTempC: number;
  thermalStatus: ThermalStatus;
  airflowScore: number; // 0-100
  thermalPasteRecommendation?: string;
  coolerAdequacyPercent: number; // چقدر خنک‌کننده مناسب TDP است
  message: string;
}

/**
 * شبیه‌سازی دمای کاری زیر بار بر اساس TDP و کیفیت خنک‌کننده.
 * فرمول ساده‌شدهٔ ترمودینامیک: T_load = T_ambient + (TDP × R_cooler)
 * که R_cooler بر اساس نوع/توان خنک‌کننده محاسبه می‌شود.
 */
export function simulateThermal(parts: TelemetryPart[]): ThermalTelemetry {
  const cpu = partByCat(parts, 'cpu');
  const gpu = partByCat(parts, 'gpu');
  const cooler = partByCat(parts, 'cooler');
  const casePart = partByCat(parts, 'case');

  const ambient = 26; // دمای اتاق فرضی (تهران/تابستان)
  const cpuTdp = estimateCpuTdp(cpu);
  const gpuTgp = estimateGpuTgp(gpu);

  // مقاومت حرارتی خنک‌کننده (°C/W) — هرچه کمتر، خنک‌تر
  const coolerNm = nameLower(cooler);
  const coolerType = String(cooler?.specs?.coolerType || cooler?.specs?.type || '').toLowerCase();
  const isAIO = coolerType.includes('aio') || /aio|liquid|واتر|مایع/.test(coolerNm);
  const is360 = /360/.test(coolerNm);
  const is240 = /240/.test(coolerNm);
  const isDualTower = /d15|ak620|dark rock pro|assassin\s*iii|fuma/.test(coolerNm);
  const isBudgetAir = /ag400|gammaxx|ak400|freezer\s*34|hyper\s*212/.test(coolerNm);

  let rCooler: number;
  if (isAIO && is360) rCooler = 0.13;
  else if (isAIO && is240) rCooler = 0.17;
  else if (isDualTower) rCooler = 0.18;
  else if (isBudgetAir) rCooler = 0.30;
  else if (isAIO) rCooler = 0.19;
  else if (cooler) rCooler = 0.25;
  else rCooler = 0.55; // بدون خنک‌کننده انتخابی → فن استوک ضعیف

  // اثر تهویه کیس
  const isMesh = /mesh|airflow/.test(nameLower(casePart)) || Boolean(casePart?.specs?.airflow);
  const airflowBonus = isMesh ? -3 : casePart ? 0 : +2;

  const estimatedCpuIdleTempC = Math.round(ambient + 8 + (cpuTdp * rCooler * 0.15));
  const estimatedCpuLoadTempC = Math.round(ambient + cpuTdp * rCooler + airflowBonus);

  // GPU: منحنی خودگردان (فن‌های خودش کار می‌کنند)
  const estimatedGpuIdleTempC = Math.round(ambient + 12);
  const estimatedGpuLoadTempC = Math.round(
    ambient + (gpuTgp * 0.14) + (isMesh ? -4 : 2)
  );

  // Airflow score
  let airflowScore = 55;
  if (isMesh) airflowScore += 25;
  if (isAIO && is360) airflowScore += 12;
  if (cooler && !isAIO) airflowScore -= 5;
  airflowScore = Math.max(20, Math.min(100, airflowScore));

  const worstTemp = Math.max(estimatedCpuLoadTempC, estimatedGpuLoadTempC);
  let thermalStatus: ThermalStatus = 'OPTIMAL';
  let message = 'دمای کاری سیستم در محدودهٔ ایده‌آل قرار دارد.';
  let thermalPasteRecommendation: string | undefined;

  if (worstTemp >= 90) {
    thermalStatus = 'THROTTLING_DANGER';
    message = `دمای کاری زیر بار (${worstTemp}°C) بحرانی است؛ خطر افت فرکانس حرارتی وجود دارد.`;
    thermalPasteRecommendation = 'استفاده از خمیر سیلیکون حرفه‌ای Thermal Grizzly Kryonaut و ارتقای خنک‌کننده الزامی است.';
  } else if (worstTemp >= 83) {
    thermalStatus = 'WARM';
    message = `دمای زیر بار (${worstTemp}°C) بالاست اما در حاشیهٔ ایمنی است.`;
    thermalPasteRecommendation = 'برای پایداری بلندمدت، تعویض خمیر سیلیکون پرمیوم توصیه می‌شود.';
  } else if (worstTemp >= 75) {
    thermalStatus = 'WARM';
    message = `دمای زیر بار (${worstTemp}°C) استاندارد است.`;
  }

  // چقدر خنک‌کننده برای TDP کافی است (100 = عالی، <60 = ناکافی)
  const coolerAdequacyPercent = Math.max(
    0,
    Math.min(100, Math.round(100 - ((cpuTdp * rCooler) / 60) * 100))
  );

  return {
    estimatedCpuIdleTempC,
    estimatedCpuLoadTempC,
    estimatedGpuIdleTempC,
    estimatedGpuLoadTempC,
    thermalStatus,
    airflowScore,
    thermalPasteRecommendation,
    coolerAdequacyPercent,
    message,
  };
}

// ─────────────────────────────────────────────────────────────────
// 💡 ۸) تخمین قبض برق ماهانه
// ─────────────────────────────────────────────────────────────────

export interface ElectricityEstimate {
  acPullWatts: number; // توان واقعی کشیده‌شده از پریز (شامل راندمان پاور)
  psuEfficiencyPercent: number; // 82 / 87 / 90 / 92
  psuCertification: string;
  dailyHours: number;
  monthlyKWh: number;
  monthlyCostToman: number;
  yearlyCostToman: number;
  message: string;
}

/**
 * تخمین قبض برق ماهانه.
 * فرض: نرخ برق ایران خانگی متوسط ~۵,۰۰۰ تومان / kWh (پله‌های بالا)
 */
export function estimateMonthlyElectricity(
  parts: TelemetryPart[],
  dailyHours: number = 6,
  costPerKwhToman: number = 5000
): ElectricityEstimate {
  const power = calculatePowerTelemetry(parts);
  const psu = partByCat(parts, 'psu');
  const cert = String(psu?.specs?.certification || psu?.specs?.rating || '').toLowerCase();

  let effPercent = 82; // 80Plus White/Bronze پیش‌فرض
  let certLabel = 'استاندارد';
  if (cert.includes('titanium')) { effPercent = 94; certLabel = '80Plus Titanium'; }
  else if (cert.includes('platinum')) { effPercent = 92; certLabel = '80Plus Platinum'; }
  else if (cert.includes('gold')) { effPercent = 90; certLabel = '80Plus Gold'; }
  else if (cert.includes('silver')) { effPercent = 87; certLabel = '80Plus Silver'; }
  else if (cert.includes('bronze')) { effPercent = 85; certLabel = '80Plus Bronze'; }

  // بار کاربردی معمولاً 40-60٪ TDP نهایی است
  const averageLoadWatts = Math.round(power.totalTdp * 0.55);
  const acPullWatts = Math.round(averageLoadWatts / (effPercent / 100));

  const dailyKWh = (acPullWatts * dailyHours) / 1000;
  const monthlyKWh = Number((dailyKWh * 30).toFixed(2));
  const monthlyCostToman = Math.round(monthlyKWh * costPerKwhToman);
  const yearlyCostToman = monthlyCostToman * 12;

  const message = `با راندمان ${certLabel} (${effPercent}٪) و ${dailyHours.toLocaleString('fa-IR')} ساعت مصرف روزانه، حدود ${monthlyKWh.toLocaleString('fa-IR')} کیلووات‌ساعت در ماه.`;

  return {
    acPullWatts,
    psuEfficiencyPercent: effPercent,
    psuCertification: certLabel,
    dailyHours,
    monthlyKWh,
    monthlyCostToman,
    yearlyCostToman,
    message,
  };
}

// ─────────────────────────────────────────────────────────────────
// 🔧 ۹) شبیه‌سازی اورکلاک
// ─────────────────────────────────────────────────────────────────

export interface OverclockSimulation {
  supported: boolean;
  extraWatts: number;
  newTotalTdp: number;
  newRecommendedPsu: number;
  psuCanHandle: boolean;
  performanceGainPercent: number;
  warning?: string;
}

export function simulateOverclock(parts: TelemetryPart[]): OverclockSimulation {
  const cpu = partByCat(parts, 'cpu');
  const mb = partByCat(parts, 'motherboard');
  const psu = partByCat(parts, 'psu');
  const power = calculatePowerTelemetry(parts);

  const cpuName = nameLower(cpu);
  const chipset = String(mb?.specs?.chipset || '').toUpperCase();
  // فقط CPU سری K/X روی چیپست Z/X پشتیبانی می‌کند
  const supportedCpu = /\bk\b|kf\b|\bx\b/i.test(cpuName) || /x3d/.test(cpuName);
  const supportedMb = /^Z\d{3}|^X[456789]/.test(chipset);
  const supported = supportedCpu && supportedMb;

  const cpuTdp = estimateCpuTdp(cpu);
  const extraWatts = Math.round(cpuTdp * 0.25 + 20);
  const newTotalTdp = power.totalTdp + extraWatts;
  const newRecommendedPsu = Math.ceil((newTotalTdp * 1.35) / 50) * 50;
  const psuW = Number(psu?.specs?.wattage || 0);
  const psuCanHandle = psuW >= newRecommendedPsu;

  const performanceGainPercent = supported ? 12 : 0;

  return {
    supported,
    extraWatts,
    newTotalTdp,
    newRecommendedPsu,
    psuCanHandle,
    performanceGainPercent,
    warning: !supported
      ? 'برای اورکلاک، پردازندهٔ سری K/X و مادربرد سری Z/X لازم است.'
      : !psuCanHandle
        ? `پاور فعلی (${psuW}W) توان اورکلاک را ندارد؛ حداقل ${newRecommendedPsu}W نیاز است.`
        : undefined,
  };
}

// ─────────────────────────────────────────────────────────────────
// 🎯 ۱۰) Bottleneck تفصیلی + تشخیص culprit
// ─────────────────────────────────────────────────────────────────

export interface DetailedBottleneck {
  bottleneck1080p: number;
  bottleneck1440p: number;
  bottleneck4k: number;
  primaryCulprit: 'CPU' | 'GPU' | 'BALANCED';
  recommendationFa: string;
  suggestedCategoryToUpgrade: 'cpu' | 'gpu' | null;
}

export function calculateDetailedBottleneck(parts: TelemetryPart[]): DetailedBottleneck {
  const cpu = partByCat(parts, 'cpu');
  const gpu = partByCat(parts, 'gpu');
  if (!cpu || !gpu) {
    return {
      bottleneck1080p: 0, bottleneck1440p: 0, bottleneck4k: 0,
      primaryCulprit: 'BALANCED',
      recommendationFa: 'جهت محاسبه دقیق گلوگاه، CPU و GPU باید انتخاب شوند.',
      suggestedCategoryToUpgrade: null,
    };
  }
  const cScore = cpuPerformanceScore(cpu);
  const gScore = gpuPerformanceScore(gpu);
  const ratio = cScore / Math.max(1, gScore);

  let b1080 = 0, b1440 = 0, b4k = 0;
  let culprit: 'CPU' | 'GPU' | 'BALANCED' = 'BALANCED';
  let rec = 'توازن بسیار عالی میان پردازنده و کارت گرافیک برقرار است.';
  let suggestedCategoryToUpgrade: 'cpu' | 'gpu' | null = null;

  if (ratio < 0.7) {
    culprit = 'CPU';
    b1080 = Math.round((1 - ratio) * 35);
    b1440 = Math.round((1 - ratio) * 22);
    b4k = Math.round((1 - ratio) * 10);
    rec = `پردازنده انتخابی ضعیف‌تر از کارت گرافیک است و در 1080p حدود ${b1080}٪ گلوگاه ایجاد می‌کند. ارتقای پردازنده توصیه می‌شود.`;
    suggestedCategoryToUpgrade = 'cpu';
  } else if (ratio > 1.4) {
    culprit = 'GPU';
    b1080 = Math.round((ratio - 1) * 8);
    b1440 = Math.round((ratio - 1) * 22);
    b4k = Math.round((ratio - 1) * 38);
    rec = `کارت گرافیک برای 4K نسبت به پردازنده ضعیف‌تر است (${b4k}٪ گلوگاه). ارتقای GPU توصیه می‌شود.`;
    suggestedCategoryToUpgrade = 'gpu';
  }

  return {
    bottleneck1080p: b1080,
    bottleneck1440p: b1440,
    bottleneck4k: b4k,
    primaryCulprit: culprit,
    recommendationFa: rec,
    suggestedCategoryToUpgrade,
  };
}

// ─────────────────────────────────────────────────────────────────
// ✨ ۱۱) پیشنهاد Auto-Balance
// ─────────────────────────────────────────────────────────────────

export interface AutoBalanceHint {
  needsBalance: boolean;
  reason: string;
  targetCategory: 'cpu' | 'gpu' | 'ram' | null;
  ctaText: string;
}

export function computeAutoBalance(parts: TelemetryPart[]): AutoBalanceHint {
  const bn = calculateDetailedBottleneck(parts);
  const power = calculatePowerTelemetry(parts);
  const worstBn = Math.max(bn.bottleneck1080p, bn.bottleneck1440p, bn.bottleneck4k);

  if (worstBn >= 10 && bn.suggestedCategoryToUpgrade) {
    return {
      needsBalance: true,
      reason: `گلوگاه ${worstBn}٪ روی ${bn.primaryCulprit} تشخیص داده شد.`,
      targetCategory: bn.suggestedCategoryToUpgrade,
      ctaText: `✨ رفع خودکار گلوگاه ${bn.primaryCulprit}`,
    };
  }
  if (power.status === 'RED') {
    return {
      needsBalance: true,
      reason: 'پاور در محدودهٔ بحرانی است.',
      targetCategory: null,
      ctaText: '⚡ پیشنهاد پاور قوی‌تر',
    };
  }
  return {
    needsBalance: false,
    reason: 'سیستم متوازن است.',
    targetCategory: null,
    ctaText: '',
  };
}

export function buildFullTelemetry(parts: TelemetryPart[]): FullTelemetry {
  return {
    power: calculatePowerTelemetry(parts),
    bottleneck: calculateBottleneckSummary(parts),
    fps: estimateFps4Games(parts),
    renderScore: renderScore(parts),
    futureProofing: futureProofingScore(parts),
    physicalClearances: verifyPhysicalClearances(parts),
    acoustic: estimateAcoustic(parts),
    thermal: simulateThermal(parts),
    electricity: estimateMonthlyElectricity(parts),
    autoBalance: computeAutoBalance(parts),
  };
}

// ─────────────────────────────────────────────────────────────────
// 🤖 v6.0 — بررسی زندهٔ هوش مصنوعی (Live AI Validation Engine)
// ─────────────────────────────────────────────────────────────────

export type LiveAiStatus = 'VERIFIED_PERFECT' | 'WARNING' | 'CRITICAL_ERROR';

export interface LiveAiIssue {
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  partCategory: string;
  message: string;
  suggestedFix: string;
}

export interface LiveAiCheckResult {
  status: LiveAiStatus;
  aiLiveSummaryFa: string;
  issues: LiveAiIssue[];
  checkedAt: number; // timestamp
}

/**
 * بررسی زندهٔ کل کانفیگ توسط هوش مصنوعی محلی (deterministic).
 * با هر تغییر قطعه صدا زده می‌شود و در < 5ms اجرا می‌شود.
 *
 * ۶ لایه بررسی:
 *  ۱. تطابق سوکت CPU و Motherboard
 *  ۲. تطابق نوع RAM (DDR4/DDR5)
 *  ۳. کولر معتبر بودن (نه پایه لپ‌تاپ)
 *  ۴. تداخل طول GPU با کیس
 *  ۵. کفایت PSU
 *  ۶. گاردریل هر قطعه در دستهٔ خود
 */
export function performLiveAiValidation(parts: TelemetryPart[]): LiveAiCheckResult {
  const issues: LiveAiIssue[] = [];

  const partsByCategory: Record<string, TelemetryPart> = {};
  for (const p of parts || []) {
    if (!partsByCategory[p.category]) partsByCategory[p.category] = p;
  }
  const cpu = partsByCategory.cpu;
  const mb = partsByCategory.motherboard;
  const ram = partsByCategory.ram;
  const gpu = partsByCategory.gpu;
  const cooler = partsByCategory.cooler;
  const casePart = partsByCategory.case;
  const psu = partsByCategory.psu;

  // ═════ لایه ۱: سوکت CPU / Motherboard ═════
  if (cpu && mb) {
    const cs = String(cpu.specs?.socket || '').toUpperCase().trim();
    const ms = String(mb.specs?.socket || '').toUpperCase().trim();
    if (cs && ms && cs !== ms && !ms.includes(cs) && !cs.includes(ms)) {
      issues.push({
        severity: 'CRITICAL',
        partCategory: 'motherboard',
        message: `عدم تطابق سوکت: پردازنده ${cs} با مادربرد ${ms} کار نمی‌کند.`,
        suggestedFix: `مادربردی با سوکت ${cs} انتخاب کنید.`,
      });
    }
  }

  // ═════ لایه ۲: نوع RAM ═════
  if (mb && ram) {
    const mbRam = String(mb.specs?.ramType || '').toUpperCase();
    const ramType = String(ram.specs?.ramType || '').toUpperCase();
    if (mbRam && ramType && mbRam !== ramType) {
      issues.push({
        severity: 'CRITICAL',
        partCategory: 'ram',
        message: `عدم تطابق حافظه: مادربرد ${mbRam} با رم ${ramType} سازگار نیست.`,
        suggestedFix: `رم ${mbRam} انتخاب کنید.`,
      });
    }
  }

  // ═════ لایه ۳: خنک‌کننده معتبر بودن ═════
  if (cooler) {
    if (!isGenuineCpuCooler(cooler.name || '')) {
      issues.push({
        severity: 'CRITICAL',
        partCategory: 'cooler',
        message: `کالای انتخابی «${cooler.name}» یک خنک‌کنندهٔ واقعی پردازندهٔ دسکتاپ نیست (احتمالاً پایه لپ‌تاپ یا اکسسوری است).`,
        suggestedFix: 'یک خنک‌کنندهٔ بادی یا مایع مخصوص پردازندهٔ دسکتاپ انتخاب کنید.',
      });
    }
  }

  // ═════ لایه ۴: تداخل طول GPU با کیس ═════
  if (gpu && casePart) {
    const gpuLen = Number(gpu.specs?.length || gpu.specs?.lengthMM || 0);
    const caseMax = Number(
      casePart.specs?.maxGpuLength ||
      casePart.specs?.maxGpuLengthMM ||
      (casePart.specs?.formFactor === 'Mini-ITX' ? 320 :
        casePart.specs?.formFactor === 'Micro-ATX' ? 360 : 400)
    );
    if (gpuLen > 0 && gpuLen > caseMax) {
      issues.push({
        severity: 'CRITICAL',
        partCategory: 'gpu',
        message: `تداخل فیزیکی: طول کارت گرافیک (${gpuLen}mm) بیشتر از فضای کیس (${caseMax}mm) است.`,
        suggestedFix: 'کیس بزرگ‌تر (Full-Tower) یا کارت گرافیک با طول کمتر انتخاب کنید.',
      });
    }
  }

  // ═════ لایه ۵: کفایت PSU ═════
  if (psu) {
    const psuW = Number(psu.specs?.wattage || 0);
    const cpuTdp = Number(cpu?.specs?.tdp || 95);
    const gpuTgp = Number(gpu?.specs?.wattage || gpu?.specs?.tdp || 0);
    const totalTdp = cpuTdp + gpuTgp + 90;
    const recommended = Math.ceil((totalTdp * 1.3) / 50) * 50;
    if (psuW > 0 && psuW < totalTdp) {
      issues.push({
        severity: 'CRITICAL',
        partCategory: 'psu',
        message: `پاور ${psuW}W برای مصرف کل سیستم (${totalTdp}W) کافی نیست.`,
        suggestedFix: `پاور حداقل ${recommended}W انتخاب کنید.`,
      });
    } else if (psuW > 0 && psuW < recommended) {
      issues.push({
        severity: 'WARNING',
        partCategory: 'psu',
        message: `پاور ${psuW}W در حاشیهٔ امن قرار ندارد (پیشنهاد: ${recommended}W).`,
        suggestedFix: `پاور با توان بیشتر برای پایداری بلندمدت انتخاب کنید.`,
      });
    }
  }

  // ═════ لایه ۶: گاردریل هر قطعه در دستهٔ خود ═════
  for (const p of parts || []) {
    const g = validatePartCategory(p.category, {
      title: p.name,
      name: p.name,
      price: p.price,
      finalPrice: p.finalPrice,
      specs: p.specs || {},
    });
    if (!g.passed) {
      issues.push({
        severity: 'WARNING',
        partCategory: p.category,
        message: `کالای «${p.name}» در دستهٔ ${p.category} از استاندارد آفلند خارج است: ${g.detail || g.reason}`,
        suggestedFix: 'یک کالای معتبر از همان دسته انتخاب کنید.',
      });
    }
  }

  const hasCritical = issues.some(i => i.severity === 'CRITICAL');
  const status: LiveAiStatus = hasCritical
    ? 'CRITICAL_ERROR'
    : issues.length > 0
      ? 'WARNING'
      : 'VERIFIED_PERFECT';

  const aiLiveSummaryFa =
    status === 'VERIFIED_PERFECT'
      ? '✅ بررسی زندهٔ هوش مصنوعی: تمام قطعات ۱۰۰٪ سازگار و بدون خطا هستند.'
      : status === 'CRITICAL_ERROR'
        ? `❌ بررسی زندهٔ هوش مصنوعی: ${issues.filter(i => i.severity === 'CRITICAL').length} خطای بحرانی در کانفیگ وجود دارد!`
        : `⚠️ بررسی زندهٔ هوش مصنوعی: سیستم سازگار است اما ${issues.length} نکتهٔ بهینه‌سازی دارد.`;

  return { status, aiLiveSummaryFa, issues, checkedAt: Date.now() };
}
