import { useSession } from '@/lib/auth/useSession';
import { request } from '@/lib/client';
import { useQuery } from '@tanstack/react-query';

export const useGetWishlist = ({ id }: { id?: number }) => {
  const session = useSession();
  return useQuery({
    queryKey: ['wishlist'],
    enabled: Boolean(session?.accessToken) && id ? true : false,
    queryFn: async () => await request({ url: `/catalog/product/wishlist?product_id=${id}` }),
    staleTime: 0,
    gcTime: 0,
  });
};
