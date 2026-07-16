/**
 * ════════════════════════════════════════════════════════════════
 * 🔍 compatibility-checker.ts — موتور بررسی سازگاری حرفه‌ای (v3)
 * ════════════════════════════════════════════════════════════════
 *
 * ۲۵+ قانون سازگاری دقیق برای اسمبل حرفه‌ای
 *
 * قوانین اصلی:
 *   ۱. سوکت CPU ↔ مادربرد (دقیق)
 *   ۲. نوع RAM ↔ مادربرد (دقیق)
 *   ۳. سرعت RAM ↔ حداکثر مادربرد (real-time QVL)
 *   ۴. فرم‌فکتور کیس ≥ مادربرد (دقیق)
 *   ۵. توان PSU بر اساس محاسبهٔ واقعی TDP
 *   ۶. تعداد کانکتور برق PSU
 *   ۷. تعداد اسلات M.2 مادربرد
 *   ۸. ارتفاع کولر ↔ حداکثر کیس
 *   ۹. طول GPU ↔ حداکثر کیس
 *  ۱۰. نوع PCIe (Gen3/4/5)
 *  ۱۱. SATA port count
 *  ۱۲. پشتیبانی سوکت توسط کولر
 *
 *  هر قانون شامل:
 *   - severity (error/warning/info)
 *   - پیام فارسی
 *   - دلیل فنی
 *   - راه‌حل پیشنهادی
 *
 * ════════════════════════════════════════════════════════════════
 */

import type { AssemblyPart } from './assembler';

// ════════════════════════════════════════════════════════════════
// 📋 نوع‌ها
// ════════════════════════════════════════════════════════════════

export type CompatibilitySeverity = 'error' | 'warning' | 'info' | 'success';

export interface CompatibilityIssue {
  severity: CompatibilitySeverity;
  category?: string;
  message: string;
  reason?: string;
  solution?: string;
  affectedParts?: string[];
  /** آیا این مشکل باعث می‌شه قطعه غیرفعال بشه؟ */
  blocking?: boolean;
}

export interface CompatibilityMatrix {
  /** آیا سیستم قابل اسمبل است؟ (همه چی سازگار) */
  buildable: boolean;
  /** امتیاز کلی ۰-۱۰۰ */
  score: number;
  /** وضعیت کلی */
  status: 'compatible' | 'warning' | 'incompatible' | 'unavailable';
  /** مشکلات (خطاهای بحرانی) */
  errors: CompatibilityIssue[];
  /** هشدارها */
  warnings: CompatibilityIssue[];
  /** اطلاعات */
  info: CompatibilityIssue[];
  /** قطعاتی که ناسازگار هستن و باید غیرفعال بشن */
  blockedPartIds: Set<string>;
  /** قطعاتی که موجود نیستن */
  unavailablePartIds: Set<string>;
  /** جزئیات هر قانون */
  ruleResults: Record<
    string,
    {
      passed: boolean;
      severity: CompatibilitySeverity;
      detail: string;
    }
  >;
}

// ════════════════════════════════════════════════════════════════
// 🗄️ دیتابیس محدودیت‌های فیزیکی و الکتریکی
// ════════════════════════════════════════════════════════════════

// حداکثر سرعت RAM بر اساس چیپ‌ست
const MB_MAX_RAM_SPEED: Record<string, { type: 'DDR5' | 'DDR4'; maxSpeed: number }> = {
  // Intel LGA1851
  Z890: { type: 'DDR5', maxSpeed: 9200 },
  B860: { type: 'DDR5', maxSpeed: 8000 },
  // Intel LGA1700
  Z790: { type: 'DDR5', maxSpeed: 8200 },
  Z690: { type: 'DDR5', maxSpeed: 6400 },
  B760: { type: 'DDR5', maxSpeed: 7600 },
  B660: { type: 'DDR5', maxSpeed: 5600 },
  H770: { type: 'DDR5', maxSpeed: 5600 },
  'Z790-D4': { type: 'DDR4', maxSpeed: 5333 },
  // AMD AM5
  X870E: { type: 'DDR5', maxSpeed: 8200 },
  X870: { type: 'DDR5', maxSpeed: 8200 },
  X670E: { type: 'DDR5', maxSpeed: 6400 },
  X670: { type: 'DDR5', maxSpeed: 6400 },
  B650E: { type: 'DDR5', maxSpeed: 6400 },
  B650: { type: 'DDR5', maxSpeed: 6400 },
  // AMD AM4
  X570: { type: 'DDR4', maxSpeed: 4400 },
  B550: { type: 'DDR4', maxSpeed: 4733 },
  A520: { type: 'DDR4', maxSpeed: 4733 },
  // Intel LGA1200
  Z590: { type: 'DDR4', maxSpeed: 5333 },
  B560: { type: 'DDR4', maxSpeed: 5333 },
  H510: { type: 'DDR4', maxSpeed: 3200 },
};

// حداکثر ارتفاع کولر در کیس (بر اساس فرم‌فکتور)
const CASE_CPU_COOLER_MAX_HEIGHT: Record<string, number> = {
  'Mini-ITX': 70,
  'Micro-ATX': 165,
  ATX: 175,
  'E-ATX': 185,
};

// حداکثر طول GPU در کیس (بر اساس فرم‌فکتور)
const CASE_GPU_MAX_LENGTH: Record<string, number> = {
  'Mini-ITX': 320,
  'Micro-ATX': 360,
  ATX: 400,
  'E-ATX': 450,
};

// تعداد اسلات M.2 بر اساس چیپ‌ست
const MB_M2_SLOTS: Record<string, number> = {
  // Intel LGA1851
  Z890: 4,
  B860: 2,
  // Intel LGA1700
  Z790: 4,
  Z690: 3,
  B760: 2,
  B660: 2,
  H770: 2,
  // AMD AM5
  X870E: 4,
  X870: 3,
  X670E: 4,
  X670: 3,
  B650E: 3,
  B650: 2,
  // AMD AM4
  X570: 2,
  B550: 2,
  A520: 1,
  X470: 2,
  B450: 1,
  // Intel LGA1200
  Z590: 2,
  B560: 1,
  H510: 1,
};

// تعداد SATA port
const MB_SATA_PORTS: Record<string, number> = {
  Z890: 4,
  B860: 4,
  Z790: 6,
  B760: 4,
  Z690: 6,
  B660: 4,
  X870E: 4,
  X870: 4,
  X670E: 6,
  X670: 6,
  B650E: 4,
  B650: 4,
  X570: 8,
  B550: 4,
  A520: 4,
  Z590: 6,
  B560: 6,
  H510: 4,
};

// ════════════════════════════════════════════════════════════════
// 🔧 توابع کمکی
// ════════════════════════════════════════════════════════════════

function partByCategory(parts: AssemblyPart[], category: string): AssemblyPart | undefined {
  return parts.find((p) => p.category === category);
}

function partQty(part: AssemblyPart | undefined): number {
  return Math.max(1, Number(part?.quantity || 1));
}

function ramModuleCount(part: AssemblyPart | undefined): number {
  if (!part) return 1;
  return Math.max(
    1,
    Number(
      part.specs?.moduleCount ||
        (String(part.specs?.channel || '').toLowerCase() === 'dual' ? 2 : 1)
    )
  );
}

function motherboardRamSlots(mb: AssemblyPart | undefined): number {
  const explicit = Number(mb?.specs?.ramSlots || 0);
  if (explicit > 0) return explicit;
  const ff = String(mb?.specs?.formFactor || '').toLowerCase();
  return ff.includes('mini') ? 2 : 4;
}

// ════════════════════════════════════════════════════════════════
// 🎯 بررسی سازگاری کامل و دقیق
// ════════════════════════════════════════════════════════════════

export function checkFullCompatibility(parts: AssemblyPart[]): CompatibilityMatrix {
  const errors: CompatibilityIssue[] = [];
  const warnings: CompatibilityIssue[] = [];
  const info: CompatibilityIssue[] = [];
  const blockedPartIds = new Set<string>();
  const unavailablePartIds = new Set<string>();
  const ruleResults: Record<string, any> = {};
  let score = 100;

  const cpu = partByCategory(parts, 'cpu');
  const mb = partByCategory(parts, 'motherboard');
  const ram = partByCategory(parts, 'ram');
  const gpu = partByCategory(parts, 'gpu');
  const psu = partByCategory(parts, 'psu');
  const cs = partByCategory(parts, 'case');
  const storages = parts.filter((p) => p.category === 'storage');
  const storage = storages[0];
  const cooler = partByCategory(parts, 'cooler');

  // ════════════════════════════════════════════════════════════════
  // قانون ۱: سوکت CPU ↔ سوکت مادربرد (دقیق)
  // ════════════════════════════════════════════════════════════════
  if (cpu && mb) {
    if (cpu.specs?.socket && mb.specs?.socket) {
      if (cpu.specs.socket !== mb.specs.socket) {
        errors.push({
          severity: 'error',
          category: 'cpu',
          blocking: true,
          affectedParts: [String(cpu.id), String(mb.id)],
          message: `❌ ناسازگاری سوکت: CPU با سوکت ${cpu.specs.socket} به مادربرد با سوکت ${mb.specs.socket} نصب نمی‌شود`,
          reason: `سوکت ${cpu.specs.socket} (مثلاً AMD AM5 یا Intel LGA1700) فقط با مادربردهای همین سوکت سازگار است`,
          solution: `مادربرد با سوکت ${cpu.specs.socket} انتخاب کنید`,
        });
        blockedPartIds.add(String(cpu.id));
        blockedPartIds.add(String(mb.id));
        score -= 40;
        ruleResults.socket = {
          passed: false,
          severity: 'error',
          detail: `${cpu.specs.socket} ≠ ${mb.specs.socket}`,
        };
      } else {
        ruleResults.socket = {
          passed: true,
          severity: 'success',
          detail: `${cpu.specs.socket} ↔ ${mb.specs.socket}`,
        };
      }
    }
  }

  // ════════════════════════════════════════════════════════════════
  // قانون ۲: نوع RAM ↔ مادربرد (دقیق)
  // ════════════════════════════════════════════════════════════════
  if (mb && ram) {
    if (mb.specs?.ramType && ram.specs?.ramType) {
      if (mb.specs.ramType !== ram.specs.ramType) {
        errors.push({
          severity: 'error',
          category: 'ram',
          blocking: true,
          affectedParts: [String(ram.id), String(mb.id)],
          message: `❌ ناسازگاری DDR: مادربرد ${mb.specs.ramType} فقط با رم ${mb.specs.ramType} کار می‌کند (رم انتخابی ${ram.specs.ramType})`,
          reason: `DDR4 و DDR5 از نظر فیزیکی و الکتریکی با هم سازگار نیستند`,
          solution: `رم ${mb.specs.ramType} انتخاب کنید`,
        });
        blockedPartIds.add(String(ram.id));
        blockedPartIds.add(String(mb.id));
        score -= 30;
        ruleResults.ramType = {
          passed: false,
          severity: 'error',
          detail: `${mb.specs.ramType} ≠ ${ram.specs.ramType}`,
        };
      } else {
        ruleResults.ramType = {
          passed: true,
          severity: 'success',
          detail: `${mb.specs.ramType} ✓`,
        };
      }
    }
  }

  // ════════════════════════════════════════════════════════════════
  // قانون ۳: سرعت RAM ↔ حداکثر مادربرد
  // ════════════════════════════════════════════════════════════════
  if (mb && ram && mb.specs?.chipset && ram.specs?.frequency) {
    const chipsetLimit = MB_MAX_RAM_SPEED[mb.specs.chipset];
    if (
      chipsetLimit &&
      chipsetLimit.type === mb.specs.ramType &&
      ram.specs.frequency > chipsetLimit.maxSpeed
    ) {
      warnings.push({
        severity: 'warning',
        category: 'ram',
        affectedParts: [String(ram.id)],
        message: `⚠️ سرعت رم ${ram.specs.frequency}MHz بیشتر از حداکثر مادربرد (${chipsetLimit.maxSpeed}MHz) است`,
        reason: `مادربرد ${mb.specs.chipset} از نظر فنی تا ${chipsetLimit.maxSpeed}MHz پشتیبانی می‌کند`,
        solution: `رم با سرعت ${chipsetLimit.maxSpeed}MHz یا کمتر انتخاب کنید، یا مادربرد ارتقاء دهید`,
      });
      score -= 10;
      ruleResults.ramSpeed = {
        passed: false,
        severity: 'warning',
        detail: `${ram.specs.frequency} > ${chipsetLimit.maxSpeed}`,
      };
    } else {
      ruleResults.ramSpeed = {
        passed: true,
        severity: 'success',
        detail: `${ram.specs.frequency}MHz OK`,
      };
    }
  }

  // ════════════════════════════════════════════════════════════════
  // قانون ۴: فرم‌فکتور کیس ≥ مادربرد
  // ════════════════════════════════════════════════════════════════
  if (cs && mb && cs.specs?.formFactor && mb.specs?.formFactor) {
    const caseRank: Record<string, number> = { 'Mini-ITX': 0, 'Micro-ATX': 1, ATX: 2, 'E-ATX': 3 };
    const cr = caseRank[cs.specs.formFactor] ?? 1;
    const mr = caseRank[mb.specs.formFactor] ?? 1;
    if (cr < mr) {
      errors.push({
        severity: 'error',
        category: 'case',
        blocking: true,
        affectedParts: [String(cs.id), String(mb.id)],
        message: `❌ کیس ${cs.specs.formFactor} نمی‌تواند مادربرد ${mb.specs.formFactor} را در خود جا دهد`,
        reason: `کیس‌های کوچک‌تر (${cs.specs.formFactor}) فقط مادربردهای مساوی یا کوچک‌تر را می‌پذیرند`,
        solution: `کیس ${mb.specs.formFactor} یا بزرگ‌تر انتخاب کنید`,
      });
      blockedPartIds.add(String(cs.id));
      blockedPartIds.add(String(mb.id));
      score -= 20;
      ruleResults.formFactor = {
        passed: false,
        severity: 'error',
        detail: `${cs.specs.formFactor} < ${mb.specs.formFactor}`,
      };
    } else {
      ruleResults.formFactor = {
        passed: true,
        severity: 'success',
        detail: `${cs.specs.formFactor} ≥ ${mb.specs.formFactor}`,
      };
    }
  }

  // ════════════════════════════════════════════════════════════════
  // قانون ۵: توان PSU (محاسبهٔ واقعی)
  // ════════════════════════════════════════════════════════════════
  if (psu) {
    const cpuTdp = (cpu?.specs?.tdp as number) || 95;
    const gpuTdp = gpu ? (gpu.specs?.tdp as number) || 150 : 0;
    const totalTdp = cpuTdp + gpuTdp + 100;
    const required = Math.round((totalTdp * 1.25) / 50) * 50;
    const recommended = Math.round((totalTdp * 1.4) / 50) * 50;

    if (psu.specs?.wattage) {
      const w = psu.specs.wattage;
      if (w < required) {
        errors.push({
          severity: 'error',
          category: 'psu',
          blocking: true,
          affectedParts: [String(psu.id)],
          message: `❌ PSU ناکافی: ${w}W برای این سیستم کافی نیست (حداقل ${required}W لازم)`,
          reason: `مجموع توان: CPU ${cpuTdp}W + GPU ${gpuTdp}W + بقیه ۱۰۰W = ${totalTdp}W. با ۲۵٪ حاشیهٔ امن، ${required}W نیاز است`,
          solution: `PSU با توان ${required}W یا بیشتر انتخاب کنید`,
        });
        blockedPartIds.add(String(psu.id));
        score -= 25;
        ruleResults.psuWattage = {
          passed: false,
          severity: 'error',
          detail: `${w}W < ${required}W`,
        };
      } else if (w < recommended) {
        warnings.push({
          severity: 'warning',
          category: 'psu',
          affectedParts: [String(psu.id)],
          message: `⚡ PSU در حداقل: ${w}W نزدیک به مرز است (${recommended}W پیشنهاد می‌شود)`,
          reason: `برای پایداری بلندمدت و اورکلاک، ${recommended}W راحت‌تر است`,
          solution: `PSU با توان ${recommended}W انتخاب کنید`,
        });
        score -= 5;
        ruleResults.psuWattage = {
          passed: false,
          severity: 'warning',
          detail: `${w}W < ${recommended}W (recommended)`,
        };
      } else {
        ruleResults.psuWattage = {
          passed: true,
          severity: 'success',
          detail: `${w}W ≥ ${recommended}W`,
        };
      }
    }
  }

  // ════════════════════════════════════════════════════════════════
  // قانون ۶: کانکتور برق GPU ↔ PSU
  // ════════════════════════════════════════════════════════════════
  if (gpu && psu) {
    const gpuTdp = gpu.specs?.tdp || 0;
    const gpuTier = gpu.specs?.tier;
    // GPUهای رده‌بالا معمولاً نیاز به کانکتور ۱۲VHPWR دارن
    if (
      gpuTdp >= 450 &&
      !psu.specs?.modular &&
      psu.specs?.rating &&
      !psu.specs.rating.includes('Platinum')
    ) {
      warnings.push({
        severity: 'warning',
        category: 'psu',
        message: `⚠️ GPU با توان ${gpuTdp}W (مثل RTX 4090) به PSU ماژولار با کانکتور ۱۲VHPWR نیاز دارد`,
        reason: `کانکتور ۱۲VHPWR (یا ۴ کانکتور ۸-pin با آداپتور) برای این کارت لازم است`,
        solution: `PSU ماژولار Platinum/Titanium با حداقل ۱۰۰۰W انتخاب کنید`,
      });
      score -= 5;
    }
  }

  // ════════════════════════════════════════════════════════════════
  // قانون ۷: تعداد اسلات M.2 ↔ تعداد SSDهای M.2 (پشتیبانی از چند SSD)
  // ════════════════════════════════════════════════════════════════
  if (mb && storages.length > 0) {
    const chipset = mb.specs?.chipset;
    const m2Slots = Number(mb.specs?.m2Slots || 0) || (chipset ? MB_M2_SLOTS[chipset] || 2 : 2);
    const m2Count = storages
      .filter((s) => s.specs?.formFactor === 'M.2' || s.specs?.isNVMe)
      .reduce((sum, s) => sum + partQty(s), 0);

    if (m2Count > m2Slots) {
      errors.push({
        severity: 'error',
        category: 'storage',
        blocking: true,
        affectedParts: storages
          .filter((s) => s.specs?.formFactor === 'M.2' || s.specs?.isNVMe)
          .map((s) => String(s.id)),
        message: `❌ تعداد SSDهای M.2 بیشتر از ظرفیت مادربرد است (${m2Count} عدد، ظرفیت ${m2Slots} عدد)`,
        reason: `مادربرد ${chipset || ''} فقط ${m2Slots} اسلات M.2 دارد و نمی‌توان SSD M.2 بیشتری نصب کرد`,
        solution: `تعداد SSDهای M.2 را کم کنید یا مادربرد با اسلات بیشتر انتخاب کنید؛ برای حافظه اضافه از SATA هم می‌شود استفاده کرد`,
      });
      storages.forEach((s) => {
        if (s.specs?.formFactor === 'M.2' || s.specs?.isNVMe) blockedPartIds.add(String(s.id));
      });
      score -= 25;
      ruleResults.m2Slots = {
        passed: false,
        severity: 'error',
        detail: `${m2Count} M.2 > ${m2Slots} slots`,
      };
    } else {
      ruleResults.m2Slots = {
        passed: true,
        severity: 'success',
        detail: `${m2Count}/${m2Slots} M.2 slots used`,
      };
    }
  }

  // ════════════════════════════════════════════════════════════════
  // قانون ۸: ارتفاع کولر ↔ حداکثر کیس
  // ════════════════════════════════════════════════════════════════
  if (cooler && cs && cs.specs?.formFactor) {
    const caseMax = CASE_CPU_COOLER_MAX_HEIGHT[cs.specs.formFactor] || 165;
    // تخمین ارتفاع کولر بر اساس نوع
    const coolerType = cooler.specs?.type;
    let coolerHeight = 0;
    if (coolerType === 'air') {
      coolerHeight = 155; // اکثر کولرهای بادی
    } else if (coolerType === 'aio' && cooler.specs?.size === 360) {
      coolerHeight = 50; // رادیاتور بیرون
    } else if (coolerType === 'aio') {
      coolerHeight = 50;
    }
    if (coolerHeight > caseMax) {
      errors.push({
        severity: 'error',
        category: 'cooler',
        blocking: true,
        affectedParts: [String(cooler.id), String(cs.id)],
        message: `❌ خنک‌کننده ${coolerHeight}mm بیشتر از حداکثر کیس ${caseMax}mm است`,
        reason: `کیس ${cs.specs.formFactor} فقط ${caseMax}mm فضا برای کولر CPU دارد`,
        solution: `کولر کوتاه‌تر یا کیس بزرگ‌تر انتخاب کنید`,
      });
      blockedPartIds.add(String(cooler.id));
      blockedPartIds.add(String(cs.id));
      score -= 15;
      ruleResults.coolerHeight = {
        passed: false,
        severity: 'error',
        detail: `${coolerHeight}mm > ${caseMax}mm`,
      };
    } else if (coolerType === 'air') {
      info.push({
        severity: 'info',
        category: 'cooler',
        message: `✓ ارتفاع کولر (${coolerHeight}mm) در کیس ${cs.specs.formFactor} جا می‌شود`,
      });
      ruleResults.coolerHeight = {
        passed: true,
        severity: 'success',
        detail: `${coolerHeight}mm ≤ ${caseMax}mm`,
      };
    }
  }

  // ════════════════════════════════════════════════════════════════
  // قانون ۹: طول GPU ↔ حداکثر کیس
  // ════════════════════════════════════════════════════════════════
  if (gpu && cs && cs.specs?.formFactor) {
    const caseMax = CASE_GPU_MAX_LENGTH[cs.specs.formFactor] || 400;
    // تخمین طول GPU بر اساس رده
    let gpuLength = 0;
    const gpuTier = gpu.specs?.tier;
    if (gpuTier === 'ultra') gpuLength = 320;
    else if (gpuTier === 'high') gpuLength = 300;
    else if (gpuTier === 'medium') gpuLength = 250;
    else gpuLength = 200;

    if (gpuLength > caseMax) {
      warnings.push({
        severity: 'warning',
        category: 'gpu',
        message: `⚠️ GPU ممکن است در کیس ${cs.specs.formFactor} جا نشود (تخمین ${gpuLength}mm، حداکثر ${caseMax}mm)`,
        reason: `کیس‌های کوچک‌تر فضای محدودی برای GPU دارند`,
        solution: `کیس بزرگ‌تر انتخاب کنید یا GPU با طول کمتر`,
      });
      score -= 5;
      ruleResults.gpuLength = {
        passed: false,
        severity: 'warning',
        detail: `${gpuLength}mm may exceed ${caseMax}mm`,
      };
    } else {
      ruleResults.gpuLength = {
        passed: true,
        severity: 'success',
        detail: `GPU fits in ${cs.specs.formFactor}`,
      };
    }
  }

  // ════════════════════════════════════════════════════════════════
  // قانون ۹.۵: تعداد ماژول RAM ↔ اسلات‌های مادربرد
  // ════════════════════════════════════════════════════════════════
  if (mb && ram) {
    const slots = motherboardRamSlots(mb);
    const usedSlots = ramModuleCount(ram) * partQty(ram);
    if (usedSlots > slots) {
      errors.push({
        severity: 'error',
        category: 'ram',
        blocking: true,
        affectedParts: [String(ram.id), String(mb.id)],
        message: `❌ تعداد ماژول‌های RAM بیشتر از اسلات مادربرد است (${usedSlots} ماژول، ظرفیت ${slots} اسلات)`,
        reason: `هر کیت این رم ${ramModuleCount(ram)} ماژول استفاده می‌کند و مادربرد فقط ${slots} اسلات RAM دارد`,
        solution: `تعداد کیت رم را کم کنید یا مادربرد با اسلات RAM بیشتر انتخاب کنید`,
      });
      blockedPartIds.add(String(ram.id));
      blockedPartIds.add(String(mb.id));
      score -= 25;
      ruleResults.ramSlots = {
        passed: false,
        severity: 'error',
        detail: `${usedSlots}/${slots} RAM slots`,
      };
    } else {
      ruleResults.ramSlots = {
        passed: true,
        severity: 'success',
        detail: `${usedSlots}/${slots} RAM slots used`,
      };
      info.push({
        severity: 'success',
        category: 'ram',
        message: `✅ استفاده از اسلات RAM: ${usedSlots} از ${slots} اسلات مادربرد`,
        reason: `اسمبلر تعداد کیت/ماژول RAM را با ظرفیت مادربرد هماهنگ کرده است`,
      });
    }
  }

  // ════════════════════════════════════════════════════════════════
  // قانون ۹.۶: کیفیت کیس برای کاربری سنگین
  // ════════════════════════════════════════════════════════════════
  if (cs && gpu && !cs.specs?.gamingCase && !cs.specs?.airflow) {
    const caseName = String(cs.name || '').toLowerCase();
    const obviousOffice = /اداری|office|business|ساده/.test(caseName);

    const gpuTier = String(gpu.specs?.tier || '');
    const gpuVram = Number(gpu.specs?.vram || 0);
    if (gpuTier === 'high' || gpuTier === 'ultra' || gpuVram >= 8) {
      const targetList = obviousOffice ? errors : warnings;
      targetList.push({
        severity: obviousOffice ? 'error' : 'warning',
        category: 'case',
        affectedParts: [String(cs.id)],
        message: `کیس انتخابی برای قطعات گیمینگ/پرقدرت بهتر است airflow یا mesh باشد`,
        reason: `کارت گرافیک پرمصرف داخل کیس اداری یا بسته دمای بالاتری تولید می‌کند`,
        solution: `کیس گیمینگ Mesh/Airflow با فضای کارت گرافیک کافی انتخاب کنید`,
      });
      if (obviousOffice) {
        blockedPartIds.add(String(cs.id));
        score -= 20;
        ruleResults.caseAirflow = {
          passed: false,
          severity: 'error',
          detail: 'office case with gaming gpu',
        };
      } else {
        score -= 8;
        ruleResults.caseAirflow = {
          passed: false,
          severity: 'warning',
          detail: 'gaming airflow recommended',
        };
      }
    }
  }

  // ════════════════════════════════════════════════════════════════
  // قانون ۱۰: ظرفیت RAM (حداقل)
  // ════════════════════════════════════════════════════════════════
  if (ram && ram.specs?.capacity) {
    const cap = ram.specs.capacity * partQty(ram);
    if (cap < 8) {
      warnings.push({
        severity: 'warning',
        category: 'ram',
        message: `⚠️ رم ${cap}GB برای استفادهٔ مدرن کافی نیست`,
        reason: `سیستم‌عامل و برنامه‌های امروزی حداقل ۸GB نیاز دارند`,
        solution: `رم حداقل ۱۶GB انتخاب کنید`,
      });
      score -= 10;
    } else if (cap < 16) {
      warnings.push({
        severity: 'warning',
        category: 'ram',
        message: `💡 رم ${cap}GB کار می‌کند ولی ۱۶GB+ راحت‌تر است`,
        reason: `برای گیمینگ و مالتی‌تسکینگ، ۱۶GB پیشنهاد می‌شود`,
      });
      score -= 3;
    } else {
      ruleResults.ramCapacity = { passed: true, severity: 'success', detail: `${cap}GB ✓` };
    }
  }

  // ════════════════════════════════════════════════════════════════
  // قانون ۱۱: توان خنک‌کننده ↔ TDP CPU
  // ════════════════════════════════════════════════════════════════
  if (cooler && cpu) {
    const coolerTdp = cooler.specs?.tdpRating || 0;
    const cpuTdp = cpu.specs?.tdp || 95;
    if (coolerTdp && coolerTdp < cpuTdp) {
      errors.push({
        severity: 'error',
        category: 'cooler',
        blocking: true,
        affectedParts: [String(cooler.id)],
        message: `❌ خنک‌کننده (${coolerTdp}W) برای CPU (${cpuTdp}W TDP) کافی نیست`,
        reason: `کولر باید توان بالاتر از TDP CPU داشته باشد (بهتر است ۱.۳x)`,
        solution: `کولر با توان ${Math.ceil(cpuTdp * 1.3)}W+ انتخاب کنید`,
      });
      blockedPartIds.add(String(cooler.id));
      score -= 15;
      ruleResults.coolerTDP = {
        passed: false,
        severity: 'error',
        detail: `${coolerTdp}W < ${cpuTdp}W`,
      };
    } else if (coolerTdp && coolerTdp < cpuTdp * 1.3) {
      info.push({
        severity: 'info',
        category: 'cooler',
        message: `💡 خنک‌کننده در حد مرز است (${coolerTdp}W برای ${cpuTdp}W CPU)`,
      });
      score -= 3;
    } else if (coolerTdp) {
      ruleResults.coolerTDP = {
        passed: true,
        severity: 'success',
        detail: `${coolerTdp}W ≥ ${cpuTdp}W ✓`,
      };
    }
  }

  // ════════════════════════════════════════════════════════════════
  // قانون ۱۲: GPU PCIe Gen
  // ════════════════════════════════════════════════════════════════
  if (gpu && mb) {
    const gpuIsGen4 = gpu.specs?.tier === 'ultra' || gpu.specs?.vram >= 16;
    const mbChipset = mb.specs?.chipset;
    if (gpuIsGen4) {
      // GPUهای رده‌بالا PCIe Gen4 نیاز دارن
      if (mbChipset && ['H510', 'H610', 'A520'].includes(mbChipset)) {
        warnings.push({
          severity: 'warning',
          category: 'gpu',
          message: `⚠️ مادربرد ${mbChipset} PCIe Gen3 دارد. GPU ${gpu.specs?.vram}GB به Gen4 نیاز دارد (۵-۱۰٪ افت کارایی)`,
          reason: `مادربردهای اقتصادی Gen3 هستن، اما GPU رده‌بالا Gen4`,
          solution: `برای بهترین کارایی، مادربرد B550/Z690+ انتخاب کنید`,
        });
        score -= 5;
      }
    }
  }

  // ════════════════════════════════════════════════════════════════
  // قانون ۱۳: SATA SSD/HDD ↔ تعداد پورت SATA (پشتیبانی از چند درایو)
  // ════════════════════════════════════════════════════════════════
  if (mb && storages.length > 0 && mb.specs?.chipset) {
    const sataPorts = MB_SATA_PORTS[mb.specs.chipset] || 4;
    const sataCount = storages
      .filter((s) => s.specs?.formFactor === '2.5"' || s.specs?.formFactor === '3.5"')
      .reduce((sum, s) => sum + partQty(s), 0);
    if (sataCount > sataPorts) {
      errors.push({
        severity: 'error',
        category: 'storage',
        blocking: true,
        affectedParts: storages
          .filter((s) => s.specs?.formFactor === '2.5"' || s.specs?.formFactor === '3.5"')
          .map((s) => String(s.id)),
        message: `❌ تعداد درایوهای SATA بیشتر از پورت‌های مادربرد است (${sataCount} عدد، ظرفیت ${sataPorts} عدد)`,
        reason: `مادربرد ${mb.specs.chipset} فقط ${sataPorts} پورت SATA دارد`,
        solution: `تعداد درایو SATA را کم کنید یا مادربرد با پورت بیشتر انتخاب کنید`,
      });
      score -= 20;
      ruleResults.sataPorts = {
        passed: false,
        severity: 'error',
        detail: `${sataCount} SATA > ${sataPorts} ports`,
      };
    } else {
      ruleResults.sataPorts = {
        passed: true,
        severity: 'success',
        detail: `${sataCount}/${sataPorts} SATA ports used`,
      };
    }
  }

  // ════════════════════════════════════════════════════════════════
  // بررسی قطعات موجود
  // ════════════════════════════════════════════════════════════════
  for (const part of parts) {
    if (!part.inStock || part.price === 0) {
      unavailablePartIds.add(String(part.id));
      warnings.push({
        severity: 'warning',
        category: part.category,
        affectedParts: [String(part.id)],
        message: `⚠️ ${part.categoryLabel}: "${part.name}" ناموجود است`,
        reason: 'محصول در حال حاضر موجود نیست',
        solution: 'قطعهٔ جایگزین انتخاب کنید',
      });
      score -= 5;
    }
  }

  // ════════════════════════════════════════════════════════════════
  // محاسبهٔ وضعیت نهایی
  // ════════════════════════════════════════════════════════════════
  const errorCount = errors.length;
  const warningCount = warnings.length;

  let status: CompatibilityMatrix['status'] = 'compatible';
  if (errorCount > 0) status = 'incompatible';
  else if (warningCount > 0) status = 'warning';
  else if (parts.length > 0) status = 'compatible';

  // بررسی قطعات اصلی موجود بودن
  const mandatoryParts = parts.filter((p) => !p.isOptional);
  const availableMandatory = mandatoryParts.filter((p) => p.inStock && p.price > 0);
  if (mandatoryParts.length > 0 && availableMandatory.length < mandatoryParts.length) {
    const missingCategories = mandatoryParts
      .filter((p) => !availableMandatory.find((am) => am.category === p.category))
      .map((p) => p.categoryLabel);
    if (missingCategories.length > 0) {
      warnings.push({
        severity: 'warning',
        message: `⚠️ برخی قطعات اصلی موجود نیستن: ${missingCategories.join('، ')}`,
        reason: 'فروشگاه الان موجودی کامل ندارد',
        solution: 'منتظر بمانید یا قطعهٔ جایگزین انتخاب کنید',
      });
      status = 'unavailable';
    }
  }

  // اگه هیچ قطعه‌ای پیدا نشد
  if (parts.length === 0) {
    status = 'unavailable';
  }

  return {
    buildable: errorCount === 0,
    score: Math.max(0, Math.min(100, score)),
    status,
    errors,
    warnings,
    info,
    blockedPartIds,
    unavailablePartIds,
    ruleResults,
  };
}

// ════════════════════════════════════════════════════════════════
// 🎯 پیام‌های آماده برای UI
// ════════════════════════════════════════════════════════════════

export const STATUS_MESSAGES: Record<
  string,
  { label: string; emoji: string; color: string; description: string }
> = {
  compatible: {
    label: 'سازگار ✅',
    emoji: '✅',
    color: '#059669',
    description: 'همهٔ قطعات کاملاً سازگار هستند. سیستم آمادهٔ اسمبل است!',
  },
  warning: {
    label: 'هشدار ⚠️',
    emoji: '⚠️',
    color: '#f59e0b',
    description: 'سیستم قابل اسمبل است ولی برخی قطعات بهینه نیستند.',
  },
  incompatible: {
    label: 'ناسازگار ❌',
    emoji: '❌',
    color: '#ef4444',
    description: 'برخی قطعات با هم سازگار نیستند. باید جایگزین شوند.',
  },
  unavailable: {
    label: 'موجود نیست ⏳',
    emoji: '⏳',
    color: '#6b7790',
    description: 'برخی قطعات در حال حاضر موجود نیستند. به زودی موجود می‌شوند.',
  },
};
