/**
 * chat-intent.ts — تشخیص قصد کاربر (Intent Classification)
 * ──────────────────────────────────────────────────────────────────
 * بدون نیاز به AI، از الگوهای زبانی و کلمات کلیدی استفاده می‌کند.
 * ──────────────────────────────────────────────────────────────────
 */

import type { IntentResult, ChatIntent } from './types';

// ════════════════════════════════════════════════════════════════
// PATTERNS
// ════════════════════════════════════════════════════════════════

const GREETING_PATTERNS = [
  /^سلام/i,
  /^درود/i,
  /^هی\b/i,
  /^هلو\b/i,
  /^hello/i,
  /^hi\b/i,
  /^صبح بخیر/i,
  /^عصر بخیر/i,
  /^شب بخیر/i,
  /^خسته نباش/i,
  /^وقت بخیر/i,
];

const IDENTITY_PATTERNS = [
  /تو کی[یئ]؟?/i,
  /تو چی[یئ]؟?/i,
  /کی هستی/i,
  /چی هستی/i,
  /معرفی کن/i,
  /خودت رو? معرفی/i,
  /who are you/i,
  /what are you/i,
  /اسمت چیه/i,
  /نامت چیه/i,
  /چیکاره‌?ای/i,
  /چه کار[یئ]ی? می‌?تونی/i,
];

const FULL_BUILD_PATTERNS = [
  /سیستم\s*(کامل|بند|بستن|جمع|اسمبل)/i,
  /(بند|بستن|جمع|اسمبل)\s*سیستم/i,
  /اسمبل\s*(کن|بزن|بده|می‌?خوام)/i,
  /pc\s*build/i,
  /full\s*build/i,
  /کامپیوتر\s*(کامل|بند|بستن)/i,
  /سیستم\s*(می‌?خوام|می‌?خام|بده|پیشنهاد)/i,
  /(گیمینگ|اداری|رندر|استریم)\s*سیستم/i,
  /(چند|چقدر)\s*(هزینه|بودجه)\s*(سیستم|اسمبل)/i,
  /از\s*(اول|صفر)\s*(سیستم|اسمبل)/i,
];

const ORDER_SUPPORT_PATTERNS = [
  /سفارش\s*(من|م)/i,
  /پیگیری\s*(سفارش|ارسال|مرسوله)/i,
  /وضعیت\s*(سفارش|ارسال)/i,
  /کی\s*می‌?رس[هت]/i,
  /ارسال\s*(نشده|نشده|کی)/i,
  /مرجوع/i,
  /بازگشت\s*(کالا|جنس)/i,
  /شکایت/i,
  /تماس\s*(بگیر|با)/i,
  /پشتیبانی/i,
];

const OFF_TOPIC_PATTERNS = [
  /آب\s*و\s*هوا/i,
  /اخبار\s*(ورزشی|سیاسی|جهان)/i,
  /فیلم\s*(پیشنهاد|معرفی)/i,
  /موسیقی\s*(پیشنهاد|معرفی)/i,
  /غذا\s*(پخت|درست)/i,
  /سفر\s*(نامه|نامه|برنامه)/i,
  /کدنویسی\s*(یاد|آموزش)/i,
  /برنامه‌?نویسی\s*(یاد|آموزش)/i,
  /recipe/i,
  /weather/i,
  /sports/i,
];

const TECHNICAL_PATTERNS = [
  /(تفاوت|فرق|اختلاف)\s*(بین|cpu|gpu|ram|ssd|hdd|ddr)/i,
  /(چرا|چگونه|چطوری)\s*.+\s*(کار|عمل)/i,
  /چیست\s*\؟?$/i,
  /چیه\s*\؟?$/i,
  /معنی\s*(چیست|چیه)/i,
  /DDR[45]/i,
  /PCIe\s*[345]/i,
  /NVMe/i,
  /TDP/i,
  /socket/i,
  /سوکت/i,
  /چیپ‌?ست/i,
  /chipset/i,
  /فرکانس/i,
  /توان\s*مصرفی/i,
  /watt/i,
  /ولتاژ/i,
  /overclock/i,
  /bottleneck/i,
  /گلوگاه/i,
];

// ════════════════════════════════════════════════════════════════
// CATEGORY DETECTION
// ════════════════════════════════════════════════════════════════

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  cpu: ['پردازنده', 'cpu', 'اینتل', 'intel', 'core', 'ryzen', 'amd', 'i5', 'i7', 'i9', 'i3', 'fx'],
  gpu: ['کارت گرافیک', 'گرافیک', 'gpu', 'rtx', 'gtx', 'rx', 'geforce', 'radeon', 'nvidia'],
  ram: ['رم', 'ram', 'ddr4', 'ddr5', 'حافظه رم', 'memory'],
  motherboard: ['مادربرد', 'motherboard', 'mainboard', 'برد اصلی'],
  storage: ['هارد', 'ssd', 'hdd', 'nvme', 'm.2', 'حافظه', 'دیسک'],
  psu: ['پاور', 'psu', 'منبع تغذیه', 'تغذیه'],
  case: ['کیس', 'case', 'بدنه'],
  cooler: ['خنک', 'cooler', 'فن', 'aio', 'خنک‌کننده', 'هواخنک', 'آب‌خنک'],
  monitor: ['مانیتور', 'monitor', 'نمایشگر', 'صفحه نمایش'],
};

function detectCategory(message: string): string | null {
  const lower = message.toLowerCase();
  let bestCategory: string | null = null;
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.filter((kw) => lower.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return bestCategory;
}

// ════════════════════════════════════════════════════════════════
// PRODUCT SEARCH DETECTION
// ════════════════════════════════════════════════════════════════

const PRODUCT_SEARCH_SIGNALS = [
  /می‌?خوام\b/i,
  /می‌?خام\b/i,
  /بخرم\b/i,
  /خرید/i,
  /قیمت/i,
  /چنده/i,
  /موجود/i,
  /پیشنهاد\s*(بده|بدید|کن|کنید)/i,
  /کدوم\s*(بهتر|خوب)/i,
  /چه\s*(مدلی|برندی)/i,
  /مشخصات/i,
  /مقایسه/i,
  /بررسی/i,
  /review/i,
  /buy/i,
  /price/i,
];

function isProductSearch(message: string): boolean {
  const signals = PRODUCT_SEARCH_SIGNALS.filter((p) => p.test(message));
  return signals.length >= 1;
}

function needsRagForIntent(intent: ChatIntent, message: string): boolean {
  if (intent === 'product_search') return true;
  if (intent === 'technical_question') {
    // Check if the technical question mentions specific product types
    return detectCategory(message) !== null;
  }
  return false;
}

// ════════════════════════════════════════════════════════════════
// MAIN CLASSIFIER
// ════════════════════════════════════════════════════════════════

/**
 * تشخیص قصد کاربر بدون نیاز به AI.
 * ترتیب بررسی: greeting → identity → full_build → order_support → off_topic → product_search → technical → unknown
 */
export function classifyIntent(message: string): IntentResult {
  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();

  // 1. Greeting (short messages only)
  if (trimmed.length < 30 && GREETING_PATTERNS.some((p) => p.test(trimmed))) {
    return { intent: 'greeting', needsRag: false, confidence: 0.95 };
  }

  // 2. Identity
  if (IDENTITY_PATTERNS.some((p) => p.test(trimmed))) {
    return { intent: 'identity', needsRag: false, confidence: 0.9 };
  }

  // 3. Full Build (assembly redirect)
  if (FULL_BUILD_PATTERNS.some((p) => p.test(trimmed))) {
    return { intent: 'full_build', needsRag: false, confidence: 0.85 };
  }

  // 4. Order Support
  if (ORDER_SUPPORT_PATTERNS.some((p) => p.test(trimmed))) {
    return { intent: 'order_support', needsRag: false, confidence: 0.8 };
  }

  // 5. Off Topic
  if (OFF_TOPIC_PATTERNS.some((p) => p.test(trimmed))) {
    return { intent: 'off_topic', needsRag: false, confidence: 0.7 };
  }

  // 6. Category detection (for RAG hint)
  const categoryHint = detectCategory(lower);

  // 7. Product Search
  if (isProductSearch(trimmed)) {
    return {
      intent: 'product_search',
      needsRag: true,
      categoryHint,
      confidence: 0.85,
    };
  }

  // 8. Technical Question
  if (TECHNICAL_PATTERNS.some((p) => p.test(trimmed)) || categoryHint) {
    const needsRag = needsRagForIntent('technical_question', lower);
    return {
      intent: 'technical_question',
      needsRag,
      categoryHint,
      confidence: 0.7,
    };
  }

  // 9. Fallback: assume product search with RAG
  return {
    intent: 'product_search',
    needsRag: true,
    categoryHint,
    confidence: 0.5,
  };
}

/**
 * آیا این پیام نیاز به RAG دارد؟
 */
export function shouldUseRag(message: string): boolean {
  const result = classifyIntent(message);
  return result.needsRag;
}
