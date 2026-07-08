'use client';
import React, { useState } from 'react';
import { BiLogoTelegram } from 'react-icons/bi';
import { Instagram_Icon, Whatsup_Icon } from '../Icon';
import Link from '@/components/Link';

const MagFooter = () => {
  const [email, setEmail] = useState('');

  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement newsletter subscription
    console.log('Newsletter subscription:', email);
    setEmail('');
  };

  return (
    <footer className="relative mt-auto bg-[#0F1014] font-reqular text-white">
      {/* Newsletter Section */}
      <div
        className="border-b bg-[#0F1014] px-4 py-6 lg:px-8"
        style={{ borderColor: 'rgba(107, 114, 128, 0.4)' }}
      >
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 lg:flex-row">
          <h3 className="text-right font-medium text-base text-white lg:text-lg">
            عضویت در خبرنامه
          </h3>
          <form
            onSubmit={handleNewsletterSubmit}
            className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="آدرس ایمیل خود را وارد کنید"
              className="flex-1 rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="submit"
              className="rounded-lg bg-blue-500 px-6 py-2.5 font-medium text-sm text-white transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              عضویت
            </button>
          </form>
        </div>
      </div>

      {/* Navigation Links */}
      <div
        className="border-b bg-[#0F1014] px-4 py-4 lg:px-8"
        style={{ borderColor: 'rgba(107, 114, 128, 0.4)' }}
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-4 text-sm lg:justify-start lg:gap-6">
          <Link href="/" className="text-gray-300 transition-colors hover:text-white">
            آفلند
          </Link>
          <Link href="/terms" className="text-gray-300 transition-colors hover:text-white">
            شرایط
          </Link>
          <Link href="#" className="text-gray-300 transition-colors hover:text-white">
            بازنشر
          </Link>
          <Link href="#" className="text-gray-300 transition-colors hover:text-white">
            فرصت های همکاری
          </Link>
          <Link href="#" className="text-gray-300 transition-colors hover:text-white">
            رفع مسؤولیت
          </Link>
        </div>
      </div>

      {/* Social Media & Copyright */}
      <div className="relative bg-[#0F1014] px-4 py-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 lg:flex-row">
          {/* Social Media Icons */}
          <div className="flex items-center gap-4">
            <a
              href="https://t.me/offlir"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-lg border text-white transition-all hover:border-blue-500 hover:text-blue-500"
              style={{ borderColor: 'rgba(107, 114, 128, 0.4)' }}
              aria-label="تلگرام"
            >
              <BiLogoTelegram className="h-5 w-5" />
            </a>
            <a
              href="https://wa.me/989129490306"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-lg border text-white transition-all hover:border-blue-500 hover:text-blue-500"
              style={{ borderColor: 'rgba(107, 114, 128, 0.4)' }}
              aria-label="واتساپ"
            >
              <Whatsup_Icon className="h-5 w-5" />
            </a>
            <a
              href="https://instagram.com/offl.ir"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-lg border text-white transition-all hover:border-blue-500 hover:text-blue-500"
              style={{ borderColor: 'rgba(107, 114, 128, 0.4)' }}
              aria-label="اینستاگرام"
            >
              <Instagram_Icon className="h-5 w-5" />
            </a>
          </div>

          {/* Copyright Text */}
          <div className="flex-1 text-center font-reqular text-xs leading-relaxed text-gray-400 lg:text-right">
            <p>
              © هر گونه کپی برداری جزئی یا کلی از مطالب آفلند مگ بدون کسب مجوز مکتوب ممنوع است.
              حقوق این سایت به فروشگاه آنلاین آفلند تعلق دارد.
            </p>
          </div>

          {/* Scroll to Top Button */}
          <button
            onClick={handleScrollToTop}
            className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500 text-white transition-all hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            aria-label="اسکرول به بالا"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
          </button>
        </div>
      </div>
    </footer>
  );
};

export default MagFooter;
