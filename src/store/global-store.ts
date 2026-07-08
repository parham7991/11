import { Category } from '@/types/Home';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
type VerifyDelete = {
  title?: string;
  updateCache?: string;
  open: boolean;
  url?: string;
  description?: string;
  info?: string;
};
type GlobalStore = {
  comingSoon: boolean;
  verifyDelete: VerifyDelete;
  isPendingCategory: boolean;
  logout: boolean;
  categories: Category[] | null;
  setVerifyDelete: (data: VerifyDelete) => void;
  setCategories: (categories: Category[]) => void;
  setLogout: () => void;
  setIsPendingCategory: (isPendingCategory: boolean) => void;
  setComingSoon: (value: boolean) => void;
};

const useGlobalStore = create<GlobalStore>()(
  devtools(
    immer((set) => ({
      comingSoon: false,
      verifyDelete: {
        open: false,
        title: '',
        updateCache: '',
        url: '',
        description: '',
      },
      isPendingCategory: false,
      logout: false,
      categories: null,
      user: null,
      setVerifyDelete: (data) => {
        set((state) => {
          state.verifyDelete = data;
        });
      },
      setLogout: () => {
        set((state) => {
          state.logout = !state.logout;
        });
      },
      setCategories: (categories) => {
        set((state) => {
          state.categories = categories;
        });
      },
      setIsPendingCategory: (isPendingCategory) => {
        set((state) => {
          state.isPendingCategory = isPendingCategory;
        });
      },
      setComingSoon: (value) => {
        set((state) => {
          state.comingSoon = value;
        });
      },
    }))
  )
);

export default useGlobalStore;
