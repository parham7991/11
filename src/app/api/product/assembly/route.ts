import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateToken } from '@/lib/fun';
import { BASEURL } from '@/lib/variable';
import { parseSessionCookie } from '@/lib/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AssemblyItem = {
  id: number;
  name?: string;
  value?: string;
  image: string;
  price?: number;
};

type BackendResult<T = any> = {
  ok: boolean;
  status?: number;
  data?: T;
  message?: string;
};

const emptyAssemblyResponse = (status?: number, message?: string, source = 'empty') => ({
  ok: false,
  source,
  items: [] as AssemblyItem[],
  total: 0,
  ...(status ? { upstreamStatus: status } : null),
  ...(message ? { message } : null),
});

const getBackendBaseUrl = () => (BASEURL || process.env.NEXT_PUBLIC_BASE_SERVER_API_URL || '').replace(/\/+$/g, '');

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const cookieStore = await cookies();
  const rawSession = process.env.NEXT_PUBLIC_COCKIES
    ? cookieStore.get(process.env.NEXT_PUBLIC_COCKIES)?.value
    : undefined;

  let session: { accessToken?: string } | null = null;

  if (rawSession) {
    try {
      session = parseSessionCookie(rawSession);
    } catch {
      session = null;
    }
  }

  const jwtKey = await generateToken();

  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${jwtKey}`,
    ...(session?.accessToken ? { token: `${session.accessToken}` } : null),
  };
};

const getErrorMessage = (body: any, fallback?: string) =>
  typeof body?.fa_message === 'string'
    ? body.fa_message
    : typeof body?.message === 'string'
      ? body.message
      : typeof body?.error === 'string'
        ? body.error
        : fallback || 'request failed';

async function fetchBackend<T = any>(
  path: string,
  headers: Record<string, string>,
  timeoutMs = 4500
): Promise<BackendResult<T>> {
  const backendBaseUrl = getBackendBaseUrl();

  if (!backendBaseUrl) {
    return { ok: false, message: 'BASE_SERVER_API_URL is not configured' };
  }

  try {
    const response = await fetch(`${backendBaseUrl}${path}`, {
      method: 'GET',
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(timeoutMs),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        data,
        message: getErrorMessage(data, response.statusText),
      };
    }

    return { ok: true, status: response.status, data };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'fetch failed',
    };
  }
}

const normalizeAssemblyResponse = (data: any): AssemblyItem[] => {
  const items = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.data?.items)
      ? data.data.items
      : Array.isArray(data?.response?.items)
        ? data.response.items
        : Array.isArray(data)
          ? data
          : [];

  return items
    .map((item: any) => ({
      id: Number(item?.id ?? item?.product_id ?? 0),
      name: item?.name ?? item?.product_name ?? item?.title,
      value: item?.value ?? item?.title,
      image: item?.image ?? item?.image_url ?? item?.thumbnail ?? item?.image?.link ?? '',
      price: Number(item?.special_price ?? item?.price ?? 0) || undefined,
    }))
    .filter((item: AssemblyItem) => item.id && item.name);
};

const normalizeProduct = (data: any) => {
  if (Array.isArray(data)) return data[0] ?? null;
  if (Array.isArray(data?.data)) return data.data[0] ?? null;
  if (Array.isArray(data?.response)) return data.response[0] ?? null;
  return data?.product ?? data?.data?.product ?? data?.response?.product ?? data?.response ?? data ?? null;
};

const getProductImage = (product: any) => {
  const images = Array.isArray(product?.images) ? product.images : [];
  const selectedImage =
    images.find((img: any) => img?.content?.small_image === 1) ||
    images.find((img: any) => img?.content?.base_image === 1) ||
    images[0];

  return (
    selectedImage?.content?.path ||
    selectedImage?.content?.link ||
    product?.image?.link ||
    product?.thumbnail ||
    product?.image ||
    ''
  );
};

const getProductPrice = (product: any) => {
  const price = product?.special_price ?? product?.price?.price ?? product?.price;
  return Number(price) || 0;
};

const extractAssemblyIdsFromProduct = (product: any) => {
  const rows = [
    ...(Array.isArray(product?.attributes) ? product.attributes : []),
    ...(Array.isArray(product?.short_attributes) ? product.short_attributes : []),
  ];

  const ignoredTitles = new Set(['برچسب محصول']);
  const uniqueIds = new Map<number, { id: number; title?: string }>();

  rows.forEach((row: any) => {
    const title = String(row?.title ?? '').trim();
    const value = String(row?.value ?? '').trim();

    if (!value || ignoredTitles.has(title)) return;

    const numericMatches = value.match(/\b\d{2,}\b/g) || [];

    numericMatches.forEach((match) => {
      const id = Number(match);
      if (!Number.isFinite(id) || id <= 0) return;
      uniqueIds.set(id, { id, title });
    });
  });

  return Array.from(uniqueIds.values());
};

async function fetchFallbackAssemblyItems(
  productId: string,
  headers: Record<string, string>
): Promise<BackendResult<{ items: AssemblyItem[]; total: number }>> {
  const parentResult = await fetchBackend(`/catalog/product/${productId}`, headers, 5500);

  if (!parentResult.ok) {
    return {
      ok: false,
      status: parentResult.status,
      message: parentResult.message,
    };
  }

  const parentProduct = normalizeProduct(parentResult.data);
  const assemblyIds = extractAssemblyIdsFromProduct(parentProduct);

  if (!assemblyIds.length) {
    return { ok: true, data: { items: [], total: 0 } };
  }

  const items: AssemblyItem[] = [];
  const concurrency = 4;

  for (let index = 0; index < assemblyIds.length; index += concurrency) {
    const chunk = assemblyIds.slice(index, index + concurrency);
    const chunkResults = await Promise.all(
      chunk.map(async ({ id, title }) => {
        const result = await fetchBackend(`/catalog/product/${id}`, headers, 5500);
        const product = result.ok ? normalizeProduct(result.data) : null;

        if (!product) {
          return {
            id,
            name: title || `قطعه ${id}`,
            value: title,
            image: '',
            price: 0,
          } satisfies AssemblyItem;
        }

        return {
          id: Number(product?.id ?? id),
          name: product?.name ?? product?.product_name ?? product?.title ?? title ?? `قطعه ${id}`,
          value: title,
          image: getProductImage(product),
          price: getProductPrice(product),
        } satisfies AssemblyItem;
      })
    );

    items.push(...chunkResults);
  }

  const total = items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  return { ok: true, data: { items, total } };
}

export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get('id')?.trim();

  if (!productId || !/^\d+$/.test(productId)) {
    return NextResponse.json(emptyAssemblyResponse(400, 'invalid product id'), {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const headers = await getAuthHeaders();

  // اول همان endpoint اصلی اسمبل را می‌زنیم. اگر بک‌اند 417/timeout داد،
  // قطعات را از روی attributeهای عددی محصول بازسازی می‌کنیم تا UI خالی نماند.
  const directResult = await fetchBackend(`/catalog/product/assembly?id=${productId}`, headers, 2800);
  const directItems = directResult.ok ? normalizeAssemblyResponse(directResult.data) : [];

  if (directItems.length) {
    const directTotal =
      Number((directResult.data as any)?.total ?? (directResult.data as any)?.data?.total) ||
      directItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

    return NextResponse.json(
      {
        ok: true,
        source: 'assembly-endpoint',
        ...(typeof directResult.data === 'object' && directResult.data ? directResult.data : null),
        items: directItems,
        total: directTotal,
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=600' },
      }
    );
  }

  const fallbackResult = await fetchFallbackAssemblyItems(productId, headers);
  const fallbackItems = fallbackResult.data?.items ?? [];

  if (fallbackItems.length) {
    return NextResponse.json(
      {
        ok: true,
        source: 'product-attribute-fallback',
        items: fallbackItems,
        total: fallbackResult.data?.total ?? 0,
        upstreamStatus: directResult.status,
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=600' },
      }
    );
  }

  console.warn('Assembly API fallback returned empty:', {
    productId,
    assemblyStatus: directResult.status,
    assemblyMessage: directResult.message,
    fallbackStatus: fallbackResult.status,
    fallbackMessage: fallbackResult.message,
  });

  return NextResponse.json(
    emptyAssemblyResponse(
      directResult.status || fallbackResult.status,
      directResult.message || fallbackResult.message,
      'empty-after-fallback'
    ),
    {
      status: 200,
      headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' },
    }
  );
}
