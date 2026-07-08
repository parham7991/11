import React from 'react';

export default function ShortNewsHeader() {
  return (
    <header className="short-news-hero relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8 text-center shadow-lg">
      {/* Decorative Background Elements */}
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-blue-400/30 to-purple-400/30 blur-2xl"></div>
      <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-gradient-to-br from-pink-400/30 to-blue-400/30 blur-2xl"></div>

      <div className="relative z-10">
        {/* Icon Container */}
        <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-4 shadow-xl">
          <svg
            className="h-8 w-8 text-white lg:h-10 lg:w-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1 className="mb-3 font-bold text-3xl text-gray-900 lg:text-4xl">اخبار کوتاه روز</h1>
        <p className="mx-auto max-w-2xl font-reqular text-base text-gray-600 lg:text-lg">
          مجموعه اخبار کوتاه و خلاصه روزانه در زمینه‌های مختلف. اخبار فوری، خلاصه رویدادها و اطلاعات
          مهم روز
        </p>
      </div>
    </header>
  );
}
