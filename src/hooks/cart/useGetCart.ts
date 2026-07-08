import { request } from '@/lib/client';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';

export const useGetCart = () => {
  const [finger, setFinger] = useState<string | null>(null);

  useEffect(() => {
    // خواندن finger از کوکی
    const fingerValue = Cookies.get('finger') || null;
    setFinger(fingerValue);
  }, []);

  return useQuery({
    queryKey: ['carts', finger],
    enabled: Boolean(finger),
    queryFn: async () => await request({ url: `/cart?code=${finger}` }),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
  });
};
