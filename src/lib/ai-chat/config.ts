/**
 * config.ts — تنظیمات سمت سرور دستیار هوشمند آفلند
 * ──────────────────────────────────────────────────────────────────
 * طراحی برای حداکثر سادگی:
 *   کافی است فقط دو چیز را در .env.local بدهی:
 *     AI_CHAT_PROVIDER = groq        ← فقط یک سرویس انتخاب کن
 *     AI_CHAT_API_KEY  = توکنِ همان سرویس
 *   و تمام! آدرس API و مدل پیش‌فرض به‌صورت خودکار از روی همان سرویس
 *   انتخاب می‌شوند (از کاتالوگ providers.ts).
 *
 * همهٔ کلیدها فقط روی سرور خوانده می‌شوند (بدون NEXT_PUBLIC) تا توکن
 * هیچ‌وقت به مرورگر فاش نشود.
 *
 * تنظیمات اختیاری (اگر بخواهی override کنی):
 *   AI_CHAT_MODEL          = نام مدل خاص (پیش‌فرض = مدل پیش‌فرضِ سرویس)
 *   AI_CHAT_API_BASE       = آدرس API دستی (پیش‌فرض = از روی سرویس)
 *   AI_CHAT_ENABLED        = 1 | 0
 *   AI_CHAT_TEMPERATURE    = دمای پاسخ (پیش‌فرض 0.4)
 *   AI_CHAT_MAX_TOKENS     = حداکثر توکن پاسخ (پیش‌فرض 800)
 *   AI_CHAT_SYSTEM_PROMPT  = پرامپت سیستمی سفارشی
 *   AI_CHAT_ENABLE_RAG     = 1 | 0  (جستجو در محصولات آفلند)
 *   AI_CHAT_RAG_COUNT      = تعداد محصول در بافت (پیش‌فرض 6)
 * ──────────────────────────────────────────────────────────────────
 */

import { findProvider, DEFAULT_PROVIDER_ID, type AiProvider } from './providers';

const DEFAULT_SYSTEM_PROMPT = [
  'تو «دستیار هوشمند آفلند» هستی؛ یک کارشناس فروش و مشاور خرید حرفه‌ای، باهوش و باانرژی برای فروشگاه اینترنتی آفلند (offl.ir) با شعار «سرزمینِ تخفیف».',
  '',
  '🏪 آفلند چه می‌فروشد؟ قطعات و سخت‌افزار کامپیوتر و کالای دیجیتال، شاملِ:',
  'مادربرد، کارت گرافیک (GPU)، پردازنده (CPU)، رم، حافظهٔ SSD/HDD، پاور (منبع تغذیه)، کیس، خنک‌کننده و فن (هواخنک/آب‌خنک)، مودم و روتر، گوشی موبایل، لپ‌تاپ، ساعت هوشمند، هندزفری، کنسول بازی و لوازم جانبی گیمینگ. برندِ اختصاصی فروشگاه «اوست (Aurest)» است.',
  '',
  '🎯 ماموریت تو:',
  '۱) کمک به کاربر برای انتخاب دقیق‌ترین قطعه/کالا متناسب با نیاز، کاربری (گیمینگ، اداری، رندر، ماینینگ و...) و بودجه.',
  '۲) مشاورهٔ فنی و سازگاری قطعات (سازگاری سوکت CPU با مادربرد، توان کافی پاور، نوع رم DDR4/DDR5).',
  '۳) پاسخ به سؤال قیمت، موجودی، تخفیف، ضمانت، ارسال و راهنمای خرید.',
  '',
  '🧠 نحوهٔ رفتار:',
  '- فارسیِ روان، صمیمی و حرفه‌ای؛ مثل یک فروشندهٔ خبرهٔ کامپیوتر که عاشق سخت‌افزار است.',
  '- کوتاه، دقیق و کاربردی؛ از لیست و ایموجی‌های مرتبط (🖥️⚡🎮💾) به‌اندازه استفاده کن.',
  '- وقتی محصولی پیشنهاد می‌دهی: نام کامل، قیمت دقیق و یک دلیل فنیِ کوتاه بگو و کاربر را به دیدن کارت محصول دعوت کن.',
  '- اگر بودجه/کاربری مشخص نیست، یک سؤال کوتاه بپرس (مثلاً: بودجه‌ات چنده؟ بیشتر گیمینگه یا کار اداری؟).',
  '- اگر کاربر دنبال «سیستم کامل» است، قطعات سازگار را کنار هم پیشنهاد بده و به سازگاری اشاره کن.',
  '',
  '🔒 قوانین مهم (هرگز نقض نکن):',
  '- فقط بر اساس «اطلاعات محصولات» که در اختیارت قرار می‌گیرد دربارهٔ قیمت/موجودی پاسخ بده. هیچ‌وقت قیمت یا موجودی از خودت نساز.',
  '- اگر محصولِ منطبق با خواسته در داده‌ها نبود، صادقانه بگو و نزدیک‌ترین گزینه‌های موجود را پیشنهاد بده.',
  '- لینک محصول را دقیقاً همان‌طور که در داده‌ها آمده استفاده کن؛ لینک نساز.',
  '- به سؤالات کاملاً نامرتبط (سیاسی، پزشکی و…) مودبانه بگو که فقط دستیار خرید آفلند هستی.',
  '- قیمت‌ها را همیشه با جداکنندهٔ هزارگان و واحد «تومان» بیان کن.',
  '',
  '🔘 دکمه‌های پیشنهادی: در پایان پاسخ، اگر مفید بود، ۲ تا ۴ اقدام بعدیِ مرتبط را در یک خطِ جدا با این قالب دقیق بده:',
  '[[دکمه‌ها: متن ۱ | متن ۲ | متن ۳]]',
  'دکمه‌ها باید کوتاه و کاملاً مرتبط با گفتگو باشند (مثلاً: «ارزان‌ترها» | «گیمینگ» | «مقایسه کن»). اگر دکمهٔ مناسبی نبود، این خط را نگذار.',
].join('\n');

export type AiChatConfig = {
  enabled: boolean;
  providerId: string;
  providerName: string;
  apiKey: string;
  apiBase: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  enableRag: boolean;
  ragCount: number;
  /** آدرس کامل پروکسی (مثل socks5://user:pass@host:port) یا '' اگر غیرفعال */
  proxyUrl: string;
  /** آیا از پروکسی برای ارتباط با سرویس AI استفاده شود؟ */
  useProxy: boolean;
};

/**
 * ساخت آدرس پروکسی از متغیرهای محیطی.
 * یا AI_CHAT_PROXY_URL کامل، یا اجزای جداگانه (scheme/host/port/user/pass).
 */
function buildProxyUrl(): string {
  const full = (process.env.AI_CHAT_PROXY_URL || '').trim();
  if (full) return full;

  const scheme = (process.env.AI_CHAT_PROXY_SCHEME || 'socks5').trim();
  const host = (process.env.AI_CHAT_PROXY_HOST || '').trim();
  const port = (process.env.AI_CHAT_PROXY_PORT || '').trim();
  if (!host || !port) return '';

  const user = (process.env.AI_CHAT_PROXY_USERNAME || '').trim();
  const pass = (process.env.AI_CHAT_PROXY_PASSWORD || '').trim();
  const auth = user ? `${encodeURIComponent(user)}:${encodeURIComponent(pass)}@` : '';
  return `${scheme}://${auth}${host}:${port}`;
}

function bool(v: string | undefined, def: boolean): boolean {
  if (v === undefined || v === '') return def;
  return v === '1' || v.toLowerCase() === 'true';
}

function num(v: string | undefined, def: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

/**
 * تنظیمات کامل دستیار را از env می‌خواند (فقط سمت سرور).
 * منطق هوشمند: فقط با provider + key همه‌چیز خودکار ست می‌شود.
 */
export function getAiChatConfig(): AiChatConfig {
  const providerId = (process.env.AI_CHAT_PROVIDER || DEFAULT_PROVIDER_ID).trim().toLowerCase();
  const provider: AiProvider | undefined = findProvider(providerId);

  // آدرس API: اگر دستی داده شده همان، وگرنه از روی سرویس
  const apiBase = (
    (process.env.AI_CHAT_API_BASE || '').trim() ||
    provider?.apiBase ||
    'https://api.openai.com/v1'
  ).replace(/\/+$/, '');

  // مدل: اگر دستی داده شده همان، وگرنه مدل پیش‌فرضِ سرویس
  const model =
    (process.env.AI_CHAT_MODEL || '').trim() || provider?.defaultModel || 'gpt-4o-mini';

  return {
    enabled: bool(process.env.AI_CHAT_ENABLED, true),
    providerId,
    providerName: provider?.name || providerId,
    // اولویت با کلید سروری است؛ اگر کاربر اشتباهاً NEXT_PUBLIC گذاشته باشد هم برای جلوگیری از fallback خوانده می‌شود.
    apiKey: (process.env.AI_CHAT_API_KEY || process.env.NEXT_PUBLIC_AI_CHAT_API_KEY || '').trim(),
    apiBase,
    model,
    temperature: num(process.env.AI_CHAT_TEMPERATURE, 0.4),
    maxTokens: num(process.env.AI_CHAT_MAX_TOKENS, 800),
    systemPrompt: (process.env.AI_CHAT_SYSTEM_PROMPT || '').trim() || DEFAULT_SYSTEM_PROMPT,
    enableRag: bool(process.env.AI_CHAT_ENABLE_RAG, true),
    ragCount: Math.max(1, Math.min(12, num(process.env.AI_CHAT_RAG_COUNT, 8))),
    proxyUrl: buildProxyUrl(),
    useProxy: bool(process.env.AI_CHAT_USE_PROXY, false),
  };
}

/** فقط برای کلاینت: آیا ویجت روشن است؟ (از طریق NEXT_PUBLIC) */
export function isAiChatPublicEnabled(): boolean {
  const v = process.env.NEXT_PUBLIC_AI_CHAT_ENABLED;
  if (v === undefined || v === '') return true;
  return v === '1' || v.toLowerCase() === 'true';
}
