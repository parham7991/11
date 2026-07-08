import { useMutation, useQueryClient } from '@tanstack/react-query';
import { request } from '@/lib/client';
import { addToast } from '@heroui/react';
import useGlobalStore from '@/store/global-store';

const useDeleteMutation = () => {
  const queryClient = useQueryClient();
  const { verifyDelete } = useGlobalStore();
  return useMutation({
    mutationFn: async () => await request({ url: verifyDelete.url!, method: 'POST' }),
    onSuccess: async () => {
      addToast({
        title: 'با موفقیت حذف شد',
        color: 'success',
      });
      await queryClient.invalidateQueries({
        queryKey: [verifyDelete.updateCache],
      });
    },
    onError: async function (error) {
      addToast({
        // @ts-expect-error errror
        title: error?.response?.data.errors.message,
        color: 'danger',
      });
    },
  });
};

export default useDeleteMutation;
