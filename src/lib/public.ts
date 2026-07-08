export type PublicCategoryItem = {
  id: number | string;
  name: string;
};

export async function getMagCategories(): Promise<PublicCategoryItem[]> {
  const res = await fetch(`/api/mag/categories`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) return [];
  const json = await res.json();
  const items: PublicCategoryItem[] = Array.isArray(json?.data)
    ? json.data.map((it: any) => ({ id: it.id ?? it.slug ?? it.name, name: it.name ?? it.title }))
    : Array.isArray(json)
      ? json.map((it: any) => ({ id: it.id ?? it.slug ?? it.name, name: it.name ?? it.title }))
      : [];
  return items;
}
