import { request } from '@/lib/client';
import { useQuery } from '@tanstack/react-query';

export const useGetShortNews = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['shortNews'],
    enabled,
    queryFn: async () => {
      const res = await request({
        url: '/mag/news?per_page=4',
        method: 'GET',
        cache: 'no-store',
      });
      return res;
    },
    staleTime: 0,
    gcTime: 0,
  });
};
