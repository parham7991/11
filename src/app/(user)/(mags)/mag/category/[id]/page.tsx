import React from 'react';
import { request } from '@/lib/client';
import { Metadata } from 'next';
import Article from '@/components/blogs/Article';
import Pagination from '@/components/product/Pagination';
import EmptyOrder from '@/components/empty/EmptyOrder';
import { BASEURL_SITE } from '@/lib/variable';

export const dynamic = 'force-dynamic';

type CategoryItem = {
  id: number | string;
  name: string;
};

type PostItem = {
  id: number;
  slug: string;
  title: string;
  cover?: string;
  short_content?: string;
  created_at?: string;
  published_at?: string;
  category?: {
    id: number;
    name: string;
  };
};

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const parsePaginated = (res: any) => {
  const original = res?.original ?? res;
  const dataArray = Array.isArray(original?.data) ? original.data : Array.isArray(res) ? res : [];
  const meta = {
    current_page: Number(original?.current_page ?? original?.meta?.current_page ?? 1),
    last_page: Number(original?.last_page ?? original?.meta?.last_page ?? 1),
    total: Number(original?.total ?? original?.meta?.total ?? dataArray.length),
    per_page: Number(original?.per_page ?? original?.meta?.per_page ?? dataArray.length),
  };
  return { dataArray, meta };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const categoriesRes = await request({
      url: '/mag/categories',
      method: 'GET',
      cache: 'no-store',
    });

    const categories = Array.isArray(categoriesRes) ? categoriesRes : categoriesRes?.data || [];

    const foundCategory = categories.find((cat: CategoryItem) => String(cat.id) === String(id));

    if (foundCategory) {
      return {
        title: `مقالات دسته ${foundCategory.name} | مجله آفلند`,
        description: `مقالات و مطالب مرتبط با دسته ${foundCategory.name}`,
        openGraph: {
          title: `مقالات دسته ${foundCategory.name}`,
          description: `مقالات و مطالب مرتبط با دسته ${foundCategory.name}`,
          url: `${BASEURL_SITE}/mag/category/${id}`,
        },
        alternates: {
          canonical: `${BASEURL_SITE}/mag/category/${id}`,
        },
      };
    }
  } catch (error) {
    console.error('[generateMetadata] Error:', error);
  }

  return {
    title: 'مقالات | مجله آفلند',
    description: 'مقالات و مطالب مجله آفلند',
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { id: categoryId } = await params;
  const searchParamsResolved = await searchParams;
  const page = Number(searchParamsResolved.page || 1);

  try {
    const qp = new URLSearchParams();
    qp.set('category_id', String(categoryId));
    qp.set('page', String(page));
    qp.set('per_page', '16');

    const url = `/mag/posts?${qp.toString()}`;

    const [categoriesRes, postsRes] = await Promise.all([
      request({ url: '/mag/categories', method: 'GET', cache: 'no-store' }),
      request({ url, method: 'GET', cache: 'no-store' }),
    ]);

    // پیدا کردن نام دسته
    const categories = Array.isArray(categoriesRes) ? categoriesRes : categoriesRes?.data || [];

    const foundCategory = categories.find(
      (cat: CategoryItem) => String(cat.id) === String(categoryId)
    );

    // پردازش پست‌ها
    const { dataArray: posts, meta } = parsePaginated(postsRes);
    const { last_page, total } = meta;

    return (
      <div className="container_page py-6 lg:py-10">
        {/* Header */}
        <div className="mb-6 lg:mb-10">
          <h1 className="font-bold text-2xl text-gray-900 lg:text-3xl">
            {foundCategory ? `مقالات دسته ${foundCategory.name}` : 'مقالات'}
          </h1>
          {total > 0 && (
            <p className="mt-2 font-reqular text-sm text-gray-600 lg:text-base">
              {total} مقاله یافت شد
            </p>
          )}
        </div>

        {/* Posts Grid */}
        {posts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {posts.map((item: PostItem) => (
                <Article
                  key={item.id}
                  cardarticle={{
                    slug: item.slug,
                    id: item.id,
                    img: item.cover || '',
                    title: item.title,
                    type: item.category?.name || 'مقاله',
                    date: item.published_at || item.created_at || '',
                    short_des: item.short_content,
                  }}
                  className="flex flex-col gap-3 rounded-xl border-2 border-gray-100 bg-white p-3 shadow-md transition-all duration-500 hover:border-blue-200 lg:gap-4 lg:p-4"
                  classNameImg="w-full h-[160px] lg:h-[180px] !overflow-hidden object-cover !rounded-xl shadow-md"
                  classNametype="bg-gradient-to-r from-blue-600 to-purple-600 text-white lg:text-[12px] text-[11px] font-medium lg:px-3 px-2.5 py-1.5 !rounded-lg shadow-md"
                  classNamedate="text-gray-500 font-reqular text-[12px] lg:text-[13px]"
                  classNametitle="text-gray-900 font-bold lg:text-[15px] text-[14px] text-justify leading-snug"
                />
              ))}
            </div>

            {/* Pagination */}
            {last_page > 1 && (
              <div className="mt-10">
                <Pagination total={last_page} className="mt-10" />
              </div>
            )}
          </>
        ) : (
          <div className="py-10">
            <EmptyOrder />
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('[CategoryPage] Error fetching posts:', error);

    return (
      <div className="container_page py-6 lg:py-10">
        <div className="mb-6 lg:mb-10">
          <h1 className="font-bold text-2xl text-gray-900 lg:text-3xl">مقالات</h1>
        </div>
        <div className="py-10">
          <EmptyOrder />
        </div>
      </div>
    );
  }
}
