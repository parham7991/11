import { request } from '@/lib/client';
import { addToast } from '@heroui/react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

export const useCheckout = () => {
  return useMutation({
    mutationFn: async ({ data }: { data: unknown }) =>
      await request({ url: '/checkout', method: 'POST', data }),
    onSuccess: async (data) => {
      if (data.result === 'error') {
        addToast({
          title: data.message,
          color: 'danger',
        });
      } else {
        toast.success('ورود با موفقیت انجام شد');
        location.href = data.action;
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
