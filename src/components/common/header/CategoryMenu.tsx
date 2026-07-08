'use client';
import { Category } from '@/types/Home';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from '@heroui/react';
import { useState, useTransition } from 'react';
import { MdKeyboardArrowLeft } from 'react-icons/md';
import { Arrow_Icon } from '../Icon';
import { useRouter } from 'next/navigation';
import Loading from '../Loading';
type Props = {
  className?: string;
  categories: Category[];
  onCategoryMenuOpen?: () => void;
  isLoading?: boolean;
};

export default function CategoryMenu({
  className,
  categories,
  onCategoryMenuOpen,
  isLoading,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [select, setSelect] = useState(0);
  const navigateCategory = (link: string) => {
    startTransition(() => {
      window.open(link, '_blank', 'noopener,noreferrer');
    });
  };
  return (
    <div>
      <Dropdown
        placement="bottom-end"
        size="lg"
        className="shadow_category h-[500px] overflow-hidden"
        classNames={{
          base: 'w-[1300px] !px-0',
          content: '!p-0',
        }}
        onOpenChange={(isOpen) => {
          if (isOpen && onCategoryMenuOpen) {
            onCategoryMenuOpen();
          }
        }}
      >
        <DropdownTrigger className="!relative !z-0">
          <Button className="bg-transparent !px-0">
            <div className={`flex w-fit items-center gap-3 ${className}`}>
              <span className="flex items-center gap-2">
                {isLoading ? (
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M7.24 2H5.34C3.15 2 2 3.15 2 5.33V7.23C2 9.41 3.15 10.56 5.33 10.56H7.23C9.41 10.56 10.56 9.41 10.56 7.23V5.33C10.57 3.15 9.42 2 7.24 2Z"
                      fill="#fff"
                    />
                    <path
                      opacity="0.4"
                      d="M18.6699 2H16.7699C14.5899 2 13.4399 3.15 13.4399 5.33V7.23C13.4399 9.41 14.5899 10.56 16.7699 10.56H18.6699C20.8499 10.56 21.9999 9.41 21.9999 7.23V5.33C21.9999 3.15 20.8499 2 18.6699 2Z"
                      fill="#fff"
                    />
                    <path
                      d="M18.6699 13.4301H16.7699C14.5899 13.4301 13.4399 14.5801 13.4399 16.7601V18.6601C13.4399 20.8401 14.5899 21.9901 16.7699 21.9901H18.6699C20.8499 21.9901 21.9999 20.8401 21.9999 18.6601V16.7601C21.9999 14.5801 20.8499 13.4301 18.6699 13.4301Z"
                      fill="#fff"
                    />
                    <path
                      opacity="0.4"
                      d="M7.24 13.4301H5.34C3.15 13.4301 2 14.5801 2 16.7601V18.6601C2 20.8501 3.15 22.0001 5.33 22.0001H7.23C9.41 22.0001 10.56 20.8501 10.56 18.6701V16.7701C10.57 14.5801 9.42 13.4301 7.24 13.4301Z"
                      fill="#fff"
                    />
                  </svg>
                )}

                <span className="font-medium text-[14px] text-white">دسته بندی‌ها</span>
              </span>

              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13.28 5.96667L8.9333 10.3133C8.41997 10.8267 7.57997 10.8267 7.06664 10.3133L2.71997 5.96667"
                  stroke="#fff"
                  strokeWidth="1.5"
                  strokeMiterlimit="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </Button>
        </DropdownTrigger>
        <DropdownMenu className="px-0" aria-label="Static Actions">
          <DropdownItem
            className="!cursor-default !px-0 data-[hover=true]:!bg-transparent"
            key="new"
          >
            <div className={`h-[500px] !overflow-y-auto`}>
              <div className="flex h-full gap-2 overflow-y-auto">
                <div className="custom_sidebar_category flex w-[200px] min-w-[200px] flex-col overflow-auto overflow-y-auto border-l border-gray-100">
                  {categories?.map((category, idx) => {
                    if (!category.status) return null;
                    return (
                      <button
                        onClick={() => navigateCategory(category.url)}
                        onMouseEnter={() => setSelect(idx)}
                        key={idx}
                        className={`flex !h-[60px] min-h-[50px] cursor-pointer items-center justify-between px-3 !font-medium !text-[14px] ${select === idx ? 'bg-main/10 text-main' : 'text-[#545A66]'}`}
                      >
                        <span className="flex items-center gap-2">
                          {
                            //  @ts-expect-error error
                            category.Icon && <category.Icon />
                          }
                          {category.title}
                        </span>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M9.99998 13.28L5.65331 8.9333C5.13998 8.41997 5.13998 7.57997 5.65331 7.06664L9.99998 2.71997"
                            stroke="#386BF9"
                            strokeWidth="1.5"
                            strokeMiterlimit="10"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    );
                  })}
                </div>
                <div
                  className={`flex w-full flex-col flex-wrap gap-2 overflow-y-auto !overflow-x-hidden ${Number(categories?.[select]?.children?.length) >= 50 ? 'h-[900px]' : 'h-full'}`}
                >
                  {categories?.[select]?.children?.map((category, idx: number) => {
                    if (!category.status) return null;
                    return (
                      <div key={idx} className="mx-3 mt-2 w-fit">
                        <button
                          onClick={() => navigateCategory(category.url)}
                          className="my-1 flex cursor-pointer items-center gap-2"
                        >
                          <div className="flex items-center gap-2">
                            <p
                              className={`text-wrap text-right font-reqular text-[14px] ${category.is_parent ? 'font-bold text-[#232429]' : 'font-regular text-[#7D8793] hover:text-main'}`}
                            >
                              {category.title}
                            </p>
                            {category.is_parent ? (
                              <MdKeyboardArrowLeft className="h-5 w-5 text-main" />
                            ) : null}
                          </div>

                          {category.is_parent ? (
                            <Arrow_Icon className="text-purple rotate-90" />
                          ) : null}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>

      {isPending && <Loading />}
    </div>
  );
}
