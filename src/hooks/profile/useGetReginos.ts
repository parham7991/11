import { request } from '@/lib/client';
import { useQuery } from '@tanstack/react-query';

export const useGetRegions = () => {
  return useQuery({
    queryKey: ['reginos'],
    queryFn: async () => await request({ url: `/regions` }),
    staleTime: 0,
    gcTime: 0,
  });
};
