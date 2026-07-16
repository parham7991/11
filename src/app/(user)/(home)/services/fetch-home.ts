import { BASEURL } from '@/lib/variable';

export const fetchHome = async () => {
  const res = await fetch(`${BASEURL}/page?url_key=/`, {
    // ISR: har 30 daghighe (1800s) data az API taze mishavad
    next: { revalidate: 1800, tags: ['home_page'] },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch home');
  }
  const data = await res.json();
  return data;
};
