import React, { useState, useEffect } from 'react';
import Footer from './footer';

interface LazyFooterProps {
  children?: React.ReactNode;
}

const LazyFooter: React.FC<LazyFooterProps> = ({ children }) => {
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  useEffect(() => {
    // بررسی اینکه آیا صفحه کاملاً لود شده است
    const checkPageLoaded = () => {
      if (document.readyState === 'complete') {
        // تأخیر کوتاه برای اطمینان از لود کامل
        setTimeout(() => {
          setIsPageLoaded(true);
        }, 1000);
      }
    };

    // اگر صفحه قبلاً لود شده
    if (document.readyState === 'complete') {
      setTimeout(() => {
        setIsPageLoaded(true);
      }, 1000);
    } else {
      // منتظر لود کامل صفحه
      window.addEventListener('load', checkPageLoaded);
    }

    return () => {
      window.removeEventListener('load', checkPageLoaded);
    };
  }, []);

  return (
    <>
      {children}
      {isPageLoaded && <Footer />}
    </>
  );
};

export default LazyFooter;
