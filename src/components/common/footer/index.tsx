'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import { footer } from '@/lib/data';
import { Instagram_Icon, Whatsup_Icon } from '../Icon';
import { BiLogoTelegram } from 'react-icons/bi';
import Logo from '@/../public/images/logo-white.png';
import Image from 'next/image';
import Link from '@/components/Link';

const pages = ['/category-list', '/cart', '/checkout'];
const Footer = () => {
  const pathname = usePathname();
  const findPage = pages.find((page) => pathname.startsWith(page));

  if (findPage || pathname?.startsWith('/mag')) return;
  return (
    <footer className="relative mt-32 min-h-fit bg-[#0F1014] pb-0 lg:mb-0">
      <div className="mx-auto w-[90%] pb-2 pt-10">
        <Link prefetch={false} href="/">
          <Image className="mx-auto w-[14rem] lg:w-[24rem]" src={Logo} alt="آفلند" />
        </Link>

        <p className="w-full py-3 text-justify font-medium text-[14px] leading-8 text-white lg:py-10 lg:text-base">
          آفلند با هدف ارائه‌ تجربه‌ای مطمئن ، سریع و هوشمند از خرید آنلاین تأسیس شده است. ما بر
          آنیم تا بستری حرفه‌ای برای تهیه‌ انواع کالای دیجیتال و تجهیزات مرتبط فراهم کنیم ؛ بستری که
          در آن کیفیت محصولات ، شفافیت قیمت‌ها و رضایت مشتری در اولویت قرار دارد.ما در آفلند باور
          داریم که خرید آنلاین باید ساده ، دقیق و بدون دغدغه باشد. از این رو تلاش می‌کنیم تا با
          تأمین کالاهای معتبر، ارائه‌ی مشاوره‌ تخصصی ، پشتیبانی پاسخ‌گو و ارسال سریع ، تجربه‌ای
          فراتر از انتظار کاربران رقم بزنیم.چشم‌انداز ما تبدیل شدن به یکی از مراجع معتبر و مورد
          اعتماد در حوزه‌ فروش اینترنتی تجهیزات دیجیتال در کشور است . انتخابی نخست برای خریدارانی که
          به کیفیت و خدمات اهمیت می‌دهند.
        </p>
        <div className="h-px w-full bg-white" />
        <div className="mt-6 grid gap-5 lg:grid-cols-5 lg:gap-0">
          {footer.map((item, idx) => (
            <ul key={idx} className="flex flex-col gap-3">
              <h3 className="font-medium text-white lg:text-lg">{item.title}</h3>
              {item.links.map((link, idx) => (
                <li key={idx}>
                  <Link
                    prefetch={false}
                    className="font-medium text-[14px] text-zinc-400"
                    href={link.link}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          ))}

          <div className="col-span-2 flex flex-col gap-4">
            <p className="text-right font-medium text-white lg:text-xl">اطلاعات تماس</p>
            <p className="text-right">
              <span className="font-bold text-[15px] text-white lg:text-base">دفتر مرکزی : </span>
              <span className="font-medium text-[14px] text-zinc-400 lg:text-base">
                استان تهران، شهر تهران، میدان ولیعصر ، کوچه ولدی ، پلاک 30
              </span>
            </p>
            <p className="text-right">
              <span className="font-bold text-[15px] text-white lg:text-base">
                ساعت پاسخگویی :{' '}
              </span>
              <span className="font-medium text-[14px] text-zinc-400 lg:text-base">
                شنبه تا چهارشنبه ساعت
              </span>
              <span className="text-base font-normal text-zinc-400"> 10</span>
              <span className="font-medium text-base text-zinc-400"> صبح الی </span>
              <span className="text-base font-normal text-zinc-400">18:30</span>
              <span className="font-medium text-base text-zinc-400"> بعد از ظهر</span>

              <span className="font-medium text-[14px] text-zinc-400 lg:text-base">
                {' '}
                پنجشنبه از ساعت
              </span>
              <span className="text-base font-normal text-zinc-400"> 10</span>
              <span className="font-medium text-base text-zinc-400"> صبح الی </span>
              <span className="text-base font-normal text-zinc-400">15:00</span>
              <span className="font-medium text-base text-zinc-400"> بعد از ظهر</span>
            </p>
            <p className="text-right">
              <span className="font-bold text-[15px] text-white lg:text-base">شماره تماس : </span>
              <span className="font-medium text-[14px] font-normal text-zinc-400 lg:text-base">
                02143000240
              </span>
            </p>
            <div
              style={{
                background:
                  'linear-gradient(270deg, rgba(252, 252, 252, 0.27) 0%, rgba(217, 217, 217, 0.00) 100.74%)',
              }}
              className="flex h-8 w-full items-center justify-between rounded-md px-3"
            >
              <span className="text-right font-bold text-xs text-white">
                ما را در شبکه های اجتماعی دنبال کنید
              </span>
              <div className="flex items-center gap-3">
                <a href="https://t.me/offlir">
                  <BiLogoTelegram className="h-6 w-6 text-[#fcfcfc] hover:text-[#386BF9]" />
                </a>
                <a href="https://wa.me/989129490306">
                  <Whatsup_Icon className="block h-5 w-5 text-[#fcfcfc] hover:text-[#386BF9]" />
                </a>
                <a href="https://instagram.com/offl.ir">
                  <Instagram_Icon className="text-[#fcfcfc] hover:text-[#386BF9]" />
                </a>
              </div>
            </div>

            {/* اینماد و ساماندهی - لوگوهای سفید PNG */}
            <div className="flex items-center justify-end gap-3">
              <a
                className="footer-trust-logo block h-16 w-16"
                referrerPolicy="origin"
                target="_blank"
                href="https://trustseal.enamad.ir/?id=268087&Code=ytpPRSc8i0dPLGwgzQyh"
              >
                <img
                  src="/images/enamad.png"
                  alt="اینماد"
                  width={64}
                  height={64}
                  className="h-full w-full object-contain"
                />
              </a>

              <a
                className="footer-trust-logo block h-16 w-16"
                href="https://logo.samandehi.ir/Verify.aspx?id=345519&p=xlaoaodsdshwdshwrfthpfvl"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.preventDefault();
                  window.open(
                    'https://logo.samandehi.ir/Verify.aspx?id=345519&p=xlaoaodsdshwdshwrfthpfvl',
                    'Popup',
                    'toolbar=no, scrollbars=no, location=no, statusbar=no, menubar=no, resizable=0, width=450, height=630, top=30'
                  );
                }}
              >
                <img
                  src="/images/samandehi.png"
                  alt="ساماندهی"
                  width={64}
                  height={64}
                  className="h-full w-full object-contain"
                />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white py-3">
        <div className="flex flex-col items-center justify-center gap-2 lg:flex-row lg:gap-4">
          <p className="text-center font-medium text-black">
            تمامی حقوق برای سایت <span className="font-bold text-blue-500">آفلند</span> محفوظ است
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
