import React from 'react';
import BaseDialog from '../common/BaseDialog';
import Button from '../common/Button';
type Props = {
  options?: {
    title: string;
    id: string;
  }[];
  searchParams: {
    attribiutes?: string;
    available?: string;
    discounted?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    search?: string;
  };
  openSort: boolean;
  onToggleSort: () => void;
  onSort: (sort: string) => void;
};
const SortModal = ({ searchParams, openSort, onToggleSort, onSort, options }: Props) => {
  return (
    <BaseDialog
      isOpen={openSort}
      title="مرتب سازی بر اساس"
      // className="bg-[#F5F6FA]"
      onClose={onToggleSort}
    >
      <div className="category-sort-modal flex flex-col items-center rounded-xl bg-white px-2">
        {options?.map((sort, idx) => (
          <Button
            onClick={() => onSort(sort.id)}
            className={`font-regular w-full justify-between text-[#232429]`}
            key={idx}
          >
            <span className="!text-[16px]">{sort.title}</span>
            <span>
              {searchParams.sort === sort.id && (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12.6673 4.79163L6.25065 11.2083L3.33398 8.29163"
                    stroke="#616A76"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
          </Button>
        ))}
      </div>
    </BaseDialog>
  );
};

export default SortModal;
