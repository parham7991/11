'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface Props {
  content: string;
}

const HEADING_SELECTOR = 'h1, h2, h3';
const GENERATED_HEADING_PREFIX = 'heading-';

const stripHtml = (html: string) =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&zwnj;/g, '‌')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

const getHeaderOffset = () => {
  if (typeof window === 'undefined') return 160;
  return window.innerWidth >= 1024 ? 230 : 120;
};

export default function TableOfContents({ content }: Props) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [readingProgress, setReadingProgress] = useState(0);
  const navRef = useRef<HTMLElement>(null);
  const realHeadingsRef = useRef<HTMLElement[]>([]);

  const parsedHeadings = useMemo<Heading[]>(() => {
    if (!content) return [];

    const extracted: Heading[] = [];
    const headingRegex = /<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi;
    let match: RegExpExecArray | null;

    while ((match = headingRegex.exec(content)) !== null) {
      const text = stripHtml(match[2] || '');
      if (!text) continue;

      extracted.push({
        id: `${GENERATED_HEADING_PREFIX}${extracted.length}`,
        text,
        level: Number.parseInt(match[1], 10),
      });
    }

    return extracted;
  }, [content]);

  useEffect(() => {
    setHeadings(parsedHeadings);
    setActiveId(parsedHeadings[0]?.id || '');
  }, [parsedHeadings]);

  const syncRealHeadings = () => {
    if (typeof document === 'undefined') return [];

    const container = document.querySelector<HTMLElement>('.single-blog-prose') || document.querySelector<HTMLElement>('.container_des');
    if (!container) return [];

    const realHeadings = Array.from(container.querySelectorAll<HTMLElement>(HEADING_SELECTOR));
    if (realHeadings.length === 0) return [];

    realHeadings.forEach((heading) => {
      const currentId = heading.getAttribute('id');
      if (currentId?.startsWith(GENERATED_HEADING_PREFIX)) {
        heading.removeAttribute('id');
      }
    });

    realHeadings.forEach((heading, index) => {
      const id = `${GENERATED_HEADING_PREFIX}${index}`;
      heading.setAttribute('id', id);
      heading.dataset.tocId = id;
      heading.style.scrollMarginTop = `${getHeaderOffset() + 18}px`;
    });

    realHeadingsRef.current = realHeadings;
    return realHeadings;
  };

  useEffect(() => {
    if (parsedHeadings.length === 0) return;

    let isMounted = true;
    const timers: ReturnType<typeof setTimeout>[] = [];


    const updateReadingState = () => {
      if (!isMounted) return;

      const realHeadings = realHeadingsRef.current.length > 0 ? realHeadingsRef.current : syncRealHeadings();

      const offset = getHeaderOffset();
      const currentScroll = window.scrollY + offset + 24;
      let currentId = realHeadings[0]?.id || parsedHeadings[0]?.id || '';

      realHeadings.forEach((heading) => {
        const headingTop = heading.getBoundingClientRect().top + window.scrollY;
        if (headingTop <= currentScroll) {
          currentId = heading.id;
        }
      });

      if (currentId) {
        setActiveId(currentId);
      }

      const article = document.querySelector<HTMLElement>('.single-blog-content-card');
      if (article) {
        const articleTop = article.getBoundingClientRect().top + window.scrollY;
        const articleHeight = Math.max(article.scrollHeight - window.innerHeight + offset, 1);
        const progress = ((window.scrollY + offset - articleTop) / articleHeight) * 100;
        setReadingProgress(Math.min(100, Math.max(0, Math.round(progress))));
      }
    };

    const boot = () => {
      if (syncRealHeadings().length > 0) {
        updateReadingState();
      }
    };

    [50, 200, 500, 900].forEach((delay) => {
      const timer = setTimeout(boot, delay);
      timers.push(timer);
    });

    window.addEventListener('scroll', updateReadingState, { passive: true });
    window.addEventListener('resize', updateReadingState);

    return () => {
      isMounted = false;
      timers.forEach(clearTimeout);
      window.removeEventListener('scroll', updateReadingState);
      window.removeEventListener('resize', updateReadingState);
    };
  }, [parsedHeadings]);

  useEffect(() => {
    if (!activeId || !navRef.current) return;

    const nav = navRef.current;
    const activeButton = nav.querySelector<HTMLButtonElement>(`button[data-heading-id="${activeId}"]`);
    if (!activeButton) return;

    const buttonTop = activeButton.offsetTop;
    const buttonBottom = buttonTop + activeButton.offsetHeight;
    const visibleTop = nav.scrollTop;
    const visibleBottom = visibleTop + nav.clientHeight;

    if (buttonTop < visibleTop || buttonBottom > visibleBottom) {
      nav.scrollTo({
        top: Math.max(0, buttonTop - nav.clientHeight / 2 + activeButton.offsetHeight / 2),
        behavior: 'smooth',
      });
    }
  }, [activeId]);

  const scrollToHeading = (id: string, index: number) => {
    const realHeadings = syncRealHeadings();
    const headingByIndex = realHeadings[index];
    const headingById = document.getElementById(id) || document.querySelector<HTMLElement>(`[data-toc-id="${id}"]`);
    const headingByText = realHeadings.find((heading) => stripHtml(heading.textContent || '') === headings[index]?.text);
    const element = headingByIndex || headingById || headingByText;

    if (!element) return;

    const targetId = element.id || id;
    const targetTop = element.getBoundingClientRect().top + window.scrollY - getHeaderOffset();

    const safeTop = Math.max(0, targetTop);
    window.scrollTo({ top: safeTop, behavior: 'smooth' });

    window.setTimeout(() => {
      const currentElementTop = element.getBoundingClientRect().top + window.scrollY - getHeaderOffset();
      const correctedTop = Math.max(0, currentElementTop);

      if (Math.abs(window.scrollY - correctedTop) > 12) {
        window.scrollTo({ top: correctedTop, behavior: 'auto' });
      }
    }, 450);

    setActiveId(targetId);
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white/85 p-5 text-slate-700 shadow-xl shadow-slate-200/50 backdrop-blur-md transition-all duration-300 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300 dark:shadow-black/30">
      <div className="mb-4 flex items-center gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-md dark:bg-slate-800 dark:text-blue-300">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h7"
            />
          </svg>
        </div>
        <div>
          <p className="text-[11px] font-black text-blue-600 dark:text-blue-400">ON THIS PAGE</p>
          <h3 className="font-black text-[16px] text-slate-950 dark:text-white">فهرست مطالب</h3>
        </div>
      </div>

      <nav ref={navRef} className="max-h-[52vh] space-y-1.5 overflow-y-auto pr-1">
        {headings.map((heading, index) => {
          const isActive = activeId === heading.id;

          return (
            <button
              key={heading.id}
              type="button"
              data-heading-id={heading.id}
              onClick={() => scrollToHeading(heading.id, index)}
              className={`group flex w-full cursor-pointer items-start gap-2 rounded-xl px-3 py-2.5 text-right transition-all duration-200 ${
                heading.level === 2 ? 'pr-6' : heading.level === 3 ? 'pr-10' : ''
              } ${
                isActive
                  ? 'bg-blue-50 text-blue-700 shadow-sm dark:bg-blue-500/10 dark:text-blue-300'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100'
              }`}
            >
              <span className="relative mt-1.5 flex h-3 w-3 flex-shrink-0 items-center justify-center">
                {isActive && <span className="absolute h-3 w-3 animate-ping rounded-full bg-blue-400/40" />}
                <span
                  className={`relative rounded-full transition-all duration-200 ${
                    isActive
                      ? 'h-2.5 w-2.5 bg-gradient-to-l from-blue-500 to-purple-500 shadow-[0_0_14px_rgba(59,130,246,0.65)]'
                      : heading.level === 1
                        ? 'h-2 w-2 bg-slate-300 dark:bg-slate-600'
                        : 'h-1.5 w-1.5 bg-slate-300 dark:bg-slate-700'
                  }`}
                />
              </span>
              <span
                className={`line-clamp-2 text-right transition-all duration-200 ${
                  heading.level === 1
                    ? 'text-[14px] font-bold'
                    : heading.level === 2
                      ? 'text-[13px] font-medium'
                      : 'text-[12px] font-normal'
                } ${isActive ? 'font-black' : 'group-hover:text-blue-600 dark:group-hover:text-blue-300'}`}
              >
                {heading.text}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
        <div className="mb-2 flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
          <span>پیشرفت مطالعه</span>
          <span>{readingProgress.toLocaleString('fa-IR')}٪</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-l from-blue-500 via-purple-500 to-pink-500 transition-all duration-300"
            style={{ width: `${readingProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
