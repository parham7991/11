export const dynamic = 'force-dynamic';
import SingleBlog from '@/components/blogs/SingleBlog';
import { request } from '@/lib/client';
import { Metadata } from 'next';
import Script from 'next/script';
import { generate_metadata_magPost, jsonLdArticle } from '@/seo/mag';
import FeaturedPosts from '@/components/blogs/FeaturedPosts';
import CategoryDescription from '@/components/common/CategoryDescription';
import TableOfContents from '@/components/blogs/TableOfContents';
import ShortNewsSection from '@/components/blogs/ShortNewsSection';
import SingleBlogADS from '@/components/blogs/SingleBlogADS';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const mag = await request({ url: `/mag/post/${id}` });
  const post = mag?.post || {};
  return generate_metadata_magPost(post, id);
}

export default async function Singleblog({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [mag, shortNewsResponse] = await Promise.all([
    request({ url: `/mag/post/${id}` }),
    request({
      url: '/mag/news?short_news=1&per_page=4',
      method: 'GET',
    }).catch(() => null),
  ]);

  const post = mag?.post;
  const shortNewsData = shortNewsResponse?.data || [];
  const jsonLd = jsonLdArticle(post, id);

  return (
    <>
      <Script
        id="mag-article-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="relative bg-[#f6f8fc] text-slate-950 dark:bg-slate-950 dark:text-slate-100">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_82%_10%,rgba(56,107,249,0.14),transparent_32%),radial-gradient(circle_at_14%_0%,rgba(168,85,247,0.12),transparent_30%)] dark:bg-[radial-gradient(circle_at_82%_10%,rgba(56,107,249,0.10),transparent_32%),radial-gradient(circle_at_14%_0%,rgba(168,85,247,0.09),transparent_30%)]" />

        <div className="container_page relative py-6 lg:py-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)_280px] xl:grid-cols-[340px_minmax(0,1fr)_300px] xl:gap-8">
            <aside className="order-3 space-y-5 lg:order-1 lg:self-start">
              <div className="space-y-5 lg:sticky lg:top-52">
                <FeaturedPosts />
                <SingleBlogADS />
              </div>
            </aside>

            <section className="order-1 min-w-0 space-y-7 lg:order-2 lg:space-y-8">
              <SingleBlog post={post} />

              <div className="lg:hidden">
                <TableOfContents content={post?.content || ''} />
              </div>

              <article className="single-blog-content-card relative rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-200/60 dark:border dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:shadow-2xl dark:shadow-black/50">
                <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/2 rounded-full bg-gradient-to-br from-blue-400/10 to-transparent blur-3xl" />
                <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 translate-x-1/2 translate-y-1/2 rounded-full bg-gradient-to-tr from-purple-400/10 to-transparent blur-3xl" />
                <div className="h-1 w-full rounded-t-[2rem] bg-gradient-to-l from-blue-500 via-purple-500 to-pink-500" />
                <div className="relative">
                  <CategoryDescription
                    className="single-blog-prose prose prose-slate dark:prose-invert prose-img:mx-auto prose-img:my-8 prose-img:block prose-img:h-auto prose-img:max-w-full prose-img:rounded-2xl prose-img:shadow-xl !h-fit !w-full !max-w-none px-5 py-6 text-lg leading-loose text-slate-800 dark:text-slate-200 lg:px-10 lg:py-10"
                    showButton={false}
                    description={post?.content as string}
                  />
                </div>
              </article>

              <SingleBlogADS />

              {shortNewsData && shortNewsData.length > 0 && (
                <ShortNewsSection shortNews={shortNewsData} />
              )}

              <div className="flex justify-center pb-4">
                <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-8 py-4 text-slate-700 shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <svg className="h-6 w-6 text-blue-500 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-bold text-[14px]">پایان مقاله</span>
                </div>
              </div>
            </section>

            <aside className="order-2 hidden lg:order-3 lg:block lg:self-start lg:sticky lg:top-52">
              <TableOfContents content={post?.content || ''} />
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
