import Image from '../common/Image';
import { BlogPost } from './Blogs';
import { Time_Icon, Eye_Icon } from '../common/Icon';

const getFirstContentImage = (content?: string) => {
  if (!content) return '';

  const match = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] || '';
};

export default function SingleBlog({ post }: { post: BlogPost }) {
  const postDate = post?.published_at || post?.created_at || '';
  const readingTime = Math.max(1, Math.ceil((post?.content?.replace(/<[^>]+>/g, '').length || 0) / 1200));
  const articleImage = post?.cover || getFirstContentImage(post?.content);

  return (
    <article className="single-blog-article animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white shadow-2xl shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/35 lg:rounded-[1.6rem]">
        <div className="relative overflow-hidden bg-[radial-gradient(circle_at_82%_12%,rgba(56,107,249,0.18),transparent_28%),radial-gradient(circle_at_12%_0%,rgba(168,85,247,0.14),transparent_30%),linear-gradient(135deg,#ffffff_0%,#f8fbff_45%,#eef4ff_100%)] px-5 py-7 dark:bg-[radial-gradient(circle_at_82%_12%,rgba(56,107,249,0.20),transparent_28%),radial-gradient(circle_at_12%_0%,rgba(168,85,247,0.18),transparent_30%),linear-gradient(135deg,#071021_0%,#0f172a_48%,#08111f_100%)] sm:px-7 lg:px-9 lg:py-9">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-l from-transparent via-blue-400/60 to-transparent" />

          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
              {post?.category?.name && (
                <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-l from-blue-600 to-purple-600 px-4 py-2 text-[12px] font-black text-white shadow-lg shadow-blue-950/20">
                  <span className="h-2 w-2 rounded-full bg-white/90" />
                  {post.category.name}
                </span>
              )}
              <span className="rounded-full border border-slate-900/10 bg-white/75 px-4 py-2 text-[12px] font-bold text-slate-700 backdrop-blur-md dark:border-white/10 dark:bg-slate-950/45 dark:text-slate-200">
                OFFLAND MAG
              </span>
            </div>

            <h1 className="single-blog-title max-w-4xl text-center text-[30px] font-black leading-relaxed text-slate-950 drop-shadow-sm dark:text-white sm:text-[40px] lg:text-[52px]">
              {post?.title}
            </h1>

            {post?.short_content && (
              <p className="mt-5 max-w-3xl text-center text-[15px] leading-loose text-slate-700 dark:text-slate-300 lg:text-lg">
                {post.short_content.replace(/<[^>]+>/g, '')}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-[12px] text-slate-600 dark:text-slate-300 lg:text-[13px]">
              {post?.user && (
                <div className="flex items-center gap-2 rounded-full border border-slate-900/10 bg-white/75 px-3 py-2 backdrop-blur-md dark:border-white/10 dark:bg-slate-950/45">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-[11px] font-black text-white">
                    {post.user.charAt(0).toUpperCase()}
                  </span>
                  <span className="font-bold">{post.user}</span>
                </div>
              )}
              {postDate && (
                <div className="flex items-center gap-2 rounded-full border border-slate-900/10 bg-white/75 px-3 py-2 backdrop-blur-md dark:border-white/10 dark:bg-slate-950/45">
                  <Time_Icon className="h-4 w-4 text-blue-500" />
                  <time dateTime={postDate}>{new Date(postDate).toLocaleDateString('fa-IR')}</time>
                </div>
              )}
              <div className="flex items-center gap-2 rounded-full border border-slate-900/10 bg-white/75 px-3 py-2 backdrop-blur-md dark:border-white/10 dark:bg-slate-950/45">
                <svg className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{readingTime.toLocaleString('fa-IR')} دقیقه مطالعه</span>
              </div>
              {post?.view_count ? (
                <div className="flex items-center gap-2 rounded-full border border-slate-900/10 bg-white/75 px-3 py-2 backdrop-blur-md dark:border-white/10 dark:bg-slate-950/45">
                  <Eye_Icon className="h-4 w-4 text-emerald-500" />
                  <span>{post.view_count.toLocaleString('fa-IR')} بازدید</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {articleImage && (
          <div className="bg-white p-3 dark:bg-slate-900 sm:p-4">
            <Image
              src={articleImage}
              alt={post?.title || 'تصویر مقاله'}
              className="h-[240px] w-full rounded-[1rem] border border-slate-200/80 bg-slate-950 shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:shadow-black/25 sm:h-[340px] lg:h-[430px]"
              imgClass="!object-cover transition-transform duration-[1200ms] hover:scale-105"
              sizes="(min-width: 1024px) 72vw, 100vw"
              priority
            />
          </div>
        )}
      </section>
    </article>
  );
}
