'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePWAStore } from '@/store/pwa-store';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const isStandaloneMode = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
};

export default function PWAClient() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [online, setOnline] = useState(true);
  const [showInstall, setShowInstall] = useState(false);
  const [updateReady, setUpdateReady] = useState<ServiceWorkerRegistration | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [showIOS, setShowIOS] = useState(false);

  const canInstall = useMemo(() => Boolean(installPrompt) && !installed && !dismissed, [installPrompt, installed, dismissed]);

  useEffect(() => {
    setInstalled(isStandaloneMode());
    setOnline(navigator.onLine);

    // iOS: beforeinstallprompt never fires → show "Add to Home Screen" popup
    const isIOS =
      /iP(hone|od|ipad)/i.test(navigator.userAgent) ||
      ((navigator as any).platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1);
    if (isIOS && !isStandaloneMode()) {
      const iosHide = Number(localStorage.getItem('offland-pwa-ios-hide-until') || 0);
      if (Date.now() > iosHide) {
        setTimeout(() => setShowIOS(true), 2200);
      }
    }

    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      usePWAStore.getState().setDeferredPrompt(event as BeforeInstallPromptEvent);
      const hideUntil = Number(localStorage.getItem('offland-pwa-install-hide-until') || 0);
      if (Date.now() > hideUntil && !isStandaloneMode()) {
        setTimeout(() => setShowInstall(true), 1600);
      }
    };
    const onInstalled = () => {
      setInstalled(true);
      setShowInstall(false);
      setInstallPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);

    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .then((registration) => {
          registration.update().catch(() => undefined);

          if (registration.active) {
            registration.active.postMessage({
              type: 'CACHE_URLS',
              urls: ['/', '/assemble-online', '/category-list', '/mag', '/short-news', '/pwa'],
            });
          }

          if (registration.waiting) setUpdateReady(registration);

          registration.addEventListener('updatefound', () => {
            const worker = registration.installing;
            if (!worker) return;
            worker.addEventListener('statechange', () => {
              if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateReady(registration);
              }
            });
          });
        })
        .catch((err) => console.warn('[PWA] service worker registration failed', err));

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    }

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice.catch(() => null);
    if (choice?.outcome === 'accepted') {
      setInstalled(true);
      setShowInstall(false);
    } else {
      localStorage.setItem('offland-pwa-install-hide-until', String(Date.now() + 1000 * 60 * 60 * 24 * 3));
      setDismissed(true);
      setShowInstall(false);
    }
    setInstallPrompt(null);
  };

  const dismissInstall = () => {
    localStorage.setItem('offland-pwa-install-hide-until', String(Date.now() + 1000 * 60 * 60 * 24 * 3));
    setDismissed(true);
    setShowInstall(false);
  };

  const dismissIOS = () => {
    localStorage.setItem('offland-pwa-ios-hide-until', String(Date.now() + 1000 * 60 * 60 * 24 * 30));
    setShowIOS(false);
  };

  const applyUpdate = () => {
    updateReady?.waiting?.postMessage({ type: 'SKIP_WAITING' });
  };

  return (
    <>
      {!online && (
        <div className="pwa-net pwa-net--offline" role="status">
          <span className="pwa-net__icon" aria-hidden="true"><WifiOffIcon /></span>
          <span>آفلاین هستی؛ قیمت و موجودی بعد از اتصال دوباره به‌روز می‌شود.</span>
        </div>
      )}

      {online && installed && (
        <div className="pwa-net pwa-net--online" role="status" aria-live="polite">
          <span className="pwa-net__icon" aria-hidden="true"><CheckIcon /></span>
          <span>اپ آفلند آماده استفاده است.</span>
        </div>
      )}

      {showInstall && canInstall && (
        <div className="pwa-install" role="dialog" aria-label="نصب اپ آفلند">
          <div className="pwa-install__icon" aria-hidden="true"><ChipIcon /></div>
          <div className="pwa-install__body">
            <strong>آفلند رو مثل اپ نصب کن</strong>
            <span>دسترسی سریع به فروشگاه، سبد خرید و اسمبل آنلاین هوشمند؛ سبک، سریع و شیک.</span>
          </div>
          <div className="pwa-install__actions">
            <button type="button" className="pwa-install__primary" onClick={install}>نصب اپ</button>
            <button type="button" className="pwa-install__ghost" onClick={dismissInstall}>بعداً</button>
          </div>
        </div>
      )}

      {showIOS && (
        <div className="pwa-install pwa-install--ios" role="dialog" aria-label="نصب اپ آفلند در آیفون">
          <div className="pwa-install__icon" aria-hidden="true"><ShareIcon /></div>
          <div className="pwa-install__body">
            <strong>آفلند رو مثل اپ نصب کن</strong>
            <span>روی دکمه اشتراک‌گذاری (بالا) بزن، بعد «Add to Home Screen» رو انتخاب کن تا آفلند کنار بقیه اپ‌ها بیفته.</span>
          </div>
          <div className="pwa-install__actions">
            <button type="button" className="pwa-install__primary" onClick={dismissIOS}>فهمیدم</button>
          </div>
        </div>
      )}

      {updateReady && (
        <div className="pwa-update" role="status">
          <span className="pwa-update__icon"><RefreshIcon /></span>
          <span>نسخه جدید آفلند آماده است.</span>
          <button type="button" onClick={applyUpdate}>به‌روزرسانی</button>
        </div>
      )}

      <style jsx global>{`
        .pwa-net{position:fixed;left:18px;bottom:18px;z-index:9998;display:flex;align-items:center;gap:9px;min-height:42px;padding:10px 14px;border-radius:15px;font-family:inherit;font-size:12px;font-weight:700;box-shadow:0 14px 38px rgba(15,23,42,.16);animation:pwaSlide .35s ease both}.pwa-net__icon{width:22px;height:22px;display:inline-flex}.pwa-net__icon svg{width:22px;height:22px}.pwa-net--offline{background:#fff7ed;color:#9a3412;border:1px solid #fed7aa}.pwa-net--online{background:#ecfdf5;color:#047857;border:1px solid #a7f3d0;animation:pwaSlide .35s ease both,pwaFadeOut .35s ease 3s forwards}.pwa-install{position:fixed;right:18px;bottom:18px;z-index:9999;width:min(420px,calc(100vw - 36px));display:grid;grid-template-columns:54px 1fr;gap:12px;padding:14px;border-radius:22px;background:rgba(255,255,255,.92);backdrop-filter:blur(18px);border:1px solid rgba(226,232,240,.9);box-shadow:0 24px 70px rgba(20,35,80,.22);animation:pwaSlide .42s cubic-bezier(.2,.8,.2,1) both}.pwa-install__icon{width:54px;height:54px;border-radius:17px;background:linear-gradient(135deg,#386bf9,#6f3cf5);display:grid;place-items:center;color:white;box-shadow:0 15px 32px rgba(56,107,249,.28)}.pwa-install__icon svg{width:31px;height:31px}.pwa-install__body{display:flex;flex-direction:column;gap:4px;text-align:right}.pwa-install__body strong{font-size:14px;color:#182235}.pwa-install__body span{font-size:12px;line-height:1.8;color:#667085}.pwa-install__actions{grid-column:1/-1;display:flex;gap:8px;justify-content:flex-end}.pwa-install__actions button,.pwa-update button{height:38px;border:0;border-radius:12px;padding:0 14px;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer}.pwa-install__primary{background:#386bf9;color:white;box-shadow:0 10px 24px rgba(56,107,249,.25)}.pwa-install__ghost{background:#eef2fb;color:#334155}.pwa-update{position:fixed;right:18px;bottom:18px;z-index:10000;display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:16px;background:#111827;color:white;box-shadow:0 20px 55px rgba(0,0,0,.25);font-size:12px;font-weight:800;animation:pwaSlide .35s ease both}.pwa-update__icon{width:22px;height:22px;display:inline-flex}.pwa-update__icon svg{width:22px;height:22px}.pwa-update button{background:#10b981;color:white}@keyframes pwaSlide{from{opacity:0;transform:translateY(16px) scale(.96)}to{opacity:1;transform:none}}@keyframes pwaFadeOut{to{opacity:0;transform:translateY(12px);pointer-events:none}}@media(max-width:640px){.pwa-install{right:12px;bottom:calc(75px + 12px + env(safe-area-inset-bottom));width:calc(100vw - 24px)}.pwa-net{left:12px;right:12px;bottom:calc(75px + 12px + env(safe-area-inset-bottom));justify-content:center}.pwa-update{right:12px;left:12px;bottom:calc(75px + 12px + env(safe-area-inset-bottom));justify-content:space-between}}
      `}</style>
    </>
  );
}

function ChipIcon() { return <svg viewBox="0 0 24 24" fill="none"><rect x="7" y="7" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="10" y="10" width="4" height="4" rx=".5" stroke="currentColor" strokeWidth="1.8"/><path d="M9 4v3M12 4v3M15 4v3M9 17v3M12 17v3M15 17v3M4 9h3M4 12h3M4 15h3M17 9h3M17 12h3M17 15h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function WifiOffIcon() { return <svg viewBox="0 0 24 24" fill="none"><path d="M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5.5 13.5a9 9 0 0 1 4.2-2.2M14.5 11.4a9 9 0 0 1 4 2.1M2.5 10.5a13 13 0 0 1 4.1-2.8M10.5 6.7A13 13 0 0 1 21.5 10.5M12 20h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function CheckIcon() { return <svg viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function RefreshIcon() { return <svg viewBox="0 0 24 24" fill="none"><path d="M3 12a9 9 0 0 1 15.5-6.3M21 5v4h-4M21 12a9 9 0 0 1-15.5 6.3M3 19v-4h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function ShareIcon() { return <svg viewBox="0 0 24 24" fill="none"><path d="M12 3v12M12 3l-4 4M12 3l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
