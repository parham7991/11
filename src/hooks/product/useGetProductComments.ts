import { request } from '@/lib/client';
import { useQuery } from '@tanstack/react-query';
import { Comment } from '@/types/Home/Product';

type ProductCommentsResponse = Comment[];

export const useGetProductComments = (productId: number | string) => {
  return useQuery({
    queryKey: ['product-comments', productId],
    queryFn: async (): Promise<ProductCommentsResponse> =>
      await request({
        url: `/product/comments?product_id=${productId}`,
        method: 'GET',
      }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!productId, // Only run if productId exists
  });
};
