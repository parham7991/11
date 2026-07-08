import { request } from '@/lib/client';
import { useQuery } from '@tanstack/react-query';

export const useShipping = () => {
  return useQuery({
    queryKey: ['shipping'],
    queryFn: async () => await request({ url: `/shipping/methods` }),
    staleTime: 0,
    gcTime: 0,
  });
};
