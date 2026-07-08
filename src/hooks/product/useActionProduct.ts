import { request } from '@/lib/client';
import { addToast } from '@heroui/react';
import { useMutation } from '@tanstack/react-query';

export const useActionProduct = () => {
  return useMutation({
    mutationFn: async ({
      url,
      data,
      method = 'POST',
    }: {
      url: string;
      data: unknown;
      method?: string;
    }) => await request({ url, method, data }),
    onSuccess: async (data) => {
      if (data.result === 'error') {
        addToast({
          title: data.message,
          color: 'danger',
        });
      } else {
        addToast({
          title: 'با موفقیت انجام شد',
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
