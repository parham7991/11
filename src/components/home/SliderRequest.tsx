import { request } from '@/lib/client';
import { HomePage } from '@/types/Home';
import React from 'react';
import Slider from '../common/Slider';

const SliderRequest = async ({ id }: { id: number }) => {
  const data: HomePage = await request({
    url: `/page?url_key=/&type=slider&id=${id}`,
  });
  return (
    <>
      {/* @ts-expect-error error */}
      <Slider sliders={data?.page?.images} />
    </>
  );
};

export default SliderRequest;
