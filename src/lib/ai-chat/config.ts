/**
 * config.ts — تنظیمات سمت سرور دستیار هوشمند آفلند
 * ──────────────────────────────────────────────────────────────────
 * مدل‌ها با fallback هوشمند برای OmniRoute:
 *   chatModel      → AI_CHAT_MODEL      → offl-chat-elite
 *   assemblyModel  → AI_ASSEMBLY_MODEL  → offl-assemble-elite
 *   analysisModel  → AI_ANALYSIS_MODEL  → offl-chat-elite
 * ──────────────────────────────────────────────────────────────────
 */

import { findProvider, DEFAULT_PROVIDER_ID, type AiProvider } from './providers';

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
  '',
  '🔘 دکمه‌های پیشنهادی: [[دکمه‌ها: متن ۱ | متن ۲ | متن ۳]]',
].join('\n');

// ─── OmniRoute-specific defaults ─────────────────────────────────
const OMNIROUTE_DEFAULTS = {
  chatModel: 'offl-chat-elite',
  assemblyModel: 'offl-assemble-elite',
  analysisModel: 'offl-chat-elite',
} as const;

export type AiChatConfig = {
  enabled: boolean;
  providerId: string;
  providerName: string;
  apiKey: string;
  apiBase: string;
  chatModel: string;
  assemblyModel: string;
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
 * تنظیمات کامل دستیار.
 * برای OmniRoute: حتی بدون env، defaults درست انتخاب می‌شوند.
 */
export function getAiChatConfig(): AiChatConfig {
  const providerId = (process.env.AI_CHAT_PROVIDER || DEFAULT_PROVIDER_ID).trim().toLowerCase();
  const provider: AiProvider | undefined = findProvider(providerId);
  const isOmniRoute = providerId === 'omniroute';

  const apiBase = ((process.env.AI_CHAT_API_BASE || '').trim() || provider?.apiBase || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const providerDefault = provider?.defaultModel || 'gpt-4o-mini';

  // Smart defaults: OmniRoute gets specialized models, others get provider default
  const chatDefault = isOmniRoute ? OMNIROUTE_DEFAULTS.chatModel : providerDefault;
  const assemblyDefault = isOmniRoute ? OMNIROUTE_DEFAULTS.assemblyModel : chatDefault;
  const analysisDefault = isOmniRoute ? OMNIROUTE_DEFAULTS.analysisModel : chatDefault;

  const chatModel = str(process.env.AI_CHAT_MODEL, chatDefault);
  // assemblyModel: env → OmniRoute default → chatModel fallback
  const assemblyModel = str(process.env.AI_ASSEMBLY_MODEL, isOmniRoute ? OMNIROUTE_DEFAULTS.assemblyModel : chatModel);
  // analysisModel: env → OmniRoute default → chatModel fallback
  const analysisModel = str(process.env.AI_ANALYSIS_MODEL, isOmniRoute ? OMNIROUTE_DEFAULTS.analysisModel : chatModel);

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
