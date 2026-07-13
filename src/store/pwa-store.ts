'use client';

import { create } from 'zustand';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PWAStore {
  deferredPrompt: BeforeInstallPromptEvent | null;
  setDeferredPrompt: (e: BeforeInstallPromptEvent | null) => void;
  /** اگر رویداد نصب موجود باشد آن را اجرا می‌کند؛ در غیر این صورت false برمی‌گرداند. */
  install: () => Promise<boolean>;
}

export const usePWAStore = create<PWAStore>((set, get) => ({
  deferredPrompt: null,
  setDeferredPrompt: (e) => set({ deferredPrompt: e }),
  install: async () => {
    const e = get().deferredPrompt;
    if (!e) return false;
    try {
      await e.prompt();
      const choice = await e.userChoice;
      if (choice?.outcome === 'accepted') {
        set({ deferredPrompt: null });
        return true;
      }
    } catch {
      /* نادیده گرفته می‌شود */
    }
    return false;
  },
}));
