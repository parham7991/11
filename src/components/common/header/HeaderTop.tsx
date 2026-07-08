import React from 'react';
import { Phone_Icon } from '../Icon';
import { BiLogoTelegram } from 'react-icons/bi';

const HeaderTop = () => {
  return (
    <div className="hidden bg-[#F3F6FB] py-2 lg:block">
      {/* top */}
      <div className="container_page flex items-center justify-between px-2 lg:px-5">
        <p className="hidden text-right !text-[23px] md:block">
          <span className="font-bold text-neutral-900">به سرزمین </span>
          <span className="font-bold text-blue-500">تخفیف‌</span>
          <span className="font-bold text-neutral-900"> خوش آمدید !</span>
        </p>
        <div className="flex w-full items-center justify-between gap-4 md:w-fit lg:justify-around">
          {/* <a href='mailto:Offland@yahoo.com' className="w-fit px-3 h-10 flex items-center justify-center gap-2 bg-slate-100 rounded-xl border border-neutral-900" >
                        <span className="text-neutral-900 text-xs lg:text-base font-regular">Offland@yahoo.com</span>
                        <Email_Icon />
                    </a> */}
          <a
            href="tel:02143000240"
            className="flex h-10 w-fit items-center justify-center gap-2 rounded-xl bg-main px-3"
          >
            <span className="font-reqular text-xs font-normal text-white lg:text-base">
              021-43000240
            </span>
            <Phone_Icon className="text-white" />
          </a>
          <a
            href="https://t.me/offlhamkar"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex h-10 w-10 items-center justify-center rounded-xl bg-main transition-all hover:bg-main/90"
            title="تلگرام همکار"
          >
            <BiLogoTelegram className="h-5 w-5 text-white" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default HeaderTop;
