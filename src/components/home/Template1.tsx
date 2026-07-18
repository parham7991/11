import { getFinalSrc } from '@/lib/fun';
import Link from 'next/link';
import Image from '../common/Image';
import { memo } from 'react';

interface StoryItem {
  link: string;
  title: string;
  image: string;
}

interface Props {
  className?: string;
  story: {
    story: {
      items: StoryItem[];
    };
    title: string;
    template_code: string;
  };
}

const Template1 = memo(({ story, className }: Props) => {
  return (
    <div
      className={`flex items-start justify-start gap-5 overflow-auto pr-5 scrollbar-hide lg:flex-wrap lg:items-center lg:justify-center lg:gap-10 lg:pr-0 ${className}`}
    >
      {story?.story?.items?.map((item, idx) => (
        <Link
          target="_blank"
          rel="follow"
          prefetch={false}
          key={`${item.link}-${idx}`}
          href={item.link}
          className="group flex !w-fit cursor-pointer flex-col items-center justify-center rounded-lg py-3"
        >
          <span className="relative flex h-[80px] w-[80px] items-center justify-center rounded-full lg:h-[100px] lg:w-[100px]">
            {/* spinning neon ring (on hover / keyboard focus) */}
            <span className="absolute -inset-[3px] animate-[spin_4s_linear_infinite] rounded-full bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600 opacity-0 shadow-[0_0_18px_rgba(6,182,212,0.45)] transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:animate-none"></span>
            <span className="relative block h-full w-full overflow-hidden rounded-full ring-1 ring-white/10">
              {item.image && (
                <Image
                  src={getFinalSrc(item.image) as string}
                  alt={item.title || 'دسته‌بندی محصولات'}
                  className="h-full w-full"
                  imgClass="object-contain"
                  sizes="(max-width: 1024px) 80px, 100px"
                  priority={idx < 6}
                  quality={100}
                />
              )}
            </span>
          </span>
          <p className="whitespace-nowrap pt-2 font-semibold text-[12px] text-zinc-800 dark:text-zinc-200 lg:pt-1 lg:text-[13px]">
            {item.title}
          </p>
        </Link>
      ))}
    </div>
  );
});

Template1.displayName = 'Template1';

export default Template1;
