import { useSession } from '@/lib/auth/useSession';
import { request } from '@/lib/client';
import { addToast } from '@heroui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

export const useAddCart = () => {
  const queryClient = useQueryClient();
  const { id: idProduct } = useParams();
  const session = useSession();

  return useMutation({
    mutationFn: async ({ qty = 1, id }: { qty?: number; id?: number }) =>
      await request({
        url: `/cart?qty=${Number(qty)}&product_id=${id ? id : Array.isArray(idProduct) ? idProduct[0] : '0'}&code=${
          session?.finger
        }`,
        method: 'POST',
      }),
    onSuccess: async (data) => {
      if (data.result === 'error') {
        addToast({
          title: data.message,
          color: 'danger',
        });
      } else {
        await queryClient.invalidateQueries({ queryKey: ['carts'] });

        addToast({
          title: 'به سبد خرید اضافه شد',
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
