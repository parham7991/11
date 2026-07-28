'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import './ai-chat.css';
import type { ChatMessage, ChatSource } from '@/lib/ai-chat/types';

/**
 * AiChatWidget — ویجت شناور دستیار هوشمند آفلند
 * ──────────────────────────────────────────────────────────────────
 * - دکمهٔ شناور + پنجرهٔ چت با RTL کامل و سازگار با دارک‌مود
 * - ذخیرهٔ تاریخچه در localStorage + دکمهٔ «گفتگوی جدید»
 * - سؤال‌های پیشنهادی، نشانگر تایپینگ، کارت محصولات (منابع)
 * - تمام تماس‌ها به /api/ai-chat (سمت سرور، کلید امن)
 * ──────────────────────────────────────────────────────────────────
 */

type DisplayMessage = ChatMessage & { sources?: ChatSource[]; actions?: string[] };

/**
 * استخراج دکمه‌های پویا از متن پاسخ.
 * مدل در پایان پاسخ خطی مثل «[[دکمه‌ها: الف | ب | ج]]» می‌گذارد.
 * این تابع آن خط را از متن جدا کرده و دکمه‌ها را برمی‌گرداند.
 */
function extractActions(text: string): { clean: string; actions: string[] } {
  const re = /\[\[\s*دکمه‌ها\s*[:：]\s*([^\]]+?)\s*\]\]/;
  const m = text.match(re);
  if (!m) return { clean: text, actions: [] };
  const actions = m[1]
    .split('|')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length <= 30)
    .slice(0, 4);
  const clean = text.replace(re, '').trim();
  return { clean, actions };
}

type Props = {
  title?: string;
  welcome?: string;
  position?: 'left' | 'right';
  primaryColor?: string;
  suggestions?: string[];
};

const STORAGE_KEY = 'offl-ai-chat-history';

const DEFAULT_SUGGESTIONS = [
  'یه سیستم گیمینگ تا ۳۰ میلیون می‌خوام 🎮',
  'بهترین کارت گرافیک موجود چیه؟',
  'مادربرد سازگار با Ryzen دارید؟',
  'ارزان‌ترین کیس‌ها رو نشونم بده',
];

export default function AiChatWidget({
  title = 'دستیار هوشمند آفلند',
  welcome = 'سلام! 👋 من دستیار هوشمند آفلندم 🖥️ دنبال قطعه یا سیستمی هستی؟ بگو بودجه و کاربریت چیه تا بهترین گزینه‌ها رو برات پیدا کنم ⚡',
  position = 'left',
  primaryColor,
  suggestions = DEFAULT_SUGGESTIONS,
}: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false); // نشانگر «در حال نوشتن» (تا اولین delta)
  const [busy, setBusy] = useState(false); // کل مدت ارسال (شامل استریم) — جلوگیری از ارسال هم‌زمان
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState<number | null>(null); // index of copied message

  const bodyRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastUserMsgRef = useRef<string>(''); // for retry

  // بارگذاری تاریخچه از localStorage
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as DisplayMessage[];
        if (Array.isArray(parsed) && parsed.length) {
          setMessages(parsed);
          return;
        }
      }
    } catch {}
    setMessages([{ role: 'assistant', content: welcome }]);
  }, [welcome]);

  // باز شدن چت از دکمهٔ منوی پایین (موبایل) — از طریق رویداد سفارشی
  useEffect(() => {
    const openFromMenu = () => setOpen(true);
    window.addEventListener('offl-open-chat', openFromMenu);
    return () => window.removeEventListener('offl-open-chat', openFromMenu);
  }, []);

  // ذخیرهٔ تاریخچه
  useEffect(() => {
    if (!mounted || messages.length === 0) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {}
  }, [messages, mounted]);

  // اسکرول به پایین هنگام پیام جدید
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, loading, open]);

  // ارتفاع خودکار textarea
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 110) + 'px';
  }, []);

  // به‌روزرسانی پیام ربات در یک ایندکس مشخص (برای استریم زنده)
  const updateBot = useCallback((index: number, patch: Partial<DisplayMessage>) => {
    setMessages((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      const copy = [...prev];
      copy[index] = { ...copy[index], ...patch };
      return copy;
    });
  }, []);

  const stopGeneration = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setLoading(false);
    setBusy(false);
  }, []);

  const copyMessage = useCallback((text: string, idx: number) => {
    if (!text) return;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(idx);
        setTimeout(() => setCopied(null), 2000);
      })
      .catch(() => {
        /* clipboard not available */
      });
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;

      lastUserMsgRef.current = trimmed;

      const userMsg: DisplayMessage = { role: 'user', content: trimmed };
      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setInput('');
      setBusy(true);
      setLoading(true);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';

      // فقط user/assistant را به‌عنوان history می‌فرستیم
      const history: ChatMessage[] = nextMessages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, content: m.content }));

      // یک پیام assistant خالی اضافه می‌کنیم تا متن به‌صورت زنده در آن تایپ شود
      const botIndex = nextMessages.length;
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      // AbortController for stop generation
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch('/api/ai-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: trimmed, history: history.slice(0, -1) }),
          signal: controller.signal,
        });

        // اگر پاسخ استریم نباشد (خطای JSON)، آن را به‌صورت معمولی هندل می‌کن
        const contentType = res.headers.get('content-type') || '';
        if (!res.ok || contentType.includes('application/json')) {
          const data = await res.json().catch(() => null);
          updateBot(botIndex, {
            content: data?.error || 'متأسفانه خطایی رخ داد. دوباره تلاش کنید.',
          });
          return;
        }

        // خواندن استریم NDJSON
        const reader = res.body?.getReader();
        if (!reader) {
          updateBot(botIndex, {
            content:
              'در حال حاضر امکان پاسخ‌گویی وجود ندارد. لطفاً دوباره تلاش کنید یا مستقیماً از محصولات سایت بازدید کنید.',
          });
          return;
        }
        const decoder = new TextDecoder();
        let buffer = '';
        let acc = '';

        // اولین delta که رسید، حالت loading را خاموش می‌کنیم
        setLoading(false);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (controller.signal.aborted) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            const t = line.trim();
            if (!t) continue;
            let evt: { type?: string; text?: string; sources?: ChatSource[]; error?: string };
            try {
              evt = JSON.parse(t);
            } catch {
              continue;
            }
            if (evt.type === 'sources' && Array.isArray(evt.sources)) {
              updateBot(botIndex, { sources: evt.sources.slice(0, 4) });
            } else if (evt.type === 'delta' && evt.text) {
              acc += evt.text;
              // هنگام تایپ زنده، خطِ دکمه‌ها را پنهان نگه می‌داریم تا کاربر کد خام نبیند
              const live = acc.includes('[[')
                ? acc.replace(/\[\[[^\]]*\]?\]?$/, '').trimEnd()
                : acc;
              updateBot(botIndex, { content: live });
            } else if (evt.type === 'error') {
              updateBot(botIndex, {
                content: acc || evt.error || 'خطا در دریافت پاسخ.',
              });
            }
          }
        }

        if (controller.signal.aborted && acc) {
          // User stopped — keep what we have
          const { clean, actions } = extractActions(acc);
          updateBot(botIndex, { content: clean, actions });
        } else if (!acc) {
          updateBot(botIndex, {
            content:
              'در حال حاضر امکان پاسخ‌گویی وجود ندارد. لطفاً دوباره تلاش کنید یا مستقیماً از محصولات سایت بازدید کنید.',
          });
        } else {
          // در پایان: متن را تمیز کن و دکمه‌های پویا را استخراج کن
          const { clean, actions } = extractActions(acc);
          updateBot(botIndex, { content: clean, actions });
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        updateBot(botIndex, {
          content: 'خطا در ارتباط با سرور. اتصال اینترنت را بررسی کنید.',
        });
      } finally {
        abortRef.current = null;
        setLoading(false);
        setBusy(false);
      }
    },
    [messages, busy, updateBot]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const newConversation = () => {
    setMessages([{ role: 'assistant', content: welcome }]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  // تبدیل لینک‌های متن به <a> (و markdown ساده [text](url))
  const renderContent = (text: string) => {
    const nodes: React.ReactNode[] = [];
    const mdLink = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    const rawUrl = /(https?:\/\/[^\s)]+)/g;

    // ابتدا markdown links
    let lastIndex = 0;
    let key = 0;
    let m: RegExpExecArray | null;
    const tmp = text;
    while ((m = mdLink.exec(tmp)) !== null) {
      if (m.index > lastIndex) nodes.push(tmp.slice(lastIndex, m.index));
      nodes.push(
        <a key={`l${key++}`} href={m[2]} target="_blank" rel="noopener noreferrer">
          {m[1]}
        </a>
      );
      lastIndex = m.index + m[0].length;
    }
    let rest = tmp.slice(lastIndex);
    // سپس لینک‌های خام در باقیمانده
    const restNodes: React.ReactNode[] = [];
    let li = 0;
    let rm: RegExpExecArray | null;
    while ((rm = rawUrl.exec(rest)) !== null) {
      if (rm.index > li) restNodes.push(rest.slice(li, rm.index));
      restNodes.push(
        <a key={`r${key++}`} href={rm[1]} target="_blank" rel="noopener noreferrer">
          {rm[1]}
        </a>
      );
      li = rm.index + rm[0].length;
    }
    restNodes.push(rest.slice(li));
    return [...nodes, ...restNodes];
  };

  const rootStyle = primaryColor
    ? ({ ['--aic-primary' as string]: primaryColor } as React.CSSProperties)
    : undefined;

  if (!mounted) return null;

  return (
    <div
      className="aic-root"
      data-position={position}
      style={{ ...rootStyle, ['--aic-origin' as string]: position }}
    >
      {open && (
        <div className="aic-window" role="dialog" aria-label={title}>
          {/* هدر */}
          <div className="aic-header">
            <div className="aic-header__avatar" aria-hidden="true">
              <BotIcon />
            </div>
            <div className="aic-header__meta">
              <div className="aic-header__title">{title}</div>
              <div className="aic-header__status">آنلاین</div>
            </div>
            <div className="aic-header__actions">
              <button
                type="button"
                className="aic-iconbtn"
                onClick={newConversation}
                aria-label="گفتگوی جدید"
                title="گفتگوی جدید"
              >
                <RefreshIcon />
              </button>
              <button
                type="button"
                className="aic-iconbtn"
                onClick={() => setOpen(false)}
                aria-label="بستن"
                title="بستن"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* بدنه */}
          <div className="aic-body" ref={bodyRef}>
            {messages.map((msg, idx) => {
              const isBot = msg.role !== 'user';
              const isStreaming = isBot && busy && idx === messages.length - 1;
              return (
                <React.Fragment key={idx}>
                  {/* حباب خالیِ ربات (در حال آماده‌سازی) را نشان نده؛ به‌جایش typing است */}
                  {(msg.role === 'user' || msg.content !== '') && (
                    <div className={`aic-row aic-row--${isBot ? 'bot' : 'user'}`}>
                      {isBot && (
                        <span className="aic-mini-avatar" aria-hidden="true">
                          <BotIcon />
                        </span>
                      )}
                      <div className="aic-bubble">
                        {renderContent(msg.content)}
                        {isStreaming && msg.content !== '' && <span className="aic-cursor" />}
                      </div>
                    </div>
                  )}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="aic-sources">
                      {msg.sources.map((s, si) => (
                        <a
                          key={si}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`aic-card${s.inStock === false ? 'aic-card--out' : ''}`}
                        >
                          {/* تصویر + بج تخفیف */}
                          <span className="aic-card__media">
                            {s.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                className="aic-card__img"
                                src={s.image}
                                alt={s.title}
                                loading="lazy"
                              />
                            ) : (
                              <span className="aic-card__img aic-card__img--ph" aria-hidden="true">
                                <BoxIcon />
                              </span>
                            )}
                            {s.discountPercent ? (
                              <span className="aic-card__badge">{s.discountPercent}٪</span>
                            ) : null}
                            {s.inStock === false && <span className="aic-card__out">ناموجود</span>}
                          </span>

                          {/* اطلاعات */}
                          <span className="aic-card__body">
                            {s.brand && <span className="aic-card__brand">{s.brand}</span>}
                            <span className="aic-card__title">{s.title}</span>

                            {/* امتیاز + گارانتی */}
                            <span className="aic-card__meta">
                              {s.rating ? (
                                <span className="aic-card__rating">
                                  <StarIcon /> {s.rating.toLocaleString('fa-IR')}
                                  {s.reviewCount ? (
                                    <span className="aic-card__reviews">
                                      ({s.reviewCount.toLocaleString('fa-IR')})
                                    </span>
                                  ) : null}
                                </span>
                              ) : null}
                              {s.warranty ? (
                                <span className="aic-card__warranty">
                                  <ShieldIcon /> {s.warranty}
                                </span>
                              ) : null}
                            </span>

                            {/* قیمت */}
                            <span className="aic-card__prices">
                              {s.oldPrice && <span className="aic-card__old">{s.oldPrice}</span>}
                              {s.price ? (
                                <span className="aic-card__price">{s.price}</span>
                              ) : (
                                <span className="aic-card__price aic-card__price--na">
                                  تماس بگیرید
                                </span>
                              )}
                            </span>
                          </span>

                          {/* دکمهٔ مشاهده */}
                          <span className="aic-card__cta" aria-hidden="true">
                            مشاهده
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <path
                                d="M15 19l-7-7 7-7"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        </a>
                      ))}
                    </div>
                  )}
                  {/* دکمه‌های پویا (پیشنهادهای بعدی بر اساس پاسخ) */}
                  {isBot && msg.actions && msg.actions.length > 0 && !isStreaming && (
                    <div className="aic-actions">
                      {msg.actions.map((a, ai) => (
                        <button
                          key={ai}
                          type="button"
                          className="aic-action-btn"
                          onClick={() => sendMessage(a)}
                          disabled={busy}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Copy + Retry buttons on completed assistant messages */}
                  {isBot && !isStreaming && msg.content && msg.role === 'assistant' && idx > 0 && (
                    <div className="aic-msg-actions">
                      <button
                        type="button"
                        className="aic-msg-btn"
                        onClick={() => copyMessage(msg.content, idx)}
                        title="کپی پاسخ"
                        aria-label="کپی"
                      >
                        {copied === idx ? '✓' : <CopyIcon />}
                      </button>
                      {(msg.content.includes('خطا') ||
                        msg.content.includes('دریافت نشد') ||
                        msg.content.includes('قطع شد')) && (
                        <button
                          type="button"
                          className="aic-msg-btn"
                          onClick={() => {
                            if (lastUserMsgRef.current) {
                              // Remove the failed assistant message and retry
                              setMessages((prev) => prev.slice(0, -1));
                              sendMessage(lastUserMsgRef.current);
                            }
                          }}
                          title="تلاش مجدد"
                          aria-label="تلاش مجدد"
                          disabled={busy}
                        >
                          <RefreshIcon />
                        </button>
                      )}
                    </div>
                  )}
                </React.Fragment>
              );
            })}

            {loading && (
              <div className="aic-row aic-row--bot">
                <span className="aic-mini-avatar" aria-hidden="true">
                  <BotIcon />
                </span>
                <div className="aic-typing" aria-label="در حال نوشتن">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
          </div>

          {/* سؤال‌های پیشنهادی (فقط در شروع گفتگو) */}
          {messages.length <= 1 && suggestions.length > 0 && (
            <div className="aic-suggestions">
              {suggestions.map((s, i) => (
                <button key={i} type="button" className="aic-chip" onClick={() => sendMessage(s)}>
                  <span className="aic-chip__dot" aria-hidden="true" />
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* ورودی */}
          <form className="aic-input" onSubmit={handleSubmit}>
            <div className="aic-input__field">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  autoResize();
                }}
                onKeyDown={handleKeyDown}
                placeholder="پیامت رو بنویس…"
                rows={1}
                aria-label="پیام"
                disabled={busy && !loading}
              />
            </div>
            {busy ? (
              <button
                type="button"
                className="aic-stop"
                onClick={stopGeneration}
                aria-label="توقف تولید"
                title="توقف"
              >
                <StopIcon />
              </button>
            ) : (
              <button
                type="submit"
                className="aic-send"
                disabled={!input.trim()}
                aria-label="ارسال"
              >
                <SendIcon />
              </button>
            )}
          </form>

          <div className="aic-footer">
            قدرت‌گرفته از هوش مصنوعی · <b>آفلند</b>
          </div>
        </div>
      )}

      {/* دکمهٔ شناور */}
      <button
        type="button"
        className="aic-fab"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'بستن دستیار' : 'باز کردن دستیار هوشمند'}
      >
        {open ? <CloseIcon /> : <ChatIcon />}
        {!open && <span className="aic-fab__badge" aria-hidden="true" />}
      </button>
    </div>
  );
}

/* ───────────────────────── آیکن‌ها ───────────────────────── */
const BoxIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M21 8l-9-5-9 5v8l9 5 9-5V8z M3 8l9 5 9-5 M12 13v8"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.8 6.1 20.8l1.2-6.6L2.5 9l6.6-.9L12 2z" />
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z M9 12l2 2 4-4"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChatIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="8.5" cy="11.5" r="1.2" fill="currentColor" />
    <circle cx="12" cy="11.5" r="1.2" fill="currentColor" />
    <circle cx="15.5" cy="11.5" r="1.2" fill="currentColor" />
  </svg>
);

const BotIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="4" y="8" width="16" height="11" rx="3" stroke="currentColor" strokeWidth="2" />
    <path
      d="M12 4v4M9 13h.01M15 13h.01"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="12" cy="4" r="1.4" fill="currentColor" />
    <path d="M2 13v2M22 13v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    {/* فلش به سمت چپ (RTL ارسال) */}
    <path
      d="M20 4L4 11l6 2 2 6 8-15z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      fill="none"
    />
    <path d="M10 13l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M3 12a9 9 0 1 1 2.6 6.4M3 18v-4h4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const StopIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
  </svg>
);

const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" width="14" height="14">
    <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
    <path
      d="M5 15V5a2 2 0 0 1 2-2h10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);
