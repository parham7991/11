import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';

type Checkout = {
  reciverAddress: {
    id: number | null;
  };
  how_to_send: {
    id: number | null;
    price: number | null;
    description?: string;
  };
  payment_methood: {
    id: number | null;
  };
};

type PartialCheckout = Partial<Checkout>; // برای آپدیت فقط بخشی از اطلاعات

type CheckoutStore = {
  checkout: Checkout;
  setCheckout: (data: PartialCheckout) => void;
};

const useCheckoutStore = create<CheckoutStore>()(
  devtools(
    immer((set) => ({
      checkout: {
        reciverAddress: {
          id: null,
        },
        how_to_send: {
          id: null,
          price: null,
        },
        payment_methood: {
          id: null,
        },
      },
      setCheckout: (data) => {
        set((state) => {
          state.checkout = {
            ...state.checkout,
            ...data,
          };
        });
      },
    }))
  )
);

export default useCheckoutStore;
