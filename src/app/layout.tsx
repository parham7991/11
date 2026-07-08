import type { Metadata } from 'next';
import './globals.css';
import GlobalContextProvider from '../components/common/GlobalContextProvider';
import { SessionProvider } from '@/lib/auth/SessionProvider';
import Fetcher from '@/lib/auth/Fetcher';
import Script from 'next/script';
import AiChatMount from '@/components/ai-chat/AiChatMount';
import { getAiChatConfig } from '@/lib/ai-chat/config';

export const metadata: Metadata = {
  title: {
    default: 'فروشگاه اینترنتی آفلند | خرید لوازم آرایشی و بهداشتی اورجینال',
    template: '%s | فروشگاه آفلند',
  },
  description: 'خرید آنلاین لوازم آرایشی، بهداشتی، عطر و ادکلن اورجینال با بهترین قیمت و ارسال سریع در فروشگاه اینترنتی آفلند',
  keywords: 'فروشگاه آفلند, لوازم آرایشی, بهداشتی, عطر, ادکلن, اورجینال, خرید آنلاین',
  other: {
    'google-site-verification': 'phfZrGamufPWO6ljHZxPbx9sNzRm-8zR9vKVl_6FnpU',
  },
  authors: [{ name: 'آفلند', url: 'https://www.offl.ir' }],
  creator: 'آفلند',
  publisher: 'آفلند',
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1,
  },
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    siteName: 'آفلند',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // تنظیمات دستیار هوشمند (سمت سرور)؛ فقط فلگ‌های لازم به کلاینت داده می‌شود
  const aiChat = getAiChatConfig();
  const aiChatEnabled = aiChat.enabled && Boolean(aiChat.apiKey);

  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body>
        <Script id="theme-init" strategy="beforeInteractive" type="text/javascript">
          {`(function(){try{var key='offland-theme-mode';var mode=localStorage.getItem(key)||'system';var systemDark=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;var isDark=mode==='dark'||(mode==='system'&&systemDark);var root=document.documentElement;root.classList.toggle('dark',isDark);root.dataset.theme=isDark?'dark':'light';root.dataset.themeMode=mode;root.style.colorScheme=isDark?'dark':'light';}catch(e){}})();`}
        </Script>
        <Script id="gtag-init" strategy="afterInteractive" type="text/javascript">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-W55LLCR5');`}
        </Script>
        <SessionProvider session={null}>
          <GlobalContextProvider>
            <Fetcher>{children}</Fetcher>
            {/* دستیار هوشمند آفلند (ویجت شناور) */}
            <AiChatMount enabled={aiChatEnabled} position="right" />
          </GlobalContextProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
