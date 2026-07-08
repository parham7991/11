'use client';

import dynamic from 'next/dynamic';
import React from 'react';

/**
 * AiChatMount — بارگذاری تنبل (lazy) ویجت دستیار هوشمند.
 * با dynamic import و ssr:false بارگذاری می‌شود تا روی عملکرد اولیهٔ
 * صفحه اثری نگذارد و فقط سمت کلاینت اجرا شود.
 *
 * prop `enabled` از سرور (layout) می‌آید و تعیین می‌کند ویجت اصلاً
 * رندر شود یا نه.
 */
const AiChatWidget = dynamic(() => import('./AiChatWidget'), { ssr: false });

type Props = {
  enabled?: boolean;
  title?: string;
  welcome?: string;
  position?: 'left' | 'right';
  primaryColor?: string;
  suggestions?: string[];
};

export default function AiChatMount({ enabled = true, ...rest }: Props) {
  if (!enabled) return null;
  return <AiChatWidget {...rest} />;
}
