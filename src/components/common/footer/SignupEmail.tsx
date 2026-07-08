import Link from 'next/link';
import React from 'react';
import { Arrow_Icon } from '../Icon';

const SignupEmail = () => {
  return (
    <div
      className="absolute -top-10 left-1/2 flex h-24 w-[95%] -translate-x-1/2 flex-col items-center justify-between rounded-[16px] bg-[#1D1E22] px-4 pb-4 lg:h-20 lg:w-[60%] lg:flex-row lg:pb-0"
      style={{ boxShadow: '0px 12px 20px 0px rgba(0, 0, 0, 0.64)' }}
    >
      <div className="pt-2 text-right">
        <span className="font-bold text-xs text-white lg:text-lg">با </span>
        <span className="whitespace-nowrap font-bold text-xs text-yellow-400 lg:text-lg">
          ایمیل
        </span>
        <span className="whitespace-nowrap font-bold text-xs text-white lg:text-lg">
          {' '}
          خود می توانید عضو خانواده{' '}
        </span>
        <span className="whitespace-nowrap font-bold text-xs text-yellow-400 lg:text-lg">
          سرزمین آفلند
        </span>
        <span className="whitespace-nowrap font-bold text-xs text-white lg:text-lg"> شوید !</span>
      </div>
      <Link
        prefetch={false}
        style={{ boxShadow: '0px 0px 24px 0px rgba(255, 199, 0, 0.32)' }}
        className="mt-3 flex h-10 w-[80%] items-center justify-between rounded-lg bg-yellow-400 px-2 lg:mt-0 lg:w-[300px]"
        href={'#'}
      >
        <span className="text-right font-reqular text-xs text-neutral-900">
          ایمیل خود را وارد کنید
        </span>
        <Arrow_Icon />
      </Link>
    </div>
  );
};

export default SignupEmail;
