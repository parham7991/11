'use client';

import { useState } from 'react';
import { request } from '@/lib/client';
import { addToast } from '@heroui/react';
import { useMutation } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Cookies from 'js-cookie';
import { getCookieOptions } from '@/lib/cookie-options';
import { cookieName } from '@/lib/utils';

export const useVerifyAuth = () => {
  const [isPending, setIsPending] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const mutate = async (data: {
    mobile?: string | null;
    code?: string | null;
    type: 'verify' | 'password';
  }) => {
    setIsPending(true);
    try {
      const response = await request({ url: '/auth/login', method: 'POST', data });

      if (response.result === 'error') {
        addToast({
          title: response.message,
          color: 'danger',
        });
        throw new Error(response.message);
      }

      toast.success('ورود با موفقیت انجام شد');

      // Save session to cookie
      if (response.access_token) {
        const session = {
          accessToken: response.access_token,
          userId: response.user.id,
        };

        // Save to cookie using js-cookie
        if (cookieName) {
          Cookies.set(cookieName, JSON.stringify(session), getCookieOptions(7));

          // Set NEW_OFFLAND_v2 flag to indicate new token system
          Cookies.set('NEW_OFFLAND_v2', 'true', getCookieOptions(7));

          // Dispatch event for auth token set
          window.dispatchEvent(
            new CustomEvent('authTokenSet', {
              detail: { token: response.access_token },
            })
          );
        }
      }

      // Navigate to redirect URL یا home
      const redirectTo =
        searchParams.get('page') && searchParams.get('page') !== 'null'
          ? (searchParams.get('page') as string)
          : '/';

      router.push(redirectTo);

      return response;
    } catch (error) {
      addToast({
        title: error instanceof Error ? error.message : 'خطایی رخ داد',
        color: 'danger',
      });
      throw error;
    } finally {
      setIsPending(false);
    }
  };

  return useMutation({
    mutationFn: mutate,
  });
};
