import { request } from '@/lib/client';
import { useQuery } from '@tanstack/react-query';

export const useGetAddress = () => {
  return useQuery({
    queryKey: ['address'],
    queryFn: async () => await request({ url: `/user/address` }),
    staleTime: 0,
    gcTime: 0,
  });
};
