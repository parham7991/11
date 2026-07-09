'use client';

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

type ThemeMode = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

type ThemeContextValue = {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setMode: (mode: ThemeMode, origin?: { x: number; y: number }) => void;
  toggleTheme: (origin?: { x: number; y: number }) => void;
};

type ToggleOrigin = { x: number; y: number };
type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => { ready: Promise<void>; finished: Promise<void> };
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = 'offland-theme-mode';
const modes: ThemeMode[] = ['light', 'dark', 'system'];

const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const getStoredMode = (): ThemeMode => {
  if (typeof window === 'undefined') return 'system';
  try {
    const storedMode = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    return storedMode && modes.includes(storedMode) ? storedMode : 'system';
  } catch {
    return 'system';
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

// عکسِ لحظه‌ای از صفحه می‌گیرد، تغییر را اعمال می‌کند و با کارت گرافیک
// بین دو اسنپ‌شات cross-fade می‌کند → تعویض بدون لگ و با انیمیشن.
const setToggleOrigin = (origin?: ToggleOrigin) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (origin && Number.isFinite(origin.x) && Number.isFinite(origin.y)) {
    root.style.setProperty('--theme-toggle-x', `${origin.x}px`);
    root.style.setProperty('--theme-toggle-y', `${origin.y}px`);
  }
};

const runThemeUpdate = (update: () => void, origin?: ToggleOrigin) => {
  setToggleOrigin(origin);
  const doc = typeof document !== 'undefined' ? (document as ViewTransitionDocument) : undefined;
  if (doc && typeof doc.startViewTransition === 'function') {
    doc.startViewTransition(() => {
      update();
    });
  } else {
    update();
  }
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');
  const [, setMounted] = useState(false);
  const resolvedThemeRef = useRef<ResolvedTheme>('light');

  useEffect(() => {
    resolvedThemeRef.current = resolvedTheme;
  }, [resolvedTheme]);

  const setMode = useCallback((nextMode: ThemeMode, origin?: ToggleOrigin) => {
    const nextResolvedTheme = nextMode === 'system' ? getSystemTheme() : nextMode;
    runThemeUpdate(() => {
      setModeState(nextMode);
      try {
        window.localStorage.setItem(STORAGE_KEY, nextMode);
      } catch {}
      setResolvedTheme(nextResolvedTheme);
      applyTheme(nextMode, nextResolvedTheme);
    }, origin);
  }, []);

  const toggleTheme = useCallback((origin?: ToggleOrigin) => {
    // Simple toggle: light ↔ dark (skip system for quick toggle)
    const nextMode: ThemeMode = resolvedThemeRef.current === 'dark' ? 'light' : 'dark';
    runThemeUpdate(() => {
      setModeState(nextMode);
      try {
        window.localStorage.setItem(STORAGE_KEY, nextMode);
      } catch {}
      setResolvedTheme(nextMode);
      applyTheme(nextMode, nextMode);
    }, origin);
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

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
};
