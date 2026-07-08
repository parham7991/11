import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const path = searchParams.get('path');
  const tag = searchParams.get('tag');
  const type = searchParams.get('type') || 'page';

  // بررسی اینکه حداقل یکی از path یا tag ارسال شده باشد
  if (!path && !tag) {
    return Response.json(
      {
        success: false,
        message: 'path or tag parameter is required',
        usage: 'استفاده: /api/revalidate?path=/your-path یا /api/revalidate?tag=your-tag',
        examples: [
          '/api/revalidate?path=/',
          '/api/revalidate?tag=home_page',
          '/api/revalidate?path=/&tag=home_page',
          '/api/revalidate?path=/product/123',
          '/api/revalidate?tag=products',
          '/api/revalidate?path=/category/electronics&tag=products',
        ],
      },
      { status: 400 }
    );
  }

  try {
    const revalidated: string[] = [];

    // Revalidate کردن path
    if (path) {
      revalidatePath(path, type as 'page' | 'layout');
      revalidated.push(`path: ${path} (type: ${type})`);
    }

    // Revalidate کردن tag
    if (tag) {
      revalidateTag(tag, 'default');
      revalidated.push(`tag: ${tag}`);
    }

    return Response.json(
      {
        success: true,
        message: 'به‌روزرسانی با موفقیت انجام شد',
        data: {
          revalidated,
          path: path || undefined,
          tag: tag || undefined,
          type: path ? type : undefined,
          revalidatedAt: new Date().toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Revalidate error:', error);
    return Response.json(
      {
        success: false,
        message: 'به‌روزرسانی با خطا مواجه شد',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
