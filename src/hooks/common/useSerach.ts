import { request } from '@/lib/client';
import { useQuery } from '@tanstack/react-query';
type Props = {
  search: string;
  type: string;
  page?: string;
};
export const useSerach = ({ search, type, page = '1' }: Props) => {
  return useQuery({
    queryKey: ['search', search],
    enabled: Boolean(search),
    queryFn: async () =>
      await request({ url: `/search?q=${search}&type=${type}&pre_page=24&page=${page}` }),
  });
};
