'use client';
import React, { useState, useEffect, useRef } from 'react';
import ScoresOpinionsUsers from './ScoresOpinionsUsers';
import QuestionAndAnswer from './QuestionAndAnswer';
import { Product } from '@/types/Home';
import ProductAttributesTable from './AttributesInformation';
import CategoryDescription from '../common/CategoryDescription';

type Props = {
  product: Product;
};

type TabKey = 'description' | 'attributes' | 'score' | 'question';

const ProductDetails = ({ product }: Props) => {
  // تعیین تب پیش‌فرض
  const getInitialTab = (): TabKey => {
    if (product.description) return 'description';
    if (product?.attributes?.length >= 1) return 'attributes';
    return 'score';
  };

  const [activeTab, setActiveTab] = useState<TabKey>(getInitialTab());
  const sectionRefs = useRef<Record<TabKey, HTMLDivElement | null>>(
    {} as Record<TabKey, HTMLDivElement | null>
  );

  // لیست تب‌ها
  const allTabs: Array<{ key: TabKey; title: string; show: boolean }> = [
    {
      key: 'description' as const,
      title: 'توضیحات محصول',
      show: !!product.description,
    },
    {
      key: 'attributes' as const,
      title: 'مشخصات محصول',
      show: product?.attributes?.length >= 1,
    },
    {
      key: 'score' as const,
      title: 'امتیاز و دیدگاه کاربران',
      show: true,
    },
    {
      key: 'question' as const,
      title: 'پرسش و پاسخ ها',
      show: true,
    },
  ];

  const tabs = allTabs.filter((tab) => tab.show);

  // Intersection Observer برای تشخیص کدام بخش در viewport است
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-120px 0px -40% 0px', // تب وقتی active میشه که بخش به این margin برسه
      threshold: [0, 0.1, 0.5],
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      // فقط entry هایی که isIntersecting هستن رو پردازش می‌کنیم
      const visibleEntries = entries.filter((entry) => entry.isIntersecting);

      if (visibleEntries.length > 0) {
        // اولین entry visible رو انتخاب می‌کنیم
        const firstVisible = visibleEntries[0];
        const tabKey = firstVisible.target.getAttribute('data-tab') as TabKey;
        if (tabKey) {
          setActiveTab(tabKey);
        }
      }
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // مشاهده تمام سکشن‌ها
    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      observer.disconnect();
    };
  }, [tabs]);

  // هندل کلیک روی تب برای اسکرول
  const handleTabClick = (tabKey: TabKey) => {
    const section = sectionRefs.current[tabKey];
    if (section) {
      const yOffset = -120; // فاصله از بالا (برای sticky header)
      const y = section.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="mt-8">
      {/* Sticky Tab headers */}
      <div className="sticky top-0 z-40 w-full rounded-lg bg-gradient-to-b from-gray-50 to-white py-3 shadow-md dark:from-[#0B0F19] dark:to-[#0B0F19]">
        <div className="container_page">
          <div className="relative flex w-full gap-2 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab.key)}
                className={`relative flex-shrink-0 whitespace-nowrap rounded-lg px-5 py-3 font-medium text-[14px] transition-all duration-300 lg:px-6 lg:py-3.5 lg:text-[15px] ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-white text-gray-700 shadow-sm hover:bg-blue-50 hover:text-blue-600 hover:shadow-md'
                }`}
              >
                {tab.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content sections - نمایش همه به صورت زیر هم */}
      <div className="mt-6 flex flex-col gap-6">
        {product.description && (
          <div
            ref={(el) => {
              sectionRefs.current['description'] = el;
            }}
            data-tab="description"
            className="scroll-mt-28 rounded-lg border border-gray-200 bg-white p-4 lg:p-6"
          >
            <h2 className="mb-4 flex items-center gap-2 border-b border-gray-200 pb-3 font-bold text-[16px] text-gray-900 lg:text-[18px]">
              <svg
                className="h-5 w-5 text-blue-600 lg:h-6 lg:w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              توضیحات محصول
            </h2>
            <CategoryDescription description={product.description} showButton />
          </div>
        )}

        {product?.attributes?.length >= 1 && (
          <div
            ref={(el) => {
              sectionRefs.current['attributes'] = el;
            }}
            data-tab="attributes"
            className="scroll-mt-28 rounded-lg border border-gray-200 bg-white p-4 lg:p-6"
          >
            <h2 className="mb-4 flex items-center gap-2 border-b border-gray-200 pb-3 font-bold text-[16px] text-gray-900 lg:text-[18px]">
              <svg
                className="h-5 w-5 text-green-600 lg:h-6 lg:w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
              مشخصات محصول
            </h2>
            <ProductAttributesTable product={product} />
          </div>
        )}

        <div
          ref={(el) => {
            sectionRefs.current['score'] = el;
          }}
          data-tab="score"
          className="scroll-mt-28 rounded-lg border border-gray-200 bg-white p-4 lg:p-6"
        >
          <h2 className="mb-4 flex items-center gap-2 border-b border-gray-200 pb-3 font-bold text-[16px] text-gray-900 lg:text-[18px]">
            <svg
              className="h-5 w-5 text-yellow-500 lg:h-6 lg:w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
            امتیاز و دیدگاه کاربران
          </h2>
          <ScoresOpinionsUsers product={product} />
        </div>

        <div
          ref={(el) => {
            sectionRefs.current['question'] = el;
          }}
          data-tab="question"
          className="scroll-mt-28 rounded-lg border border-gray-200 bg-white p-4 lg:p-6"
        >
          <h2 className="mb-4 flex items-center gap-2 border-b border-gray-200 pb-3 font-bold text-[16px] text-gray-900 lg:text-[18px]">
            <svg
              className="h-5 w-5 text-purple-600 lg:h-6 lg:w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            پرسش و پاسخ ها
          </h2>
          <QuestionAndAnswer product={product} />
        </div>
      </div>
      {/* <div className='hidden lg:block'>
                <div className="w-full h-16 bg-neutral-50 flex items-center px-3 gap-5 rounded-2xl border border-zinc-100" >
                    {
                        components.map((detail, idx) => {
                            if(product?.attributes === null && idx===0) return null 
                            return <Button onClick={() => setSelect(idx)} key={idx}  className={`w-fit h-12 rounded-lg !px-3 ${select === idx?"bg-main":""}`} >
                                <span className={`text-center -900 text-md font-bold ${select === idx ? "text-white" : "text-neutral-900"}`}>{detail.name}</span>
                            </Button>
                        })
                    }
                </div>
                <div className='mt-10'>
                    {select === 0 ? <Information product={product} /> : null}
                    {select === 1 ? <ScoresOpinionsUsers product={product} /> : null}
                    {select === 2 ? <QuestionAndAnswer product={product} /> : null}
                </div>
            </div>

            <div className='flex flex-col gap-3 lg:hidden'>
                {
                    components.map((item, idx) => {
                        if (idx === 0) return null
                        return (
                            <Accordion key={idx}>
                                <AccordionItem
                                    style={{ backgroundColor: "#f5f5f5" }}
                                    indicator={<Arrow_Icon className="text-black" size="16" />}
                                    
                                    aria-controls="panel1a-content"
                                    id="panel1a-header"
                                >
                                    <p className='font-medium text-[14px]'>{item.name}</p>
                                </AccordionItem>
                                
                            </Accordion>
                        )
                    })
                }
            </div> */}
    </div>
  );
};

export default ProductDetails;
