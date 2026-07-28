/**
 * providers.ts — کاتالوگ سرویس‌های هوش مصنوعی (سازگار با OpenAI)
 * ──────────────────────────────────────────────────────────────────
 * هدف: راحتی کامل کاربر. کافی است یک سرویس را انتخاب کنی و فقط توکن
 * بدهی؛ آدرس API و مدل پیش‌فرض به‌صورت خودکار از همین کاتالوگ انتخاب
 * می‌شوند. اگر مدل خاصی نخواهی، مدل پیش‌فرضِ همان سرویس استفاده می‌شود.
 *
 * این فایل بدون وابستگی به سرور است و هم در سرور و هم در کلاینت
 * (برای نمایش لیست انتخاب) قابل استفاده است.
 * ──────────────────────────────────────────────────────────────────
 */

export type AiProvider = {
  /** شناسهٔ یکتا (همان مقداری که در env می‌گذاری) */
  id: string;
  /** نام نمایشی */
  name: string;
  /** توضیح کوتاه */
  desc: string;
  /** آدرس پایهٔ API (سازگار با OpenAI) */
  apiBase: string;
  /** مدل پیش‌فرض هوشمند (وقتی کاربر مدلی انتخاب نکند) */
  defaultModel: string;
  /** چند مدل پیشنهادی برای انتخاب */
  models: string[];
  /** آیا پلن رایگان/آزمایشی دارد؟ */
  free: boolean;
  /** آیا سرویس ایرانی/داخلی است؟ */
  iranian: boolean;
  /** لینک گرفتن کلید API */
  apiKeyUrl: string;
  /** رنگ برند (برای UI) */
  color: string;
  /** ایموجی/نشان کوتاه */
  emoji: string;
};

/**
 * کاتالوگ کامل سرویس‌ها. ترتیب = ترتیب نمایش در انتخابگر.
 * (سرویس‌های رایگان و ایرانی اول آمده‌اند تا انتخاب راحت‌تر باشد.)
 */
export const AI_PROVIDERS: AiProvider[] = [
  {
    id: 'omniroute',
    name: 'OmniRoute Arena Elite',
    desc: 'Combo پیشرفته آفلند با مدل‌های برتر (offl-ai-elite)',
    apiBase: 'https://api.lonz.ir/v1',
    defaultModel: 'offl-ai-elite',
    models: [
      'offl-ai-elite',
      'lmarena/claude-sonnet-4-6',
      'lmarena/max',
      'lmarena/gemini-3.6-flash',
      'lmarena/grok-4.20-multi-agent-beta-0309',
      'lmarena/claude-haiku-4-5-20251001',
    ],
    free: false,
    iranian: true,
    apiKeyUrl: 'https://lonz.ir',
    color: '#8b5cf6',
    emoji: '🏆',
  },
  {
    id: 'groq',
    name: 'Groq',
    desc: 'بسیار سریع و رایگان (Llama 3.3)',
    apiBase: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'gemma2-9b-it'],
    free: true,
    iranian: false,
    apiKeyUrl: 'https://console.groq.com/keys',
    color: '#f55036',
    emoji: '⚡',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    desc: 'رایگان و قدرتمند (Gemini 2.0 Flash)',
    apiBase: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-2.0-flash',
    models: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
    free: true,
    iranian: false,
    apiKeyUrl: 'https://aistudio.google.com/apikey',
    color: '#4285f4',
    emoji: '✨',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    desc: 'دسترسی به ده‌ها مدل + مدل‌های رایگان',
    apiBase: 'https://openrouter.ai/api/v1',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct:free',
    models: [
      'meta-llama/llama-3.3-70b-instruct:free',
      'google/gemini-2.0-flash-exp:free',
      'deepseek/deepseek-chat',
      'openai/gpt-4o-mini',
    ],
    free: true,
    iranian: false,
    apiKeyUrl: 'https://openrouter.ai/keys',
    color: '#6566f1',
    emoji: '🔀',
  },
  {
    id: 'avalai',
    name: 'AvalAI (آوال‌ای)',
    desc: 'سرویس ایرانی، سازگار با OpenAI',
    apiBase: 'https://api.avalai.ir/v1',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo', 'claude-3-5-sonnet'],
    free: false,
    iranian: true,
    apiKeyUrl: 'https://avalai.ir',
    color: '#0a8c5c',
    emoji: '🇮🇷',
  },
  {
    id: 'liara',
    name: 'Liara AI (لیارا)',
    desc: 'سرویس ابری ایرانی',
    apiBase: 'https://ai.liara.ir/api/v1',
    defaultModel: 'openai/gpt-4o-mini',
    models: ['openai/gpt-4o-mini', 'openai/gpt-4o', 'google/gemini-1.5-flash'],
    free: false,
    iranian: true,
    apiKeyUrl: 'https://liara.ir/ai',
    color: '#00ab8e',
    emoji: '🇮🇷',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    desc: 'رسمی (GPT-4o، GPT-4o-mini)',
    apiBase: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-3.5-turbo'],
    free: false,
    iranian: false,
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    color: '#10a37f',
    emoji: '🤖',
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    desc: 'مدل‌های اروپایی سریع',
    apiBase: 'https://api.mistral.ai/v1',
    defaultModel: 'mistral-small-latest',
    models: ['mistral-small-latest', 'mistral-large-latest', 'open-mistral-nemo'],
    free: true,
    iranian: false,
    apiKeyUrl: 'https://console.mistral.ai/api-keys',
    color: '#fa520f',
    emoji: '🌬️',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    desc: 'ارزان و قدرتمند',
    apiBase: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    free: false,
    iranian: false,
    apiKeyUrl: 'https://platform.deepseek.com/api_keys',
    color: '#4d6bfe',
    emoji: '🐋',
  },
  {
    id: 'together',
    name: 'Together AI',
    desc: 'مدل‌های متن‌باز متنوع',
    apiBase: 'https://api.together.xyz/v1',
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    models: [
      'meta-llama/Llama-3.3-70B-Instruct-Turbo',
      'mistralai/Mixtral-8x7B-Instruct-v0.1',
    ],
    free: false,
    iranian: false,
    apiKeyUrl: 'https://api.together.xyz/settings/api-keys',
    color: '#0f6fff',
    emoji: '🧩',
  },
  {
    id: 'cerebras',
    name: 'Cerebras',
    desc: 'فوق‌سریع و رایگان',
    apiBase: 'https://api.cerebras.ai/v1',
    defaultModel: 'llama-3.3-70b',
    models: ['llama-3.3-70b', 'llama3.1-8b'],
    free: true,
    iranian: false,
    apiKeyUrl: 'https://cloud.cerebras.ai',
    color: '#f76707',
    emoji: '🚀',
  },
];

/** نگاشت id → provider برای دسترسی سریع */
export const PROVIDER_MAP: Record<string, AiProvider> = AI_PROVIDERS.reduce(
  (acc, p) => {
    acc[p.id] = p;
    return acc;
  },
  {} as Record<string, AiProvider>
);

/** پیدا کردن یک provider با id (بدون حساسیت به بزرگی/کوچکی حروف) */
export function findProvider(id?: string): AiProvider | undefined {
  if (!id) return undefined;
  return PROVIDER_MAP[id.trim().toLowerCase()];
}

/** provider پیش‌فرض اگر چیزی انتخاب نشده باشد */
export const DEFAULT_PROVIDER_ID = 'omniroute';
