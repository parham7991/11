// src/lib/home.ts
import { cache } from 'react';
import { request } from './client';

// کش مشترک برای هر دو استفاده
const getHomeDataInternal = cache(async () => {
  const res = await request({
    url: '/page?url_key=/',
    method: 'GET',
    cache: 'force-cache',
    tag: 'home_page', // برای revalidate
  });
  return res;
});

export const getHomeData = getHomeDataInternal;
export const getHomeMetadata = getHomeDataInternal;
