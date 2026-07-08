import { request } from '@/lib/client';
import { useQuery } from '@tanstack/react-query';

export const useGetOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => await request({ url: `/user/order` }),
    staleTime: 0,
    gcTime: 0,
  });
};
