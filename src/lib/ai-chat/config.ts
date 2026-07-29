/**
 * config.ts — تنظیمات سمت سرور دستیار هوشمند آفلند (نسخه بازنویسی شده)
 * ──────────────────────────────────────────────────────────────────
 * اتصال به OmniRouter AI Gateway (سرور 147.45.43.25)
 * ──────────────────────────────────────────────────────────────────
 */

import type { AiProvider, AiChatConfig } from './types';

// ════════════════════════════════════════════════════════════════
// PROVIDERS
// ════════════════════════════════════════════════════════════════

const PROVIDERS: AiProvider[] = [
  {
    id: 'omniroute',
    name: 'OmniRoute Arena Elite',
    apiBase: 'https://api.lonz.ir/v1',
    defaultModel: 'offl-chat-elite',
  },
];

export const DEFAULT_PROVIDER_ID = 'omniroute';

export function findProvider(id: string): AiProvider | undefined {
  return PROVIDERS.find((p) => p.id === id);
}

// ════════════════════════════════════════════════════════════════
// SYSTEM PROMPTS
// ════════════════════════════════════════════════════════════════

const DEFAULT_SYSTEM_PROMPT = [
  'تو «دستیار هوشمند آفلند» هستی؛ یک کارشناس فروش و مشاور خرید حرفه‌ای، باهوش و باانرژی برای فروشگاه اینترنتی آفلند (offl.ir) با شعار «سرزمینِ تخفیف».',
  '',
  '🏪 آفلند چه می‌فروشد؟ قطعات و سخت‌افزار کامپیوتر و کالای دیجیتال.',
  '',
  '🎯 ماموریت تو:',
  '۱) کمک به کاربر برای انتخاب دقیق‌ترین قطعه متناسب با نیاز و بودجه.',
  '۲) مشاورهٔ فنی سازگاری قطعات.',
  '۳) پاسخ به سؤال قیمت، موجودی، تخفیف، ضمانت و ارسال.',
  '',
  '🔒 قوانین مهم:',
  '- فقط بر اساس اطلاعات محصولات موجود پاسخ بده. هیچ‌وقت قیمت یا موجودی از خودت نساز.',
  '- اگر محصول منطبق نبود، صادقانه بگو.',
  '- لینک محصول را دقیقاً همان‌طور که در داده‌ها آمده استفاده کن.',
  '- قیمت‌ها با جداکنندهٔ هزارگان و واحد «تومان».',
  '- پاسخ عادی حداکثر ۱۲۰ کلمه مگر کاربر توضیح کامل بخواهد.',
  '',
  '🔘 دکمه‌های پیشنهادی: [[دکمه‌ها: متن ۱ | متن ۲ | متن ۳]]',
].join('\n');

// ════════════════════════════════════════════════════════════════
// OMNIROUTE DEFAULTS
// ════════════════════════════════════════════════════════════════

const OMNIROUTE_DEFAULTS = {
  chatModel: 'offl-chat-elite',
  assemblyModel: 'offl-assemble-elite',
  analysisModel: 'offl-chat-elite',
} as const;

// ════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════

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

// ════════════════════════════════════════════════════════════════
// CONFIG BUILDER
// ════════════════════════════════════════════════════════════════

/**
 * تنظیمات کامل دستیار.
 * برای OmniRoute: حتی بدون env، defaults درست انتخاب می‌شوند.
 */
export function getAiChatConfig(): AiChatConfig {
  const providerId = (process.env.AI_CHAT_PROVIDER || DEFAULT_PROVIDER_ID).trim().toLowerCase();
  const provider = findProvider(providerId);
  const isOmniRoute = providerId === 'omniroute';

  const apiBase = (
    (process.env.AI_CHAT_API_BASE || '').trim() ||
    provider?.apiBase ||
    'https://api.lonz.ir/v1'
  ).replace(/\/+$/, '');

  const providerDefault = provider?.defaultModel || 'gpt-4o-mini';

  // Smart defaults: OmniRoute gets specialized models, others get provider default
  const chatDefault = isOmniRoute ? OMNIROUTE_DEFAULTS.chatModel : providerDefault;
  const assemblyDefault = isOmniRoute ? OMNIROUTE_DEFAULTS.assemblyModel : providerDefault;
  const analysisDefault = isOmniRoute ? OMNIROUTE_DEFAULTS.analysisModel : providerDefault;

  const chatModel = str(process.env.AI_CHAT_MODEL, chatDefault);
  const assemblyModel = str(
    process.env.AI_ASSEMBLY_MODEL,
    isOmniRoute ? OMNIROUTE_DEFAULTS.assemblyModel : chatModel
  );
  const analysisModel = str(
    process.env.AI_ANALYSIS_MODEL,
    isOmniRoute ? OMNIROUTE_DEFAULTS.analysisModel : chatModel
  );

  return {
    enabled: bool(process.env.AI_CHAT_ENABLED, true),
    providerId,
    providerName: provider?.name || providerId,
    apiKey: (process.env.AI_CHAT_API_KEY || '').trim(),
    apiBase,
    chatModel,
    assemblyModel,
    analysisModel,
    temperature: num(process.env.AI_CHAT_TEMPERATURE, 0.35),
    maxTokens: num(process.env.AI_CHAT_MAX_TOKENS, 1000),
    systemPrompt: (process.env.AI_CHAT_SYSTEM_PROMPT || '').trim() || DEFAULT_SYSTEM_PROMPT,
    enableRag: bool(process.env.AI_CHAT_ENABLE_RAG, true),
    ragCount: Math.max(1, Math.min(12, num(process.env.AI_CHAT_RAG_COUNT, 10))),
    proxyUrl: buildProxyUrl(),
    useProxy: bool(process.env.AI_CHAT_USE_PROXY, false),
  };
}

// ════════════════════════════════════════════════════════════════
// SANITIZATION
// ════════════════════════════════════════════════════════════════

/**
 * sanitizePrompt — محافظت بدون تخریب سوال کاربر.
 * فقط: length limit + control chars + Unicode NFC + HTML strip.
 */
export function sanitizePrompt(text: string): string {
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/<[^>]*>/g, ' ')
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1000);
}

export function isAiChatPublicEnabled(): boolean {
  const v = process.env.NEXT_PUBLIC_AI_CHAT_ENABLED;
  if (v === undefined || v === '') return true;
  return v === '1' || v.toLowerCase() === 'true';
}

// ════════════════════════════════════════════════════════════════
// RATE LIMITING
// ════════════════════════════════════════════════════════════════

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 15;

const rateMap = new Map<string, { count: number; reset: number }>();

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);

  if (!entry || now > entry.reset) {
    rateMap.set(ip, { count: 1, reset: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) return false;

  entry.count++;
  return true;
}

export function getClientIp(req: { headers: Headers }): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

// ════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════

export const ASSEMBLY_REDIRECT_MESSAGE =
  'برای اسمبل سیستم کامل با قطعات سازگار و بهینه، لطفاً از بخش «اسمبل هوشمند» سایت استفاده کنید. ' +
  'این بخش به شما کمک می‌کند با توجه به بودجه و نیاز خود، بهترین ترکیب قطعات را انتخاب کنید.';

export const OFF_TOPIC_MESSAGE =
  'من فقط دستیار خرید آفلند هستم و می‌تونم در مورد قطعات کامپیوتر، قیمت، موجودی و اسمبل سیستم کمکتون کنم. 😊';

export const ORDER_SUPPORT_MESSAGE =
  'برای پیگیری سفارش، لطفاً به بخش «پروفایل > سفارشات من» مراجعه کنید یا با پشتیبانی آفلند تماس بگیرید.';

export const GREETING_MESSAGE =
  'سلام! من دستیار هوشمند آفلند هستم. برای مشاوره فنی، انتخاب کالای دیجیتال و اسمبل سیستم کنارت هستم.';

export const IDENTITY_MESSAGE =
  'من دستیار هوشمند آفلند، مشاور تخصصی قطعات کامپیوتر و کالای دیجیتال هستم. ' +
  'می‌توانم به سؤال‌های فنی پاسخ بدهم، محصولات موجود را براساس داده واقعی فروشگاه پیدا کنم ' +
  'و برای سیستم کامل شما را به اسمبلر هوشمند هدایت کنم.';
