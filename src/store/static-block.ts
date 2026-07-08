import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type BearStore = {
  footer: string;
  setFooter: (footer: string) => void;
};

export const useStaticBlock = create<BearStore>()(
  persist(
    (set) => ({
      footer: '',
      setFooter: (footer: string) => set({ footer: footer }),
    }),
    {
      name: 'static-black', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
    }
  )
);
