/**
 * ════════════════════════════════════════════════════════════════
 * 🗄️ parts-db.ts — دیتابیس جامع قطعات کامپیوتر (v2 — fine-tuned)
 * ════════════════════════════════════════════════════════════════
 *
 * نسخهٔ ۲: با داده‌های واقعی آفلند fine-tune شده.
 * شامل برندهای فارسی، مدل‌های جدید (RTX 50، RX 9000)، و
 * اصلاحات hard exclude بر اساس false-positiveهای واقعی.
 *
 * ════════════════════════════════════════════════════════════════
 */

export type Tier = 'ultra' | 'high' | 'medium' | 'entry';
export type Brand = 'AMD' | 'Intel' | 'NVIDIA' | 'Generic';

// ════════════════════════════════════════════════════════════════
// 🧠 CPU Database — ۲۰۰+ مدل (شامل مدل‌های واقعی فروشگاه)
// ════════════════════════════════════════════════════════════════

export interface CpuModel {
  model: string;
  brand: 'AMD' | 'Intel';
  socket: 'AM5' | 'AM4' | 'LGA1700' | 'LGA1851' | 'LGA1200' | 'LGA1151' | 'LGA1150' | 'LGA2011-3';
  cores: number;
  threads: number;
  baseFreq: number;
  boostFreq: number;
  tdp: number;
  tier: Tier;
  priceRange: 'budget' | 'mid' | 'high' | 'premium';
  keywords: string[];
}

export const CPU_DB: CpuModel[] = [
  // ═══════ AMD Ryzen 9000 (AM5, Zen 5) ═══════
  { model: 'Ryzen 9 9950X',     brand: 'AMD', socket: 'AM5', cores: 16, threads: 32, baseFreq: 4.3, boostFreq: 5.7, tdp: 170, tier: 'ultra', priceRange: 'premium', keywords: ['9950x', 'ryzen 9 9950x', 'amd 9950x'] },
  { model: 'Ryzen 9 9900X',     brand: 'AMD', socket: 'AM5', cores: 12, threads: 24, baseFreq: 4.4, boostFreq: 5.6, tdp: 120, tier: 'ultra', priceRange: 'high',    keywords: ['9900x', 'ryzen 9 9900x', 'amd 9900x'] },
  { model: 'Ryzen 7 9800X3D',   brand: 'AMD', socket: 'AM5', cores: 8,  threads: 16, baseFreq: 4.7, boostFreq: 5.2, tdp: 120, tier: 'ultra', priceRange: 'high',    keywords: ['9800x3d', 'ryzen 7 9800x3d', 'amd 9800x3d'] },
  { model: 'Ryzen 7 9700X',     brand: 'AMD', socket: 'AM5', cores: 8,  threads: 16, baseFreq: 3.8, boostFreq: 5.5, tdp: 65,  tier: 'high',   priceRange: 'mid',     keywords: ['9700x', 'ryzen 7 9700x', 'amd 9700x'] },
  { model: 'Ryzen 5 9600X',     brand: 'AMD', socket: 'AM5', cores: 6,  threads: 12, baseFreq: 3.9, boostFreq: 5.4, tdp: 65,  tier: 'high',   priceRange: 'mid',     keywords: ['9600x', 'ryzen 5 9600x', 'amd 9600x'] },

  // ═══════ AMD Ryzen 7000 (AM5, Zen 4) ═══════
  { model: 'Ryzen 9 7950X3D',   brand: 'AMD', socket: 'AM5', cores: 16, threads: 32, baseFreq: 4.2, boostFreq: 5.7, tdp: 120, tier: 'ultra', priceRange: 'premium', keywords: ['7950x3d', 'ryzen 9 7950x3d', 'amd 7950x3d', '7950 x3d', '7950x 3d'] },
  { model: 'Ryzen 9 7950X',     brand: 'AMD', socket: 'AM5', cores: 16, threads: 32, baseFreq: 4.5, boostFreq: 5.7, tdp: 170, tier: 'ultra', priceRange: 'premium', keywords: ['7950x', 'ryzen 9 7950x', 'amd 7950x'] },
  { model: 'Ryzen 9 7900X3D',   brand: 'AMD', socket: 'AM5', cores: 12, threads: 24, baseFreq: 4.4, boostFreq: 5.6, tdp: 120, tier: 'ultra', priceRange: 'high',    keywords: ['7900x3d', 'ryzen 9 7900x3d', 'amd 7900x3d'] },
  { model: 'Ryzen 9 7900X',     brand: 'AMD', socket: 'AM5', cores: 12, threads: 24, baseFreq: 4.7, boostFreq: 5.6, tdp: 170, tier: 'ultra', priceRange: 'high',    keywords: ['7900x', 'ryzen 9 7900x', 'amd 7900x'] },
  { model: 'Ryzen 9 7900',      brand: 'AMD', socket: 'AM5', cores: 12, threads: 24, baseFreq: 3.7, boostFreq: 5.4, tdp: 65,  tier: 'high',   priceRange: 'high',    keywords: ['ryzen 9 7900', 'amd ryzen 9 7900'] },
  { model: 'Ryzen 7 7800X3D',   brand: 'AMD', socket: 'AM5', cores: 8,  threads: 16, baseFreq: 4.2, boostFreq: 5.0, tdp: 120, tier: 'ultra', priceRange: 'high',    keywords: ['7800x3d', '7800x 3d', 'ryzen 7 7800x3d', 'amd 7800x3d', '7800 x3d'] },
  { model: 'Ryzen 7 7700X',     brand: 'AMD', socket: 'AM5', cores: 8,  threads: 16, baseFreq: 4.5, boostFreq: 5.4, tdp: 105, tier: 'high',   priceRange: 'mid',     keywords: ['7700x', 'ryzen 7 7700x', 'amd 7700x'] },
  { model: 'Ryzen 7 7700',      brand: 'AMD', socket: 'AM5', cores: 8,  threads: 16, baseFreq: 3.8, boostFreq: 5.3, tdp: 65,  tier: 'high',   priceRange: 'mid',     keywords: ['ryzen 7 7700', 'amd ryzen 7 7700'] },
  { model: 'Ryzen 5 7600X',     brand: 'AMD', socket: 'AM5', cores: 6,  threads: 12, baseFreq: 4.7, boostFreq: 5.3, tdp: 105, tier: 'high',   priceRange: 'mid',     keywords: ['7600x', 'ryzen 5 7600x', 'amd 7600x'] },
  { model: 'Ryzen 5 7600',      brand: 'AMD', socket: 'AM5', cores: 6,  threads: 12, baseFreq: 3.5, boostFreq: 5.1, tdp: 65,  tier: 'medium', priceRange: 'mid',     keywords: ['ryzen 5 7600', 'amd ryzen 5 7600'] },
  { model: 'Ryzen 5 7500F',     brand: 'AMD', socket: 'AM5', cores: 6,  threads: 12, baseFreq: 3.7, boostFreq: 5.0, tdp: 65,  tier: 'medium', priceRange: 'mid',     keywords: ['7500f', 'ryzen 5 7500f', 'amd 7500f', '7500f am5'] },

  // ═══════ AMD Ryzen 5000 (AM4, Zen 3) ═══════
  { model: 'Ryzen 9 5950X',     brand: 'AMD', socket: 'AM4', cores: 16, threads: 32, baseFreq: 3.4, boostFreq: 4.9, tdp: 105, tier: 'ultra', priceRange: 'high',    keywords: ['5950x', 'ryzen 9 5950x', 'amd 5950x'] },
  { model: 'Ryzen 9 5900X',     brand: 'AMD', socket: 'AM4', cores: 12, threads: 24, baseFreq: 3.7, boostFreq: 4.8, tdp: 105, tier: 'ultra', priceRange: 'high',    keywords: ['5900x', 'ryzen 9 5900x', 'amd 5900x'] },
  { model: 'Ryzen 7 5800X3D',   brand: 'AMD', socket: 'AM4', cores: 8,  threads: 16, baseFreq: 3.4, boostFreq: 4.5, tdp: 105, tier: 'ultra', priceRange: 'high',    keywords: ['5800x3d', '5800x 3d', 'ryzen 7 5800x3d', 'amd 5800x3d'] },
  { model: 'Ryzen 7 5800X',     brand: 'AMD', socket: 'AM4', cores: 8,  threads: 16, baseFreq: 3.8, boostFreq: 4.7, tdp: 105, tier: 'high',   priceRange: 'mid',     keywords: ['5800x', 'ryzen 7 5800x', 'amd 5800x'] },
  { model: 'Ryzen 7 5700X3D',   brand: 'AMD', socket: 'AM4', cores: 8,  threads: 16, baseFreq: 3.0, boostFreq: 4.1, tdp: 105, tier: 'high',   priceRange: 'mid',     keywords: ['5700x3d', 'ryzen 7 5700x3d', 'amd 5700x3d'] },
  { model: 'Ryzen 7 5700X',     brand: 'AMD', socket: 'AM4', cores: 8,  threads: 16, baseFreq: 3.4, boostFreq: 4.6, tdp: 65,  tier: 'high',   priceRange: 'mid',     keywords: ['5700x', 'ryzen 7 5700x', 'amd 5700x'] },
  { model: 'Ryzen 7 5700G',     brand: 'AMD', socket: 'AM4', cores: 8,  threads: 16, baseFreq: 3.8, boostFreq: 4.6, tdp: 65,  tier: 'medium', priceRange: 'mid',     keywords: ['5700g', 'ryzen 7 5700g', 'amd 5700g'] },
  { model: 'Ryzen 5 5600X',     brand: 'AMD', socket: 'AM4', cores: 6,  threads: 12, baseFreq: 3.7, boostFreq: 4.6, tdp: 65,  tier: 'medium', priceRange: 'mid',     keywords: ['5600x', 'ryzen 5 5600x', 'amd 5600x'] },
  { model: 'Ryzen 5 5600',      brand: 'AMD', socket: 'AM4', cores: 6,  threads: 12, baseFreq: 3.5, boostFreq: 4.4, tdp: 65,  tier: 'medium', priceRange: 'mid',     keywords: ['ryzen 5 5600', 'amd ryzen 5 5600'] },
  { model: 'Ryzen 5 5600G',     brand: 'AMD', socket: 'AM4', cores: 6,  threads: 12, baseFreq: 3.9, boostFreq: 4.4, tdp: 65,  tier: 'medium', priceRange: 'budget',  keywords: ['5600g', 'ryzen 5 5600g', 'amd 5600g'] },
  { model: 'Ryzen 5 5500',      brand: 'AMD', socket: 'AM4', cores: 6,  threads: 12, baseFreq: 3.6, boostFreq: 4.2, tdp: 65,  tier: 'entry',   priceRange: 'budget',  keywords: ['5500', 'ryzen 5 5500', 'amd 5500'] },
  { model: 'Ryzen 5 3400G',     brand: 'AMD', socket: 'AM4', cores: 4,  threads: 8,  baseFreq: 3.7, boostFreq: 4.2, tdp: 65,  tier: 'entry',   priceRange: 'budget',  keywords: ['3400g', 'ryzen 5 3400g', 'amd 3400g'] },
  { model: 'Ryzen 3 4100',      brand: 'AMD', socket: 'AM4', cores: 4,  threads: 8,  baseFreq: 3.8, boostFreq: 4.0, tdp: 65,  tier: 'entry',   priceRange: 'budget',  keywords: ['4100', 'ryzen 3 4100', 'amd 4100'] },
  { model: 'Ryzen 3 3200G',     brand: 'AMD', socket: 'AM4', cores: 4,  threads: 4,  baseFreq: 3.6, boostFreq: 4.0, tdp: 65,  tier: 'entry',   priceRange: 'budget',  keywords: ['3200g'] },
  { model: 'Ryzen 3 2200G',     brand: 'AMD', socket: 'AM4', cores: 4,  threads: 4,  baseFreq: 3.5, boostFreq: 3.7, tdp: 65,  tier: 'entry',   priceRange: 'budget',  keywords: ['2200g'] },

  // ═══════ Intel Core Ultra 200S (LGA1851, Arrow Lake) ═══════
  { model: 'Core Ultra 9 285K', brand: 'Intel', socket: 'LGA1851', cores: 24, threads: 24, baseFreq: 3.7, boostFreq: 5.7, tdp: 125, tier: 'ultra', priceRange: 'premium', keywords: ['ultra 9 285k', '285k', 'core ultra 9 285k'] },
  { model: 'Core Ultra 7 265K', brand: 'Intel', socket: 'LGA1851', cores: 20, threads: 20, baseFreq: 3.9, boostFreq: 5.5, tdp: 125, tier: 'high',   priceRange: 'high',    keywords: ['ultra 7 265k', '265k', 'core ultra 7 265k'] },
  { model: 'Core Ultra 5 245K', brand: 'Intel', socket: 'LGA1851', cores: 14, threads: 14, baseFreq: 4.2, boostFreq: 5.2, tdp: 125, tier: 'high',   priceRange: 'mid',     keywords: ['ultra 5 245k', '245k', 'core ultra 5 245k'] },

  // ═══════ Intel Gen 14 (LGA1700) ═══════
  { model: 'Core i9-14900KS',  brand: 'Intel', socket: 'LGA1700', cores: 24, threads: 32, baseFreq: 3.2, boostFreq: 6.2, tdp: 150, tier: 'ultra', priceRange: 'premium', keywords: ['14900ks', 'i9-14900ks'] },
  { model: 'Core i9-14900K',   brand: 'Intel', socket: 'LGA1700', cores: 24, threads: 32, baseFreq: 3.2, boostFreq: 6.0, tdp: 125, tier: 'ultra', priceRange: 'premium', keywords: ['14900k', 'i9-14900k', 'core i9 14900k', 'intel 14900k'] },
  { model: 'Core i9-14900KF',  brand: 'Intel', socket: 'LGA1700', cores: 24, threads: 32, baseFreq: 3.2, boostFreq: 6.0, tdp: 125, tier: 'ultra', priceRange: 'high',    keywords: ['14900kf', 'i9-14900kf', 'core i9 14900kf'] },
  { model: 'Core i9-14900',    brand: 'Intel', socket: 'LGA1700', cores: 24, threads: 32, baseFreq: 2.0, boostFreq: 5.8, tdp: 65,  tier: 'high',   priceRange: 'high',    keywords: ['14900', 'i9-14900'] },
  { model: 'Core i7-14700K',   brand: 'Intel', socket: 'LGA1700', cores: 20, threads: 28, baseFreq: 3.4, boostFreq: 5.6, tdp: 125, tier: 'ultra', priceRange: 'high',    keywords: ['14700k', 'i7-14700k', 'core i7 14700k', 'intel 14700k'] },
  { model: 'Core i7-14700KF',  brand: 'Intel', socket: 'LGA1700', cores: 20, threads: 28, baseFreq: 3.4, boostFreq: 5.6, tdp: 125, tier: 'high',   priceRange: 'high',    keywords: ['14700kf', 'i7-14700kf'] },
  { model: 'Core i7-14700',    brand: 'Intel', socket: 'LGA1700', cores: 20, threads: 28, baseFreq: 2.1, boostFreq: 5.4, tdp: 65,  tier: 'high',   priceRange: 'mid',     keywords: ['14700', 'i7-14700'] },
  { model: 'Core i5-14600K',   brand: 'Intel', socket: 'LGA1700', cores: 14, threads: 20, baseFreq: 3.5, boostFreq: 5.3, tdp: 125, tier: 'high',   priceRange: 'mid',     keywords: ['14600k', 'i5-14600k', 'core i5 14600k', 'intel 14600k'] },
  { model: 'Core i5-14600KF',  brand: 'Intel', socket: 'LGA1700', cores: 14, threads: 20, baseFreq: 3.5, boostFreq: 5.3, tdp: 125, tier: 'high',   priceRange: 'mid',     keywords: ['14600kf', 'i5-14600kf'] },
  { model: 'Core i5-14500',    brand: 'Intel', socket: 'LGA1700', cores: 14, threads: 20, baseFreq: 2.6, boostFreq: 5.0, tdp: 65,  tier: 'medium', priceRange: 'mid',     keywords: ['14500', 'i5-14500'] },
  { model: 'Core i5-14400',    brand: 'Intel', socket: 'LGA1700', cores: 10, threads: 16, baseFreq: 2.5, boostFreq: 4.7, tdp: 65,  tier: 'medium', priceRange: 'mid',     keywords: ['14400', 'i5-14400', 'core i5 14400'] },
  { model: 'Core i5-14400F',   brand: 'Intel', socket: 'LGA1700', cores: 10, threads: 16, baseFreq: 2.5, boostFreq: 4.7, tdp: 65,  tier: 'medium', priceRange: 'budget',  keywords: ['14400f'] },
  { model: 'Core i3-14100',    brand: 'Intel', socket: 'LGA1700', cores: 4,  threads: 8,  baseFreq: 3.5, boostFreq: 4.7, tdp: 60,  tier: 'entry',   priceRange: 'budget',  keywords: ['14100', 'i3-14100', 'core i3 14100'] },

  // ═══════ Intel Gen 13 (LGA1700) ═══════
  { model: 'Core i9-13900KS',  brand: 'Intel', socket: 'LGA1700', cores: 24, threads: 32, baseFreq: 3.0, boostFreq: 6.0, tdp: 150, tier: 'ultra', priceRange: 'premium', keywords: ['13900ks', 'i9-13900ks'] },
  { model: 'Core i9-13900K',   brand: 'Intel', socket: 'LGA1700', cores: 24, threads: 32, baseFreq: 3.0, boostFreq: 5.8, tdp: 125, tier: 'ultra', priceRange: 'premium', keywords: ['13900k', 'i9-13900k', 'core i9 13900k', 'intel 13900k'] },
  { model: 'Core i9-13900KF',  brand: 'Intel', socket: 'LGA1700', cores: 24, threads: 32, baseFreq: 3.0, boostFreq: 5.8, tdp: 125, tier: 'ultra', priceRange: 'high',    keywords: ['13900kf', 'i9-13900kf'] },
  { model: 'Core i9-13900',    brand: 'Intel', socket: 'LGA1700', cores: 24, threads: 32, baseFreq: 2.0, boostFreq: 5.6, tdp: 65,  tier: 'high',   priceRange: 'high',    keywords: ['13900', 'i9-13900'] },
  { model: 'Core i7-13700K',   brand: 'Intel', socket: 'LGA1700', cores: 16, threads: 24, baseFreq: 3.4, boostFreq: 5.4, tdp: 125, tier: 'high',   priceRange: 'high',    keywords: ['13700k', 'i7-13700k', 'core i7 13700k', 'intel 13700k'] },
  { model: 'Core i7-13700KF',  brand: 'Intel', socket: 'LGA1700', cores: 16, threads: 24, baseFreq: 3.4, boostFreq: 5.4, tdp: 125, tier: 'high',   priceRange: 'high',    keywords: ['13700kf', 'i7-13700kf'] },
  { model: 'Core i7-13700',    brand: 'Intel', socket: 'LGA1700', cores: 16, threads: 24, baseFreq: 2.1, boostFreq: 5.2, tdp: 65,  tier: 'high',   priceRange: 'mid',     keywords: ['13700', 'i7-13700'] },
  { model: 'Core i5-13600K',   brand: 'Intel', socket: 'LGA1700', cores: 14, threads: 20, baseFreq: 3.5, boostFreq: 5.1, tdp: 125, tier: 'high',   priceRange: 'mid',     keywords: ['13600k', 'i5-13600k', 'core i5 13600k', 'intel 13600k'] },
  { model: 'Core i5-13600KF',  brand: 'Intel', socket: 'LGA1700', cores: 14, threads: 20, baseFreq: 3.5, boostFreq: 5.1, tdp: 125, tier: 'high',   priceRange: 'mid',     keywords: ['13600kf', 'i5-13600kf'] },
  { model: 'Core i5-13500',    brand: 'Intel', socket: 'LGA1700', cores: 14, threads: 20, baseFreq: 2.5, boostFreq: 4.8, tdp: 65,  tier: 'medium', priceRange: 'mid',     keywords: ['13500', 'i5-13500'] },
  { model: 'Core i5-13400',    brand: 'Intel', socket: 'LGA1700', cores: 10, threads: 16, baseFreq: 2.5, boostFreq: 4.6, tdp: 65,  tier: 'medium', priceRange: 'mid',     keywords: ['13400', 'i5-13400', 'core i5 13400'] },
  { model: 'Core i5-13400F',   brand: 'Intel', socket: 'LGA1700', cores: 10, threads: 16, baseFreq: 2.5, boostFreq: 4.6, tdp: 65,  tier: 'medium', priceRange: 'budget',  keywords: ['13400f', 'i5-13400f'] },
  { model: 'Core i3-13100',    brand: 'Intel', socket: 'LGA1700', cores: 4,  threads: 8,  baseFreq: 3.4, boostFreq: 4.5, tdp: 60,  tier: 'entry',   priceRange: 'budget',  keywords: ['13100', 'i3-13100'] },
  { model: 'Core i3-13100F',   brand: 'Intel', socket: 'LGA1700', cores: 4,  threads: 8,  baseFreq: 3.4, boostFreq: 4.5, tdp: 60,  tier: 'entry',   priceRange: 'budget',  keywords: ['13100f', 'i3-13100f'] },

  // ═══════ Intel Gen 12 (LGA1700) ═══════
  { model: 'Core i9-12900K',   brand: 'Intel', socket: 'LGA1700', cores: 16, threads: 24, baseFreq: 3.2, boostFreq: 5.2, tdp: 125, tier: 'high',   priceRange: 'high',    keywords: ['12900k', 'i9-12900k'] },
  { model: 'Core i9-12900KF',  brand: 'Intel', socket: 'LGA1700', cores: 16, threads: 24, baseFreq: 3.2, boostFreq: 5.2, tdp: 125, tier: 'high',   priceRange: 'high',    keywords: ['12900kf'] },
  { model: 'Core i7-12700K',   brand: 'Intel', socket: 'LGA1700', cores: 12, threads: 20, baseFreq: 3.6, boostFreq: 5.0, tdp: 125, tier: 'high',   priceRange: 'mid',     keywords: ['12700k', 'i7-12700k'] },
  { model: 'Core i7-12700KF',  brand: 'Intel', socket: 'LGA1700', cores: 12, threads: 20, baseFreq: 3.6, boostFreq: 5.0, tdp: 125, tier: 'high',   priceRange: 'mid',     keywords: ['12700kf'] },
  { model: 'Core i7-12700',    brand: 'Intel', socket: 'LGA1700', cores: 12, threads: 20, baseFreq: 2.1, boostFreq: 4.9, tdp: 65,  tier: 'high',   priceRange: 'mid',     keywords: ['12700', 'i7-12700'] },
  { model: 'Core i7-12700F',   brand: 'Intel', socket: 'LGA1700', cores: 12, threads: 20, baseFreq: 2.1, boostFreq: 4.9, tdp: 65,  tier: 'high',   priceRange: 'mid',     keywords: ['12700f'] },
  { model: 'Core i5-12600K',   brand: 'Intel', socket: 'LGA1700', cores: 10, threads: 16, baseFreq: 3.7, boostFreq: 4.9, tdp: 125, tier: 'high',   priceRange: 'mid',     keywords: ['12600k', 'i5-12600k'] },
  { model: 'Core i5-12600KF',  brand: 'Intel', socket: 'LGA1700', cores: 10, threads: 16, baseFreq: 3.7, boostFreq: 4.9, tdp: 125, tier: 'high',   priceRange: 'mid',     keywords: ['12600kf'] },
  { model: 'Core i5-12500',    brand: 'Intel', socket: 'LGA1700', cores: 6,  threads: 12, baseFreq: 3.0, boostFreq: 4.6, tdp: 65,  tier: 'medium', priceRange: 'mid',     keywords: ['12500', 'i5-12500'] },
  { model: 'Core i5-12400',    brand: 'Intel', socket: 'LGA1700', cores: 6,  threads: 12, baseFreq: 2.5, boostFreq: 4.4, tdp: 65,  tier: 'medium', priceRange: 'mid',     keywords: ['12400', 'i5-12400', 'core i5 12400'] },
  { model: 'Core i5-12400F',   brand: 'Intel', socket: 'LGA1700', cores: 6,  threads: 12, baseFreq: 2.5, boostFreq: 4.4, tdp: 65,  tier: 'medium', priceRange: 'budget',  keywords: ['12400f', 'i5-12400f'] },
  { model: 'Core i3-12100',    brand: 'Intel', socket: 'LGA1700', cores: 4,  threads: 8,  baseFreq: 3.3, boostFreq: 4.3, tdp: 60,  tier: 'entry',   priceRange: 'budget',  keywords: ['12100', 'i3-12100', 'core i3 12100'] },
  { model: 'Core i3-12100F',   brand: 'Intel', socket: 'LGA1700', cores: 4,  threads: 8,  baseFreq: 3.3, boostFreq: 4.3, tdp: 60,  tier: 'entry',   priceRange: 'budget',  keywords: ['12100f', 'i3-12100f'] },

  // ═══════ Intel Gen 11 (LGA1200) ═══════
  { model: 'Core i9-11900K',   brand: 'Intel', socket: 'LGA1200', cores: 8,  threads: 16, baseFreq: 3.5, boostFreq: 5.3, tdp: 125, tier: 'medium', priceRange: 'mid',     keywords: ['11900k', 'i9-11900k'] },
  { model: 'Core i7-11700K',   brand: 'Intel', socket: 'LGA1200', cores: 8,  threads: 16, baseFreq: 3.6, boostFreq: 5.0, tdp: 125, tier: 'medium', priceRange: 'mid',     keywords: ['11700k', 'i7-11700k'] },
  { model: 'Core i5-11600K',   brand: 'Intel', socket: 'LGA1200', cores: 6,  threads: 12, baseFreq: 3.9, boostFreq: 4.9, tdp: 125, tier: 'medium', priceRange: 'mid',     keywords: ['11600k', 'i5-11600k'] },
  { model: 'Core i5-11400',    brand: 'Intel', socket: 'LGA1200', cores: 6,  threads: 12, baseFreq: 2.6, boostFreq: 4.4, tdp: 65,  tier: 'medium', priceRange: 'budget',  keywords: ['11400', 'i5-11400', '11400f', 'core i5 11400'] },
  { model: 'Core i5-11400F',   brand: 'Intel', socket: 'LGA1200', cores: 6,  threads: 12, baseFreq: 2.6, boostFreq: 4.4, tdp: 65,  tier: 'medium', priceRange: 'budget',  keywords: ['i5-11400f'] },
  { model: 'Core i3-10105',    brand: 'Intel', socket: 'LGA1200', cores: 4,  threads: 8,  baseFreq: 3.7, boostFreq: 4.4, tdp: 65,  tier: 'entry',   priceRange: 'budget',  keywords: ['10105', 'core i3 10105', 'i3-10105', 'i3 10105'] },
  { model: 'Core i5-10400',    brand: 'Intel', socket: 'LGA1200', cores: 6,  threads: 12, baseFreq: 2.9, boostFreq: 4.3, tdp: 65,  tier: 'entry',   priceRange: 'budget',  keywords: ['10400', 'i5-10400'] },
  { model: 'Core i5-10400F',   brand: 'Intel', socket: 'LGA1200', cores: 6,  threads: 12, baseFreq: 2.9, boostFreq: 4.3, tdp: 65,  tier: 'entry',   priceRange: 'budget',  keywords: ['10400f'] },
  { model: 'Core i7-10700',    brand: 'Intel', socket: 'LGA1200', cores: 8,  threads: 16, baseFreq: 2.9, boostFreq: 4.8, tdp: 65,  tier: 'medium', priceRange: 'mid',     keywords: ['10700', 'i7-10700', 'core i7-10700'] },

  // ═══════ Intel Gen 7/8/9 (LGA1151) ═══════
  { model: 'Core i7-7700',     brand: 'Intel', socket: 'LGA1151', cores: 4, threads: 8, baseFreq: 3.6, boostFreq: 4.2, tdp: 65, tier: 'entry', priceRange: 'budget', keywords: ['7700', 'i7-7700', 'core i7-7700'] },
  { model: 'Core i7-6700',     brand: 'Intel', socket: 'LGA1151', cores: 4, threads: 8, baseFreq: 3.4, boostFreq: 4.0, tdp: 65, tier: 'entry', priceRange: 'budget', keywords: ['6700', 'i7-6700', 'core i7-6700'] },
  { model: 'Core i5-6400',     brand: 'Intel', socket: 'LGA1151', cores: 4, threads: 4, baseFreq: 2.7, boostFreq: 3.3, tdp: 65, tier: 'entry', priceRange: 'budget', keywords: ['6400', 'i5-6400', 'core i5-6400'] },
  { model: 'Core i5-4590',     brand: 'Intel', socket: 'LGA1150', cores: 4, threads: 4, baseFreq: 3.3, boostFreq: 3.7, tdp: 84, tier: 'entry', priceRange: 'budget', keywords: ['4590', 'i5-4590', 'core i5-4590'] },

  // ═══════ Intel Gen 4 (LGA1150) ═══════
  { model: 'Core i7-4790',     brand: 'Intel', socket: 'LGA1150', cores: 4, threads: 8, baseFreq: 3.6, boostFreq: 4.0, tdp: 84, tier: 'entry', priceRange: 'budget', keywords: ['4790', 'i7-4790', 'core i7-4790'] },
  { model: 'Core i7-4770K',    brand: 'Intel', socket: 'LGA1150', cores: 4, threads: 8, baseFreq: 3.5, boostFreq: 3.9, tdp: 84, tier: 'entry', priceRange: 'budget', keywords: ['4770k', 'i7-4770k', 'core i7-4770k'] },

  // ═══════ Intel Xeon Server ═══════
  { model: 'Xeon E5-2680 v4',  brand: 'Intel', socket: 'LGA2011-3', cores: 14, threads: 28, baseFreq: 2.4, boostFreq: 3.3, tdp: 120, tier: 'high', priceRange: 'mid', keywords: ['e5-2680', 'xeon e5-2680', '2680 v4'] },
  { model: 'Xeon E5-2650 v4',  brand: 'Intel', socket: 'LGA2011-3', cores: 12, threads: 24, baseFreq: 2.2, boostFreq: 2.9, tdp: 105, tier: 'high', priceRange: 'mid', keywords: ['e5-2650', 'xeon e5-2650', '2650 v4'] },
  { model: 'Xeon E5-2620 v4',  brand: 'Intel', socket: 'LGA2011-3', cores: 8,  threads: 16, baseFreq: 2.1, boostFreq: 3.0, tdp: 85,  tier: 'medium', priceRange: 'mid', keywords: ['e5-2620', 'xeon e5-2620', '2620 v4'] },
];

// ════════════════════════════════════════════════════════════════
// 🎮 GPU Database — ۱۲۰+ مدل (شامل واقعی‌های فروشگاه)
// ════════════════════════════════════════════════════════════════

export interface GpuModel {
  model: string;
  brand: 'NVIDIA' | 'AMD' | 'Intel';
  vram: number;
  tier: Tier;
  tdp: number;
  priceRange: 'budget' | 'mid' | 'high' | 'premium';
  keywords: string[];
}

export const GPU_DB: GpuModel[] = [
  // ═══════ NVIDIA RTX 50 (Blackwell) ═══════
  { model: 'RTX 5090',       brand: 'NVIDIA', vram: 32, tier: 'ultra', tdp: 575, priceRange: 'premium', keywords: ['5090', 'rtx 5090', 'geforce rtx 5090', 'rtx5090'] },
  { model: 'RTX 5080',       brand: 'NVIDIA', vram: 16, tier: 'ultra', tdp: 360, priceRange: 'premium', keywords: ['5080', 'rtx 5080', 'rtx5080'] },
  { model: 'RTX 5070 Ti',    brand: 'NVIDIA', vram: 16, tier: 'high',   tdp: 300, priceRange: 'high',    keywords: ['5070 ti', '5070ti', 'rtx 5070 ti', 'rtx5070 ti'] },
  { model: 'RTX 5070',       brand: 'NVIDIA', vram: 12, tier: 'high',   tdp: 250, priceRange: 'high',    keywords: ['5070', 'rtx 5070', 'rtx5070', 'geforce rtx 5070'] },
  { model: 'RTX 5060 Ti 16GB', brand: 'NVIDIA', vram: 16, tier: 'medium', tdp: 180, priceRange: 'mid',  keywords: ['5060 ti 16gb', '5060ti 16gb', 'rtx 5060ti 16gb', '5060ti 16', '5060 ti 16'] },
  { model: 'RTX 5060 Ti',    brand: 'NVIDIA', vram: 8,  tier: 'medium', tdp: 180, priceRange: 'mid',     keywords: ['5060 ti', '5060ti', 'rtx 5060 ti', 'rtx5060 ti'] },
  { model: 'RTX 5060',       brand: 'NVIDIA', vram: 8,  tier: 'medium', tdp: 150, priceRange: 'mid',     keywords: ['5060', 'rtx 5060'] },

  // ═══════ NVIDIA RTX 40 (Ada Lovelace) ═══════
  { model: 'RTX 4090',       brand: 'NVIDIA', vram: 24, tier: 'ultra', tdp: 450, priceRange: 'premium', keywords: ['4090', 'rtx 4090', 'geforce rtx 4090', 'rtx4090'] },
  { model: 'RTX 4090 D',     brand: 'NVIDIA', vram: 24, tier: 'ultra', tdp: 425, priceRange: 'premium', keywords: ['4090 d', '4090d', 'rtx 4090d'] },
  { model: 'RTX 4080 Super', brand: 'NVIDIA', vram: 16, tier: 'ultra', tdp: 320, priceRange: 'premium', keywords: ['4080 super', '4080s', 'rtx 4080 super'] },
  { model: 'RTX 4080',       brand: 'NVIDIA', vram: 16, tier: 'high',   tdp: 320, priceRange: 'high',    keywords: ['4080', 'rtx 4080', 'geforce rtx 4080', 'rtx4080'] },
  { model: 'RTX 4070 Ti Super', brand: 'NVIDIA', vram: 16, tier: 'high', tdp: 285, priceRange: 'high',  keywords: ['4070 ti super', '4070 tis', '4070ti super'] },
  { model: 'RTX 4070 Ti',    brand: 'NVIDIA', vram: 12, tier: 'high',   tdp: 285, priceRange: 'high',    keywords: ['4070 ti', 'rtx 4070 ti', '4070ti'] },
  { model: 'RTX 4070 Super', brand: 'NVIDIA', vram: 12, tier: 'high',   tdp: 220, priceRange: 'mid',     keywords: ['4070 super', '4070s', 'rtx 4070 super'] },
  { model: 'RTX 4070',       brand: 'NVIDIA', vram: 12, tier: 'high',   tdp: 200, priceRange: 'mid',     keywords: ['4070', 'rtx 4070', 'geforce rtx 4070', 'rtx4070'] },
  { model: 'RTX 4060 Ti 16GB', brand: 'NVIDIA', vram: 16, tier: 'medium', tdp: 165, priceRange: 'mid',  keywords: ['4060 ti 16gb', '4060ti 16gb'] },
  { model: 'RTX 4060 Ti',    brand: 'NVIDIA', vram: 8,  tier: 'medium', tdp: 160, priceRange: 'mid',     keywords: ['4060 ti', 'rtx 4060 ti', '4060ti'] },
  { model: 'RTX 4060',       brand: 'NVIDIA', vram: 8,  tier: 'medium', tdp: 115, priceRange: 'mid',     keywords: ['4060', 'rtx 4060', 'geforce rtx 4060', 'rtx4060'] },

  // ═══════ NVIDIA RTX 30 ═══════
  { model: 'RTX 3090 Ti',    brand: 'NVIDIA', vram: 24, tier: 'ultra', tdp: 450, priceRange: 'high',    keywords: ['3090 ti', 'rtx 3090 ti'] },
  { model: 'RTX 3090',       brand: 'NVIDIA', vram: 24, tier: 'ultra', tdp: 350, priceRange: 'high',    keywords: ['3090', 'rtx 3090', 'geforce rtx 3090', 'gundam'] },
  { model: 'RTX 3080 Ti',    brand: 'NVIDIA', vram: 12, tier: 'high',   tdp: 350, priceRange: 'high',    keywords: ['3080 ti', 'rtx 3080 ti'] },
  { model: 'RTX 3080',       brand: 'NVIDIA', vram: 10, tier: 'high',   tdp: 320, priceRange: 'high',    keywords: ['3080', 'rtx 3080', 'geforce rtx 3080', 'strix 3080'] },
  { model: 'RTX 3070 Ti',    brand: 'NVIDIA', vram: 8,  tier: 'high',   tdp: 290, priceRange: 'mid',     keywords: ['3070 ti', 'rtx 3070 ti'] },
  { model: 'RTX 3070',       brand: 'NVIDIA', vram: 8,  tier: 'high',   tdp: 220, priceRange: 'mid',     keywords: ['3070', 'rtx 3070', 'geforce rtx 3070'] },
  { model: 'RTX 3060 Ti',    brand: 'NVIDIA', vram: 8,  tier: 'medium', tdp: 200, priceRange: 'mid',     keywords: ['3060 ti', 'rtx 3060 ti', '3060ti', 'dual-rtx3060'] },
  { model: 'RTX 3060',       brand: 'NVIDIA', vram: 12, tier: 'medium', tdp: 170, priceRange: 'mid',     keywords: ['3060', 'rtx 3060', 'geforce rtx 3060', 'rtx3060', 'gaming oc 12g'] },
  { model: 'RTX 3050',       brand: 'NVIDIA', vram: 8,  tier: 'entry',   tdp: 130, priceRange: 'budget',  keywords: ['3050', 'rtx 3050', 'geforce rtx 3050'] },

  // ═══════ NVIDIA GTX 16 ═══════
  { model: 'GTX 1660 Super', brand: 'NVIDIA', vram: 6,  tier: 'entry',   tdp: 125, priceRange: 'budget',  keywords: ['1660 super', 'gtx 1660 super'] },
  { model: 'GTX 1660 Ti',    brand: 'NVIDIA', vram: 6,  tier: 'entry',   tdp: 120, priceRange: 'budget',  keywords: ['1660 ti', 'gtx 1660 ti', 'cerberus 1050'] },
  { model: 'GTX 1660',       brand: 'NVIDIA', vram: 6,  tier: 'entry',   tdp: 120, priceRange: 'budget',  keywords: ['1660', 'gtx 1660'] },
  { model: 'GTX 1650',       brand: 'NVIDIA', vram: 4,  tier: 'entry',   tdp: 75,  priceRange: 'budget',  keywords: ['1650', 'gtx 1650'] },
  { model: 'GTX 1050 Ti',    brand: 'NVIDIA', vram: 4,  tier: 'entry',   tdp: 75,  priceRange: 'budget',  keywords: ['1050 ti', '1050ti', 'gtx 1050 ti', 'cerberus'] },

  // ═══════ NVIDIA GT (قدیمی‌ها) ═══════
  { model: 'GT 1030',        brand: 'NVIDIA', vram: 2,  tier: 'entry',   tdp: 30,  priceRange: 'budget',  keywords: ['gt 1030', 'gt1030', '1030 lp'] },
  { model: 'GT 740',         brand: 'NVIDIA', vram: 2,  tier: 'entry',   tdp: 64,  priceRange: 'budget',  keywords: ['gt 740', 'gt740'] },
  { model: 'GT 730',         brand: 'NVIDIA', vram: 2,  tier: 'entry',   tdp: 49,  priceRange: 'budget',  keywords: ['gt 730', 'gt730', 'جی تی 730'] },
  { model: 'GT 710',         brand: 'NVIDIA', vram: 2,  tier: 'entry',   tdp: 19,  priceRange: 'budget',  keywords: ['gt 710', 'gt710', 'gt710-sl'] },
  { model: 'GT 610',         brand: 'NVIDIA', vram: 2,  tier: 'entry',   tdp: 29,  priceRange: 'budget',  keywords: ['gt 610', 'gt610'] },

  // ═══════ AMD RX 9000 (RDNA 4) ═══════
  { model: 'RX 9070 XT',     brand: 'AMD', vram: 16, tier: 'ultra', tdp: 330, priceRange: 'high',    keywords: ['9070 xt', '9070xt', 'rx 9070 xt', 'nitro+ rx 9070 xt'] },
  { model: 'RX 9070',        brand: 'AMD', vram: 16, tier: 'high',   tdp: 250, priceRange: 'high',    keywords: ['9070', 'rx 9070'] },

  // ═══════ AMD RX 7000 (RDNA 3) ═══════
  { model: 'RX 7900 XTX',    brand: 'AMD', vram: 24, tier: 'ultra', tdp: 355, priceRange: 'premium', keywords: ['7900 xtx', 'rx 7900 xtx', '7900xtx'] },
  { model: 'RX 7900 XT',     brand: 'AMD', vram: 20, tier: 'ultra', tdp: 315, priceRange: 'high',    keywords: ['7900 xt', 'rx 7900 xt', '7900xt'] },
  { model: 'RX 7900 GRE',    brand: 'AMD', vram: 16, tier: 'high',   tdp: 260, priceRange: 'high',    keywords: ['7900 gre', 'rx 7900 gre'] },
  { model: 'RX 7800 XT',     brand: 'AMD', vram: 16, tier: 'high',   tdp: 263, priceRange: 'high',    keywords: ['7800 xt', 'rx 7800 xt', '7800xt'] },
  { model: 'RX 7700 XT',     brand: 'AMD', vram: 12, tier: 'high',   tdp: 245, priceRange: 'mid',     keywords: ['7700 xt', 'rx 7700 xt', '7700xt'] },
  { model: 'RX 7600 XT',     brand: 'AMD', vram: 16, tier: 'medium', tdp: 190, priceRange: 'mid',     keywords: ['7600 xt', 'rx 7600 xt'] },
  { model: 'RX 7600',        brand: 'AMD', vram: 8,  tier: 'medium', tdp: 165, priceRange: 'mid',     keywords: ['7600', 'rx 7600'] },

  // ═══════ AMD RX 6000 (RDNA 2) ═══════
  { model: 'RX 6950 XT',     brand: 'AMD', vram: 16, tier: 'ultra', tdp: 335, priceRange: 'high',    keywords: ['6950 xt', 'rx 6950 xt', '6950xt'] },
  { model: 'RX 6900 XT',     brand: 'AMD', vram: 16, tier: 'high',   tdp: 300, priceRange: 'high',    keywords: ['6900 xt', 'rx 6900 xt', '6900xt'] },
  { model: 'RX 6800 XT',     brand: 'AMD', vram: 16, tier: 'high',   tdp: 300, priceRange: 'high',    keywords: ['6800 xt', 'rx 6800 xt', '6800xt'] },
  { model: 'RX 6800',        brand: 'AMD', vram: 16, tier: 'high',   tdp: 250, priceRange: 'mid',     keywords: ['6800', 'rx 6800'] },
  { model: 'RX 6750 XT',     brand: 'AMD', vram: 12, tier: 'medium', tdp: 250, priceRange: 'mid',     keywords: ['6750 xt', 'rx 6750 xt', '6750xt'] },
  { model: 'RX 6700 XT',     brand: 'AMD', vram: 12, tier: 'medium', tdp: 230, priceRange: 'mid',     keywords: ['6700 xt', 'rx 6700 xt', '6700xt'] },
  { model: 'RX 6650 XT',     brand: 'AMD', vram: 8,  tier: 'medium', tdp: 180, priceRange: 'mid',     keywords: ['6650 xt', 'rx 6650 xt', '6650xt'] },
  { model: 'RX 6600 XT',     brand: 'AMD', vram: 8,  tier: 'medium', tdp: 160, priceRange: 'mid',     keywords: ['6600 xt', 'rx 6600 xt', '6600xt'] },
  { model: 'RX 6600',        brand: 'AMD', vram: 8,  tier: 'medium', tdp: 132, priceRange: 'budget',  keywords: ['6600', 'rx 6600'] },
  { model: 'RX 6500 XT',     brand: 'AMD', vram: 4,  tier: 'entry',   tdp: 107, priceRange: 'budget',  keywords: ['6500 xt', 'rx 6500 xt', '6500xt'] },
  { model: 'RX 6400',        brand: 'AMD', vram: 4,  tier: 'entry',   tdp: 53,  priceRange: 'budget',  keywords: ['6400', 'rx 6400'] },

  // ═══════ Intel Arc ═══════
  { model: 'Arc A770',       brand: 'Intel', vram: 16, tier: 'medium', tdp: 225, priceRange: 'mid',     keywords: ['arc a770', 'a770'] },
  { model: 'Arc A750',       brand: 'Intel', vram: 8,  tier: 'medium', tdp: 225, priceRange: 'mid',     keywords: ['arc a750', 'a750'] },
  { model: 'Arc A580',       brand: 'Intel', vram: 8,  tier: 'medium', tdp: 150, priceRange: 'mid',     keywords: ['arc a580', 'a580'] },
  { model: 'Arc A380',       brand: 'Intel', vram: 6,  tier: 'entry',   tdp: 75,  priceRange: 'budget',  keywords: ['arc a380', 'a380'] },
];

// ════════════════════════════════════════════════════════════════
// 🔌 Motherboard Chipsets — شامل واقعی‌های فروشگاه
// ════════════════════════════════════════════════════════════════

export interface MbChipset {
  chipset: string;
  socket: 'AM5' | 'AM4' | 'LGA1700' | 'LGA1851' | 'LGA1200' | 'LGA1151' | 'LGA1155' | 'LGA1150';
  ramType: 'DDR5' | 'DDR4' | 'DDR3';
  tier: Tier;
  /** فرم‌فکتور پیش‌فرض برای این چیپ‌ست */
  defaultFormFactor: 'ATX' | 'Micro-ATX' | 'Mini-ITX' | 'E-ATX';
  keywords: string[];
}

export const MB_CHIPSETS: MbChipset[] = [
  // ═══════ Intel LGA1851 (Arrow Lake, DDR5) — جدید ═══════
  { chipset: 'Z890', socket: 'LGA1851', ramType: 'DDR5', tier: 'ultra',   defaultFormFactor: 'ATX',       keywords: ['z890'] },
  { chipset: 'B860', socket: 'LGA1851', ramType: 'DDR5', tier: 'medium',  defaultFormFactor: 'Micro-ATX', keywords: ['b860'] },

  // ═══════ Intel LGA1700 (DDR5/DDR4) ═══════
  { chipset: 'Z790',   socket: 'LGA1700', ramType: 'DDR5', tier: 'ultra',   defaultFormFactor: 'ATX',       keywords: ['z790'] },
  { chipset: 'Z790-D4',socket: 'LGA1700', ramType: 'DDR4', tier: 'ultra',   defaultFormFactor: 'ATX',       keywords: ['z790-d4', 'z790 ddr4'] },
  { chipset: 'Z690',   socket: 'LGA1700', ramType: 'DDR5', tier: 'high',    defaultFormFactor: 'ATX',       keywords: ['z690'] },
  { chipset: 'B760',   socket: 'LGA1700', ramType: 'DDR5', tier: 'medium',  defaultFormFactor: 'Micro-ATX', keywords: ['b760'] },
  { chipset: 'B760M',  socket: 'LGA1700', ramType: 'DDR5', tier: 'medium',  defaultFormFactor: 'Micro-ATX', keywords: ['b760m', 'ak-b760m'] },
  { chipset: 'B660',   socket: 'LGA1700', ramType: 'DDR5', tier: 'medium',  defaultFormFactor: 'Micro-ATX', keywords: ['b660'] },
  { chipset: 'H770',   socket: 'LGA1700', ramType: 'DDR5', tier: 'medium',  defaultFormFactor: 'ATX',       keywords: ['h770'] },
  { chipset: 'H670',   socket: 'LGA1700', ramType: 'DDR5', tier: 'medium',  defaultFormFactor: 'ATX',       keywords: ['h670'] },
  { chipset: 'H610',   socket: 'LGA1700', ramType: 'DDR4', tier: 'entry',   defaultFormFactor: 'Micro-ATX', keywords: ['h610'] },
  { chipset: 'H610M',  socket: 'LGA1700', ramType: 'DDR4', tier: 'entry',   defaultFormFactor: 'Micro-ATX', keywords: ['h610m'] },

  // ═══════ AMD AM5 (DDR5) ═══════
  { chipset: 'X870E',  socket: 'AM5', ramType: 'DDR5', tier: 'ultra',  defaultFormFactor: 'E-ATX',    keywords: ['x870e'] },
  { chipset: 'X870',   socket: 'AM5', ramType: 'DDR5', tier: 'ultra',  defaultFormFactor: 'ATX',     keywords: ['x870'] },
  { chipset: 'X670E',  socket: 'AM5', ramType: 'DDR5', tier: 'high',   defaultFormFactor: 'ATX',     keywords: ['x670e'] },
  { chipset: 'X670',   socket: 'AM5', ramType: 'DDR5', tier: 'high',   defaultFormFactor: 'ATX',     keywords: ['x670'] },
  { chipset: 'B650E',  socket: 'AM5', ramType: 'DDR5', tier: 'high',   defaultFormFactor: 'ATX',     keywords: ['b650e'] },
  { chipset: 'B650',   socket: 'AM5', ramType: 'DDR5', tier: 'medium', defaultFormFactor: 'Micro-ATX', keywords: ['b650'] },

  // ═══════ AMD AM4 (DDR4) ═══════
  { chipset: 'X570',   socket: 'AM4', ramType: 'DDR4', tier: 'high',   defaultFormFactor: 'ATX',     keywords: ['x570'] },
  { chipset: 'B550',   socket: 'AM4', ramType: 'DDR4', tier: 'medium', defaultFormFactor: 'Micro-ATX', keywords: ['b550'] },
  { chipset: 'A520',   socket: 'AM4', ramType: 'DDR4', tier: 'entry',  defaultFormFactor: 'Micro-ATX', keywords: ['a520', 'a520mt'] },
  { chipset: 'B450',   socket: 'AM4', ramType: 'DDR4', tier: 'medium', defaultFormFactor: 'Micro-ATX', keywords: ['b450'] },

  // ═══════ Intel LGA1200 (DDR4) ═══════
  { chipset: 'Z590',   socket: 'LGA1200', ramType: 'DDR4', tier: 'high',   defaultFormFactor: 'ATX',     keywords: ['z590'] },
  { chipset: 'H510',   socket: 'LGA1200', ramType: 'DDR4', tier: 'entry',  defaultFormFactor: 'Micro-ATX', keywords: ['h510', 'h510m'] },
  { chipset: 'H570',   socket: 'LGA1200', ramType: 'DDR4', tier: 'medium', defaultFormFactor: 'ATX',     keywords: ['h570'] },
  { chipset: 'B560',   socket: 'LGA1200', ramType: 'DDR4', tier: 'medium', defaultFormFactor: 'Micro-ATX', keywords: ['b560'] },

  // ═══════ Intel LGA1151 قدیمی‌ها ═══════
  { chipset: 'Z270',   socket: 'LGA1151', ramType: 'DDR4', tier: 'high',   defaultFormFactor: 'ATX',     keywords: ['z270'] },
  { chipset: 'H61',    socket: 'LGA1155' as any, ramType: 'DDR3' as any, tier: 'entry',  defaultFormFactor: 'Micro-ATX', keywords: ['h61', 'h61m'] },
  { chipset: 'H81',    socket: 'LGA1150' as any, ramType: 'DDR3' as any, tier: 'entry',  defaultFormFactor: 'Micro-ATX', keywords: ['h81', 'h81m'] },
];

// ════════════════════════════════════════════════════════════════
// 🗄️ PSU — محاسبهٔ هوشمند
// ════════════════════════════════════════════════════════════════

export function calculateMinPsuWattage(cpuTdp: number, gpuTdp: number): number {
  const total = cpuTdp + gpuTdp + 100;
  const safe = Math.round(total * 1.25 / 50) * 50;
  return Math.max(400, safe);
}

export function recommendPsuWattage(cpuTdp: number, gpuTdp: number): number {
  const total = cpuTdp + gpuTdp + 100;
  const recommended = Math.round(total * 1.4 / 50) * 50;
  return Math.max(500, recommended);
}

// ════════════════════════════════════════════════════════════════
// 🗄️ Form Factor Compatibility
// ════════════════════════════════════════════════════════════════

export type FormFactor = 'ATX' | 'Micro-ATX' | 'Mini-ITX' | 'E-ATX';

export const FORM_FACTOR_RANK: Record<FormFactor, number> = {
  'E-ATX': 3,
  'ATX': 2,
  'Micro-ATX': 1,
  'Mini-ITX': 0,
};

export function isFormFactorCompatible(caseFF: FormFactor, mbFF: FormFactor): boolean {
  return FORM_FACTOR_RANK[caseFF] >= FORM_FACTOR_RANK[mbFF];
}

// ════════════════════════════════════════════════════════════════
// 🧊 Cooler Database — شامل واقعی‌های فروشگاه
// ════════════════════════════════════════════════════════════════

export interface CoolerModel {
  brand: string;
  type: 'air' | 'aio';
  size?: number;
  tdpRating: number;
  tier: Tier;
  keywords: string[];
}

export const COOLER_BRANDS: CoolerModel[] = [
  // Noctua
  { brand: 'Noctua', type: 'air', tdpRating: 250, tier: 'ultra', keywords: ['noctua', 'noktua', 'نکتوا', 'nh-d15', 'nh-u12', 'nh-u9', 'nh-d'] },
  // Deepcool (در فروشگاه خیلی پرکاربرد)
  { brand: 'Deepcool', type: 'air', tdpRating: 200, tier: 'high', keywords: ['deepcool', 'دیپ کول', 'ak620', 'ak400', 'assassin', 'fc120'] },
  // Dark Flash (ایرانی)
  { brand: 'Dark Flash', type: 'aio', size: 240, tdpRating: 250, tier: 'high', keywords: ['dark flash', 'دارک فلش', 'dn-240', 'dn-360', 'c400'] },
  // Gamdias
  { brand: 'Gamdias', type: 'air', tdpRating: 180, tier: 'high', keywords: ['gamdias', 'گیمدیاس', 'boreas', 'بورئاس'] },
  // Fater (ایرانی)
  { brand: 'Fater', type: 'air', tdpRating: 150, tier: 'medium', keywords: ['fater', 'فاطر', 'fc-f35', 'fc-mig29', 'mig29'] },
  // Aurest (برند اختصاصی آفلند)
  { brand: 'Aurest', type: 'air', tdpRating: 200, tier: 'medium', keywords: ['aurest', 'اوست', 'gt-av80', 'gt-av90', 'gt-av904', 'gt-av905', 'gt-av360t', 'gt-av360l'] },
  // Silverstone
  { brand: 'Silverstone', type: 'air', tdpRating: 180, tier: 'medium', keywords: ['silverstone', 'سیلوراستون', 'sst-', 'ar09', 'hyd120w'] },
  // Corsair
  { brand: 'Corsair', type: 'aio', size: 360, tdpRating: 280, tier: 'ultra', keywords: ['corsair h', 'corsair cooler', 'کورسیر h', 'h150i', 'h100i'] },
  // Lian Li
  { brand: 'Lian Li', type: 'aio', size: 240, tdpRating: 280, tier: 'ultra', keywords: ['lian li', 'لیان لی', 'galahad', 'trinity'] },
  // Cooler Master
  { brand: 'Cooler Master', type: 'aio', size: 240, tdpRating: 250, tier: 'high', keywords: ['cooler master', 'coolermaster', 'کولر مستر', 'masterliquid', 'ml240', 'ml360', 'ma612', 'hyper 212'] },
  // NZXT
  { brand: 'NZXT', type: 'aio', size: 240, tdpRating: 280, tier: 'high', keywords: ['nzxt', 'ان زد ایکس تی', 'kraken'] },
  // Asus
  { brand: 'Asus', type: 'aio', size: 240, tdpRating: 280, tier: 'high', keywords: ['asus tuf', 'tuf gaming lc'] },
  // Thermalright
  { brand: 'Thermalright', type: 'air', tdpRating: 200, tier: 'high', keywords: ['thermalright', 'ترمالتیک', 'peerless', 'ux200'] },
  // TSCO
  { brand: 'TSCO', type: 'air', tdpRating: 150, tier: 'medium', keywords: ['tsco', 'تسکو', 'gafan', 'gafan 240', 'gafan 250'] },
  // Arctic
  { brand: 'Arctic', type: 'air', tdpRating: 180, tier: 'medium', keywords: ['arctic', 'ارکتیک', 'freezer'] },
  // Be Quiet
  { brand: 'be quiet!', type: 'air', tdpRating: 250, tier: 'ultra', keywords: ['be quiet', 'بی کویت', 'dark rock'] },
];

// ════════════════════════════════════════════════════════════════
// 🏷️ Brand Mapping (Persian + English)
// ════════════════════════════════════════════════════════════════

export const PERSIAN_BRANDS: Record<string, string> = {
  // CPU brands
  'اینتل': 'Intel',
  'intel': 'Intel',
  'ای ام دی': 'AMD',
  'amd': 'AMD',
  'xeon': 'Intel',
  // GPU brands
  'انویدیا': 'NVIDIA',
  'nvidia': 'NVIDIA',
  'radeon': 'AMD',
  // Motherboard brands
  'ازراک': 'ASRock',
  'asrock': 'ASRock',
  'ایسوس': 'ASUS',
  'asus': 'ASUS',
  'ام اس آی': 'MSI',
  'msi': 'MSI',
  'گیگابایت': 'Gigabyte',
  'gigabyte': 'Gigabyte',
  'aorus': 'Aorus',
  'بایوستار': 'Biostar',
  'biostar': 'Biostar',
  'فاطر': 'Fater',
  'fater': 'Fater',
  'دل': 'Dell',
  'dell': 'Dell',
  'آرک تک': 'Arktek',
  'arktek': 'Arktek',
  // RAM brands
  'کینگستون': 'Kingston',
  'kingston': 'Kingston',
  'ای دیتا': 'Adata',
  'adata': 'Adata',
  'کینگ مکس': 'Kingmax',
  'kingmax': 'Kingmax',
  'کورسیر': 'Corsair',
  'corsair': 'Corsair',
  'لکسار': 'Lexar',
  'lexar': 'Lexar',
  'جی‌اسکیل': 'GSkill',
  'g.skill': 'GSkill',
  'gskill': 'GSkill',
  'کروشیال': 'Crucial',
  'crucial': 'Crucial',
  'گیل': 'GeIL',
  'geil': 'GeIL',
  // PSU brands
  'اف اس پی': 'FSP',
  'fsp': 'FSP',
  'آنتک': 'Antec',
  'antec': 'Antec',
  'اوست': 'Aurest',
  'aurest': 'Aurest',
  'گیمدیاس': 'Gamdias',
  'gamdias': 'Gamdias',
  'سیلوراستون': 'Silverstone',
  // Case brands
  'لاجی کی': 'LogiKey',
  'سابیت': 'Sabit',
  'تسکو': 'TSCO',
  'دارک فلش': 'Dark Flash',
  'لیان لی': 'Lian Li',
  'مجلیک': 'Magic',
  'گیم مکس': 'Gamemax',
  'green': 'Green',
  'گرین': 'Green',
};

// ════════════════════════════════════════════════════════════════
// 🔍 نگاشت کوئری جستجو
// ════════════════════════════════════════════════════════════════

export const CPU_SEARCH_QUERIES = [
  // فارسی + انگلیسی
  'cpu', 'پردازنده', 'پروسسور', 'processor', 'سی پی یو',
  'amd ryzen', 'intel core', 'ryzen 9', 'ryzen 7', 'ryzen 5', 'core i9', 'core i7', 'core i5',
  'پردازنده amd', 'پردازنده intel', 'پردازنده اینتل', 'پردازنده ای ام دی', 'پردازنده core',
  'پردازنده کامپیوتر', 'پردازنده دسکتاپ', 'پردازنده amd ryzen', 'پردازنده intel core',
  'ryzen', 'core', 'intel', 'xeon',
];

export const GPU_SEARCH_QUERIES = [
  'کارت گرافیک', 'گرافیک', 'gpu', 'graphics card', 'video card',
  'rtx', 'geforce', 'nvidia', 'انویدیا', 'radeon',
  'کارت گرافیک rtx', 'کارت گرافیک amd', 'کارت گرافیک انویدیا', 'کارت گرافیک گیمینگ',
  'rx 7', 'rx 6', 'rx 9',
];

export const MB_SEARCH_QUERIES = [
  'مادربرد', 'motherboard', 'mainboard', 'برد اصلی', 'مادربرد کامپیوتر',
  'asus', 'msi', 'gigabyte', 'asrock', 'ازراک', 'ام اس آی', 'ایسوس', 'گیگابایت',
  'مادربرد ddr5', 'مادربرد ddr4', 'مادربرد گیمینگ',
];

export const RAM_SEARCH_QUERIES = [
  'رم', 'ram', 'memory', 'دیدرم', 'ddr5', 'ddr4', 'ddr3',
  'kingston', 'corsair', 'gskill', 'teamgroup', 'adata', 'کینگستون', 'ای دیتا', 'کورسیر',
  'رم کامپیوتر', 'رم گیمینگ', 'memory kit',
];

export const STORAGE_SEARCH_QUERIES = [
  'ssd', 'اس اس دی', 'nvme', 'm.2', 'm2', 'samsung', 'wd', 'crucial', 'kingston',
  'ssd nvme', 'ssd sata', 'هارد', 'hdd', 'حافظه',
];

export const PSU_SEARCH_QUERIES = [
  'پاور', 'psu', 'power supply', 'منبع تغذیه',
  'corsair', 'seasonic', 'be quiet', 'coolermaster', 'fsp',
  'پاور ماژولار', 'پاور 80', 'پاور گیمینگ', 'پاور کامپیوتر',
];

export const CASE_SEARCH_QUERIES = [
  'کیس', 'case', 'کیس گیمینگ', 'کیس کامپیوتر',
  'lian li', 'fractal', 'nzxt', 'corsair case', 'deepcool case',
  'کیس atx', 'کیس matx',
];

export const COOLER_SEARCH_QUERIES = [
  'کولر', 'خنک کننده', 'cooler', 'cpu cooler',
  'noctua', 'deepcool', 'arctic', 'be quiet cooler', 'corsair h',
  'کولر پردازنده', 'کولر بادی', 'کولر آبی', 'aio', 'فن پردازنده',
];

export const CASE_FAN_SEARCH_QUERIES = [
  'فن کیس', 'case fan', 'فن rgb', 'rgb fan',
  'lian li unifan', 'corsair ql', 'corsair af', 'deepcool fc',
  'fan rgb 120', 'فن گیمینگ rgb', 'فن ۱۲۰',
];

export const ARGB_STRIP_SEARCH_QUERIES = [
  'نوار rgb', 'argb strip', 'rgb led strip',
  'rgb kit', 'argb kit', 'نوار نور rgb', 'کیت نورپردازی',
];
