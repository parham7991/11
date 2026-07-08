import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// تعریف اینترفیس برای آیتمهای سبد خرید
interface CartItem {
  id: number;
  total: number;
  qty: number;
  items: unknown;
}

// تعریف نوع برای state سبد خرید
interface CartState {
  total: number;
  qty: number;
  items: CartItem[];
}

// اینترفیس اصلی استور
interface CartStore {
  carts: CartState;
  addNewProduct: (newProduct: CartItem) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      carts: {
        total: 0,
        qty: 0,
        items: [],
      },
      addNewProduct: (newProduct) =>
        set((state) => ({
          carts: {
            total: state.carts.total + 1, // منطق محاسبه مجموع را اینجا اعمال کنید
            qty: state.carts.qty + 1,
            items: [...state.carts?.items, newProduct],
          },
        })),
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
