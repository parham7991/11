import { request } from '@/lib/client';
import { addToast } from '@heroui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useRemoveAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: number }) =>
      await request({
        url: `/user/address/destroy`,
        data: { id },
        method: 'POST',
      }),
    onSuccess: async (data) => {
      if (data.result === 'error') {
        addToast({
          title: data.message,
          color: 'danger',
        });
      } else {
        await queryClient.invalidateQueries({ queryKey: ['address'] });

        addToast({
          title: 'آدرس حذف شد',
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
