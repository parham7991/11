'use client';
import React, { useState, useEffect, useRef } from 'react';
import Button from './Button';
import { Arrow_back_mobile } from './Icon';
import { replaceEmbeddedObjects, minifyHTML } from '@/seo/common';

const CategoryDescription = ({
  description,
  className = 'mt-14',
  showButton = true,
}: {
  description: string;
  className?: string;
  showButton?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // حذف استایلهای inline از h2 و عناصر داخلی که از Word میآیند
  useEffect(() => {
    if (!contentRef.current) return;

    const h2Elements = contentRef.current.querySelectorAll('h2, h2 *');
    h2Elements.forEach((element) => {
      const htmlElement = element as HTMLElement;

      htmlElement.style.removeProperty('font-family');
      htmlElement.style.removeProperty('font-size');
      htmlElement.style.removeProperty('mso-ascii-font-family');
      htmlElement.style.removeProperty('mso-hansi-font-family');
      htmlElement.style.removeProperty('mso-bidi-font-family');

      if (!htmlElement.style.cssText.trim()) {
        htmlElement.removeAttribute('style');
      }
    });
  }, [description, open]);

  const cleanedDescription = minifyHTML(replaceEmbeddedObjects(description || ''));

  return (
    <div>
      <div
        ref={contentRef}
        dangerouslySetInnerHTML={{ __html: cleanedDescription }}
        className={`container_page container_des overflow-hidden !font-light leading-8 text-gray-800 ${open ? '' : showButton ? '!h-[250px]' : ''} ${className}`}
      />

      {showButton && (
        <span className="container_page flex justify-end border-b border-[#E4E7E9]">
          <Button onClick={() => setOpen(!open)} className="w-fit min-w-fit text-main">
            <Arrow_back_mobile className="h-4 w-4 rotate-90 stroke-main" />
            <span>{open ? 'مشاهده کمتر' : 'مشاهده بیشتر'}</span>
          </Button>
        </span>
      )}
    </div>
  );
};

export default CategoryDescription;
