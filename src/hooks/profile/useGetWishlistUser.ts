import { request } from '@/lib/client';
import { useQuery } from '@tanstack/react-query';

export const useGetWishlistUser = () => {
  return useQuery({
    queryKey: ['wishlist-list'],
    queryFn: async () => await request({ url: `/user/wishlist` }),
    staleTime: 0,
    gcTime: 0,
  });
};
