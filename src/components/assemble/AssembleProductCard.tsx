'use client';

import React, { useState } from 'react';
import { getFinalSrc } from '@/lib/fun';
import {
  PART_ICONS,
  CpuIcon,
  EyeIcon,
  RefreshIcon,
  CheckIcon,
  ShieldIcon,
  SparkIcon,
  WarningIcon,
  ExpandIcon,
  CollapseIcon,
  InfoIcon,
  RamIcon,
  SsdIcon,
  PsuIcon,
  GpuIcon,
} from './PartIcons';

type Specs = {
  cores?: number;
  threads?: number;
  vram?: number;
  socket?: string;
  ramType?: string;
  capacity?: number;
  wattage?: number;
  frequency?: number;
  size?: number;
  isNVMe?: boolean;
  tier?: string;
  brand?: string;
  tdp?: number;
  formFactor?: string;
  tdpRating?: number;
  type?: string;
  chipset?: string;
  rating?: string;
  rgb?: boolean;
  [k: string]: any;
};

type Part = {
  category: string;
  categoryLabel: string;
  emoji: string;
  id: number | string;
  name: string;
  url: string;
  image: string | null;
  price: number;
  finalPrice: number;
  discountPercent: number;
  inStock: boolean;
  brand: string | null;
  warranty: string | null;
  shortSpec: string;
  specs: Specs;
  confidence: number;
  isOptional: boolean;
  quantity?: number;
  quantityLabel?: string;
  alternatives: Part[];
  pickReason?: string;
};

const toman = (n: number) => `${Math.round(n).toLocaleString('fa-IR')} تومان`;
const shortToman = (n: number) => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} میلیارد`;
  if (n >= 1_000_000) return `${Math.round(n / 1_000_000).toLocaleString('fa-IR')} میلیون`;
  return `${n.toLocaleString('fa-IR')}`;
};

/**
 * AssembleProductCard — کارت محصول برای اسمبل
 *
 * با عکس بزرگ، specs، و وضعیت سازگاری
 */
export default function AssembleProductCard({
  part,
  index,
  onSelectAlternative,
  onRemoveOptional,
  blocked,
  unavailable,
  blockingReason,
  expanded,
  onToggleExpand,
}: {
  part: Part;
  index: number;
  onSelectAlternative?: (alt: Part) => void;
  onRemoveOptional?: () => void;
  blocked?: boolean;
  unavailable?: boolean;
  blockingReason?: string;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const Icon = PART_ICONS[part.category] || CpuIcon;
  const [imageError, setImageError] = useState(false);
  const isDisabled = blocked || unavailable;
  const hasImage = part.image && !imageError;
  const qty = Math.max(1, Number(part.quantity || 1));
  const totalPrice = part.finalPrice * qty;
  const totalOldPrice = part.price * qty;

  return (
    <div
      className={`asm-pcard ${part.isOptional ? 'asm-pcard--optional' : ''} ${blocked ? 'asm-pcard--blocked' : ''} ${unavailable ? 'asm-pcard--unavailable' : ''}`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* ────── بنرهای وضعیت ────── */}
      {blocked && (
        <div className="asm-pcard__status-banner asm-pcard__status-banner--blocked">
          <span><WarningIcon /></span>
          <div>
            <strong>این قطعه با بقیهٔ سیستم سازگار نیست</strong>
            <span>انتخاب غیرفعال شده</span>
          </div>
        </div>
      )}
      {unavailable && (
        <div className="asm-pcard__status-banner asm-pcard__status-banner--unavailable">
          <span><WarningIcon /></span>
          <div>
            <strong>الان موجود نیست</strong>
            <span>به زودی موجود می‌کنیم</span>
          </div>
        </div>
      )}

      <div className="asm-pcard__grid">
        {/* ────── تصویر بزرگ محصول ────── */}
        <a
          href={isDisabled ? undefined : part.url}
          target={isDisabled ? undefined : '_blank'}
          rel="noopener noreferrer"
          className={`asm-pcard__image-wrap ${isDisabled ? 'asm-pcard__image-wrap--disabled' : ''}`}
          title={isDisabled ? 'غیرفعال' : 'مشاهده در فروشگاه'}
        >
          {hasImage ? (
            <img
              className="asm-pcard__image"
              src={getFinalSrc(part.image || undefined) as string}
              alt={part.name}
              loading="lazy"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="asm-pcard__image-fallback">
              <Icon />
            </div>
          )}
          {part.discountPercent > 0 && !isDisabled && (
            <span className="asm-pcard__badge">{part.discountPercent}%</span>
          )}
          {isDisabled && (
            <span className="asm-pcard__badge asm-pcard__badge--gray">
              {blocked ? 'ناسازگار' : 'ناموجود'}
            </span>
          )}
        </a>

        {/* ────── اطلاعات اصلی ────── */}
        <div className="asm-pcard__info">
          {/* دسته + اجباری/اختیاری */}
          <div className="asm-pcard__cat-row">
            <div className="asm-pcard__cat">
              <span className="asm-pcard__cat-icon"><Icon /></span>
              <span className="asm-pcard__cat-label">{part.categoryLabel}</span>
            </div>
            {part.isOptional ? (
              <span className="asm-pcard__tag asm-pcard__tag--optional">اختیاری</span>
            ) : (
              <span className="asm-pcard__tag asm-pcard__tag--mandatory">اجباری</span>
            )}
            {qty > 1 && <span className="asm-pcard__tag asm-pcard__tag--mandatory">×{qty.toLocaleString('fa-IR')}</span>}
          </div>

          {/* برند */}
          {part.brand && <div className="asm-pcard__brand">{part.brand}</div>}

          {/* نام محصول */}
          <h4 className="asm-pcard__name">{part.name}</h4>

          {/* خلاصه spec */}
          {part.shortSpec && <div className="asm-pcard__short-spec">{part.shortSpec}</div>}
          {part.quantityLabel && <div className="asm-pcard__short-spec">{part.quantityLabel}</div>}

          {/* Specs badges به تفکیک */}
          <SpecBadges part={part} />

          {/* دلیل انتخاب */}
          {part.pickReason && !isDisabled && (
            <div className="asm-pcard__pickreason">
              <SparkIcon />
              <span>{part.pickReason}</span>
            </div>
          )}

          {/* پیام مسدودیت */}
          {blockingReason && (
            <div className="asm-pcard__block-reason">
              {blockingReason}
            </div>
          )}
        </div>

        {/* ────── قیمت + اکشن ────── */}
        <div className="asm-pcard__purchase">
          <div className="asm-pcard__price-wrap">
            {!isDisabled && part.discountPercent > 0 && (
              <div className="asm-pcard__old-price">{toman(totalOldPrice)}</div>
            )}
            <div className={`asm-pcard__price ${isDisabled ? 'asm-pcard__price--disabled' : ''}`}>
              {isDisabled ? '—' : shortToman(totalPrice)}
              <span className="asm-pcard__price-currency">تومان</span>
            </div>
            {!isDisabled && qty > 1 && (
              <div className="asm-pcard__warranty">قیمت واحد: {toman(part.finalPrice)}</div>
            )}
            {!isDisabled && part.warranty && (
              <div className="asm-pcard__warranty">
                <ShieldIcon />
                {part.warranty}
              </div>
            )}
          </div>

          <div className="asm-pcard__actions">
            <a
              href={isDisabled ? undefined : part.url}
              target={isDisabled ? undefined : '_blank'}
              rel="noopener noreferrer"
              className={`asm-pcard__action-btn ${isDisabled ? 'asm-pcard__action-btn--disabled' : ''}`}
              title={isDisabled ? 'غیرفعال' : 'مشاهده'}
            >
              <EyeIcon />
            </a>
            {!isDisabled && part.alternatives && part.alternatives.length > 0 && (
              <button
                className="asm-pcard__action-btn"
                onClick={onToggleExpand}
                title={expanded ? 'پنهان کردن' : `${part.alternatives.length} جایگزین`}
              >
                {expanded ? <CollapseIcon /> : <ExpandIcon />}
              </button>
            )}
            {!isDisabled && part.isOptional && onRemoveOptional && (
              <button
                className="asm-pcard__action-btn asm-pcard__action-btn--remove"
                onClick={onRemoveOptional}
                title="حذف"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ────── جایگزین‌ها (v5.0: با فیلتر Air/Liquid برای cooler) ────── */}
      {!isDisabled && expanded && part.alternatives && part.alternatives.length > 0 && (
        <AlternativesDrawer
          alternatives={part.alternatives}
          category={part.category}
          onSelectAlternative={onSelectAlternative}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 🗂️ کشوی جایگزین‌ها با فیلتر سریع Air/Liquid برای cooler (v5.0)
// ═══════════════════════════════════════════════════════════════════

function AlternativesDrawer({
  alternatives,
  category,
  onSelectAlternative,
}: {
  alternatives: Part[];
  category: string;
  onSelectAlternative?: (alt: Part) => void;
}) {
  const [filter, setFilter] = useState<'all' | 'air' | 'liquid'>('all');
  const [query, setQuery] = useState('');

  const isCoolerCat = category === 'cooler';

  const isLiquid = (name: string) => {
    const n = name.toLowerCase();
    return /liquid|aio|water\s*cool|واتر|مایع|فریز/i.test(n);
  };

  const filtered = React.useMemo(() => {
    let list = alternatives;
    if (isCoolerCat && filter === 'air') list = list.filter(a => !isLiquid(a.name || ''));
    if (isCoolerCat && filter === 'liquid') list = list.filter(a => isLiquid(a.name || ''));
    const q = query.trim().toLowerCase();
    if (q) list = list.filter(a => (a.name || '').toLowerCase().includes(q));
    return list;
  }, [alternatives, filter, query, isCoolerCat]);

  const airCount = React.useMemo(
    () => (isCoolerCat ? alternatives.filter(a => !isLiquid(a.name || '')).length : 0),
    [alternatives, isCoolerCat]
  );
  const liquidCount = React.useMemo(
    () => (isCoolerCat ? alternatives.filter(a => isLiquid(a.name || '')).length : 0),
    [alternatives, isCoolerCat]
  );

  return (
    <div className="asm-pcard__alts">
      <div className="asm-pcard__alts-title">
        {alternatives.length} جایگزین سازگار
        {isCoolerCat && ` (${airCount} بادی، ${liquidCount} آبی)`}
        — کلیک کن تا عوض بشه:
      </div>

      {/* فیلترها: فقط برای cooler و اگر بیش از 4 گزینه است */}
      {alternatives.length > 4 && (
        <div className="asm-pcard__alts-filters">
          {isCoolerCat && (
            <div className="asm-pcard__filter-group">
              <button
                type="button"
                className={`asm-pcard__filter-btn${filter === 'all' ? ' asm-pcard__filter-btn--active' : ''}`}
                onClick={() => setFilter('all')}
              >
                🔎 همه ({alternatives.length})
              </button>
              <button
                type="button"
                className={`asm-pcard__filter-btn${filter === 'air' ? ' asm-pcard__filter-btn--active' : ''}`}
                onClick={() => setFilter('air')}
              >
                ❄️ بادی ({airCount})
              </button>
              <button
                type="button"
                className={`asm-pcard__filter-btn${filter === 'liquid' ? ' asm-pcard__filter-btn--active' : ''}`}
                onClick={() => setFilter('liquid')}
              >
                💧 مایع/AIO ({liquidCount})
              </button>
            </div>
          )}
          <input
            type="search"
            className="asm-pcard__filter-search"
            placeholder="جستجو در جایگزین‌ها..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      )}

      <div className="asm-pcard__alts-grid">
        {filtered.slice(0, 60).map((alt, i) => {
          const AltIcon = PART_ICONS[alt.category] || CpuIcon;
          return (
            <button
              key={`${alt.id}-${i}`}
              className="asm-pcard__alt"
              onClick={() => onSelectAlternative?.(alt)}
            >
              {alt.image ? (
                <img
                  src={getFinalSrc(alt.image) as string}
                  alt={alt.name}
                  className="asm-pcard__alt-image"
                  loading="lazy"
                  onError={(e) => {
                    // v6.0: در صورت خطا، به fallback SVG سوئیچ می‌کند
                    const img = e.target as HTMLImageElement;
                    img.style.display = 'none';
                    const fallback = img.nextElementSibling as HTMLElement | null;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              {/* v6.0: fallback icon برای آیتم‌های offline بدون عکس */}
              <div
                className="asm-pcard__alt-image asm-pcard__alt-image--fallback"
                style={{ display: alt.image ? 'none' : 'flex' }}
                aria-hidden="true"
              >
                <AltIcon />
              </div>
              <div className="asm-pcard__alt-info">
                <div className="asm-pcard__alt-name">{alt.name}</div>
                <div className="asm-pcard__alt-spec">{alt.shortSpec || '—'}</div>
              </div>
              <div className="asm-pcard__alt-price">{shortToman(alt.finalPrice)}</div>
              <div className="asm-pcard__alt-select"><CheckIcon /> انتخاب</div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="asm-pcard__alts-empty">
            هیچ گزینه‌ای با این فیلتر پیدا نشد. فیلترها را عوض کنید.
          </div>
        )}
        {filtered.length > 60 && (
          <div className="asm-pcard__alts-more">
            ...و {(filtered.length - 60).toLocaleString('fa-IR')} گزینهٔ دیگر
          </div>
        )}
      </div>
    </div>
  );
}

function SpecMiniIcon({ type }: { type: string }) {
  if (type === 'cpu') return <CpuIcon />;
  if (type === 'gpu') return <GpuIcon />;
  if (type === 'ram') return <RamIcon />;
  if (type === 'storage') return <SsdIcon />;
  if (type === 'psu') return <PsuIcon />;
  if (type === 'warn') return <WarningIcon />;
  if (type === 'ok') return <CheckIcon />;
  return <InfoIcon />;
}

function SpecBadges({ part }: { part: Part }) {
  const specs = part.specs;
  const list: Array<{ icon: string; label: string; value: string; color?: string }> = [];

  if (part.category === 'cpu') {
    if (specs.cores) list.push({ icon: 'cpu', label: 'هسته', value: `${specs.cores}C` });
    if (specs.threads) list.push({ icon: 'cpu', label: 'رشته', value: `${specs.threads}T` });
    if (specs.socket) list.push({ icon: 'info', label: 'سوکت', value: specs.socket });
    if (specs.tdp) list.push({ icon: 'psu', label: 'توان', value: `${specs.tdp}W` });
    if (specs.frequency) list.push({ icon: 'info', label: 'بوست', value: `${specs.frequency}GHz` });
  } else if (part.category === 'gpu') {
    if (specs.vram) list.push({ icon: 'gpu', label: 'VRAM', value: `${specs.vram}GB`, color: '#386bf9' });
    if (specs.tdp) list.push({ icon: 'psu', label: 'توان', value: `${specs.tdp}W` });
    if (specs.brand) list.push({ icon: 'info', label: 'برند', value: specs.brand });
  } else if (part.category === 'motherboard') {
    if (specs.socket) list.push({ icon: 'cpu', label: 'سوکت', value: specs.socket });
    if (specs.chipset) list.push({ icon: 'info', label: 'چیپ‌ست', value: specs.chipset });
    if (specs.ramType) list.push({ icon: 'ram', label: 'رم', value: specs.ramType, color: specs.ramType === 'DDR5' ? '#059669' : '#6b7790' });
    if (specs.ramSlots) list.push({ icon: 'ram', label: 'اسلات RAM', value: `${specs.ramSlots} اسلات` });
    if (specs.m2Slots) list.push({ icon: 'storage', label: 'M.2', value: `${specs.m2Slots} اسلات` });
    if (specs.formFactor) list.push({ icon: 'info', label: 'فرم', value: specs.formFactor });
    if (specs.wifi) list.push({ icon: 'ok', label: 'WiFi', value: 'دارد' });
  } else if (part.category === 'ram') {
    if (specs.capacity) list.push({ icon: 'ram', label: 'ظرفیت', value: `${specs.capacity}GB`, color: '#386bf9' });
    if (specs.totalModules && specs.ramSlots) list.push({ icon: 'ram', label: 'اسلات', value: `${specs.totalModules}/${specs.ramSlots}` });
    else if (specs.moduleCount) list.push({ icon: 'ram', label: 'ماژول', value: `${specs.moduleCount} ماژول` });
    if (specs.ramType) list.push({ icon: 'ram', label: 'نوع', value: specs.ramType });
    if (specs.frequency) list.push({ icon: 'info', label: 'فرکانس', value: `${specs.frequency}MHz` });
    if (specs.rgb) list.push({ icon: 'ok', label: 'RGB', value: 'دارد' });
  } else if (part.category === 'storage') {
    if (specs.size) list.push({ icon: 'storage', label: 'ظرفیت', value: specs.sizeTB ? `${specs.sizeTB}TB` : `${specs.size}GB`, color: '#059669' });
    if (specs.isNVMe) list.push({ icon: 'storage', label: 'NVMe', value: 'دارد' });
    if (specs.pcie) list.push({ icon: 'info', label: 'PCIe', value: specs.pcie });
  } else if (part.category === 'psu') {
    if (specs.wattage) list.push({ icon: 'psu', label: 'توان', value: `${specs.wattage}W`, color: '#dc2626' });
    if (specs.rating) list.push({ icon: 'ok', label: 'گواهی', value: specs.rating });
    if (specs.modular) list.push({ icon: 'info', label: 'ماژولار', value: specs.modular });
  } else if (part.category === 'case') {
    if (specs.formFactor) list.push({ icon: 'info', label: 'فرم', value: specs.formFactor });
    if (specs.rgb) list.push({ icon: 'ok', label: 'RGB', value: 'دارد' });
  } else if (part.category === 'cooler') {
    if (specs.type === 'aio') list.push({ icon: 'info', label: 'AIO', value: `${specs.size}mm`, color: '#386bf9' });
    else list.push({ icon: 'info', label: 'Air', value: 'Cooler' });
    if (specs.tdpRating) list.push({ icon: 'psu', label: 'تا', value: `${specs.tdpRating}W` });
  } else if (part.category === 'case_fan') {
    if (specs.size) list.push({ icon: 'info', label: 'سایز', value: `${specs.size}mm` });
    if (specs.rgb) list.push({ icon: 'ok', label: 'RGB', value: 'دارد' });
  }

  if (list.length === 0) return null;

  return (
    <div className="asm-pcard__specs">
      {list.map((spec, i) => (
        <span
          key={i}
          className="asm-pcard__spec"
          title={spec.label}
          style={spec.color ? { color: spec.color, borderColor: spec.color + '40', background: spec.color + '10' } : undefined}
        >
          <span className="asm-pcard__spec-icon"><SpecMiniIcon type={spec.icon} /></span>
          {spec.value}
        </span>
      ))}
    </div>
  );
}
