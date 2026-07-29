/**
 * types.ts — تایپ‌های مشترک دستیار هوشمند آفلند (نسخه بازنویسی شده)
 * ──────────────────────────────────────────────────────────────────
 */

// ════════════════════════════════════════════════════════════════
// CHAT TYPES
// ════════════════════════════════════════════════════════════════

/** نقش پیام در گفتگو */
export type ChatRole = 'system' | 'user' | 'assistant';

/** یک پیام در گفتگو */
export type ChatMessage = {
  role: ChatRole;
  content: string;
};

/** منبعی که در پاسخ به آن ارجاع داده شده (کارت محصول غنی) */
export type ChatSource = {
  id: string | number;
  title: string;
  url: string;
  /** قیمت نهایی (با تخفیف) به‌صورت فرمت‌شده */
  price?: string | null;
  /** قیمت اصلی قبل از تخفیف (برای خط‌خوردگی) */
  oldPrice?: string | null;
  /** درصد تخفیف (مثلاً 7) */
  discountPercent?: number | null;
  /** آدرس عکس محصول */
  image?: string | null;
  /** موجود/ناموجود */
  inStock?: boolean;
  /** برند محصول */
  brand?: string | null;
  /** گارانتی */
  warranty?: string | null;
  /** امتیاز میانگین نظرات (۱ تا ۵) */
  rating?: number | null;
  /** تعداد نظرات */
  reviewCount?: number | null;
  /** مشخصات کوتاه */
  specs?: string | null;
};

/** بدنهٔ درخواست کلاینت به API */
export type ChatRequestBody = {
  /** پیام جدید کاربر */
  message: string;
  /** تاریخچهٔ گفتگو (برای حفظ زمینه) — اختیاری */
  history?: ChatMessage[];
  /** دسته‌بندی برای فیلتر (اختیاری) */
  category?: string;
  /** بودجه کاربر (اختیاری) */
  budget?: number;
};

/** انواع intent برای classifying پیام کاربر */
export type ChatIntent =
  | 'greeting'
  | 'identity'
  | 'technical_question'
  | 'product_search'
  | 'full_build'
  | 'order_support'
  | 'off_topic';

/** نتیجه intent classification */
export type IntentResult = {
  intent: ChatIntent;
  needsRag: boolean;
  categoryHint?: string | null;
  confidence: number;
};

/** پاسخ API به کلاینت */
export type ChatResponse = {
  reply: string;
  sources: ChatSource[];
  error?: string;
};

/** NDJSON event types برای streaming */
export type StreamEvent =
  | { type: 'progress'; phase: string; message: string; elapsedMs?: number; [key: string]: unknown }
  | { type: 'delta'; text: string }
  | { type: 'sources'; sources: ChatSource[] }
  | { type: 'meta'; mode: string; model: string; requestId: string; latencyMs: number }
  | { type: 'error'; error: string }
  | { type: 'done' };

// ════════════════════════════════════════════════════════════════
// ASSEMBLY TYPES
// ════════════════════════════════════════════════════════════════

/** دسته‌بندی‌های قطعات */
export type PartCategory =
  | 'cpu'
  | 'motherboard'
  | 'ram'
  | 'gpu'
  | 'storage'
  | 'psu'
  | 'case'
  | 'cooler'
  | 'case_fan'
  | 'case_argb';

/** کاربری سیستم */
export type UseCase = 'gaming' | 'editing' | 'streaming' | 'office' | 'custom';

/** یک قطعه در اسمبل */
export type AssemblyPart = {
  id: number;
  category: PartCategory;
  categoryLabel: string;
  name: string;
  brand?: string;
  price: number;
  finalPrice: number;
  inStock: boolean;
  quantity?: number;
  specs?: Record<string, string | number>;
  shortSpec?: string;
  image?: string;
  url?: string;
  pickReason?: string;
  alternatives?: AssemblyPart[];
  isOptional?: boolean;
  confidence?: number;
};

/** کاندیداهای یک دسته */
export type CategoryCandidates = {
  category: PartCategory;
  categoryLabel: string;
  candidates: AssemblyPart[];
};

/** بدنهٔ درخواست اسمبل */
export type AssembleRequestBody = {
  useCase?: UseCase;
  budget?: number;
  note?: string;
  customDesc?: string;
  includeOptional?: boolean;
  verifyStock?: boolean;
};

/** نتیجه بررسی سازگاری */
export type CompatibilityIssue = {
  severity: 'error' | 'warning' | 'info';
  message: string;
  category: PartCategory | 'budget';
  reason: string;
  solution: string;
};

/** نتیجه نهایی اسمبل */
export type AssembleResponse = {
  ok: boolean;
  partial: boolean;
  useCase: UseCase;
  useCaseLabel: string;
  budget: number;
  parts: AssemblyPart[];
  summary: {
    totalBefore: number;
    totalAfter: number;
    savings: number;
    partCount: number;
    mandatoryCount: number;
    optionalCount: number;
  };
  tier: 'budget' | 'mid' | 'high' | 'enthusiast';
  compatibilityScore: number;
  compatibilityIssues: CompatibilityIssue[];
  compatibilityWarnings: CompatibilityIssue[];
  missingCategories: string[];
  overBudgetBy: number;
  description: string;
  recommendation: string;
  analysis: string;
  ai: {
    requested: boolean;
    planningSucceeded: boolean;
    planningModel: string | null;
    planningLatencyMs: number;
    recoveryUsed: boolean;
    finalAnalysisUsed: boolean;
    finalAnalysisModel: string | null;
    fallbackReason: string | null;
    totalAiCalls: number;
  };
  debug?: {
    totalCandidates: number;
    mandatoryParts: number;
    optionalParts: number;
    selectedCategories: string[];
    compatibilityErrors: number;
    compatibilityWarnings: number;
    stockVerified: boolean;
    resolverApplied: boolean;
    requestId: string;
  };
};

// ════════════════════════════════════════════════════════════════
// AI PROVIDER TYPES
// ════════════════════════════════════════════════════════════════

/** تنظیمات AI provider */
export type AiProvider = {
  id: string;
  name: string;
  apiBase: string;
  defaultModel: string;
};

/** تنظیمات کامل AI chat */
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

/** گزینه‌های AI client */
export type AiClientOptions = {
  apiKey: string;
  apiBase: string;
  model: string;
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
  proxyUrl: string;
  useProxy: boolean;
};

/** متادیتای AI */
export type AiMeta = {
  model: string;
  latencyMs: number;
  tokensUsed?: number;
  mode: 'ai' | 'ai-recovery' | 'deterministic-fallback';
};

// ════════════════════════════════════════════════════════════════
// RAG TYPES
// ════════════════════════════════════════════════════════════════

/** نتیجه RAG */
export type RagResult = {
  context: string;
  sources: ChatSource[];
};

/** محصول خام از API */
export type RawProduct = {
  id?: number | string;
  name?: string;
  title?: string;
  price?: number | string;
  special_price?: number | string;
  is_in_stock?: number;
  url_key?: string;
  slug?: string;
  warranty?: string;
  images?: Array<{
    content?: { title?: string; path?: string; base_image?: number };
    title?: string;
    src?: string;
    url?: string;
    path?: string;
  }>;
  image?: { src?: string; url?: string; title?: string; path?: string };
  brand?: { title?: string; name?: string } | string;
  comment?: Array<{ vote?: number }>;
  comments?: Array<{ vote?: number }>;
  attributes?: Array<{ title?: string; value?: string }>;
};
