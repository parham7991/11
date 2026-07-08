import { request } from '@/lib/client';
import { useQuery } from '@tanstack/react-query';

export const useGetComment = () => {
  return useQuery({
    queryKey: ['comment'],
    queryFn: async () => await request({ url: `/user/comment` }),
    staleTime: 0,
    gcTime: 0,
  });
};
