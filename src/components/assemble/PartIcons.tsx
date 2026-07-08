'use client';

import React from 'react';

/**
 * PartIcons.tsx — آیکن‌های SVG سفارشیِ مرتبط با هر قطعهٔ کامپیوتر.
 * طراحی خطی (stroke) و مدرن، با currentColor تا با تم هماهنگ شوند.
 * هیچ ایموجی‌ای استفاده نمی‌شود؛ همه آیکن واقعی و معنادارند.
 */

type IconProps = { className?: string; size?: number | string };
const base = (size?: number | string) => ({
  width: size ?? '1em',
  height: size ?? '1em',
  fill: 'none' as const,
  viewBox: '0 0 24 24',
  xmlns: 'http://www.w3.org/2000/svg',
});
const stroke = {
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/* پردازنده (CPU) — مربع با پایه‌های اطراف و هستهٔ داخلی */
export const CpuIcon = ({ className, size }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="7" y="7" width="10" height="10" rx="1.5" {...stroke} />
    <rect x="10" y="10" width="4" height="4" rx="0.5" {...stroke} />
    <path d="M9 4v3M12 4v3M15 4v3M9 17v3M12 17v3M15 17v3M4 9h3M4 12h3M4 15h3M17 9h3M17 12h3M17 15h3" {...stroke} />
  </svg>
);

/* کارت گرافیک (GPU) — برد با فن دایره‌ای */
export const GpuIcon = ({ className, size }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="2.5" y="7" width="19" height="10" rx="1.5" {...stroke} />
    <circle cx="8" cy="12" r="2.4" {...stroke} />
    <circle cx="15" cy="12" r="2.4" {...stroke} />
    <path d="M8 12h.01M15 12h.01M5 17v2.5M19 17v2.5" {...stroke} />
  </svg>
);

/* مادربرد — برد با اسلات‌ها و سوکت */
export const MotherboardIcon = ({ className, size }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="3" y="3" width="18" height="18" rx="2" {...stroke} />
    <rect x="6" y="6" width="5" height="5" rx="0.5" {...stroke} />
    <path d="M14 6h4M14 9h4M7 15h10M7 18h6" {...stroke} />
    <circle cx="8.5" cy="15.5" r="0.4" fill="currentColor" />
  </svg>
);

/* رم (RAM) — ماژول حافظه با پین‌ها */
export const RamIcon = ({ className, size }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="2.5" y="8" width="19" height="8" rx="1" {...stroke} />
    <path d="M6 8v-1.5M10 8v-1.5M14 8v-1.5M18 8v-1.5" {...stroke} />
    <path d="M5 16v1.5M8 16v1.5M11 16v1.5M13 16v1.5M16 16v1.5M19 16v1.5" {...stroke} />
    <path d="M7 11.5h3M14 11.5h3" {...stroke} />
  </svg>
);

/* حافظه SSD — قطعهٔ مستطیلی با خطوط داده */
export const SsdIcon = ({ className, size }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="4" y="5" width="16" height="14" rx="2" {...stroke} />
    <path d="M8 9h8M8 12h8M8 15h5" {...stroke} />
    <circle cx="16.5" cy="15" r="0.6" fill="currentColor" />
  </svg>
);

/* پاور (PSU) — جعبه با فن و پریز */
export const PsuIcon = ({ className, size }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="3" y="6" width="18" height="12" rx="2" {...stroke} />
    <circle cx="9" cy="12" r="3" {...stroke} />
    <path d="M9 12h.01M16 9.5h2M16 12h2M16 14.5h2" {...stroke} />
  </svg>
);

/* کیس — برج کامپیوتر با دکمه پاور */
export const CaseIcon = ({ className, size }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="6" y="2.5" width="12" height="19" rx="2" {...stroke} />
    <path d="M9 6h6M9 9h6" {...stroke} />
    <circle cx="12" cy="13.5" r="2" {...stroke} />
    <path d="M9 18.5h3" {...stroke} />
  </svg>
);

/* خنک‌کننده — فن با پره‌های چرخان */
export const CoolerIcon = ({ className, size }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="3" y="3" width="18" height="18" rx="2" {...stroke} />
    <circle cx="12" cy="12" r="2" {...stroke} />
    <path d="M12 10c-2-2-3.5-2.5-5-2 .5 2 2 3 4 3M12 14c2 2 3.5 2.5 5 2-.5-2-2-3-4-3M10 12c-2 2-2.5 3.5-2 5 2-.5 3-2 3-4M14 12c2-2 2.5-3.5 2-5-2 .5-3 2-3 4" {...stroke} />
  </svg>
);

/** نگاشت کلید دسته → آیکن */
export const PART_ICONS: Record<string, React.FC<IconProps>> = {
  cpu: CpuIcon,
  gpu: GpuIcon,
  motherboard: MotherboardIcon,
  ram: RamIcon,
  storage: SsdIcon,
  psu: PsuIcon,
  case: CaseIcon,
  cooler: CoolerIcon,
};

/* ───────────────── آیکن‌های UI ───────────────── */

export const GamingIcon = ({ className, size }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M7 12h4M9 10v4" {...stroke} />
    <circle cx="15.5" cy="11" r="0.8" fill="currentColor" />
    <circle cx="17.5" cy="13" r="0.8" fill="currentColor" />
    <path d="M6.5 7h11a3.5 3.5 0 0 1 3.4 4.3l-1 4.2A2.5 2.5 0 0 1 15.6 17l-1.6-2H10l-1.6 2a2.5 2.5 0 0 1-4.3-1.5l-1-4.2A3.5 3.5 0 0 1 6.5 7z" {...stroke} />
  </svg>
);

export const OfficeIcon = ({ className, size }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="3" y="4" width="18" height="12" rx="2" {...stroke} />
    <path d="M2 20h20M8 16v4M16 16v4" {...stroke} />
  </svg>
);

export const EditingIcon = ({ className, size }: IconProps) => (
  <svg {...base(size)} className={className}>
    <rect x="3" y="5" width="18" height="14" rx="2" {...stroke} />
    <path d="M3 9h18M7 5V3M17 5V3M10 13l4 2-4 2v-4z" {...stroke} />
  </svg>
);

export const StreamIcon = ({ className, size }: IconProps) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="3" {...stroke} />
    <path d="M8 8a5.6 5.6 0 0 0 0 8M16 8a5.6 5.6 0 0 1 0 8M5.5 5.5a9.2 9.2 0 0 0 0 13M18.5 5.5a9.2 9.2 0 0 1 0 13" {...stroke} />
  </svg>
);

export const CustomIcon = ({ className, size }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M12 19l7-7a2.5 2.5 0 0 0-3.5-3.5l-7 7-1.5 5 5-1.5z" {...stroke} />
    <path d="M4 20h6" {...stroke} />
    <path d="M14.5 6.5l3 3" {...stroke} />
  </svg>
);

export const USECASE_ICONS: Record<string, React.FC<IconProps>> = {
  gaming: GamingIcon,
  office: OfficeIcon,
  editing: EditingIcon,
  streaming: StreamIcon,
  custom: CustomIcon,
};

export const CartIcon = ({ className, size }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M3 4h2l2.5 12.5a1.5 1.5 0 0 0 1.5 1.2h8a1.5 1.5 0 0 0 1.5-1.2L21 8H6" {...stroke} />
    <circle cx="9.5" cy="20" r="1.3" {...stroke} />
    <circle cx="17.5" cy="20" r="1.3" {...stroke} />
  </svg>
);

export const SparkIcon = ({ className, size }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" {...stroke} />
    <path d="M19 14l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z" {...stroke} />
  </svg>
);

export const BulbIcon = ({ className, size }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.5.5 1 1.2 1 2.5h6c0-1.3.5-2 1-2.5A6 6 0 0 0 12 3z" {...stroke} />
  </svg>
);

export const ArrowIcon = ({ className, size }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M15 19l-7-7 7-7" {...stroke} strokeWidth={2.2} />
  </svg>
);

export const EyeIcon = ({ className, size }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" {...stroke} />
    <circle cx="12" cy="12" r="3" {...stroke} />
  </svg>
);

export const RefreshIcon = ({ className, size }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M3 12a9 9 0 0 1 15.5-6.3M21 5v4h-4M21 12a9 9 0 0 1-15.5 6.3M3 19v-4h4" {...stroke} />
  </svg>
);

export const EditIcon = ({ className, size }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" {...stroke} />
  </svg>
);

export const CheckIcon = ({ className, size }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M5 13l4 4L19 7" {...stroke} strokeWidth={2.2} />
  </svg>
);

export const ShieldIcon = ({ className, size }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z M9 12l2 2 4-4" {...stroke} />
  </svg>
);

export const StarIcon = ({ className, size }: IconProps) => (
  <svg {...base(size)} className={className} fill="currentColor">
    <path d="M12 2l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.8 6.1 20.8l1.2-6.6L2.5 9l6.6-.9L12 2z" />
  </svg>
);


export const InfoIcon = ({ className, size }: IconProps) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="10" {...stroke} />
    <path d="M12 16v-4M12 8h.01" {...stroke} strokeWidth={2} />
  </svg>
);

export const TrophyIcon = ({ className, size }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M6 9H3a1 1 0 0 0-1 1v1a5 5 0 0 0 10 0V6a1 1 0 0 0-1-1h-3" {...stroke} />
    <path d="M6 5h12M6 5v4a6 6 0 0 0 12 0V5M9 20h6M12 17v3" {...stroke} />
  </svg>
);

export const WarningIcon = ({ className, size }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3L2 20h20L12 3z" {...stroke} />
    <path d="M12 9v4M12 16h.01" {...stroke} strokeWidth={2} />
  </svg>
);

export const TierIcon = ({ className, size }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M12 2l3 6 6 1-4 4 1 6-6-3-6 3 1-6-4-4 6-1 3-6z" {...stroke} />
  </svg>
);

export const ExpandIcon = ({ className, size }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M6 9l6 6 6-6" {...stroke} />
    <path d="M6 15l6-6 6 6" {...stroke} />
  </svg>
);

export const CollapseIcon = ({ className, size }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M6 15l6-6 6 6" {...stroke} />
  </svg>
);

export const AlternativesIcon = ({ className, size }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M8 3l8 8-8 8M16 3l-8 8 8 8" {...stroke} />
  </svg>
);

