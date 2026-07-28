/**
 * config.ts — تنظیمات سمت سرور دستیار هوشمند آفلند
 * ──────────────────────────────────────────────────────────────────
 * مدل‌ها:
 *   AI_CHAT_MODEL      = offl-chat-elite (چت آنلاین)
 *   AI_ASSEMBLY_MODEL  = offl-assemble-elite (اسمبل هوشمند)
 *   AI_ANALYSIS_MODEL  = offl-chat-elite (تحلیل نهایی اسمبل)
 *
 * همهٔ کلیدها فقط روی سرور خوانده می‌شوند (بدون NEXT_PUBLIC).
 * ──────────────────────────────────────────────────────────────────
 */

import { findProvider, DEFAULT_PROVIDER_ID, type AiProvider } from './providers';

const DEFAULT_SYSTEM_PROMPT = [
  'تو «دستیار هوشمند آفلند» هستی؛ یک کارشناس فروش و مشاور خرید حرفه‌ای، باهوش و باانرژی برای فروشگاه اینترنتی آفلند (offl.ir) با شعار «سرزمینِ تخفیل».',
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
  '- اگر کاربر دنبال «سیستم کامل» است، قطعات سازگار را کنار هم پیشنهاد بده و به سازگاری اشاره کن. برای سیستم کامل، کاربر را به اسمبل هوشمند هدایت کن.',
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
  /** مدل چت آنلاین (offl-chat-elite) */
  chatModel: string;
  /** مدل اسمبل هوشمند (offl-assemble-elite) */
  assemblyModel: string;
  /** مدل تحلیل نهایی (offl-chat-elite) */
  analysisModel: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  enableRag: boolean;
  ragCount: number;
  proxyUrl: string;
  useProxy: boolean;
};

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

function str(v: string | undefined, def: string): string {
  return (v || '').trim() || def;
}

/**
 * تنظیمات کامل دستیار را از env می‌خواند.
 * مدل‌ها:
 *   AI_CHAT_MODEL → chatModel (default: provider default)
 *   AI_ASSEMBLY_MODEL → assemblyModel (default: chatModel fallback)
 *   AI_ANALYSIS_MODEL → analysisModel (default: chatModel fallback)
 */
export function getAiChatConfig(): AiChatConfig {
  const providerId = (process.env.AI_CHAT_PROVIDER || DEFAULT_PROVIDER_ID).trim().toLowerCase();
  const provider: AiProvider | undefined = findProvider(providerId);

  const apiBase = (
    (process.env.AI_CHAT_API_BASE || '').trim() ||
    provider?.apiBase ||
    'https://api.openai.com/v1'
  ).replace(/\/+$/, '');

  const defaultModel = provider?.defaultModel || 'gpt-4o-mini';

  // مدل چت: از env یا provider default
  const chatModel = str(process.env.AI_CHAT_MODEL, defaultModel);
  // مدل اسمبل: از env یا fallback به chatModel
  const assemblyModel = str(process.env.AI_ASSEMBLY_MODEL, chatModel);
  // مدل تحلیل: از env یا fallback به chatModel
  const analysisModel = str(process.env.AI_ANALYSIS_MODEL, chatModel);

  return {
    enabled: bool(process.env.AI_CHAT_ENABLED, true),
    providerId,
    providerName: provider?.name || providerId,
    apiKey: (process.env.AI_CHAT_API_KEY || '').trim(),
    apiBase,
    chatModel,
    assemblyModel,
    analysisModel,
    temperature: num(process.env.AI_CHAT_TEMPERATURE, 0.4),
    maxTokens: num(process.env.AI_CHAT_MAX_TOKENS, 800),
    systemPrompt: (process.env.AI_CHAT_SYSTEM_PROMPT || '').trim() || DEFAULT_SYSTEM_PROMPT,
    enableRag: bool(process.env.AI_CHAT_ENABLE_RAG, true),
    ragCount: Math.max(1, Math.min(12, num(process.env.AI_CHAT_RAG_COUNT, 10))),
    proxyUrl: buildProxyUrl(),
    useProxy: bool(process.env.AI_CHAT_USE_PROXY, false),
  };
}

/**
 * sanitizePrompt — محافظت بدون تخریب سوال کاربر.
 * فقط محدودیت طول + حذف control characters + Unicode normalization.
 * کلمات کاربر حذف نمی‌شوند — role separation + RAG delimiter محافظت می‌کند.
 */
export function sanitizePrompt(text: string): string {
  return (
    text
      // حذف control characters (به جز whitespace معمول)
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // حذف HTML tags
      .replace(/<[^>]*>/g, ' ')
      // Unicode normalization (NFC)
      .normalize('NFC')
      // trim و collapse whitespace
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 1000)
  );
}

/** فقط برای کلاینت: آیا ویجت روشن است؟ */
export function isAiChatPublicEnabled(): boolean {
  const v = process.env.NEXT_PUBLIC_AI_CHAT_ENABLED;
  if (v === undefined || v === '') return true;
  return v === '1' || v.toLowerCase() === 'true';
}
