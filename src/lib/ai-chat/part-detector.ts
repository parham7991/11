/**
 * ════════════════════════════════════════════════════════════════
 * 🔬 part-detector.ts — موتور تشخیص هوشمند قطعات (v2 — fine-tuned)
 * ════════════════════════════════════════════════════════════════
 *
 * نسخهٔ ۲: با داده‌های واقعی فروشگاه آفلند fine-tune شده.
 *
 * بهبودهای کلیدی:
 *   - hard excludes دقیق (مانیتور در مادربرد، لپ‌تاپ در GPU، ...)
 *   - پترن‌های واقعی فارسی (پردازنده اینتل، ای ام دی، ...)
 *   - تشخیص Tray/بدون باکس
 *   - تشخیص GDDR7، D5/D4، WiFi، ...
 *   - امتیازدهی بهبودیافته برای CPU
 *
 * ════════════════════════════════════════════════════════════════
 */

import {
  CPU_DB,
  GPU_DB,
  MB_CHIPSETS,
  COOLER_BRANDS,
  PERSIAN_BRANDS,
  type CpuModel,
  type GpuModel,
  type MbChipset,
  type FormFactor,
} from './parts-db';

// ════════════════════════════════════════════════════════════════
// 🧰 توابع کمکی
// ════════════════════════════════════════════════════════════════

function normalize(name: string): string {
  return String(name || '')
    .toLowerCase()
    .replace(/[\u200c\s\u200f\u200e]+/g, ' ')
    .replace(/[\-_/\\|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function containsAny(text: string, keywords: string[]): boolean {
  const t = text.toLowerCase();
  return keywords.some(k => t.includes(k.toLowerCase()));
}

function containsAll(text: string, keywords: string[]): boolean {
  const t = text.toLowerCase();
  return keywords.every(k => t.includes(k.toLowerCase()));
}

// ════════════════════════════════════════════════════════════════
// 📦 نوع خروجی تشخیص
// ════════════════════════════════════════════════════════════════

export interface PartDetection {
  isMatch: boolean;
  confidence: number;
  matchedModel?: string;
  specs: Record<string, any>;
  shortSpec: string;
  matchedDb?: any;
}

// ════════════════════════════════════════════════════════════════
// ❌ کلمات ممنوعهٔ هر دسته — fine-tune شده با داده‌های واقعی
// ════════════════════════════════════════════════════════════════
// نکته: کلمهٔ "باکس" قبلاً در CPU بود ولی الان نیست.
// "Tray" و "بدون باکس" در CPU مجاز هستن (پردازنده واقعی هستن)

const CPU_HARD_EXCLUDE = [
  // کولرها که اشتباهی تو CPU میان (مشکل اصلی!)
  'خنک کننده پردازنده', 'کولر پردازنده', 'cpu cooler',
  'فن پردازنده', 'هیت سینک', 'heat sink', 'heatpipe',
  'liquid cooler', 'water cooler', 'aio',
  // خنک‌کننده‌های برند
  'noctua nh-', 'deepcool ak', 'deepcool assassin', 'arctic freezer',
  'be quiet dark rock', 'corsair h150i', 'corsair h100i',
  'lian li galahad', 'kraken', 'masterliquid', 'boreas',
  'fc-f35', 'fc-mig', 'sst-hyd', 'av360t', 'av360l', 'av80',
  'av90', 'av904', 'av905', 'gafan', 'dark flash c400', 'dark flash dn',
  'silverstone ar', 'silverstone sst', 'silverstone xe02',
  // سایر موارد نامرتبط
  'thermal paste', 'خمیر سیلیکون',
  'fan heatsink', 'radiator', 'رادیاتور',
];

const GPU_HARD_EXCLUDE = [
  // لپ‌تاپ (در نام‌های واقعی زیاد می‌بینیم)
  'لپ تاپ', 'لپتاپ', 'laptop', 'notebook', 'نوت بوک',
  // iMac / Apple
  'آی مک', 'imac', 'macbook', 'مک بوک',
  // موبایل
  'موبایل', 'گوشی', 'mobile', 'iphone', 'ipad', 'samsung galaxy a', 'xiaomi',
  // لوازم جانبی
  'پایه نگهدارنده', 'نگهدارنده', 'holder', 'stand',
  'کابل', 'cable', 'براکت', 'bracket', 'vertical gpu kit',
  // مانیتور (بعضی برندها مشترک)
  'مانیتور', 'monitor',
  // پردازنده و سایر قطعات
  'پردازنده', 'processor', 'ryzen', 'core i', 'مادربرد', 'motherboard',
  'رم', 'ram', 'ssd', 'nvme', 'پاور', 'psu', 'power supply',
  'کیس', 'case', 'کولر', 'cooler',
];

const RAM_HARD_EXCLUDE = [
  // موبایل
  'گوشی موبایل', 'گوشی', 'موبایل', 'mobile', 'iphone',
  'samsung galaxy', 'poco', 'xiaomi', 'galaxy a', 'galaxy s',
  // لپ‌تاپ (SO-DIMM)
  'لپ تاپ', 'لپتاپ', 'so-dimm', 'sodimm', 'لپ تاپی',
  'iphone', 'ipad',
  // سایر قطعات
  'پردازنده', 'cpu', 'مادربرد', 'کارت گرافیک', 'gpu', 'ssd', 'nvme', 'پاور', 'psu', 'کیس', 'case',
];

const STORAGE_HARD_EXCLUDE = [
  'پردازنده', 'cpu', 'مادربرد', 'motherboard', 'رم', 'ram', 'کارت گرافیک', 'gpu',
  'موبایل', 'گوشی', 'لپ تاپ', 'آی مک', 'پاور', 'psu',
];

const PSU_HARD_EXCLUDE = [
  'کابل برق', 'کابل', 'cable',
  'پردازنده', 'cpu', 'مادربرد', 'motherboard', 'کارت گرافیک', 'gpu', 'رم', 'ram', 'ssd',
  'مانیتور', 'monitor', 'لپ تاپ', 'آی مک', 'گوشی',
  'موبایل', 'گوشی موبایل', 'تبلت', 'tablet',
];

const MB_HARD_EXCLUDE = [
  // مانیتور (در داده‌های واقعی زیاد می‌بینیم!)
  'مانیتور', 'monitor',
  // کارت گرافیک
  'کارت گرافیک', 'گرافیک', 'gpu',
  // پاور
  'پاور', 'psu', 'power supply',
  // سایر قطعات
  'پردازنده', 'cpu', 'processor', 'رم', 'ram', 'ssd', 'nvme', 'کیس', 'case', 'کولر', 'cooler',
  // کنترلرها
  'کنترل نورپردازی', 'rgb controller', 'fan controller',
  'فن پردازنده', 'خنک کننده پردازنده',
];

const CASE_HARD_EXCLUDE = [
  'پردازنده', 'cpu', 'مادربرد', 'motherboard', 'کارت گرافیک', 'gpu', 'رم', 'ram', 'ssd', 'پاور', 'psu',
  'کولر پردازنده', 'خنک کننده', 'cooler',
  'مانیتور', 'monitor', 'لپ تاپ', 'آی مک',
];

const COOLER_HARD_EXCLUDE = [
  'ryzen 9', 'ryzen 7', 'ryzen 5', 'core i9', 'core i7', 'core i5', 'core i3', 'پردازنده',
  'processor', 'cpu', 'مادربرد', 'motherboard',
  'فن کیس', 'case fan', 'rgb fan',
];

const FAN_HARD_EXCLUDE = [
  'پردازنده', 'cpu', 'مادربرد', 'motherboard', 'کارت گرافیک', 'gpu', 'رم', 'ram', 'ssd', 'پاور', 'psu',
  'کیس', 'case', 'monitor', 'مانیتور',
];

const ARGB_HARD_EXCLUDE = [
  'پردازنده', 'cpu', 'مادربرد', 'motherboard', 'کارت گرافیک', 'gpu', 'رم', 'ram', 'ssd', 'پاور', 'psu', 'کیس', 'case',
];

// ════════════════════════════════════════════════════════════════
// 🧠 تشخیص CPU
// ════════════════════════════════════════════════════════════════

export function detectCpu(name: string): PartDetection {
  const n = normalize(name);
  if (!n) return { isMatch: false, confidence: 0, specs: {}, shortSpec: '' };

  if (containsAny(n, CPU_HARD_EXCLUDE)) {
    return { isMatch: false, confidence: 0, specs: {}, shortSpec: '' };
  }

  // ۱) تطابق دقیق با دیتابیس
  for (const cpu of CPU_DB) {
    for (const kw of cpu.keywords) {
      if (n.includes(kw.toLowerCase())) {
        return {
          isMatch: true,
          confidence: 98,
          matchedModel: cpu.model,
          specs: {
            cores: cpu.cores,
            threads: cpu.threads,
            socket: cpu.socket,
            tier: cpu.tier,
            brand: cpu.brand,
            frequency: cpu.boostFreq,
            tdp: cpu.tdp,
            priceRange: cpu.priceRange,
            integratedGraphics: !/f$/i.test(cpu.model) || /5600g|5700g|8600g|8700g/i.test(cpu.model),
          },
          shortSpec: `${cpu.brand} ${cpu.model} • ${cpu.cores}C/${cpu.threads}T • ${cpu.socket}`,
          matchedDb: cpu,
        };
      }
    }
  }

  // ۲) تشخیص خانواده (مهم‌ترین fallback)
  const familyResult = detectCpuFamily(n);
  if (familyResult.isMatch) return familyResult;

  // ۳) فقط کلمهٔ پردازنده (confidence پایین)
  if (containsAny(n, ['پردازنده', 'cpu', 'processor', 'سی پی یو'])) {
    return {
      isMatch: true,
      confidence: 55,
      matchedModel: 'CPU',
      specs: { tier: 'medium' },
      shortSpec: 'پردازنده',
    };
  }

  return { isMatch: false, confidence: 0, specs: {}, shortSpec: '' };
}

function detectCpuFamily(n: string): PartDetection {
  // ═══════ AMD Ryzen ═══════
  if (containsAny(n, ['ryzen 9', 'amd ryzen 9', 'r9 ', 'ای ام دی ryzen 9', 'ryzen9'])) {
    return {
      isMatch: true, confidence: 82,
      matchedModel: 'AMD Ryzen 9',
      specs: { cores: 12, threads: 24, socket: 'AM5/AM4', tier: 'ultra', brand: 'AMD', integratedGraphics: false },
      shortSpec: 'AMD Ryzen 9 • 12+ هسته',
    };
  }
  if (containsAny(n, ['ryzen 7', 'amd ryzen 7', 'r7 ', 'ای ام دی ryzen 7', 'ryzen7'])) {
    return {
      isMatch: true, confidence: 82,
      matchedModel: 'AMD Ryzen 7',
      specs: { cores: 8, threads: 16, socket: 'AM5/AM4', tier: 'high', brand: 'AMD', integratedGraphics: false },
      shortSpec: 'AMD Ryzen 7 • 8 هسته',
    };
  }
  if (containsAny(n, ['ryzen 5', 'amd ryzen 5', 'r5 ', 'ای ام دی ryzen 5', 'ryzen5'])) {
    return {
      isMatch: true, confidence: 82,
      matchedModel: 'AMD Ryzen 5',
      specs: { cores: 6, threads: 12, socket: 'AM5/AM4', tier: 'medium', brand: 'AMD', integratedGraphics: /5600g|5700g|8600g|8700g/.test(n) },
      shortSpec: 'AMD Ryzen 5 • 6 هسته',
    };
  }
  if (containsAny(n, ['ryzen 3', 'amd ryzen 3', 'r3 '])) {
    return {
      isMatch: true, confidence: 80,
      matchedModel: 'AMD Ryzen 3',
      specs: { cores: 4, threads: 8, socket: 'AM4', tier: 'entry', brand: 'AMD', integratedGraphics: /g\b/.test(n) },
      shortSpec: 'AMD Ryzen 3 • 4 هسته',
    };
  }

  // ═══════ Intel Core Ultra (جدید) ═══════
  if (containsAny(n, ['core ultra 9', 'core ultra 7', 'core ultra 5'])) {
    return {
      isMatch: true, confidence: 88,
      matchedModel: 'Intel Core Ultra',
      specs: { tier: 'high', brand: 'Intel', socket: 'LGA1851' },
      shortSpec: 'Intel Core Ultra',
    };
  }

  // ═══════ Intel Core i ═══════
  if (containsAny(n, ['core i9', 'intel core i9', 'i9-', 'i9 ', 'core i9-'])) {
    return {
      isMatch: true, confidence: 85,
      matchedModel: 'Intel Core i9',
      specs: { cores: 16, threads: 24, socket: 'LGA1700', tier: 'ultra', brand: 'Intel', integratedGraphics: !/\d+f\b|kf\b/i.test(n) },
      shortSpec: 'Intel Core i9 • 16+ هسته',
    };
  }
  if (containsAny(n, ['core i7', 'intel core i7', 'i7-', 'i7 ', 'core i7-'])) {
    return {
      isMatch: true, confidence: 85,
      matchedModel: 'Intel Core i7',
      specs: { cores: 12, threads: 20, socket: 'LGA1700', tier: 'high', brand: 'Intel', integratedGraphics: !/\d+f\b|kf\b/i.test(n) },
      shortSpec: 'Intel Core i7 • 12+ هسته',
    };
  }
  if (containsAny(n, ['core i5', 'intel core i5', 'i5-', 'i5 ', 'core i5-'])) {
    return {
      isMatch: true, confidence: 85,
      matchedModel: 'Intel Core i5',
      specs: { cores: 10, threads: 16, socket: 'LGA1700', tier: 'medium', brand: 'Intel', integratedGraphics: !/\d+f\b|kf\b/i.test(n) },
      shortSpec: 'Intel Core i5 • 10+ هسته',
    };
  }
  if (containsAny(n, ['core i3', 'intel core i3', 'i3-', 'i3 '])) {
    return {
      isMatch: true, confidence: 82,
      matchedModel: 'Intel Core i3',
      specs: { cores: 4, threads: 8, socket: 'LGA1700', tier: 'entry', brand: 'Intel', integratedGraphics: !/\d+f\b/i.test(n) },
      shortSpec: 'Intel Core i3 • 4 هسته',
    };
  }

  // ═══════ Intel Xeon Server ═══════
  if (containsAny(n, ['xeon', 'xeon processor', 'xeon e5'])) {
    return {
      isMatch: true, confidence: 88,
      matchedModel: 'Intel Xeon',
      specs: { tier: 'high', brand: 'Intel', socket: 'LGA2011-3' },
      shortSpec: 'Intel Xeon Server',
    };
  }

  return { isMatch: false, confidence: 0, specs: {}, shortSpec: '' };
}

// ════════════════════════════════════════════════════════════════
// 🎮 تشخیص GPU
// ════════════════════════════════════════════════════════════════

export function detectGpu(name: string): PartDetection {
  const n = normalize(name);
  if (!n) return { isMatch: false, confidence: 0, specs: {}, shortSpec: '' };

  if (containsAny(n, GPU_HARD_EXCLUDE)) {
    return { isMatch: false, confidence: 0, specs: {}, shortSpec: '' };
  }

  // ۱) تطابق دقیق با دیتابیس
  for (const gpu of GPU_DB) {
    for (const kw of gpu.keywords) {
      if (n.includes(kw.toLowerCase())) {
        return {
          isMatch: true,
          confidence: 98,
          matchedModel: gpu.model,
          specs: {
            vram: gpu.vram,
            tier: gpu.tier,
            brand: gpu.brand,
            tdp: gpu.tdp,
            priceRange: gpu.priceRange,
          },
          shortSpec: `${gpu.brand} ${gpu.model} • ${gpu.vram}GB`,
          matchedDb: gpu,
        };
      }
    }
  }

  // ۲) تشخیص خانواده
  // RTX 50 series (جدیدترین)
  if (containsAny(n, ['5090', '5080', '5070', '5060'])) {
    return { isMatch: true, confidence: 88, matchedModel: 'RTX 50 Series', specs: { tier: 'high', brand: 'NVIDIA' }, shortSpec: 'RTX 50 Series' };
  }
  // RTX 40 series
  if (containsAny(n, ['4090', '4080', '4070', '4060', 'geforce rtx 4'])) {
    return { isMatch: true, confidence: 88, matchedModel: 'RTX 40 Series', specs: { tier: 'high', brand: 'NVIDIA' }, shortSpec: 'RTX 40 Series' };
  }
  // RTX 30 series
  if (containsAny(n, ['3090', '3080', '3070', '3060', '3050'])) {
    return { isMatch: true, confidence: 88, matchedModel: 'RTX 30 Series', specs: { tier: 'medium', brand: 'NVIDIA' }, shortSpec: 'RTX 30 Series' };
  }
  // GTX 16 series
  if (containsAny(n, ['1660', '1650', '1630', '1050'])) {
    return { isMatch: true, confidence: 85, matchedModel: 'GTX 10/16 Series', specs: { tier: 'entry', brand: 'NVIDIA' }, shortSpec: 'GTX Series' };
  }
  // GT series (قدیمی‌ها)
  if (containsAny(n, [' gt 7', ' gt 6', 'gt 1030', 'gt 740', 'gt 730', 'gt 710', 'gt 610', 'gt1030', 'gt740', 'gt730', 'gt710', 'gt610', 'جی تی 7', 'جی تی 6'])) {
    return { isMatch: true, confidence: 85, matchedModel: 'GT Series', specs: { tier: 'entry', brand: 'NVIDIA' }, shortSpec: 'GT Series (قدیمی)' };
  }
  // RX 9000 (جدید)
  if (containsAny(n, ['9070', 'rx 9', 'radeon rx 9'])) {
    return { isMatch: true, confidence: 88, matchedModel: 'RX 9000 Series', specs: { tier: 'high', brand: 'AMD' }, shortSpec: 'RX 9000 Series' };
  }
  // RX 7000
  if (containsAny(n, ['7900', '7800', '7700', '7600', 'radeon rx 7'])) {
    return { isMatch: true, confidence: 88, matchedModel: 'RX 7000 Series', specs: { tier: 'high', brand: 'AMD' }, shortSpec: 'RX 7000 Series' };
  }
  // RX 6000
  if (containsAny(n, ['6950', '6900', '6800', '6700', '6600', '6500', '6400', 'radeon rx 6'])) {
    return { isMatch: true, confidence: 85, matchedModel: 'RX 6000 Series', specs: { tier: 'medium', brand: 'AMD' }, shortSpec: 'RX 6000 Series' };
  }
  // Intel Arc
  if (containsAny(n, ['arc a', 'intel arc'])) {
    return { isMatch: true, confidence: 85, matchedModel: 'Intel Arc', specs: { tier: 'medium', brand: 'Intel' }, shortSpec: 'Intel Arc' };
  }

  // ۳) فقط کلمهٔ کارت گرافیک
  if (containsAny(n, ['کارت گرافیک', 'گرافیک', 'graphics card', ' video card', 'videocard'])) {
    return { isMatch: true, confidence: 50, matchedModel: 'GPU', specs: { tier: 'medium' }, shortSpec: 'کارت گرافیک' };
  }

  return { isMatch: false, confidence: 0, specs: {}, shortSpec: '' };
}

// ════════════════════════════════════════════════════════════════
// 🔲 تشخیص Motherboard
// ════════════════════════════════════════════════════════════════

export function detectMotherboard(name: string): PartDetection {
  const n = normalize(name);
  if (!n) return { isMatch: false, confidence: 0, specs: {}, shortSpec: '' };

  if (containsAny(n, MB_HARD_EXCLUDE)) {
    return { isMatch: false, confidence: 0, specs: {}, shortSpec: '' };
  }

  // ۱) استخراج چیپ‌ست
  let chipsetInfo: MbChipset | null = null;
  for (const cs of MB_CHIPSETS) {
    if (containsAny(n, cs.keywords)) {
      chipsetInfo = cs;
      break;
    }
  }

  // ۲) تشخیص RAM Type (D5 = DDR5, D4 = DDR4)
  let ramType: 'DDR5' | 'DDR4' | null = null;
  if (containsAny(n, ['ddr5', ' ddr 5', ' d5 ', 'd5)', '(d5)', '/d5', '+d5', 'with d5'])) ramType = 'DDR5';
  else if (containsAny(n, ['ddr4', ' ddr 4', ' d4 ', 'd4)', '(d4)', '/d4', '+d4', 'with d4'])) ramType = 'DDR4';
  else if (containsAny(n, ['ddr3'])) ramType = 'DDR4'; // DDR3 = old, treat as DDR4 in detection

  // ۳) تشخیص Form Factor (M suffix = Micro-ATX)
  let formFactor: FormFactor = 'ATX';
  if (containsAny(n, ['e-atx', 'eatx'])) formFactor = 'E-ATX';
  else if (containsAny(n, ['mini-itx', 'mini itx', 'itx'])) formFactor = 'Mini-ITX';
  else if (containsAny(n, ['matx', 'm-atx', 'micro-atx', 'micro atx'])) formFactor = 'Micro-ATX';
  // مدل‌های m-suffix (مثل B760M, H610M)
  else if (/[a-z]\d+m\b/i.test(n) || /\d+m-/i.test(n) || /m\d+/i.test(n)) formFactor = 'Micro-ATX';
  else if (containsAny(n, ['atx'])) formFactor = 'ATX';

  // ۴) تشخیص سوکت
  let socket = chipsetInfo?.socket;
  if (containsAny(n, ['am5', 'سوکت am5', 'socket am5'])) socket = 'AM5';
  else if (containsAny(n, ['am4', 'سوکت am4', 'socket am4'])) socket = 'AM4';
  else if (containsAny(n, ['lga 1700', 'lga1700'])) socket = 'LGA1700';
  else if (containsAny(n, ['lga 1851', 'lga1851'])) socket = 'LGA1851';

  // ۵) WiFi؟
  const hasWifi = containsAny(n, ['wifi', 'wi-fi', 'وای فای']);

  // ۵.۵) ظرفیت توسعهٔ مادربرد (برای تصمیم‌گیری چند RAM / چند SSD)
  const ramSlotsMatch = n.match(/(?:ram slots?|memory slots?|dimm slots?|اسلات(?:‌| )?رم)\s*[:x×-]?\s*(\d)/i)
    || n.match(/(\d)\s*(?:x|×)\s*(?:ddr4|ddr5|dimm|رم)/i);
  const m2SlotsMatch = n.match(/(?:m\.?2|nvme)\s*(?:slots?|اسلات)?\s*[:x×-]?\s*(\d)/i)
    || n.match(/(\d)\s*(?:x|×)\s*(?:m\.?2|nvme)/i);
  const sataPortsMatch = n.match(/(?:sata)\s*(?:ports?|پورت)?\s*[:x×-]?\s*(\d)/i)
    || n.match(/(\d)\s*(?:x|×)\s*sata/i);
  const inferredRamSlots = formFactor === 'Mini-ITX' ? 2 : formFactor === 'Micro-ATX' ? 4 : 4;

  // ۶) تشخیص "مثبت"
  const hasPositive =
    containsAny(n, ['مادربرد', 'motherboard', 'mainboard', 'برد اصلی', 'm.b']);

  if (!hasPositive && !chipsetInfo) {
    return { isMatch: false, confidence: 0, specs: {}, shortSpec: '' };
  }

  // اگه چیپ‌ست پیدا شد، خیلی مطمئنیم
  if (chipsetInfo) {
    const specs: any = {
      socket: socket || chipsetInfo.socket,
      ramType: ramType || chipsetInfo.ramType,
      tier: chipsetInfo.tier,
      chipset: chipsetInfo.chipset,
      formFactor,
      wifi: hasWifi,
      ramSlots: ramSlotsMatch ? Number(ramSlotsMatch[1]) : inferredRamSlots,
      m2Slots: m2SlotsMatch ? Number(m2SlotsMatch[1]) : undefined,
      sataPorts: sataPortsMatch ? Number(sataPortsMatch[1]) : undefined,
    };
    return {
      isMatch: true,
      confidence: 96,
      matchedModel: `${chipsetInfo.chipset} chipset`,
      specs,
      shortSpec: `${chipsetInfo.chipset} • ${specs.ramType} • ${formFactor}${hasWifi ? ' • WiFi' : ''}`,
      matchedDb: chipsetInfo,
    };
  }

  // فقط نام مادربرد
  if (hasPositive) {
    return {
      isMatch: true,
      confidence: 80,
      matchedModel: 'Motherboard',
      specs: {
        socket: socket || 'unknown',
        ramType: ramType || 'DDR5',
        formFactor,
        wifi: hasWifi,
        ramSlots: ramSlotsMatch ? Number(ramSlotsMatch[1]) : inferredRamSlots,
        m2Slots: m2SlotsMatch ? Number(m2SlotsMatch[1]) : undefined,
        sataPorts: sataPortsMatch ? Number(sataPortsMatch[1]) : undefined,
        tier: ramType === 'DDR5' ? 'high' : 'medium',
      },
      shortSpec: `مادربرد ${socket || ''} ${ramType || ''} ${formFactor}${hasWifi ? ' WiFi' : ''}`.trim(),
    };
  }

  return { isMatch: false, confidence: 0, specs: {}, shortSpec: '' };
}

// ════════════════════════════════════════════════════════════════
// 💾 تشخیص RAM
// ════════════════════════════════════════════════════════════════

export function detectRam(name: string): PartDetection {
  const n = normalize(name);
  if (!n) return { isMatch: false, confidence: 0, specs: {}, shortSpec: '' };

  if (containsAny(n, RAM_HARD_EXCLUDE)) {
    return { isMatch: false, confidence: 0, specs: {}, shortSpec: '' };
  }

  const specs: any = {};
  const specParts: string[] = [];

  // RAM Type
  let isLaptop = false;
  if (containsAny(n, ['لپ تاپ', 'لپتاپ', 'laptop', 'notebook', ' so-dimm', 'sodimm'])) {
    isLaptop = true;
    specs.formFactor = 'SO-DIMM';
  } else {
    specs.formFactor = 'U-DIMM';
  }

  if (containsAny(n, ['ddr5', ' ddr 5'])) { specs.ramType = 'DDR5'; specParts.push('DDR5'); }
  else if (containsAny(n, ['ddr4', ' ddr 4'])) { specs.ramType = 'DDR4'; specParts.push('DDR4'); }
  else if (containsAny(n, ['ddr3', ' ddr 3'])) { specs.ramType = 'DDR3'; specParts.push('DDR3'); }
  else if (containsAny(n, ['ddr2'])) { specs.ramType = 'DDR2'; specParts.push('DDR2'); }

  // Capacity (فارسی: ظرفیت X گیگابایت)
  const capFa = n.match(/ظرفیت\s*(\d+)\s*(?:گیگ|گیگابایت|گيگ)/i);
  const capEn = n.match(/(\d+)\s*(?:gb|گیگابایت)/i);
  const capOnly = n.match(/(\d+)\s*گیگ/i);
  if (capFa) {
    const cap = parseInt(capFa[1]);
    if (cap >= 2 && cap <= 256) { specs.capacity = cap; specParts.push(`${cap}GB`); }
  } else if (capEn) {
    const cap = parseInt(capEn[1]);
    if (cap >= 2 && cap <= 256) { specs.capacity = cap; specParts.push(`${cap}GB`); }
  } else if (capOnly) {
    const cap = parseInt(capOnly[1]);
    if (cap >= 2 && cap <= 256) { specs.capacity = cap; specParts.push(`${cap}GB`); }
  }

  // تعداد ماژول‌های کیت: برای استفاده دقیق از اسلات‌های RAM مادربرد
  const kitMatch = n.match(/(\d)\s*(?:x|×)\s*(\d{1,3})\s*(?:gb|گیگ|گيگ)/i);
  if (kitMatch) {
    const modules = Number(kitMatch[1]);
    const perModule = Number(kitMatch[2]);
    if (modules >= 1 && modules <= 8) specs.moduleCount = modules;
    if (perModule >= 2 && perModule <= 128) specs.moduleSize = perModule;
    if (!specs.capacity && modules * perModule <= 256) {
      specs.capacity = modules * perModule;
      specParts.push(`${modules * perModule}GB`);
    }
    specParts.push(`${modules}×${perModule}GB`);
  } else if (containsAny(n, ['dual', 'دو کاناله', '2 کاناله', 'kit 2'])) {
    specs.moduleCount = 2;
  } else {
    specs.moduleCount = 1;
  }

  // Frequency (فارسی: فرکانس X مگاهرتز / انگلیسی: XMHz)
  const freqFa = n.match(/فرکانس\s*(\d{3,4})\s*(?:مگاهرتز|مگا)/i);
  const freqEn = n.match(/(\d{3,4})\s*mhz/i);
  if (freqFa) {
    const freq = parseInt(freqFa[1]);
    if (freq >= 1600 && freq <= 8000) { specs.frequency = freq; specParts.push(`${freq}MHz`); }
  } else if (freqEn) {
    const freq = parseInt(freqEn[1]);
    if (freq >= 1600 && freq <= 8000) { specs.frequency = freq; specParts.push(`${freq}MHz`); }
  }

  // CAS Latency (CLXX)
  const clMatch = n.match(/cl\s*(\d+)/i);
  if (clMatch) { specs.casLatency = parseInt(clMatch[1]); specParts.push(`CL${clMatch[1]}`); }

  // RGB
  if (containsAny(n, ['rgb', 'argb', 'vengeance rgb', 'رنگی'])) {
    specs.rgb = true;
    specParts.push('RGB');
  }

  // Channel (تک کاناله / دو کاناله / dual)
  if (containsAny(n, ['dual', 'دو کاناله', '2 کاناله', 'kit 2'])) {
    specs.channel = 'dual';
    specs.moduleCount = Math.max(Number(specs.moduleCount || 1), 2);
    specParts.push('Dual');
  } else if (containsAny(n, ['تک کاناله', 'single'])) {
    specs.channel = 'single';
    specs.moduleCount = 1;
    specParts.push('Single');
  }

  // Brand bonus
  const brandBonus =
    containsAny(n, ['kingston', 'corsair', 'gskill', 'g.skill', 'teamgroup', 'crucial', 'adata', 'kingbank', 'geil', 'apacer', 'lexar', 'kingmax', 'کینگستون', 'ای دیتا', 'کورسیر', 'لکسار']) ? 8 : 0;

  // اگه لپ‌تاپ باشه، از اسمبل دسکتاپ حذف می‌شه (confidence پایین)
  if (isLaptop) {
    return {
      isMatch: false, // لپ‌تاپ رم در اسمبل دسکتاپ نمی‌خوایم
      confidence: 0,
      specs: {},
      shortSpec: '',
    };
  }

  const positive =
    containsAny(n, ['رم کامپیوتر', 'ram', 'memory', 'دیدرم', 'ddr']) ||
    specs.ramType ||
    specs.capacity ||
    specs.frequency ||
    specs.casLatency;

  if (!positive) {
    return { isMatch: false, confidence: 0, specs: {}, shortSpec: '' };
  }

  return {
    isMatch: true,
    confidence: 78 + brandBonus + (specs.capacity ? 10 : 0) + (specs.ramType ? 10 : 0),
    matchedModel: specParts.join(' ') || 'RAM',
    specs,
    shortSpec: specParts.join(' • ') || 'RAM',
  };
}

// ════════════════════════════════════════════════════════════════
// ⚡ تشخیص Storage
// ════════════════════════════════════════════════════════════════

export function detectStorage(name: string): PartDetection {
  const n = normalize(name);
  if (!n) return { isMatch: false, confidence: 0, specs: {}, shortSpec: '' };

  if (containsAny(n, STORAGE_HARD_EXCLUDE)) {
    return { isMatch: false, confidence: 0, specs: {}, shortSpec: '' };
  }

  const specs: any = {};
  const specParts: string[] = [];

  // NVMe / M.2 / SATA
  const isNvme = containsAny(n, ['nvme', 'm.2', 'm2']);
  if (isNvme) {
    specs.isNVMe = true;
    specs.formFactor = 'M.2';
    specParts.push('NVMe M.2');
  } else if (containsAny(n, ['2.5', 'sata ssd', 'sata'])) {
    specs.formFactor = '2.5"';
    specParts.push('SATA SSD');
  } else if (containsAny(n, ['ssd', 'اس اس دی'])) {
    specs.formFactor = 'M.2';
    specParts.push('SSD');
  } else if (containsAny(n, ['hdd', 'هارد دیسک', 'هارد اینترنال', 'internal hard'])) {
    specs.formFactor = '3.5"';
    specs.type = 'HDD';
    specParts.push('HDD');
  }

  // Capacity
  const tbMatch = n.match(/(\d+(?:\.\d+)?)\s*(tb|ترابایت|tera)/i);
  const gbMatch = n.match(/(\d+)\s*(gb|گیگ|گيگ)/i);
  if (tbMatch) {
    const tb = parseFloat(tbMatch[1]);
    specs.size = Math.round(tb * 1000);
    specs.sizeTB = tb;
    specParts.push(`${tb}TB`);
  } else if (gbMatch) {
    const gb = parseInt(gbMatch[1]);
    if (gb >= 64 && gb <= 8000) {
      specs.size = gb;
      specParts.push(`${gb}GB`);
    }
  }

  // Brand bonus
  const brandBonus =
    containsAny(n, ['samsung', 'سامسونگ']) ? 5 :
    containsAny(n, ['wd', 'western digital']) ? 5 :
    containsAny(n, ['crucial']) ? 5 :
    containsAny(n, ['kingston']) ? 5 :
    containsAny(n, ['seagate']) ? 4 :
    containsAny(n, ['sabrent']) ? 4 :
    containsAny(n, ['adata', 'xpg']) ? 3 :
    containsAny(n, ['sk hynix', 'hynix']) ? 4 : 0;

  // Speed hint (PCIe Gen)
  if (containsAny(n, ['pcie 5', 'gen5', 'gen 5', 'pcie5'])) {
    specs.pcie = '5.0';
    specParts.push('PCIe 5.0');
  } else if (containsAny(n, ['pcie 4', 'gen4', 'gen 4', 'pcie4'])) {
    specs.pcie = '4.0';
    specParts.push('PCIe 4.0');
  } else if (containsAny(n, ['pcie 3', 'gen3', 'gen 3', 'pcie3'])) {
    specs.pcie = '3.0';
    specParts.push('PCIe 3.0');
  }

  const positive =
    containsAny(n, ['ssd', 'اس اس دی', 'nvme', 'm.2', 'هارد', 'hard', 'storage', 'حافظه']) ||
    specs.size ||
    specs.formFactor;

  if (!positive) {
    return { isMatch: false, confidence: 0, specs: {}, shortSpec: '' };
  }

  return {
    isMatch: true,
    confidence: 80 + brandBonus + (specs.size ? 10 : 0),
    matchedModel: specParts.join(' ') || 'Storage',
    specs,
    shortSpec: specParts.join(' • ') || 'Storage',
  };
}

// ════════════════════════════════════════════════════════════════
// 🔌 تشخیص PSU
// ════════════════════════════════════════════════════════════════

export function detectPsu(name: string): PartDetection {
  const n = normalize(name);
  if (!n) return { isMatch: false, confidence: 0, specs: {}, shortSpec: '' };

  if (containsAny(n, PSU_HARD_EXCLUDE)) {
    return { isMatch: false, confidence: 0, specs: {}, shortSpec: '' };
  }

  const specs: any = {};
  const specParts: string[] = [];

  // Wattage (فارسی: X وات / انگلیسی: XW)
  const wMatch = n.match(/(\d{3,4})\s*(?:w|وات|wat|watt)/i);
  if (wMatch) {
    const w = parseInt(wMatch[1]);
    if (w >= 300 && w <= 2000) {
      specs.wattage = w;
      specParts.push(`${w}W`);
    }
  }

  // 80+ rating
  let rating = '';
  if (containsAny(n, ['titanium', 'تیتانیوم'])) rating = '80+ Titanium';
  else if (containsAny(n, ['platinum', 'پلاتینیوم'])) rating = '80+ Platinum';
  else if (containsAny(n, ['gold', 'طلایی'])) rating = '80+ Gold';
  else if (containsAny(n, ['bronze', 'برنزی'])) rating = '80+ Bronze';
  else if (containsAny(n, ['80 plus', '80+'])) rating = '80+';
  if (rating) {
    specs.rating = rating;
    specParts.push(rating);
  }

  // Modularity
  if (containsAny(n, ['full modular', 'fully modular', 'ماژولار کامل', 'full modular'])) specs.modular = 'full';
  else if (containsAny(n, ['semi modular', 'semi-modular', 'نیمه ماژولار'])) specs.modular = 'semi';
  else if (containsAny(n, ['modular', 'ماژولار'])) specs.modular = 'modular';

  // ATX3.1 (جدید)
  if (containsAny(n, ['atx 3.1', 'atx3.1'])) specs.atx = '3.1';

  // Brand bonus
  const brandBonus =
    containsAny(n, ['corsair', 'کورسیر']) ? 5 :
    containsAny(n, ['seasonic']) ? 5 :
    containsAny(n, ['be quiet']) ? 5 :
    containsAny(n, ['coolermaster', 'cm storm']) ? 4 :
    containsAny(n, ['fractal']) ? 4 :
    containsAny(n, ['asus', 'rog']) ? 4 :
    containsAny(n, ['msi']) ? 3 :
    containsAny(n, ['gigabyte']) ? 3 :
    containsAny(n, ['fsp', 'اف اس پی']) ? 4 :
    containsAny(n, ['antec', 'آنتک']) ? 3 :
    containsAny(n, ['aurest', 'اوست']) ? 4 :
    containsAny(n, ['gamdias', 'گیمدیاس']) ? 3 :
    containsAny(n, ['fater', 'فاطر']) ? 3 :
    containsAny(n, ['deepcool', 'دیپ کول']) ? 3 : 0;

  const positive =
    containsAny(n, ['پاور', 'psu', 'power supply', 'منبع تغذیه', 'power']) ||
    specs.wattage;

  if (!positive) {
    return { isMatch: false, confidence: 0, specs: {}, shortSpec: '' };
  }

  return {
    isMatch: true,
    confidence: 80 + brandBonus + (specs.wattage ? 10 : 0),
    matchedModel: specParts.join(' ') || 'PSU',
    specs,
    shortSpec: specParts.join(' • ') || 'PSU',
  };
}

// ════════════════════════════════════════════════════════════════
// 🗄️ تشخیص Case
// ════════════════════════════════════════════════════════════════

export function detectCase(name: string): PartDetection {
  const n = normalize(name);
  if (!n) return { isMatch: false, confidence: 0, specs: {}, shortSpec: '' };

  if (containsAny(n, CASE_HARD_EXCLUDE)) {
    return { isMatch: false, confidence: 0, specs: {}, shortSpec: '' };
  }

  const specs: any = {};
  const specParts: string[] = [];

  // Form Factor
  if (containsAny(n, ['full tower', 'فول تاور'])) { specs.formFactor = 'E-ATX'; specParts.push('Full Tower'); }
  else if (containsAny(n, ['mini-itx', 'mini itx', 'small form', 'sff'])) { specs.formFactor = 'Mini-ITX'; specParts.push('Mini-ITX'); }
  else if (containsAny(n, ['micro-atx', 'micro atx', 'matx'])) { specs.formFactor = 'Micro-ATX'; specParts.push('Micro-ATX'); }
  else if (containsAny(n, ['mid tower', 'mid-tower', 'midtower'])) { specs.formFactor = 'ATX'; specParts.push('Mid Tower'); }
  else if (containsAny(n, ['atx', 'tower'])) { specs.formFactor = 'ATX'; }

  // Gaming / airflow / clearance hints
  const isGamingCase = containsAny(n, ['گیمینگ', 'gaming', 'mesh', 'airflow', 'flow', 'tempered glass', 'tg', 'argb', 'rgb']);
  const isOfficeCase = containsAny(n, ['اداری', 'office', 'ساده', 'simple', 'business']);
  if (isGamingCase) { specs.gamingCase = true; specParts.push('Gaming'); }
  if (containsAny(n, ['mesh', 'airflow', 'flow', 'تهویه'])) { specs.airflow = true; specParts.push('Airflow'); }
  if (isOfficeCase) specs.officeCase = true;

  const gpuLenMatch = n.match(/(?:gpu|vga|کارت گرافیک|گرافیک).*?(\d{3})\s*(?:mm|میلی)/i)
    || n.match(/(\d{3})\s*(?:mm|میلی).*?(?:gpu|vga|کارت گرافیک|گرافیک)/i);
  if (gpuLenMatch) specs.gpuMaxLength = Number(gpuLenMatch[1]);
  else if (specs.formFactor === 'E-ATX') specs.gpuMaxLength = 420;
  else if (specs.formFactor === 'ATX') specs.gpuMaxLength = isGamingCase ? 380 : 320;
  else if (specs.formFactor === 'Micro-ATX') specs.gpuMaxLength = isGamingCase ? 340 : 300;
  else if (specs.formFactor === 'Mini-ITX') specs.gpuMaxLength = 280;

  if (containsAny(n, ['360', 'سه فن', '3 fan', 'triple fan'])) specs.radiatorSupport = Math.max(Number(specs.radiatorSupport || 0), 360);
  else if (containsAny(n, ['240', 'دو فن', '2 fan'])) specs.radiatorSupport = Math.max(Number(specs.radiatorSupport || 0), 240);

  // RGB
  if (containsAny(n, ['rgb', 'argb', 'frgb', 'tg', 'tempered glass', 'رنگی'])) {
    specs.rgb = true;
    specParts.push('RGB');
  }

  // Brand bonus
  const brandBonus =
    containsAny(n, ['lian li', 'لیان لی']) ? 5 :
    containsAny(n, ['fractal']) ? 5 :
    containsAny(n, ['nzxt']) ? 5 :
    containsAny(n, ['corsair']) ? 5 :
    containsAny(n, ['deepcool', 'دیپ کول']) ? 4 :
    containsAny(n, ['coolermaster', 'کولر مستر']) ? 4 :
    containsAny(n, ['asus', 'rog', 'ایسوس']) ? 4 :
    containsAny(n, ['msi', 'ام اس آی']) ? 3 :
    containsAny(n, ['gigabyte', 'گیگابایت', 'aorus']) ? 3 :
    containsAny(n, ['phanteks']) ? 4 :
    containsAny(n, ['be quiet']) ? 4 :
    containsAny(n, ['aurest', 'اوست']) ? 3 :
    containsAny(n, ['gamdias', 'گیمدیاس']) ? 3 :
    containsAny(n, ['fater', 'فاطر']) ? 3 :
    containsAny(n, ['logikey', 'لاجی کی']) ? 3 :
    containsAny(n, ['sabit', 'سابیت']) ? 3 :
    containsAny(n, ['dark flash', 'دارک فلش']) ? 3 :
    containsAny(n, ['tsco', 'تسکو']) ? 3 : 0;

  const positive =
    containsAny(n, ['کیس', 'case']);

  if (!positive) {
    return { isMatch: false, confidence: 0, specs: {}, shortSpec: '' };
  }

  if (!specs.formFactor) {
    specs.formFactor = 'ATX';
  }

  return {
    isMatch: true,
    confidence: 80 + brandBonus + (specs.formFactor ? 10 : 0),
    matchedModel: specParts.join(' ') || 'Case',
    specs,
    shortSpec: specParts.join(' • ') || `Case ${specs.formFactor}`,
  };
}

// ════════════════════════════════════════════════════════════════
// ❄️ تشخیص Cooler
// ════════════════════════════════════════════════════════════════

export function detectCooler(name: string): PartDetection {
  const n = normalize(name);
  if (!n) return { isMatch: false, confidence: 0, specs: {}, shortSpec: '' };

  if (containsAny(n, COOLER_HARD_EXCLUDE)) {
    return { isMatch: false, confidence: 0, specs: {}, shortSpec: '' };
  }

  const specs: any = {};
  const specParts: string[] = [];

  // ۱) نوع: بادی (Air) یا مایع (AIO)
  const isAio = containsAny(n, ['مایع', 'liquid', 'واتر', 'water cooler', 'liquid cooler', 'aio', 'hyd']);
  const isAirCooler = containsAny(n, ['بادی', 'air cooler', 'tower cooler']);

  specs.type = isAio ? 'aio' : 'air';

  // اندازه AIO
  let size: number | null = null;
  if (containsAny(n, ['360'])) size = 360;
  else if (containsAny(n, ['280'])) size = 280;
  else if (containsAny(n, ['240'])) size = 240;
  else if (containsAny(n, ['120'])) size = 120;

  if (isAio) {
    specs.size = size || 240;
    specParts.push(`AIO ${size || 240}mm`);
  } else if (isAirCooler) {
    specParts.push('Air Cooler');
  }

  // ۲) تشخیص برند
  for (const brand of COOLER_BRANDS) {
    if (containsAny(n, brand.keywords)) {
      specs.brand = brand.brand;
      specs.tdpRating = brand.tdpRating;
      specs.tier = brand.tier;
      // نوع پیش‌فرض برند اگه تشخیص داده نشده
      if (!isAio && !isAirCooler) specs.type = brand.type;
      specParts.push(brand.brand);
      break;
    }
  }

  // RGB
  if (containsAny(n, ['rgb', 'argb', 'frgb'])) {
    specs.rgb = true;
    specParts.push('RGB');
  }

  // ۳) مثبت؟
  const positive = containsAny(n, [
    'کولر', 'خنک کننده', 'cooler', 'cpu cooler', 'fan heatsink',
  ]) || specs.brand;

  if (!positive) {
    return { isMatch: false, confidence: 0, specs: {}, shortSpec: '' };
  }

  // TDP rating fallback
  if (!specs.tdpRating) {
    specs.tdpRating = isAio ? (size === 360 ? 280 : 200) : 180;
    specs.tier = 'medium';
  }

  return {
    isMatch: true,
    confidence: 90,
    matchedModel: specs.brand || (isAio ? 'AIO Cooler' : 'Air Cooler'),
    specs,
    shortSpec: specParts.join(' • ') || (isAio ? 'AIO Cooler' : 'Air Cooler'),
  };
}

// ════════════════════════════════════════════════════════════════
// 🌬️ تشخیص فن کیس (RGB)
// ════════════════════════════════════════════════════════════════

export function detectCaseFan(name: string): PartDetection {
  const n = normalize(name);
  if (!n) return { isMatch: false, confidence: 0, specs: {}, shortSpec: '' };

  if (containsAny(n, FAN_HARD_EXCLUDE)) {
    return { isMatch: false, confidence: 0, specs: {}, shortSpec: '' };
  }

  const specs: any = {};
  const specParts: string[] = [];

  // Size
  let size = 120;
  if (containsAny(n, ['140', '۱۴۰'])) size = 140;
  else if (containsAny(n, ['200'])) size = 200;
  else if (containsAny(n, ['92'])) size = 92;
  else if (containsAny(n, ['120', '۱۲۰', 'f120', 'f-120', 'mf120', 'avi-120', 'aeolus p2', 'aeolus m2', 'aeolus m3', 'fl12'])) size = 120;
  specs.size = size;
  specParts.push(`${size}mm`);

  // Pack count (بسته X عددی)
  const packMatch = n.match(/(\d+)\s*(?:عددی|pcs|pack|بسته)/i);
  if (packMatch) {
    specs.packCount = parseInt(packMatch[1]);
    specParts.push(`${packMatch[1]}-pack`);
  }

  // RGB
  const isRgb = containsAny(n, ['rgb', 'argb', 'frgb', 'رنگی']);
  if (isRgb) {
    specs.rgb = true;
    specParts.push('RGB');
  }

  // Color
  let color = '';
  if (containsAny(n, ['مشکی', 'black'])) { color = 'Black'; specs.color = 'black'; }
  else if (containsAny(n, ['سفید', 'white'])) { color = 'White'; specs.color = 'white'; }
  if (color) specParts.push(color);

  // Brand
  const brandBonus =
    containsAny(n, ['lian li', 'لیان لی']) ? 5 :
    containsAny(n, ['corsair', 'کورسیر']) ? 5 :
    containsAny(n, ['nzxt', 'ان زد ایکس تی']) ? 5 :
    containsAny(n, ['deepcool', 'دیپ کول']) ? 4 :
    containsAny(n, ['phanteks']) ? 4 :
    containsAny(n, ['msi', 'ام اس آی']) ? 4 :
    containsAny(n, ['coolermaster', 'کولر مستر', 'coolermastr']) ? 3 :
    containsAny(n, ['aurest', 'اوست']) ? 3 :
    containsAny(n, ['gamdias', 'گیمدیاس', 'گیم دیاس']) ? 3 :
    containsAny(n, ['gamemax', 'گیم مکس']) ? 3 :
    containsAny(n, ['logikey', 'لاجی کی']) ? 3 :
    containsAny(n, ['magic', 'مجلیک', 'مجیک']) ? 3 :
    containsAny(n, ['green', 'گرین']) ? 3 : 0;

  const positive =
    containsAny(n, ['فن کیس', 'case fan', 'فن rgb', 'rgb fan', 'فن']) ||
    specs.size;

  if (!positive) return { isMatch: false, confidence: 0, specs: {}, shortSpec: '' };

  // بسته ۳ عددی
  if (!specs.packCount && containsAny(n, ['3b', '3w', 'bسته ۳', '3 عددی'])) {
    specs.packCount = 3;
  }

  return {
    isMatch: true,
    confidence: 78 + brandBonus,
    matchedModel: specParts.join(' '),
    specs,
    shortSpec: specParts.join(' • '),
  };
}

// ════════════════════════════════════════════════════════════════
// ✨ تشخیص نوار ARGB
// ════════════════════════════════════════════════════════════════

export function detectArgbStrip(name: string): PartDetection {
  const n = normalize(name);
  if (!n) return { isMatch: false, confidence: 0, specs: {}, shortSpec: '' };

  if (containsAny(n, ARGB_HARD_EXCLUDE)) {
    return { isMatch: false, confidence: 0, specs: {}, shortSpec: '' };
  }

  const isStrip = containsAny(n, [
    'نوار', 'strip', 'led', 'argb', 'rgb strip', 'rgb led',
    'استریپ', 'نوار نور', 'rgb light', 'argb kit', 'rgb kit',
    'کیت نورپردازی',
  ]);

  if (!isStrip) return { isMatch: false, confidence: 0, specs: {}, shortSpec: '' };

  return {
    isMatch: true,
    confidence: 88,
    matchedModel: 'ARGB Strip',
    specs: { type: 'argb' },
    shortSpec: 'ARGB Strip',
  };
}

// ════════════════════════════════════════════════════════════════
// 🎯 تابع اصلی: detectPart
// ════════════════════════════════════════════════════════════════

export type PartCategory =
  | 'cpu' | 'gpu' | 'motherboard' | 'ram' | 'storage' | 'psu' | 'case'
  | 'cooler' | 'case_fan' | 'case_argb';

export function detectPart(category: PartCategory, name: string): PartDetection {
  switch (category) {
    case 'cpu': return detectCpu(name);
    case 'gpu': return detectGpu(name);
    case 'motherboard': return detectMotherboard(name);
    case 'ram': return detectRam(name);
    case 'storage': return detectStorage(name);
    case 'psu': return detectPsu(name);
    case 'case': return detectCase(name);
    case 'cooler': return detectCooler(name);
    case 'case_fan': return detectCaseFan(name);
    case 'case_argb': return detectArgbStrip(name);
    default: return { isMatch: false, confidence: 0, specs: {}, shortSpec: '' };
  }
}
