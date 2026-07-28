/**
 * ai-errors.ts — Typed AI errors with sanitized messages
 * ──────────────────────────────────────────────────────────────────
 * Never expose: API keys, raw provider errors, internal prompts, PII.
 * User sees only safe messages. Internal logs see full detail.
 */

import type { AiMeta } from './ai-client';

export enum AiErrorCode {
  EMPTY_RESPONSE = 'EMPTY_RESPONSE',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMITED = 'RATE_LIMITED',
  AUTH_ERROR = 'AUTH_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  SERVER_ERROR = 'SERVER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  ABORTED = 'ABORTED',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  UNKNOWN = 'UNKNOWN',
}

/** User-safe messages (no technical details) */
const SAFE_MESSAGES: Record<AiErrorCode, string> = {
  [AiErrorCode.EMPTY_RESPONSE]: 'پاسخی دریافت نشد. لطفاً دوباره تلاش کنید.',
  [AiErrorCode.TIMEOUT]: 'زمان پاسخ‌گویی به پایان رسید. لطفاً دوباره تلاش کنید.',
  [AiErrorCode.RATE_LIMITED]: 'محدودیت موقت سرویس. لطفاً چند لحظه بعد دوباره تلاش کنید.',
  [AiErrorCode.AUTH_ERROR]: 'مشکل اتصال به سرویس. لطفاً بعداً تلاش کنید.',
  [AiErrorCode.NOT_FOUND]: 'سرویس در دسترس نیست.',
  [AiErrorCode.SERVER_ERROR]: 'خطای داخلی سرویس. لطفاً بعداً تلاش کنید.',
  [AiErrorCode.NETWORK_ERROR]: 'خطای شبکه. اتصال اینترنت را بررسی کنید.',
  [AiErrorCode.ABORTED]: 'درخواست لغو شد.',
  [AiErrorCode.INVALID_RESPONSE]: 'پاسخ نامعتبر از سرویس.',
  [AiErrorCode.UNKNOWN]: 'خطای غیرمنتظره. لطفاً دوباره تلاش کنید.',
};

export class AiError extends Error {
  code: AiErrorCode;
  /** Internal detail for server logs only — NEVER send to client */
  detail?: string;
  /** Extra context (retry-after, etc.) */
  context?: Record<string, unknown>;
  /** Meta attached after error is caught */
  meta?: AiMeta;

  constructor(
    code: AiErrorCode,
    detail?: string,
    extra?: { context?: Record<string, unknown>; meta?: AiMeta }
  ) {
    super(SAFE_MESSAGES[code] || 'خطای ناشناخته');
    this.name = 'AiError';
    this.code = code;
    this.detail = detail;
    this.context = extra?.context;
    this.meta = extra?.meta;
  }

  /** Safe message for client (no internal details) */
  get userMessage(): string {
    return this.message;
  }

  /** Internal log string (includes detail but NO secrets) */
  get logMessage(): string {
    return `[${this.code}] ${this.detail || ''}${this.context ? ' ' + JSON.stringify(this.context) : ''}`;
  }
}

/** Create a sanitized error from HTTP status */
export function createSanitizedError(status: number): AiError {
  if (status === 429) return new AiError(AiErrorCode.RATE_LIMITED, `HTTP 429`);
  if (status === 401 || status === 403)
    return new AiError(AiErrorCode.AUTH_ERROR, `HTTP ${status}`);
  if (status === 404) return new AiError(AiErrorCode.NOT_FOUND, `HTTP 404`);
  if (status >= 500) return new AiError(AiErrorCode.SERVER_ERROR, `HTTP ${status}`);
  return new AiError(AiErrorCode.UNKNOWN, `HTTP ${status}`);
}
