'use client';
import React, { useTransition } from 'react';
import Button from './Button';
import { useRouter } from 'next/navigation';
import Loading from './Loading';
type Props = {
  title?: string;
  url?: string;
};
const BackPrevPage = ({ title, url }: Props) => {
  const [isPending, startTransition] = useTransition();
  const onClick = () => {
    startTransition(() => {
      if (url) {
        router.push(url);
      } else {
        router.back();
      }
    });
  };

  const router = useRouter();
  return (
    <>
      <div className="container_page sticky top-0 z-50 border-b !border-gray-200 bg-white lg:hidden">
        <div className="container_page flex h-[56px] items-center">
          <Button className="w-fit min-w-fit" onClick={onClick}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8.91 19.9201L15.43 13.4001C16.2 12.6301 16.2 11.3701 15.43 10.6001L8.91 4.08008"
                stroke="#545A66"
                strokeWidth="1.5"
                strokeMiterlimit="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Button>
          <p className="line-clamp-1 flex-1 text-center font-medium text-[14px] text-[#0C0C0C]">
            {title}
          </p>
        </div>
      </div>
      {isPending && <Loading />}
    </>
  );
};

export default BackPrevPage;
