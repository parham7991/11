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
    <div className={`w-full overflow-hidden ${className}`}>
      <div className="flex flex-nowrap items-start justify-start gap-5 overflow-x-auto pr-5 scrollbar-hide lg:items-center lg:justify-center lg:gap-10 lg:pr-0">
      {story?.story?.items?.map((item, idx) => (
        <Link
          target="_blank"
          rel="follow"
          prefetch={false}
          key={`${item.link}-${idx}`}
          href={item.link}
          className="flex !w-fit cursor-pointer flex-col items-center justify-center rounded-lg py-3"
        >
          <span className="relative flex h-[80px] w-[80px] items-center justify-center rounded-full lg:h-[100px] lg:w-[100px]">
            <span className="relative block h-full w-full overflow-hidden rounded-full">
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
          <p className="whitespace-nowrap pt-2 font-medium text-[12px] lg:pt-1 lg:text-[13px]">
            {item.title}
          </p>
        </Link>
      ))}
      </div>
    </div>
  );
});

Template1.displayName = 'Template1';

export default Template1;
