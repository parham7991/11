'use client';
import { HomePage as HomePageType } from '@/types/Home';
import { useEffect } from 'react';
import TopSlider from './TopSlider';
import Template1 from './Template1';
import Template from './Template';
import Slider from '../common/Slider';
import Banners from '../common/Banners';
import SpecialSection from './SpecialSection';
import Carousel from '../common/Carousel';
import FeaturedCarousel from '../common/FeaturedCarousel';
import Brands from './Brands';
import CategoryDescription from '../common/CategoryDescription';
import HomeArticles from './HomeArticles';
const HomePage = ({
  page,
  brands,
  showDescription = true,
  showMag = true,
}: {
  page: HomePageType;
  brands?: { status: boolean; logo: string; title: string }[];
  showDescription?: boolean;
  showMag?: boolean;
}) => {
  useEffect(() => {
    scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, []);

  const findStatic = Array.isArray(page) ? page?.find((item) => item.type === 'static_html') : null;
  return (
    <div className="flex flex-col gap-10">
      {Array.isArray(page) &&
        page?.map((pageItem, idx) => {
          if (pageItem.type === 'sliderproduct')
            return <TopSlider key={idx} showProduct={true} html={pageItem as any} />;

          if (pageItem.type === 'story') return <Template1 key={idx} story={pageItem as any} />;

          if (pageItem.type === 'slider') return <Slider key={idx} sliders={pageItem?.images} />;

          if (pageItem.type === 'banner')
            return <Banners key={idx} banners={pageItem?.images || []} />;

          if ((pageItem as any).type === 'template')
            return <Template key={idx} story={pageItem as any} />;

          if (pageItem.type === 'megashop')
            return (
              <SpecialSection
                key={idx}
                vitrinId={Number(pageItem?.id)}
                products={pageItem as any}
              />
            );

          if (pageItem.type === 'vitrin') {
            const isFeatured =
              pageItem?.title?.includes('ویژه') || pageItem?.title?.includes('پیشنهاد');
            const CarouselComponent = isFeatured ? FeaturedCarousel : Carousel;

            return (
              <CarouselComponent
                key={idx}
                vitrinId={Number(pageItem?.id)}
                products={Array.isArray(pageItem?.products) ? pageItem?.products : []}
                title={pageItem?.title}
              />
            );
          }

          return null;
        })}

      <Brands brands={brands} />
      {showMag && <HomeArticles />}
      {findStatic && (
        <CategoryDescription
          showButton={showDescription}
          className="!mt-0"
          description={findStatic?.content?.static_html}
        />
      )}
    </div>
  );
};

export default HomePage;
