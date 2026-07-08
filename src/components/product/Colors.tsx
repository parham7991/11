'use client';
import useSingleProduct from '@/store/singleProduct';
import React from 'react';
import { Check_Icon } from '../common/Icon';
type Option = {
  type_id: number;
  options: {
    detail: {
      title: string;
    };
    rows: {
      code: string;
      color: string;
      title: string;
    }[];
  };
};
type Props = {
  options: Option[];
};
const Colors = ({ options }: Props) => {
  if (!options?.length || !options.some((opt) => opt.type_id === 5)) {
    return null;
  }
  const { selectOption, onSelectOption } = useSingleProduct();
  const color = selectOption?.find((option) => Number(option?.type_id) === 5);
  const onSelect = (option: { type_id: Option }) => {
    if (color?.type_id === Number(option.type_id)) {
      const filterOptions = selectOption.filter((option) => option?.type_id !== 5);
      return onSelectOption(filterOptions);
    }
    // @ts-expect-error error
    onSelectOption([...selectOption, option]);
  };
  return (
    <div className="flex flex-col gap-2">
      {Array.isArray(options)
        ? options.map((option, idx) => {
            if (option.type_id === 5) {
              return (
                <>
                  <span className="text-right font-medium text-base text-black">
                    {option?.options?.detail?.title} : {color?.title}{' '}
                  </span>
                  <div className="flex items-center gap-3">
                    {option?.options?.rows.map((row) => (
                      <button
                        //   @ts-expect-error error
                        onClick={() => onSelect({ type_id: option.type_id, ...row })}
                        style={{ background: row.color }}
                        key={idx}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border-2 border-zinc-200"
                      >
                        {color?.title === row.title && (
                          <Check_Icon
                            size="13"
                            className={`${row.title === 'مشکی' ? 'text-white' : 'text-white'}`}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              );
            }
          })
        : null}
    </div>
  );
};

export default Colors;
