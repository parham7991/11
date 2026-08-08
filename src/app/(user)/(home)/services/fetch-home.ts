import { BASEURL } from '@/lib/variable';

export const fetchHome = async () => {
  try {
    const res = await fetch(`${BASEURL}/page?url_key=/`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`home fetch ${res.status}`);
    const data = await res.json();
    return data;
  } catch (e) {
    console.error('[fetchHome] failed, fallback:', (e as Error)?.message);
    // fallback khali ta build nemire — page ba data khali render mishe
    return { page: null, brands: [] } as any;
  }
};
