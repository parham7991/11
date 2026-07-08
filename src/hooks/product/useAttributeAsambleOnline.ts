import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

type AssemblyItem = {
  name?: string;
  value?: string;
  image: string;
  id: number;
};

type AssemblyResponse = {
  ok?: boolean;
  items: AssemblyItem[];
  total?: number;
  source?: string;
  [key: string]: unknown;
};

const emptyAssembly: AssemblyResponse = { ok: false, items: [] };

export const useAttributeAsambleOnline = ({ enabled }: { enabled: boolean }) => {
  const { id }: { id?: string[] } = useParams();
  const productId = Array.isArray(id) ? id[0] : undefined;

  return useQuery<AssemblyResponse>({
    queryKey: ['attributeAsambleOnline', productId],
    enabled: enabled && Boolean(productId),
    queryFn: async ({ signal }) => {
      try {
        const response = await fetch(`/api/product/assembly?id=${productId}`, {
          method: 'GET',
          credentials: 'same-origin',
          signal,
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) return emptyAssembly;

        const data = (await response.json()) as AssemblyResponse;

        return {
          ...data,
          items: Array.isArray(data?.items) ? data.items : [],
        };
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw error;
        }

        return emptyAssembly;
      }
    },
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
};
