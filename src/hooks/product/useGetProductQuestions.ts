import { useQuery } from '@tanstack/react-query';
import { request } from '@/lib/client';
import { Question } from '@/types/Home/Product';

type ProductQuestionsResponse = Question[];

export const useGetProductQuestions = (productId: number | string) => {
  return useQuery({
    queryKey: ['product-questions', productId],
    queryFn: async (): Promise<ProductQuestionsResponse> => {
      try {
        const response = await request({
          url: `/product/questions?product_id=${productId}`,
          method: 'GET',
        });
        return response;
      } catch (error) {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!productId, // Only run if productId exists
    retry: 1, // Only retry once
  });
};
