import { request } from '@/lib/client';
import { addToast } from '@heroui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useAddWidhlist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ data, method = 'POST' }: { data: unknown; method: string }) =>
      await request({ url: '/catalog/product/wishlist', method, data }),
    onSuccess: async (data) => {
      if (data.result === 'error') {
        addToast({
          title: data.message,
          color: 'danger',
        });
      } else {
        await queryClient.refetchQueries({ queryKey: ['wishlist-list'] });
        await queryClient.refetchQueries({ queryKey: ['wishlist'] });
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
