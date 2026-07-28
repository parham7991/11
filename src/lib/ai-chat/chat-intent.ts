/**
 * chat-intent.ts — Deterministic intent classifier (table-driven)
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
  needsRag: boolean;
  showCards: boolean;
  redirectToAssembly: boolean;
  categoryHint: string | null;
}

// ─── Tables ──────────────────────────────────────────────────────

const GREETING_TABLE = [
  'سلام', 'درود', 'صبح بخیر', 'شب بخیر', 'عصر بخیر', 'خسته نباشید',
  'hello', 'hi', 'hey', 'good morning', 'سلامت باشید', 'خوش آمدید',
];

const IDENTITY_TABLE = [
  'کی هستی', 'کیهستی', 'اسمت چیه', 'اسمت', 'چه کاری می‌کنی', 'چه کاری میکنی',
  'چیکار میکنی', 'چیکار می‌کنی', 'چه کار بلدی', 'چه کاری بلدی',
  // Keep self-reference in identity patterns. "معرفی کن" alone is a normal shopping request.
  'معرفی کن خودت', 'خودت رو معرفی کن', 'خودتو معرفی کن',
  'خودت رو در دو جمله معرفی کن', 'خودتو در دو جمله معرفی کن',
  'خودت را معرفی کن', 'خودت را در دو جمله معرفی کن', 'از خودت بگو', 'تو کی هستی', 'تو چیهستی',
  'کی هستی تو', 'هویت', 'اسم تو', 'به من بگو کی هستی',
  'what are you', 'who are you', 'introduce yourself',
  'what can you do', 'tell me about yourself',
];

const FULL_BUILD_TABLE = [
  'سیستم کامل', 'اسمبل کامل', 'یک سیستم', 'یه سیستم',
  'system build', 'full build', 'پیشنهاد سیستم', 'سیستم بخرم',
  'سیستم گیمینگ', 'سیستم اداری', 'سیستم رندر', 'سیستم استریم',
  'اسمبل کن', 'برام اسمبل کن', 'سیستم ببند',
];

const ORDER_SUPPORT_TABLE = [
  'سفارش', 'پیگیری', 'ارسال', 'پست', 'تیپاکس',
  'فاکتور', 'خریدم', 'سبد خرید', 'order', 'tracking',
  'وضعیت سفارش', 'کد پیگیری', 'مژده',
];

const SITE_HELP_TABLE = [
  'راهنما', 'چطور از', 'چگونه', 'آموزش', 'help',
  'چطوری ثبت سفارش', 'نحوه خرید',
];

const OFF_TOPIC_TABLE = [
  'آب و هوا', 'سیاسی', 'فوتبال', 'فیلم و سریال',
  'دستور غذا', 'طرز تهیه', 'شعر', 'داستان',
];

// ─── Category Synonym Map ────────────────────────────────────────

export const CATEGORY_SYNONYMS: Record<string, string[]> = {
  // Short Ryzen labels such as "r5" are deliberately excluded: they are substrings of DDR5.
  // "ryzen"/"رایزن" still classify all normal Ryzen product queries as CPU.
  cpu: ['پردازنده', 'سی پی یو', 'cpu', 'اینتل', 'intel', 'رایزن', 'ryzen', 'core', 'i3', 'i5', 'i7', 'i9', 'core ultra'],
  gpu: ['کارت گرافیک', 'gpu', 'گرافیک', 'rtx', 'rx', 'geforce', 'radeon', 'vram', 'graphics'],
  ram: ['رم', 'ram', 'ddr4', 'ddr5', 'حافظه رم', 'memory'],
  motherboard: ['مادربرد', 'motherboard', 'mainboard', 'بورد', 'b650', 'b760', 'h610', 'z790', 'x670'],
  ssd: ['ssd', 'nvme', 'm.2', 'حافظه', 'اس اس دی', 'هارد', 'hdd', 'storage'],
  psu: ['پاور', 'psu', 'منبع تغذیه', 'power supply', 'وات', 'watt'],
  case: ['کیس', 'case', 'mid tower', 'full tower', 'mini tower'],
  cooler: ['خنک کننده', 'خنک‌کننده', 'cooler', 'هواخنک', 'آب‌خنک', 'aio', 'فن پردازنده'],
  monitor: ['مانیتور', 'monitor', 'صفحه نمایش'],
};

// Words indicating purchase intent
const PURCHASE_INTENT_TABLE = [
  'موجود', 'قیمت', 'چنده', 'بخرم', 'میخوام', 'می‌خوام',
  'معرفی کن', 'نشونم بده', 'نشونم بده', 'دارید', 'لینک', 'محصول',
  'product', 'مقایسه', 'ارزون', 'ارزان', 'بهترین', 'پیشنهاد',
  'کدوم رو', 'کدومو',
];

// Technical question indicators
const TECHNICAL_TABLE = [
  'تفاوت', 'فرق', 'difference', 'vs', 'سازگار', 'compatibility',
  'سوکت', 'socket', 'tdp', 'pcie', 'sata', 'بنچمارک', 'benchmark',
  'چطور', 'چگونه', 'how', 'why', 'چرا', 'آیا',
];

// Negation: user explicitly says "don't show products"
const NEGATION_TABLE = [
  'معرفی نکن', 'پیشنهاد نده', 'نشان نده', 'نشون نده',
  'نمی‌خوام', 'نمیخوام', 'نیاز ندارم', 'بدون محصول',
  'قیمت نمیخوام', 'نخریدم', 'کالا نمیخوام', 'محصول نمیخوام',
  'don\'t show', 'don\'t recommend',
];

// ─── Classifier ──────────────────────────────────────────────────

export function classifyIntent(query: string): IntentResult {
  const q = query.toLowerCase().trim().replace(/\s+/g, ' ');
  const qNormalized = q.replace(/ي/g, 'ی').replace(/ك/g, 'ک'); // Arabic→Persian normalization

  // ─── 1. Check negation first ─────────────────────────────
  const hasNegation = NEGATION_TABLE.some(w => qNormalized.includes(w));

  // ─── 2. Greeting ─────────────────────────────────────────
  if (GREETING_TABLE.some(w => qNormalized.includes(w)) && q.length < 40) {
    return { intent: 'greeting', needsRag: false, showCards: false, redirectToAssembly: false, categoryHint: null };
  }

  // ─── 3. Identity ─────────────────────────────────────────
  if (IDENTITY_TABLE.some(w => qNormalized.includes(w))) {
    return { intent: 'identity', needsRag: false, showCards: false, redirectToAssembly: false, categoryHint: null };
  }

  // ─── 4. Off-topic ────────────────────────────────────────
  if (OFF_TOPIC_TABLE.some(w => qNormalized.includes(w))) {
    return { intent: 'off_topic', needsRag: false, showCards: false, redirectToAssembly: false, categoryHint: null };
  }

  // ─── 5. Full build → redirect ────────────────────────────
  if (FULL_BUILD_TABLE.some(w => qNormalized.includes(w))) {
    return { intent: 'full_build', needsRag: false, showCards: false, redirectToAssembly: true, categoryHint: null };
  }

  // ─── 6. Order support ────────────────────────────────────
  if (ORDER_SUPPORT_TABLE.some(w => qNormalized.includes(w))) {
    return { intent: 'order_support', needsRag: false, showCards: false, redirectToAssembly: false, categoryHint: null };
  }

  // ─── 7. Site help ────────────────────────────────────────
  if (SITE_HELP_TABLE.some(w => qNormalized.includes(w))) {
    return { intent: 'site_help', needsRag: false, showCards: false, redirectToAssembly: false, categoryHint: null };
  }

  // ─── 8. Detect category ──────────────────────────────────
  let categoryHint: string | null = null;
  for (const [cat, words] of Object.entries(CATEGORY_SYNONYMS)) {
    if (words.some(w => qNormalized.includes(w))) {
      categoryHint = cat;
      break;
    }
  }

  // ─── 9. Negation + anything → NO RAG ─────────────────────
  if (hasNegation) {
    // Even if technical or product words exist, negation wins → no RAG
    return { intent: 'technical_question', needsRag: false, showCards: false, redirectToAssembly: false, categoryHint };
  }

  // ─── 10. Price/stock ─────────────────────────────────────
  if (/قیمت|چنده|موجودی|موجوده|stock|price/i.test(qNormalized)) {
    return { intent: 'price_or_stock', needsRag: true, showCards: true, redirectToAssembly: false, categoryHint };
  }

  // ─── 11. Compare ─────────────────────────────────────────
  if (/مقایسه|vs|تفاوت\s+.*\s+با|فرق/i.test(qNormalized)) {
    const hasPurchase = PURCHASE_INTENT_TABLE.some(w => qNormalized.includes(w));
    if (hasPurchase) {
      return { intent: 'product_compare', needsRag: true, showCards: true, redirectToAssembly: false, categoryHint };
    }
    return { intent: 'technical_question', needsRag: false, showCards: false, redirectToAssembly: false, categoryHint };
  }

  // ─── 12. Product search (purchase intent + category) ─────
  const hasPurchaseIntent = PURCHASE_INTENT_TABLE.some(w => qNormalized.includes(w));
  const hasTechnical = TECHNICAL_TABLE.some(w => qNormalized.includes(w));

  if (hasPurchaseIntent && categoryHint) {
    return { intent: 'product_search', needsRag: true, showCards: true, redirectToAssembly: false, categoryHint };
  }

  // ─── 13. Technical question (no purchase intent) ─────────
  if (hasTechnical && !hasPurchaseIntent) {
    return { intent: 'technical_question', needsRag: false, showCards: false, redirectToAssembly: false, categoryHint };
  }

  // ─── 14. Product search (general) ────────────────────────
  if (hasPurchaseIntent) {
    return { intent: 'product_search', needsRag: true, showCards: true, redirectToAssembly: false, categoryHint };
  }

  // ─── 15. Technical with category ─────────────────────────
  if (categoryHint && hasTechnical) {
    return { intent: 'technical_question', needsRag: false, showCards: false, redirectToAssembly: false, categoryHint };
  }

  // ─── 16. Unknown ─────────────────────────────────────────
  return { intent: 'unknown', needsRag: false, showCards: false, redirectToAssembly: false, categoryHint };
}

export const ASSEMBLY_REDIRECT_MESSAGE = 'برای ساخت سیستم کامل، بهتره از ابزار «اسمبل هوشمند» استفاده کنید. اونجا با توجه به بودجه و کاربری شما، قطعات سازگار و بهینه رو خودش انتخاب می‌کنه. از منوی سایت به بخش «اسمبل آنلاین» برید! 🔧';
