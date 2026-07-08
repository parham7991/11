import { request } from '@/lib/client';
import { useQuery } from '@tanstack/react-query';

export const useSendRequest = ({ url, enabled }: { url: string; enabled: boolean }) => {
  return useQuery({
    queryKey: [url],
    enabled,
    queryFn: async () => await request({ url }),
    staleTime: 0,
    gcTime: 0,
  });
};
