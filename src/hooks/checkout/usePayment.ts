import { request } from '@/lib/client';
import { useQuery } from '@tanstack/react-query';

export const usePayment = () => {
  return useQuery({
    queryKey: ['payments'],
    queryFn: async () => await request({ url: `/payment/methods` }),
    staleTime: 0,
    gcTime: 0,
  });
};
