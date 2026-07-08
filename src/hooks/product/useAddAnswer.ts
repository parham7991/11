import { request } from '@/lib/client';
import { addToast } from '@heroui/react';
import { useMutation } from '@tanstack/react-query';

export const useAddAnswer = () => {
  return useMutation({
    mutationFn: async ({ data }: { data: unknown }) =>
      await request({ url: '/answer', method: 'POST', data }),
    onSuccess: async (data) => {
      if (data.result === 'error') {
        addToast({
          title: data.message,
          color: 'danger',
        });
      } else {
        addToast({
          title: 'جواب شما با موفقیت ثبت شد',
          color: 'success',
        });
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
