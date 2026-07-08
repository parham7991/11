import { updateTag } from '@/lib/auth/storage';
import { useSession } from '@/lib/auth/useSession';
import { request } from '@/lib/client';
import { addToast } from '@heroui/react';
import { useMutation } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';

export const useUpdateProfile = () => {
  const searchParams = useSearchParams();
  const session = useSession();
  return useMutation({
    mutationFn: async ({ data }: { data: unknown }) =>
      await request({
        url: `/user/${session?.id}`,
        method: 'PUT',
        data,
      }),
    onSuccess: async (data) => {
      await updateTag('user-info');
      if (data.result === 'error') {
        addToast({
          title: data.message,
          color: 'danger',
        });
      } else {
        addToast({
          title: 'ویرایش شد',
          color: 'success',
        });
      }
      if (searchParams.get('page')) {
        location.href = searchParams.get('page') as string;
      } else {
        location.href = '/';
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
