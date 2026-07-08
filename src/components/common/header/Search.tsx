'use client';
import React, { useState, useRef, useEffect, useTransition } from 'react';
import { Input, Spinner } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useSerach } from '@/hooks/common/useSerach';
import { Arrow_back_mobile, Search_Icon } from '../Icon';
import BoxCardProduct from './BoxCardProduct';
import { Product } from '@/types/Home';
import Button from '../Button';
import { useMedia } from 'react-use';
import { CgClose } from 'react-icons/cg';
import Loading from '../Loading';

export default function Search() {
  const isMobile = useMedia('(max-width: 480px)', false);

  const [isVisible, setIsVisible] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [inputValue, setInputValue] = useState<string>('');
  const [debouncedValue, setDebouncedValue] = useState<string>('');

  const { isLoading, data, isSuccess } = useSerach({
    search: debouncedValue,
    type: 'search',
  });
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounce input value
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(inputValue);
    }, 500); // 500ms delay

    return () => {
      clearTimeout(timer);
    };
  }, [inputValue]);

  const handleClickOutside = (event: MouseEvent) => {
    if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, []);

  // const isVisible = inputValue.length >= 3;
  const onValueChange = (value: string) => {
    setInputValue(value);
    if (value.length >= 2) return setIsVisible(true);
    if (!isMobile) {
      setIsVisible(false);
    }
  };

  // @ts-expect-error formik
  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      startTransition(() => {
        setIsVisible(false);
        router.push(`/result?q=${inputValue}`);
      });
    }
  };
  // const serachResult: Serach = data?.data?.data
  const onClose = () => setIsVisible(false);

  const onRedirect = (url: string) => {
    startTransition(() => {
      router.push(url);
      setInputValue('');
      setDebouncedValue('');
      onClose();
    });
  };

  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    // اطمینان از اینکه هنگام خروج از کامپوننت، overflow به حالت عادی برمی‌گرده
    return () => {
      document.body.style.overflow = '';
    };
  }, [isVisible]);
  if (isPending) return <Loading />;
  return (
    <div className="w-full">
      <Button className="w-fit min-w-fit lg:!hidden" onClick={() => setIsVisible(true)}>
        <span>
          <svg
            width="25"
            height="25"
            viewBox="0 0 23 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="8.5" cy="8.50041" r="7.5" stroke="#A6AFB9" strokeWidth="2" />
            <line
              x1="16.0931"
              y1="15.5377"
              x2="20.6682"
              y2="19.8082"
              stroke="#A6AFB9"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </Button>
      <div
        ref={searchRef}
        className={`min-w-full !rounded-t-lg lg:border ${
          isVisible
            ? 'fixed -left-[1px] top-0 !z-[9999] h-[95vh] w-full lg:relative lg:h-fit lg:border-none'
            : 'relative hidden border-transparent lg:block lg:h-fit'
        }`}
      >
        <Input
          value={inputValue}
          onValueChange={(value: string) => onValueChange(value)}
          startContent={<Search_Icon className="h-6 w-6 stroke-[#616A76]" />}
          endContent={
            inputValue.length >= 2 || isMobile ? (
              <Button
                onClick={() => {
                  setInputValue('');
                  setDebouncedValue('');
                  setIsVisible(false);
                }}
                className="w-fit min-w-fit"
              >
                <CgClose className="h-6 w-6 text-[#616A76]" />
              </Button>
            ) : null
          }
          className="mx-auto mt-2 w-[95%] lg:w-full"
          classNames={{
            inputWrapper: `!h-[48px] !bg-[#E4E7E9] hover:!bg-[#E4E7E9] data-[hover=true]:!bg-[#E4E7E9] group-data-[hover=true]:!bg-[#E4E7E9] !ring-0 !outline-none !shadow-none focus:!outline-none focus:!border-transparent focus:!shadow-none group-data-[focus=true]:!ring-0 group-data-[focus=true]:!outline-none group-data-[focus=true]:!shadow-none group-data-[focus=true]:!border-transparent group-data-[focus-visible=true]:!outline-none group-data-[focus-visible=true]:!shadow-none group-data-[focus-visible=true]:!border-transparent ${
              isVisible
                ? 'group-data-[has-value=true]:bg-[#E4E7E9]'
                : '!bg-[#E4E7E9] !border !border-gray-200'
            }`,
            input:
              'font-medium !rounded-none lg:!rounded-lg !border-none !ring-0 !outline-none focus:!border-none focus:!ring-0 focus:!outline-none focus-visible:!outline-none group-data-[focus=true]:!border-none group-data-[focus-visible=true]:!border-none',
          }}
          placeholder="جستجو"
          //   isClearable={true}
          //   onClear={() => {
          //     setInputValue("");
          //     setIsVisible(false);
          //   }}
          onKeyDown={onKeyDown}
        />
        {isVisible && (
          <div className="custom_sidebar absolute left-1/2 top-16 !z-[9999] h-full min-h-[200px] w-full -translate-x-1/2 overflow-auto rounded-b-sm bg-white px-2 py-3 !pb-32 lg:top-12 lg:h-fit lg:max-h-[556px] lg:!pb-0">
            {isLoading || inputValue !== debouncedValue ? (
              <Spinner className="mx-auto mt-10 w-full" size="lg" />
            ) : isSuccess ? (
              <>
                <div className="z-50 flex w-full flex-col gap-5 lg:p-4">
                  {data?.categories?.length >= 1 && (
                    <div className="h-full w-full overflow-auto">
                      {/* title */}
                      <div className="h-10 w-full rounded-lg bg-zinc-100 px-2">
                        <span className="text-right font-medium text-sm leading-10 text-neutral-900">
                          دسته بندی ها
                        </span>
                      </div>

                      {/* result */}
                      {data?.categories?.length >= 1 ? (
                        <div className="my-4 flex flex-wrap gap-4 pr-1">
                          {data?.categories?.map(
                            (category: { name: string; link: string }, idx: number) => (
                              <Button
                                key={idx}
                                onClick={() => onRedirect(category.link)}
                                className="!h-fit w-fit min-w-fit rounded-lg border border-gray-200 !p-2 text-right font-medium text-sm text-neutral-400 transition-all duration-300 hover:text-blue-500"
                              >
                                {category.name}
                              </Button>
                            )
                          )}
                        </div>
                      ) : (
                        <span className="mt-7 block w-full text-center font-medium">
                          دسته بندی یافت نشد
                        </span>
                      )}
                    </div>
                  )}
                  <div className="h-full w-full overflow-auto">
                    {/* title */}
                    <div className="flex h-10 w-full items-center justify-between rounded-lg bg-zinc-100 px-2">
                      <span className="text-right font-medium text-sm leading-10 text-neutral-900">
                        محصولات مربوطه
                      </span>
                      <Button
                        className="!h-fit !w-fit text-main"
                        onClick={() => onRedirect(`/result?q=${inputValue}`)}
                      >
                        مشاهده همه محصولات
                        <Arrow_back_mobile className="h-3 w-3 rotate-180 stroke-main" />
                      </Button>
                    </div>
                    {/* result */}
                    {data?.products?.length >= 1 ? (
                      <div className="my-4 grid gap-4 lg:grid-cols-2">
                        {data?.products?.map((product: Product, idx: number) => (
                          <BoxCardProduct
                            product={product}
                            key={idx}
                            onClick={() => onRedirect(`/product/${product?.id}/${product?.name}`)}
                            priceEnd
                            showAction={false}
                          />
                        ))}
                      </div>
                    ) : (
                      <span className="mt-7 block w-full text-center font-medium">
                        محصولی یافت نشد
                      </span>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
      {isVisible && (
        <div className="fixed left-0 top-[16vh] !z-[8888] hidden h-full w-full bg-[#0C0C0C99] bg-opacity-60 backdrop-blur-[1px] lg:block"></div>
      )}
    </div>
  );
}
