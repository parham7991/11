'use client';

import { useEffect, useState } from 'react';
import { Session } from '@/lib/auth/types';
import Cookies from 'js-cookie';
import { cookieName, parseSessionCookie } from '@/lib/utils';
import { request } from '@/lib/client';
import { getCookieRemoveOptions } from '@/lib/cookie-options';

export const useGetSession = () => {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        setIsLoading(true);

        const cookieNameValue = cookieName || process.env.NEXT_PUBLIC_COCKIES;
        const finger = Cookies.get('finger') || undefined;
        const viewport = Cookies.get('viewport') || undefined;

        // بررسی کوکی از سمت سرور (چون ممکن است از JavaScript قابل دسترسی نباشد)
        let shouldCleanup = false;
        try {
          const checkResponse = await fetch('/api/check-session', {
            method: 'GET',
            credentials: 'include',
          });
          if (checkResponse.ok) {
            const checkData = await checkResponse.json();
            shouldCleanup = checkData.shouldCleanup;
            console.log('Server-side session check:', checkData);
          }
        } catch (error) {
          console.error('Failed to check session from server:', error);
        }

        // بررسی از سمت کلاینت هم (برای fallback)
        const newOfflandFlag = Cookies.get('NEW_OFFLAND_v2');
        const rawSession = cookieNameValue ? Cookies.get(cookieNameValue) : null;
        const clientShouldCleanup = !newOfflandFlag && rawSession && cookieNameValue;

        // اگر از سمت سرور یا کلاینت نیاز به پاک کردن باشد
        if ((shouldCleanup || clientShouldCleanup) && cookieNameValue) {
          console.log('Cleaning up old session cookies - flag missing, session found');

          // پاک کردن کوکی‌های سمت سرور از طریق API
          try {
            const response = await fetch('/api/logout', {
              method: 'POST',
              credentials: 'include', // مهم: برای ارسال کوکی‌ها
            });
            if (!response.ok) {
              console.error('Logout API failed:', response.status);
            }
          } catch (error) {
            console.error('Failed to remove server-side cookies:', error);
          }

          // پاک کردن کوکی session از کلاینت
          const removeOptions = getCookieRemoveOptions();

          // پاک کردن با تمام گزینه‌های ممکن
          Cookies.remove(cookieNameValue, removeOptions);
          Cookies.remove(cookieNameValue, { path: '/' });
          if (removeOptions.domain) {
            Cookies.remove(cookieNameValue, { ...removeOptions, domain: removeOptions.domain });
          }

          // پاک کردن فلگ قدیمی در صورت وجود
          Cookies.remove('NEW_OFFLAND', removeOptions);
          Cookies.remove('NEW_OFFLAND', { path: '/' });
          Cookies.remove('NEW_OFFLAND_v1', removeOptions);
          Cookies.remove('NEW_OFFLAND_v1', { path: '/' });
          Cookies.remove('NEW_OFFLAND_v2', removeOptions);
          Cookies.remove('NEW_OFFLAND_v2', { path: '/' });

          // پاک کردن از document.cookie به صورت مستقیم (برای اطمینان)
          if (typeof document !== 'undefined' && cookieNameValue) {
            document.cookie = `${cookieNameValue}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            document.cookie = `NEW_OFFLAND=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            document.cookie = `NEW_OFFLAND_v1=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            document.cookie = `NEW_OFFLAND_v2=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            if (removeOptions.domain) {
              document.cookie = `${cookieNameValue}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${removeOptions.domain};`;
              document.cookie = `NEW_OFFLAND=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${removeOptions.domain};`;
              document.cookie = `NEW_OFFLAND_v1=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${removeOptions.domain};`;
              document.cookie = `NEW_OFFLAND_v2=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${removeOptions.domain};`;
            }
          }

          // فقط finger و viewport را برگردان
          setSession({
            finger,
            viewport,
          } as Session);
          setIsLoading(false);
          return;
        }

        // اگر کوکی session وجود نداشت، فقط finger و viewport را برگردان
        if (!cookieNameValue) {
          setSession({
            finger,
            viewport,
          } as Session);
          setIsLoading(false);
          return;
        }

        if (!rawSession) {
          setSession({
            finger,
            viewport,
          } as Session);
          setIsLoading(false);
          return;
        }

        try {
          const parsedSession = parseSessionCookie(rawSession);
          const { accessToken, userId } = parsedSession;

          // اگر accessToken وجود داشت، درخواست به API بزن
          if (accessToken && userId) {
            try {
              // استفاده از request برای درخواست به API
              const user = await request({ url: `/user/${userId}`, cache: 'no-store' });
              setSession({
                finger,
                viewport,
                ...user,
                accessToken,
              } as Session);
            } catch (error) {
              // در صورت خطا، فقط finger را برگردان
              setSession({
                finger,
                viewport,
              } as Session);
            }
          } else {
            // اگر accessToken وجود نداشت، فقط finger و viewport را برگردان
            setSession({
              finger,
              viewport,
            } as Session);
          }
        } catch (error) {
          // در صورت خطا در parse کردن، فقط finger را برگردان
          setSession({
            finger,
            viewport,
          } as Session);
        }
      } catch (error) {
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    };

    // دریافت اولیه session
    fetchSession();

    // گوش دادن به event برای تغییرات توکن
    const handleTokenChange = () => {
      fetchSession();
    };

    window.addEventListener('authTokenSet', handleTokenChange);
    window.addEventListener('storage', handleTokenChange);

    return () => {
      window.removeEventListener('authTokenSet', handleTokenChange);
      window.removeEventListener('storage', handleTokenChange);
    };
  }, []);

  return { session, isLoading };
};
