import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage, {
  LegalSection,
  LegalCard,
  LegalList,
  SITE_URL,
} from '@/components/common/LegalPage';
import ContactForm from '@/components/common/ContactForm';

export const metadata: Metadata = {
  title: 'تماس با ما | پشتیبانی و مشاوره آفلند',
  description:
    'راه‌های ارتباط با آفلند: تلفن، ایمیل، فرم تماس و پیگیری سفارش. پشتیبانی، مشاورهٔ خرید و خدمات گارانتی در سرزمینِ تخفیف.',
  keywords: ['تماس با آفلند', 'پشتیبانی آفلند', 'پیگیری سفارش', 'مشاوره خرید'],
  alternates: { canonical: '/contact-us' },
  openGraph: {
    title: 'تماس با ما | آفلند',
    description: 'راه‌های ارتباط با آفلند برای پشتیبانی، مشاوره و پیگیری سفارش.',
    url: `${SITE_URL}/contact-us`,
    locale: 'fa_IR',
    siteName: 'آفلند',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'تماس با آفلند',
    url: `${SITE_URL}/contact-us`,
    mainEntity: {
      '@type': 'Organization',
      name: 'آفلند',
      telephone: '+982143000240',
      email: 'support@offl.ir',
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+982143000240',
        email: 'support@offl.ir',
        contactType: 'customer support',
        availableLanguage: 'Persian',
        areaServed: 'IR',
      },
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        item: { '@id': `${SITE_URL}/`, name: 'آفلند' },
      },
      {
        '@type': 'ListItem',
        position: 2,
        item: { '@id': `${SITE_URL}/contact-us`, name: 'تماس با ما' },
      },
    ],
  },
];

const CONTACT_CARDS = [
  {
    title: 'تلفن پشتیبانی',
    value: '۰۲۱-۴۳۰۰۰۲۴۰',
    desc: 'شنبه تا پنج‌شنبه، ۹ تا ۲۱',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M6.5 3h3l1.5 4.5-2 1.5a11 11 0 0 0 5 5l1.5-2 4.5 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5a2 2 0 0 1 2-2Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: 'ایمیل',
    value: 'support@offl.ir',
    desc: 'پاسخ در کمتر از ۲۴ ساعت',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M3 7.5 12 13l9-5.5M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: 'ساعات پاسخگویی',
    value: '۹ تا ۲۱ — شنبه تا پنج‌شنبه',
    desc: 'پنج‌شنبه تا ۱۴',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M12 7v5l3 2"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

const FAQ = [
  {
    q: 'سفارشم را چطور پیگیری کنم؟',
    a: 'از بخش حساب کاربری وضعیت سفارش را ببینید، یا با شمارهٔ پشتیبانی و ذکر کد سفارش تماس بگیرید.',
  },
  {
    q: 'گارانتی چطور فعال می‌شود؟',
    a: 'نگهداری فاکتور رسمی و کارت گارانتی کافی است. جزئیات و مراحل را در صفحهٔ گارانتی بخوانید.',
  },
  {
    q: 'مشاورهٔ خرید رایگان دارید؟',
    a: 'بله؛ دستیار هوشمند آفلند و چت، مشاوره و مقایسهٔ رایگان به زبان فارسی ارائه می‌دهند.',
  },
  {
    q: 'ارسال چقدر طول می‌کشد؟',
    a: 'معمولاً ۱ تا ۳ روز کاری از طریق پست پیشتاز یا تیپاکس به سراسر ایران.',
  },
  {
    q: 'امکان بازگشت کالا هست؟',
    a: 'بله؛ ۷ روز مهلت تست و انصراف طبق قوانین نظام صنفی، با شرایطی که در صفحهٔ شرایط و قوانین آمده است.',
  },
];

export default function ContactUsPage() {
  return (
    <LegalPage
      title="تماس با ما"
      description="راه‌های ارتباط با آفلند برای پشتیبانی، مشاورهٔ خرید و پیگیری سفارش. ما اینجاییم تا خریدت روان انجام شود."
      breadcrumb="تماس با ما"
      jsonLd={jsonLd}
    >
      <LegalSection title="چطور می‌توانیم کمک کنیم؟">
        <p>
          برای پشتیبانی، مشاورهٔ فنی، پیگیری سفارش یا دریافت خدمات گارانتی، از یکی از راه‌های زیر
          استفاده کن. تیم آفلند آمادهٔ پاسخ‌گویی است.
        </p>
      </LegalSection>

      <section aria-label="راه‌های ارتباطی" className="grid gap-4 md:grid-cols-3">
        {CONTACT_CARDS.map((c) => (
          <div
            key={c.title}
            className="flex items-start gap-3 rounded-xl border border-[var(--offl-border)] bg-[var(--offl-bg-soft)] p-5"
          >
            <span className="mt-0.5 text-[var(--offl-primary)]">{c.icon}</span>
            <div>
              <h3 className="font-bold text-[15px] text-[var(--offl-text)]">{c.title}</h3>
              <p className="mt-1 font-reqular text-[14px] text-[var(--offl-text)]">{c.value}</p>
              <p className="mt-0.5 font-light text-[12px] text-[var(--offl-text-muted)]">
                {c.desc}
              </p>
            </div>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <ContactForm />
        <LegalCard title="پیش از تماس، این را بدانید">
          <LegalList
            items={[
              <span key="1">
                برای پیگیری سفارش، کد سفارش (شمارهٔ فاکتور) را آماده داشته باشید.
              </span>,
              <span key="2">
                سؤالات فنی را می‌توانید از{' '}
                <span className="font-medium text-[var(--offl-primary)]">دستیار هوشمند</span> هم
                بپرسید — سریع‌تر و شبانه‌روزی.
              </span>,
              <span key="3">
                برای امور گارانتی، ابتدا{' '}
                <Link
                  href="/warranty"
                  className="font-medium text-[var(--offl-primary)] hover:underline"
                >
                  صفحهٔ گارانتی
                </Link>{' '}
                را بخوانید تا مراحل را سریع‌تر طی کنید.
              </span>,
              <span key="4">پاسخ‌گویی ایمیل معمولاً کمتر از ۲۴ ساعت طول می‌کشد.</span>,
            ]}
          />
        </LegalCard>
      </div>

      <LegalSection title="سؤالات پرتکرار">
        <div className="space-y-3">
          {FAQ.map((f) => (
            <details
              key={f.q}
              className="group rounded-xl border border-[var(--offl-border)] bg-[var(--offl-bg-soft)] p-4"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-[15px] text-[var(--offl-text)]">
                {f.q}
                <span
                  className="text-[var(--offl-text-muted)] transition-transform group-open:rotate-180"
                  aria-hidden="true"
                >
                  ▾
                </span>
              </summary>
              <p className="mt-3 font-reqular text-[14px] leading-7 text-[var(--offl-text-muted)]">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </LegalSection>

      <LegalSection title="اطلاعات تماس">
        <LegalList items={[<>تلفن پشتیبانی: ۰۲۱-۴۳۰۰۰۲۴۰</>, <>ایمیل: support@offl.ir</>]} />
        <p className="!mt-3 text-[14px]">
          قوانین خرید، ارسال و بازگشت کالا را در{' '}
          <Link href="/Terms" className="font-medium text-[var(--offl-primary)] hover:underline">
            شرایط و قوانین
          </Link>{' '}
          و ضمانت را در{' '}
          <Link href="/warranty" className="font-medium text-[var(--offl-primary)] hover:underline">
            گارانتی
          </Link>{' '}
          بخوانید.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
