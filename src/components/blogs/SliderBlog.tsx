'use client';
import Link from 'next/link';
import React from 'react';
// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';

// import required modules
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import Article from './Article';
import { Arrow_Icon } from '../common/Icon';
import { article } from '@/lib/data';
export default function SliderBlog() {
  return (
    <div>
      <div className="flex justify-between rounded-xl bg-[#F5F5F5] p-3 md:bg-white">
        <h3 className="font-bold text-[16px] text-[#000000]">تاریخچه مالی</h3>
        <Link
          prefetch={false}
          href="/blog"
          className="group flex h-[32px] w-[120px] items-center justify-center gap-5 rounded-lg font-medium text-[13px] text-[#386BF9] hover:bg-[#386BF9] hover:text-[#FCFCFC]"
        >
          مشاهده همه
          <span className="group-hover:text-[#FCFCFC]">
            <Arrow_Icon className="fill-current" />
          </span>
        </Link>
      </div>
      <div className="max-w-full">
        <Swiper
          breakpoints={{
            640: {
              slidesPerView: 1,
              spaceBetween: 10,
            },
            768: {
              slidesPerView: 2,
              spaceBetween: 20,
            },
            1024: {
              slidesPerView: 3,
              spaceBetween: 30,
            },
          }}
          navigation={true}
          pagination={{
            clickable: true,
          }}
          modules={[Pagination, Navigation]}
          className="mySwiper !max-w-full"
        >
          {article?.slice(5, 15)?.map((item, index) => {
            return (
              <SwiperSlide key={index}>
                {/* <Article
                  cardarticle={item}
                  className="flex flex-col gap-5"
                  classNameImg="w-full rounded-lg"
                  classNametype="bg-[#386BF9] text-[#FCFCFC] text-[14px] font-medium p-3 rounded-lg"
                  classNamedate="text-[#ADADAD] font-medium text-[14px] flex gap-2 items-center"
                  classNametitle="text-[#0F1014] font-bold text-[18px] text-justify mt-1"
                  sizeIcon="18"
                /> */}
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </div>
  );
}
