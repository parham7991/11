import Link from 'next/link';
import React from 'react';

const Categories = () => {
  return (
    <div className="container_page flex flex-wrap items-center">
      {new Array(10).fill(10).map((_, idx) => {
        return (
          <Link target="_blank" prefetch={false} key={idx} href={`/`}>
            <div className="h-24 w-24 rounded-full border font-medium">
              <img src="https://dkstatics-public.digikala.com/digikala-mega-menu/151ec29bae111afd3b6a0e71cec5c4c26f1c3014_1740299456.jpg?x-oss-process=image/resize,m_lfit,h_300,w_300/quality,q_80" />
            </div>
            <p className="font-medium text-[14px]">کالای دیجیتال</p>
          </Link>
        );
      })}
    </div>
  );
};

export default Categories;
