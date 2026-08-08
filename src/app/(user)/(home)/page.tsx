import HomePage from '@/components/home/HomePage';
import { fetchHome } from './services/fetch-home';
import { jsonLdHome, generate_metadata_home } from '@/seo/home';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const generateMetadata = generate_metadata_home;

async function Home() {
  const data = await fetchHome();
  return (
    <>
      <script
        id="jsonld_home"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLdHome).replace(/\s+/g, ' ').trim(),
        }}
      />
      <main className="flex flex-col gap-7 lg:mt-5 lg:gap-9">
        <HomePage brands={data?.brands} page={data.page} />
      </main>
    </>
  );
}

export default Home;
