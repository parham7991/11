import { useSession } from '@/lib/auth/useSession';
import { request } from '@/lib/client';
import { addToast } from '@heroui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

export const useRemoveCart = () => {
  const queryClient = useQueryClient();
  const { id: isProduct } = useParams();
  const session = useSession();
  return useMutation({
    mutationFn: async ({ qty = 1, id }: { qty?: number; id?: number }) => {
      return await request({
        url: `/cart/destroy?qty=${Number(qty)}&product_id=${id ? id : isProduct}&code=${
          session?.finger
        }`,
        method: 'POST',
      });
    },
    onSuccess: async (data) => {
      if (data.result === 'error') {
        addToast({
          title: data.message,
          color: 'danger',
        });
      } else {
        await queryClient.invalidateQueries({ queryKey: ['carts'] });

        addToast({
          title: 'از سبد خرید شما حذف شد',
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
