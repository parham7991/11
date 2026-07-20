import { NextRequest, NextResponse } from 'next/server';
import { getProductsCategory } from '@/seo/product-category';

// Proxy for client-side infinite scroll on category pages.
// The catalog API requires a server-generated JWT (handled by getProductsCategory),
// so the browser cannot call the backend directly — this route fetches server-side
// and returns only the product slice for the requested page.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const page = searchParams.get('page') || '1';

  if (!id) {
    return NextResponse.json({ products: [], total: 0, error: 'missing-id' }, { status: 400 });
  }

  // Rebuild the filter object from the known category filter keys.
  const filter: Record<string, string> = {};
  for (const key of [
    'attribiutes',
    'available',
    'discounted',
    'minPrice',
    'maxPrice',
    'sort',
    'search',
  ]) {
    const value = searchParams.get(key);
    if (value) filter[key] = value;
  }

  try {
    const data = await getProductsCategory({ searchParamsFilter: filter, id, page });
    const response = data?.response;
    return NextResponse.json({
      products: response?.products ?? [],
      total: response?.total ?? 0,
    });
  } catch (error) {
    console.error('[category-products] fetch failed:', error);
    // Return empty slice so the client stops the infinite scroll instead of looping.
    return NextResponse.json({ products: [], total: 0, error: 'fetch-failed' }, { status: 200 });
  }
}
