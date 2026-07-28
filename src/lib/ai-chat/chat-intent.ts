/**
 * chat-intent.ts — Deterministic intent classifier
 * ──────────────────────────────────────────────────────────────────
 * Fast, rule-based. No AI call. Uses keyword matching + synonym maps.
 * Used by chat route to decide: RAG or no RAG, cards or no cards.
 */

export type ChatIntent =
  | 'greeting'
  | 'identity'
  | 'technical_question'
  | 'product_search'
  | 'product_compare'
  | 'price_or_stock'
  | 'full_build'
  | 'order_support'
  | 'site_help'
  | 'off_topic'
  | 'unknown';

export interface IntentResult {
  intent: ChatIntent;
  /** Whether to run RAG / product search */
  needsRag: boolean;
  /** Whether to show product source cards */
  showCards: boolean;
  /** Whether to redirect to assembly */
  redirectToAssembly: boolean;
  /** Category hint if detected */
  categoryHint: string | null;
}

// ─── Keyword Maps ────────────────────────────────────────────────

const GREETING_WORDS = [
  'سلام', 'درود', 'صبح بخیر', 'شب بخیر', 'عصر بخیر', 'خسته نباشید',
  'hello', 'hi', 'hey', 'good morning',
];

const IDENTITY_PATTERNS = [
  /\bکی\s*هستی\b/, /\bاسمت\s*چیه\b/, /\bچیکار\s*میکنی\b/,
  /\bچه\s*کاری\s*بلدی\b/, /\bمعرفی\s*کن\s*خودت\b/,
  /\bwho\s*are\s*you\b/i, /\bwhat\s*can\s*you\s*do\b/i,
  /\bاسم\s*تو\b/, /\bهویت\b/,
];

const FULL_BUILD_PATTERNS = [
  /سیستم\s*کامل/, /اسمبل\s*کامل/, /یک\s*سیستم/,
  /system\s*build/i, /full\s*build/i,
  /پیشنهاد\s*سیستم/, /سیستم\s*بخرم/,
  /سیستم\s*گیمینگ/, /سیستم\s*اداری/, /سیستم\s*رندر/,
];

const ORDER_SUPPORT_PATTERNS = [
  /سفارش/, /پیگیری/, /ارسال/, /پست/, /تیپاکس/,
  /فاکتور/, /خریدم/, /سبد\s*خرید/, /order/i, /tracking/i,
  /وضعیت\s*سفارش/, /کد\s*پیگیری/,
];

const SITE_HELP_PATTERNS = [
  /راهنما/, /چطور\s*از/, /چگونه/, /آموزش/, /help/i,
  /چطوری\s*ثبت\s*سفارش/, /نحوه\s*خرید/,
];

const OFF_TOPIC_PATTERNS = [
  /آب\s*و\s*هوا/, /سیاسی/, /فوتبال/, /فیلم\s*و\s*سریال/,
  /دستور\s*غذا/, /طرز\s*تهیه/, /شعر/, /داستان/,
];

// ─── Category Detection ──────────────────────────────────────────

const CATEGORY_SYNONYMS: Record<string, string[]> = {
  cpu: ['پردازنده', 'سی پی یو', 'cpu', 'اینتل', 'intel', 'رایزن', 'ryzen', 'core', 'i3', 'i5', 'i7', 'i9', 'r3', 'r5', 'r7', 'r9'],
  gpu: ['کارت گرافیک', 'gpu', 'گرافیک', 'rtx', 'rx', 'geforce', 'radeon', 'vram', 'graphics'],
  ram: ['رم', 'ram', 'ddr4', 'ddr5', 'حافظه رم', 'memory'],
  motherboard: ['مادربرد', 'motherboard', 'mainboard', 'بورد', 'b650', 'b760', 'h610', 'z790', 'x670'],
  ssd: ['ssd', 'nvme', 'm.2', 'حافظه', 'اس اس دی', 'هارد', 'hdd', 'storage'],
  psu: ['پاور', 'psu', 'منبع تغذیه', 'power supply', 'وات', 'watt'],
  case: ['کیس', 'case', 'mid tower', 'full tower', 'mini tower'],
  cooler: ['خنک کننده', 'خنک‌کننده', 'cooler', 'هواخنک', 'آب‌خنک', 'aio', 'فن پردازنده'],
  monitor: ['مانیتور', 'monitor', 'صفحه نمایش'],
};

// Words that indicate user wants to BUY (not just ask technically)
const PURCHASE_INTENT_WORDS = [
  'موجود', 'گقیمت', 'چنده', 'bekharam', 'بخرم', 'میخوام', 'می‌خوام',
  'معرفی کن', 'نشونم بده', 'دارید', 'لینک', 'محصول', 'product',
  'مقایسه', 'ارزون', 'ارزان', 'بهترین', 'پیشنهاد',
];

// Technical question indicators (no purchase intent)
const TECHNICAL_WORDS = [
  'تفاوت', 'فرق', 'difference', 'vs', 'مقایسه', 'کدوم بهتره',
  'سازگار', 'compatibility', 'سوکت', 'socket', 'ddr4', 'ddr5',
  'pcie', 'nvme', 'sata', 'tdp', 'watt', 'بنچمارک', 'benchmark',
  'چطور', 'چگونه', 'how', 'why', 'چرا',
];

// ─── Classifier ──────────────────────────────────────────────────

export function classifyIntent(query: string): IntentResult {
  const q = query.toLowerCase().trim();
  const qNormalized = q.replace(/\s+/g, ' ');

  // 1. Greeting
  if (GREETING_WORDS.some(w => qNormalized.includes(w)) && qNormalized.length < 30) {
    return { intent: 'greeting', needsRag: false, showCards: false, redirectToAssembly: false, categoryHint: null };
  }

  // 2. Identity
  if (IDENTITY_PATTERNS.some(p => p.test(qNormalized))) {
    return { intent: 'identity', needsRag: false, showCards: false, redirectToAssembly: false, categoryHint: null };
  }

  // 3. Off-topic
  if (OFF_TOPIC_PATTERNS.some(p => p.test(qNormalized))) {
    return { intent: 'off_topic', needsRag: false, showCards: false, redirectToAssembly: false, categoryHint: null };
  }

  // 4. Full build → redirect to assembly
  if (FULL_BUILD_PATTERNS.some(p => p.test(qNormalized))) {
    return { intent: 'full_build', needsRag: false, showCards: false, redirectToAssembly: true, categoryHint: null };
  }

  // 5. Order support
  if (ORDER_SUPPORT_PATTERNS.some(p => p.test(qNormalized))) {
    return { intent: 'order_support', needsRag: false, showCards: false, redirectToAssembly: false, categoryHint: null };
  }

  // 6. Site help
  if (SITE_HELP_PATTERNS.some(p => p.test(qNormalized))) {
    return { intent: 'site_help', needsRag: false, showCards: false, redirectToAssembly: false, categoryHint: null };
  }

  // 7. Detect category
  let categoryHint: string | null = null;
  for (const [cat, words] of Object.entries(CATEGORY_SYNONYMS)) {
    if (words.some(w => qNormalized.includes(w))) {
      categoryHint = cat;
      break;
    }
  }

  // 8. Check purchase intent vs technical question
  const hasPurchaseIntent = PURCHASE_INTENT_WORDS.some(w => qNormalized.includes(w));
  const hasTechnical = TECHNICAL_WORDS.some(w => qNormalized.includes(w));

  // Price/stock check
  if (/قیمت|چنده|موجودی|موجوده|stock|price/i.test(qNormalized)) {
    return { intent: 'price_or_stock', needsRag: true, showCards: true, redirectToAssembly: false, categoryHint };
  }

  // Compare
  if (/مقایسه|vs|تفاوت\s+.*\s+با|فرق/i.test(qNormalized) && hasPurchaseIntent) {
    return { intent: 'product_compare', needsRag: true, showCards: true, redirectToAssembly: false, categoryHint };
  }

  // Product search (explicit purchase intent + category)
  if (hasPurchaseIntent && categoryHint) {
    return { intent: 'product_search', needsRag: true, showCards: true, redirectToAssembly: false, categoryHint };
  }

  // Technical question
  if (hasTechnical && !hasPurchaseIntent) {
    return { intent: 'technical_question', needsRag: false, showCards: false, redirectToAssembly: false, categoryHint };
  }

  // Product search (general purchase intent without category)
  if (hasPurchaseIntent) {
    return { intent: 'product_search', needsRag: true, showCards: true, redirectToAssembly: false, categoryHint };
  }

  // Technical with category hint but ambiguous purchase intent
  if (categoryHint && hasTechnical) {
    return { intent: 'technical_question', needsRag: false, showCards: false, redirectToAssembly: false, categoryHint };
  }

  // Unknown — let AI decide, no RAG
  return { intent: 'unknown', needsRag: false, showCards: false, redirectToAssembly: false, categoryHint };
}

/**
 * Assembly redirect message
 */
export const ASSEMBLY_REDIRECT_MESSAGE = 'برای ساخت سیستم کامل، بهتره از ابزار «اسمبل هوشمند» استفاده کنید. اونجا با توجه به بودجه و کاربری شما، قطعات سازگار و بهینه رو خودش انتخاب می‌کنه. از منوی سایت به بخش «اسمبل آنلاین» برید! 🔧';
