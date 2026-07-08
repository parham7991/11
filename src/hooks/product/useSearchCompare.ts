import { request } from '@/lib/client';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

export const useSearchCompare = (searchQuery: string = '') => {
  const { id: ids } = useParams();

  return useInfiniteQuery({
    queryKey: ['searchCompare', searchQuery],
    enabled: true,
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        ids: ids?.[0] || '',
        per_page: '24',
        page: pageParam.toString(),
        ...(searchQuery && { q: searchQuery }),
      });

      return await request({ url: `/search/by/attributeset?${params.toString()}` });
    },
    getNextPageParam: (lastPage, allPages) => {
      const products = lastPage?.products || [];
      const total = lastPage?.total || 0;
      const currentPage = allPages.length;
      const perPage = 24;

      // Check if we have more products to load based on total
      if (total > currentPage * perPage) {
        return currentPage + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 0,
    gcTime: 0,
  });
};
