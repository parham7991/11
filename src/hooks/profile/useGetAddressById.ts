import { request } from '@/lib/client';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

export const useGetAddressById = () => {
  const { id } = useParams();
  return useQuery({
    queryKey: ['addressbyId', id],
    enabled: Boolean(id !== 'new'),
    queryFn: async () => await request({ url: `/user/address/${id}` }),
    staleTime: 0,
    gcTime: 0,
  });
};
