'use client';

import React from 'react';

interface AddProductButtonProps {
  onClick: () => void;
  size?: 'desktop' | 'mobile';
}

const AddProductButton: React.FC<AddProductButtonProps> = ({ onClick, size = 'desktop' }) => {
  const isDesktop = size === 'desktop';

  const containerClass = isDesktop
    ? 'relative flex flex-col items-center bg-gray-50 p-4 border border-gray-200 rounded-2xl shadow-sm h-[180px]'
    : 'flex-shrink-0 w-32 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-3';

  const buttonClass = isDesktop
    ? 'w-24 h-24 mb-3 rounded-lg border-2 border-dashed border-gray-300 hover:border-main hover:bg-main/5 flex items-center justify-center transition-all duration-200 group'
    : 'w-full h-full flex flex-col items-center justify-center';

  const iconClass = isDesktop
    ? 'w-8 h-8 text-gray-400 group-hover:text-main transition-colors'
    : 'w-8 h-8 text-gray-400 mb-2';

  const textClass = isDesktop
    ? 'text-xs font-light text-gray-600 font-yekan line-clamp-2 text-center leading-tight flex-1 flex items-center'
    : 'text-xs text-gray-500 font-yekan font-medium text-center';

  return (
    <div className={containerClass}>
      <button onClick={onClick} className={buttonClass}>
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        {!isDesktop && <span className={textClass}>افزودن محصول</span>}
      </button>
      {isDesktop && <h3 className={textClass}>افزودن محصول</h3>}
    </div>
  );
};

export default AddProductButton;
