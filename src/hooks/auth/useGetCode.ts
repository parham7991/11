import { request } from '@/lib/client';
import { addToast } from '@heroui/react';
import { useMutation } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';

export const useGetCode = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  return useMutation({
    mutationFn: async (data: { mobile?: string }) =>
      await request({ url: '/auth/register', data, method: 'POST' }),
    onSuccess: (data, variable) => {
      if (data.result === 'error') {
        addToast({
          title: data.message,
          color: 'danger',
        });
      } else {
        addToast({
          title: 'کد با موفقیت ارسال شد',
          color: 'success',
        });
        router.push(`/auth/verify?mobile=${variable.mobile}&page=${searchParams.get('page')}`);
      }
    },
    onError: (error) => {
      addToast({
        title: error.message,
        color: 'danger',
      });
    },
  });
};
