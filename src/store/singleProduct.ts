import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
type Option =
  | {
      title?: string | undefined;
      code?: string | undefined;
      type_id: number;
      price: string;
      options: {
        detail: {
          title: string;
        };
      };
    }
  | undefined;
type SingeProduct = {
  selectOption: Option[] | [];
  onSelectOption: (options: Option[]) => void;
  qty: number;
  onQty: (qty: number) => void;
};

const useSingleProduct = create<SingeProduct>()(
  devtools(
    immer((set) => ({
      selectOption: [],
      qty: 1,
      onSelectOption: (options) => {
        set((state) => {
          state.selectOption = options;
        });
      },
      onQty: (num) => {
        set((state) => {
          state.qty = num;
        });
      },
    }))
  )
);

export default useSingleProduct;
