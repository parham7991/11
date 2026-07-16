'use client';

import Link from 'next/link';
import { FiArrowLeft, FiCpu, FiShield, FiTruck, FiZap } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';

const quickBudgets = ['۲۵ میلیون', '۴۰ میلیون', '۶۰ میلیون', '۹۰ میلیون'];
const useCases = ['گیمینگ', 'ادیت و رندر', 'برنامه‌نویسی', 'ارتقا سیستم'];

export default function OfflandSuperHero() {
  return (
    <section className="offl-super-hero container_page" aria-label="ویترین هوشمند آفلند">
      <div className="offl-super-hero__bg" />
      <div className="offl-super-hero__grid">
        <div className="offl-super-hero__content">
          <div className="offl-super-hero__eyebrow">
            <HiSparkles />
            <span>فروشگاه تخصصی تکنولوژی، قطعات و اسمبل هوشمند</span>
          </div>

          <h1>
            قطعات حرفه‌ای بخر،
            <span> سیستم رویایی‌تو هوشمند اسمبل کن.</span>
          </h1>

          <p className="offl-super-hero__lead">
            آفلند فقط یک فروشگاه نیست؛ یک دستیار خرید تخصصی برای انتخاب قطعات سازگار، مقایسه بهتر،
            خرید مطمئن و ساخت سیستم کامل بر اساس بودجه و کاربرد توست.
          </p>

          <div className="offl-super-hero__actions">
            <Link href="/assemble-online" prefetch={false} className="offl-cta offl-cta--primary">
              <FiCpu />
              شروع اسمبل آنلاین هوشمند
              <FiArrowLeft />
            </Link>
            <Link href="/result" prefetch={false} className="offl-cta offl-cta--secondary">
              مشاهده محصولات
            </Link>
          </div>

          <div className="offl-super-hero__quick">
            <span>شروع سریع با بودجه:</span>
            {quickBudgets.map((item) => (
              <Link
                key={item}
                href={`/assemble-online?budget=${encodeURIComponent(item)}`}
                prefetch={false}
              >
                {item}
              </Link>
            ))}
          </div>
        </div>

        <div className="offl-super-hero__visual" aria-hidden="true">
          <div className="offl-orbit offl-orbit--one" />
          <div className="offl-orbit offl-orbit--two" />
          <div className="offl-rig-card">
            <div className="offl-rig-card__top">
              <span className="offl-live-dot" />
              <span>AI Build Engine</span>
            </div>
            <div className="offl-chip-core">
              <FiCpu />
            </div>
            <div className="offl-score-row">
              <span>سازگاری قطعات</span>
              <strong>۹۶٪</strong>
            </div>
            <div className="offl-progress">
              <i style={{ width: '96%' }} />
            </div>
            <div className="offl-mini-specs">
              <span>GPU Ready</span>
              <span>DDR5</span>
              <span>NVMe</span>
            </div>
          </div>

          <div className="offl-floating-card offl-floating-card--a">
            <FiZap />
            <div>
              <b>ارزش خرید بالا</b>
              <span>انتخاب بر اساس قیمت و موجودی</span>
            </div>
          </div>
          <div className="offl-floating-card offl-floating-card--b">
            <FiShield />
            <div>
              <b>خرید مطمئن</b>
              <span>گارانتی، اصالت و پشتیبانی تخصصی</span>
            </div>
          </div>
        </div>
      </div>

      <div className="offl-usecase-strip">
        {useCases.map((item, index) => (
          <Link key={item} href="/assemble-online" prefetch={false} className="offl-usecase-pill">
            <span>{String(index + 1).padStart(2, '0')}</span>
            {item}
          </Link>
        ))}
      </div>
    </section>
  );
}

export function OfflandTrustBar() {
  const items = [
    { icon: <FiShield />, title: 'ضمانت اصالت', text: 'خرید شفاف با گارانتی معتبر' },
    { icon: <FiCpu />, title: 'مشاوره تخصصی', text: 'انتخاب قطعه بر اساس کاربرد واقعی' },
    { icon: <HiSparkles />, title: 'اسمبل هوشمند', text: 'سیستم سازگار با بودجه و موجودی' },
    { icon: <FiTruck />, title: 'ارسال سریع', text: 'پردازش حرفه‌ای سفارش‌ها' },
  ];

  return (
    <section className="offl-trustbar container_page" aria-label="مزیت‌های آفلند">
      {items.map((item) => (
        <div className="offl-trustbar__item" key={item.title}>
          <span>{item.icon}</span>
          <div>
            <b>{item.title}</b>
            <p>{item.text}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
