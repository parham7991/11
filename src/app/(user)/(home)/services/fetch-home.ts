import { BASEURL } from '@/lib/variable';

export const fetchHome = async () => {
  const res = await fetch(`${BASEURL}/page?url_key=/`, {
    cache: 'force-cache', // کش کامل
    next: { tags: ['home_page'] }, // برای revalidation با API
  });
  if (!res.ok) {
    throw new Error('Failed to fetch home');
  }
  const data = await res.json();
  return data;
};
