import React from 'react';
import Logo from '@/../public/images/logo-off-3.png';
import Image from 'next/image';
import { Spinner } from '@heroui/react';
const Loading = ({ showShadow = true }: { showShadow?: boolean }) => {
  return (
    <>
      <div className="shadow-loading fixed top-1/2 left-1/2 !z-[9999] flex h-fit w-[208px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-[13px] bg-white py-5">
        <Spinner size="lg" classNames={{ circle1: 'border-b-main', circle2: 'border-b-main' }} />

        <Image width={170} height={170} src={Logo} alt="" className="mt-5" />
      </div>
      {showShadow && (
        <div className="fixed top-0 left-1/2 z-[8888] block h-screen w-full -translate-x-1/2 bg-[#0C0C0C99]"></div>
      )}
    </>
  );
};

export default Loading;
