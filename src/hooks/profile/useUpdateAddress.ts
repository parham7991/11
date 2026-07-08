import { request } from '@/lib/client';
import { addToast } from '@heroui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useUpdateAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ data }: { data: unknown; id: number }) =>
      await request({
        url: `/user/address/update`,
        method: 'POST',
        data,
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
          title: 'ویرایش شد',
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
