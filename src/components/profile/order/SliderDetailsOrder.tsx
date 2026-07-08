'use client';
import React from 'react';
import CardSlider from './CardSlider';
import { Product } from '@/types/Home';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
interface Props {
  orders: Product[];
}
const SliderDetails = ({ orders }: Props) => {
  return (
    <div className="lg:h-[200px]">
      {orders.length >= 4 ? (
        <Swiper
          speed={1000}
          autoplay={{
            delay: 3000,
            pauseOnMouseEnter: true,
          }}
          pagination={{
            clickable: true,
          }}
          spaceBetween={17}
          slidesPerView={'auto'}
          modules={[Autoplay, Pagination]}
          loop
        >
          {orders.map((order, idx) => (
            <SwiperSlide className="!w-[330px]" key={idx}>
              <CardSlider order={order} key={idx} />
            </SwiperSlide>
          ))}
        </Swiper>
      ) : (
        <div className="mt-5 flex flex-col gap-3 md:flex-row md:gap-10">
          {orders.map((order, idx) => (
            <CardSlider order={order} key={idx} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SliderDetails;
