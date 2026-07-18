'use client';
import { getFinalSrc } from '@/lib/fun';
import Link from 'next/link';
import Image from './Image';
import { memo } from 'react';
import { BannerItem } from '@/types/Home';

interface Props {
  banners: BannerItem[];
}

const Banners = memo(({ banners }: Props) => {
  // اگر داده‌ای نیامد (مثلاً خطای API/تایم‌اوت)، به‌جای container خالی و زشت
  // یک اسکلت لودینگ تمیز نشان می‌دهیم تا صفحه یکدست بماند.
  if (!Array.isArray(banners) || banners.length === 0) {
    return (
      <div className="container_page flex flex-col items-center gap-5 lg:flex-row lg:gap-10">
        {[0, 1].map((idx) => (
          <div
            key={idx}
            className="banner-skeleton h-[180px] w-full animate-pulse rounded-xl bg-gray-200 lg:h-[250px]"
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="container_page flex flex-col items-center gap-5 lg:flex-row lg:gap-10">
      {banners?.map((item, idx) => {
        const imagePath = item.full_path || item.content?.path;
        const redirectLink = item.content?.link || '#';
        const altText = item.content?.alt || item.name || 'Banner';

        return (
          <Link
            rel="follow"
            prefetch={false}
            target="_blank"
            key={`${item.id}-${idx}`}
            href={redirectLink}
            className="banner-link group w-full"
          >
            <div className="banner-card relative h-[180px] w-full overflow-hidden rounded-xl lg:h-[250px]">
              <Image
                src={getFinalSrc(imagePath) as string}
                alt={altText}
                className="h-full w-full cursor-pointer transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                imgClass="object-fill"
                quality={75}
                showLoader={true}
              />
              {/* Flash / lightning sweep effect on hover */}
              <span className="banner-flash pointer-events-none absolute inset-0 z-10" />
              {/* Depth shadow on hover */}
              <span className="banner-depth pointer-events-none absolute inset-0 rounded-xl" />
            </div>
          </Link>
        );
      })}

      {/* Inline keyframes for flash effect */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .banner-flash {
          background: linear-gradient(
            105deg,
            transparent 40%,
            rgba(255, 255, 255, 0) 45%,
            rgba(255, 255, 255, 0.45) 50%,
            rgba(255, 255, 255, 0) 55%,
            transparent 60%
          );
          background-size: 250% 100%;
          background-position: 100% 0;
          transition: none;
        }
        .banner-link:hover .banner-flash {
          animation: bannerSweep 0.7s ease-out forwards;
        }
        @keyframes bannerSweep {
          0%   { background-position: 100% 0; }
          100% { background-position: -50% 0; }
        }
        .banner-depth {
          box-shadow: inset 0 0 0 0 rgba(0,0,0,0);
          transition: box-shadow 0.4s ease;
        }
        .banner-link:hover .banner-depth {
          box-shadow:
            inset 0 -60px 50px -20px rgba(0, 0, 0, 0.25),
            0 16px 40px -8px rgba(0, 0, 0, 0.35);
        }
      `,
        }}
      />
    </div>
  );
});

Banners.displayName = 'Banners';

export default Banners;
