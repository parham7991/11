import React from 'react';
import Image from '@/components/common/Image';
import Link from '../Link';
import { Time_Icon, Arrow_Icon } from '../common/Icon';

interface Props {
  cardarticle: {
    img: string;
    type: string;
    title: string;
    date: string;
    id: number;
    short_des?: string;
    slug: string;
  };
  className?: string;
  classNameImg?: string;
  classNametype?: string;
  classNamedate?: string;
  classNametitle?: string;
  classNameShortDes?: string;
  sizeIcon?: string;
  hideCategory?: boolean;
  titleFirst?: boolean;
  iconColor?: string;
}
export default function Article({
  cardarticle,
  className,
  classNameImg,
  classNametype,
  classNamedate,
  classNametitle,
  classNameShortDes,
  hideCategory = false,
  titleFirst = false,
  iconColor = 'text-blue-500',
}: Props) {
  return (
    <Link
      href={`/mag/${cardarticle.slug}`}
      className={`mag-article-card group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg transition-all duration-700 hover:-translate-y-2 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:shadow-black/20 dark:hover:border-blue-500/40 ${className || ''}`}
    >
      {/* Gradient Border Effect */}
      <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 opacity-0 blur transition-opacity duration-700 group-hover:opacity-20"></div>

      {/* Image Container with Advanced Effects */}
      <div className="mag-article-image relative overflow-hidden rounded-lg">
        <Image
          imgClass="!object-fill transition-all duration-1000 group-hover:scale-110 group-hover:brightness-110"
          src={cardarticle.img}
          alt={cardarticle.title}
          className={classNameImg || ''}
        />
        {/* Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-purple-600/20 opacity-0 transition-opacity duration-700 group-hover:opacity-100"></div>

        {/* Read More Button (appears on hover) */}
        <div className="mag-read-more absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-white px-5 py-2.5 opacity-0 shadow-xl transition-all duration-500 group-hover:bottom-6 group-hover:opacity-100 dark:bg-slate-950">
          <span className="font-medium text-[12px] text-blue-600">ادامه مطلب</span>
          <Arrow_Icon className="h-4 w-4 text-blue-600 transition-transform group-hover:-translate-x-1" />
        </div>
      </div>

      {/* Content Section */}
      <div className="mag-article-content flex w-full flex-col">
        {titleFirst ? (
          <>
            {/* Title with Gradient Effect - First */}
            <p
              className={`mag-article-title relative bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text transition-all duration-300 group-hover:from-blue-600 group-hover:to-purple-600 dark:from-white dark:to-slate-300 dark:text-white ${classNametitle || ''}`}
            >
              {cardarticle.title}
            </p>

            {/* Date with Icon - Below Title */}
            <div
              className={`mt-2 flex items-center gap-2 transition-all duration-300 ${classNamedate || ''}`}
            >
              <Time_Icon
                className={`h-4 w-4 ${iconColor} opacity-70 transition-all group-hover:scale-110 group-hover:opacity-100`}
              />
              <span>{new Date(cardarticle.date).toLocaleDateString('fa-IR')}</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex w-full items-center justify-between">
              {/* Category Badge */}
              {!hideCategory && (
                <div
                  className={`relative overflow-hidden shadow-lg transition-all duration-500 group-hover:scale-105 group-hover:shadow-xl ${classNametype || ''}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 dark:from-transparent"></div>
                  <span className="relative">{cardarticle.type}</span>
                </div>
              )}

              {/* Date with Icon */}
              <div
                className={`flex items-center gap-2 transition-all duration-300 ${classNamedate || ''}`}
              >
                <Time_Icon
                  className={`h-4 w-4 ${iconColor} opacity-70 transition-all group-hover:scale-110 group-hover:opacity-100`}
                />
                <span>{new Date(cardarticle.date).toLocaleDateString('fa-IR')}</span>
              </div>
            </div>

            {/* Title with Gradient Effect */}
            <p
              className={`mag-article-title relative mt-3 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text transition-all duration-300 group-hover:from-blue-600 group-hover:to-purple-600 dark:from-white dark:to-slate-300 dark:text-white ${classNametitle || ''}`}
            >
              {cardarticle.title}
            </p>
          </>
        )}

        {/* Short Description */}
        {cardarticle.short_des && (
          <div className="mt-3">
            <p
              className={`text-justify font-reqular text-[13px] leading-relaxed text-gray-600 transition-colors duration-300 group-hover:text-gray-800 dark:text-slate-400 dark:group-hover:text-slate-200 lg:text-[14px] ${classNameShortDes || 'line-clamp-3'}`}
            >
              {cardarticle.short_des}
            </p>
            {/* Read More Indicator */}
            <div className="mt-2 flex items-center gap-2 opacity-0 transition-all duration-500 group-hover:opacity-100">
              <div className="h-[2px] flex-1 bg-gradient-to-r from-blue-500 to-transparent"></div>
              <span className="text-[11px] text-blue-600">بیشتر بخوانید</span>
            </div>
          </div>
        )}
      </div>

      {/* Corner Decoration */}
      <div className="absolute left-0 top-0 h-20 w-20 -translate-x-10 -translate-y-10 rounded-full bg-gradient-to-br from-blue-400/30 to-purple-400/30 opacity-0 blur-2xl transition-all duration-700 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100"></div>
    </Link>
  );
}
