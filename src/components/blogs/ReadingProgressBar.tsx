'use client';

import { useEffect, useState } from 'react';

interface Props {
  /** سلکتور عنصر مقاله که پیشرفت مطالعه نسبت به آن حساب می‌شود */
  targetSelector?: string;
}

const getHeaderOffset = () => {
  if (typeof window === 'undefined') return 120;
  return window.innerWidth >= 1024 ? 230 : 120;
};

/**
 * ReadingProgressBar — نوار باریک نئونی در بالای صفحه که میزان پیشرفت
 * خواندنِ مقاله را نشان می‌دهد. روی موبایل هم دیده می‌شود (برخلاف نوارِ داخل ToC).
 */
export default function ReadingProgressBar({
  targetSelector = '.single-blog-content-card',
}: Props) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;

    const compute = () => {
      const article = document.querySelector<HTMLElement>(targetSelector);
      if (!article) {
        setProgress(0);
        return;
      }
      const offset = getHeaderOffset();
      const articleTop = article.getBoundingClientRect().top + window.scrollY;
      const articleHeight = Math.max(article.scrollHeight - window.innerHeight + offset, 1);
      const pct = ((window.scrollY + offset - articleTop) / articleHeight) * 100;
      setProgress(Math.min(100, Math.max(0, pct)));
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(compute);
    };

    // چند بار در ابتدا برای اطمینان از لود کامل محتوا
    const timers = [100, 400, 900].map((d) => setTimeout(compute, d));
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [targetSelector]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-1" aria-hidden>
      <div
        className="h-full origin-right bg-gradient-to-l from-blue-500 via-purple-500 to-pink-500 shadow-[0_0_10px_rgba(139,92,246,0.6)] transition-[width] duration-150 ease-out motion-reduce:transition-none"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
