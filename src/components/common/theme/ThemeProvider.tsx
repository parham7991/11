'use client';

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

type ThemeMode = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

type ThemeContextValue = {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = 'offland-theme-mode';
const modes: ThemeMode[] = ['light', 'dark', 'system'];

const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const getStoredMode = (): ThemeMode => {
  if (typeof window === 'undefined') return 'dark';
  try {
    const storedMode = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    return storedMode && modes.includes(storedMode) ? storedMode : 'dark';
  } catch {
    return 'dark';
  }
};

const updateThemeColorMeta = (resolvedTheme: ResolvedTheme) => {
  if (typeof document === 'undefined') return;
  const themeColor = resolvedTheme === 'dark' ? '#070b16' : '#ffffff';
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = themeColor;
};

const applyTheme = (mode: ThemeMode, resolvedTheme: ResolvedTheme) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('dark', resolvedTheme === 'dark');
  root.dataset.theme = resolvedTheme;
  root.dataset.themeMode = mode;
  root.style.colorScheme = resolvedTheme;
  updateThemeColorMeta(resolvedTheme);
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark');
  const [mounted, setMounted] = useState(false);

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextMode);
    } catch {}
    const nextResolvedTheme = nextMode === 'system' ? getSystemTheme() : nextMode;
    setResolvedTheme(nextResolvedTheme);
    applyTheme(nextMode, nextResolvedTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setModeState((currentMode) => {
      // Simple toggle: light ↔ dark (skip system for quick toggle)
      const nextMode = currentMode === 'dark' ? 'light' : 'dark';
      try {
        window.localStorage.setItem(STORAGE_KEY, nextMode);
      } catch {}
      const nextResolvedTheme: ResolvedTheme = nextMode;
      setResolvedTheme(nextResolvedTheme);
      applyTheme(nextMode, nextResolvedTheme);
      return nextMode;
    });
  }, []);

  useEffect(() => {
    const initialMode = getStoredMode();
    const initialResolvedTheme = initialMode === 'system' ? getSystemTheme() : initialMode;
    setModeState(initialMode);
    setResolvedTheme(initialResolvedTheme);
    applyTheme(initialMode, initialResolvedTheme);
    setMounted(true);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystemThemeChange = () => {
      const storedMode = getStoredMode();
      if (storedMode !== 'system') return;
      const nextResolvedTheme = getSystemTheme();
      setResolvedTheme(nextResolvedTheme);
      applyTheme('system', nextResolvedTheme);
    };
    const onStorageChange = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      const nextMode = getStoredMode();
      const nextResolvedTheme = nextMode === 'system' ? getSystemTheme() : nextMode;
      setModeState(nextMode);
      setResolvedTheme(nextResolvedTheme);
      applyTheme(nextMode, nextResolvedTheme);
    };

    mediaQuery.addEventListener('change', onSystemThemeChange);
    window.addEventListener('storage', onStorageChange);
    return () => {
      mediaQuery.removeEventListener('change', onSystemThemeChange);
      window.removeEventListener('storage', onStorageChange);
    };
  }, []);

  const value = useMemo(
    () => ({ mode, resolvedTheme, setMode, toggleTheme }),
    [mode, resolvedTheme, setMode, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
};
