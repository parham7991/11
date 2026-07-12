import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage, { LegalSection, LegalList, LegalTable, SITE_URL } from '@/components/common/LegalPage';

// ── آخرین به‌روزرسانی: برای تغییر تاریخ، فقط این رشته را ویرایش کن ──
const LAST_UPDATED = '۱۴۰۵/۰۴/۲۱';

export const metadata: Metadata = {
  title: 'حریم خصوصی | آفلند',
  description:
    'سیاست‌نامهٔ حریم خصوصی آفلند: چه داده‌هایی جمع‌آوری می‌شود، پردازش AI و انتقال بین‌المللی داده، حقوق کاربر، کوکی‌ها و امنیت اطلاعات.',
  keywords: ['حریم خصوصی آفلند', 'حفاظت داده', 'کوکی', 'پردازش AI'],
  alternates: { canonical: '/privacy' },
  openGraph: {
    title: 'حریم خصوصی | آفلند',
    description:
      'چه داده‌هایی جمع‌آوری می‌شود، پردازش AI، کوکی‌ها و حقوق کاربر در آفلند.',
    url: `${SITE_URL}/privacy`,
    locale: 'fa_IR',
    siteName: 'آفلند',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'سیاست حریم خصوصی آفلند',
    url: `${SITE_URL}/privacy`,
    inLanguage: 'fa-IR',
    publisher: { '@type': 'Organization', name: 'آفلند', url: SITE_URL },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, item: { '@id': `${SITE_URL}/`, name: 'آفلند' } },
      { '@type': 'ListItem', position: 2, item: { '@id': `${SITE_URL}/privacy`, name: 'حریم خصوصی' } },
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="سیاست‌نامهٔ حریم خصوصی"
      description="در آفلند، حریم خصوصی و امنیت اطلاعات شما جدی گرفته می‌شود. این صفحه دقیقاً توضیح می‌دهد چه داده‌هایی جمع‌آوری می‌شود، چطور استفاده و چگونه محافظت می‌گردد — از جمله داده‌های پردازش‌شده توسط دستیار هوشمند و جادوگر اسمبل."
      breadcrumb="حریم خصوصی"
      lastUpdated={LAST_UPDATED}
      jsonLd={jsonLd}
    >
      <LegalSection title="مقدمه">
        <p>
          آفلند («سرزمینِ تخفیف») متعهد است اطلاعات شخصی کاربران را شفاف، قانونی و
          ایمن پردازش کند. این سیاست‌نامه توضیح می‌دهد چه داده‌هایی دربارهٔ شما جمع‌آوری
          می‌شود، چرا، چگونه محافظت می‌شود و چه حقوقی دارید. با استفاده از سایت، با
          این سیاست موافقت می‌کنید.
        </p>
      </LegalSection>

      <LegalSection title="تعاریف">
        <LegalList
          items={[
            <span key="u">
              <strong className="text-[var(--offl-text)]">کاربر:</strong> هر شخصی که از
              سایت بازدید یا ثبت‌نام می‌کند.
            </span>,
            <span key="pd">
              <strong className="text-[var(--offl-text)]">دادهٔ شخصی:</strong> اطلاعاتی که
              هویت شما را شناسایی می‌کند (مانند نام، موبایل، ایمیل، آدرس).
            </span>,
            <span key="proc">
              <strong className="text-[var(--offl-text)]">دادهٔ پردازشی:</strong> هر داده‌ای
              که پس از پردازش (از جمله توسط هوش مصنوعی) تولید یا تحلیل می‌شود.
            </span>,
            <span key="ai">
              <strong className="text-[var(--offl-text)]">دستیار AI:</strong> چت هوشمند
              مشاورهٔ خرید آفلند.
            </span>,
            <span key="wiz">
              <strong className="text-[var(--offl-text)]">جادوگر اسمبل:</strong> ابزار
              هوشمند چیدمان قطعات سازگار بر اساس کاربری و بودجه.
            </span>,
          ]}
        />
      </LegalSection>

      <LegalSection title="چه داده‌هایی جمع‌آوری می‌کنیم">
        <LegalList
          ordered
          items={[
            <span key="1">
              <strong className="text-[var(--offl-text)]">داده‌های حساب کاربری:</strong> نام،
              شمارهٔ موبایل، ایمیل و آدرس‌های ارسال.
            </span>,
            <span key="2">
              <strong className="text-[var(--offl-text)]">داده‌های سفارش و پرداخت:</strong>{' '}
              اقلام سفارش، مبلغ و وضعیت پرداخت. پرداخت از طریق درگاه امن انجام می‌شود و
              آفلند <strong className="text-[var(--offl-text)]">شمارهٔ کارت کامل</strong> یا
              رمز دوم را ذخیره نمی‌کند.
            </span>,
            <span key="3">
              <strong className="text-[var(--offl-text)]">داده‌های فنی:</strong> نشانی IP،
              نوع دستگاه، مرورگر، سیستم‌عامل و کوکی‌ها.
            </span>,
            <span key="4">
              <strong className="text-[var(--offl-text)]">
                داده‌های استفاده از دستیار AI و اسمبل هوشمند:
              </strong>{' '}
              درخواست‌های چت، بودجه، یوزکیس انتخابی و قطعات پیشنهادی — جهت بهبود کیفیت
              سرویس و پاسخ‌های هوشمند.
            </span>,
            <span key="5">
              <strong className="text-[var(--offl-text)]">داده‌های بازاریابی:</strong> فقط در
              صورت رضایت صریح شما (مثلاً عضویت در خبرنامه) جمع‌آوری می‌شود.
            </span>,
          ]}
        />
      </LegalSection>

      <LegalSection title="اهداف استفاده از داده‌ها">
        <LegalList
          items={[
            'پردازش و ارسال سفارش‌ها و صدور فاکتور رسمی.',
            'ارائهٔ پشتیبانی، پیگیری سفارش و خدمات گارانتی.',
            'بهبود عملکرد سایت، امنیت و تجربهٔ کاربری.',
            'ارائهٔ مشاوره و چیدمان هوشمند از طریق دستیار AI و جادوگر اسمبل.',
            'اطلاع‌رسانی در صورت رضایت (تخفیف‌ها، محصولات جدید).',
          ]}
        />
      </LegalSection>

      <LegalSection title="مبنای حقوقی پردازش">
        <LegalList
          items={[
            <span key="c">
              <strong className="text-[var(--offl-text)]">رضایت:</strong> برای خبرنامه و
              داده‌های اختیاری.
            </span>,
            <span key="k">
              <strong className="text-[var(--offl-text)]">قرارداد:</strong> برای اجرای
              سفارش و ارائهٔ خدمات (ثبت سفارش = قرارداد خرید).
            </span>,
            <span key="l">
              <strong className="text-[var(--offl-text)]">منفعت قانونی:</strong> برای
              امنیت، پیشگیری از تقلب و بهبود سرویس.
            </span>,
          ]}
        />
      </LegalSection>

      <LegalSection title="اشتراک‌گذاری با شخص ثالث">
        <p>آفلند داده‌های شما را نمی‌فروشد. اشتراک در موارد محدود و ضروری انجام می‌شود:</p>
        <LegalList
          items={[
            <span key="pg">
              <strong className="text-[var(--offl-text)]">درگاه پرداخت:</strong> فقط داده‌های
              لازم برای تسویهٔ تراکنش (بدون ذخیرهٔ کارت توسط آفلند).
            </span>,
            <span key="sh">
              <strong className="text-[var(--offl-text)]">شرکت حمل‌ونقل:</strong> نام، موبایل
              و آدرس برای تحویل فیزیکی کالا.
            </span>,
            <span key="wa">
              <strong className="text-[var(--offl-text)]">شرکت گارانتی‌کننده:</strong> برای
              فعال‌سازی و پیگیری خدمات پس از فروش.
            </span>,
            <span key="an">
              <strong className="text-[var(--offl-text)]">تحلیل داده:</strong> ابزارهای
              آماری ناشناس‌شده برای بهبود سایت.
            </span>,
            <span key="ai">
              <strong className="text-[var(--offl-text)]">سرویس‌دهندهٔ AI:</strong> بخشی از
              درخواست‌های دستیار هوشمند جهت تولید پاسخ پردازش می‌شود (جزئیات در بخش
              «تصمیم‌گیری خودکار»).
            </span>,
          ]}
        />
      </LegalSection>

      <LegalSection title="ماندگاری داده‌ها">
        <p>
          داده‌ها فقط تا حدی نگهداری می‌شوند که برای هدف جمع‌آوری ضروری باشد: داده‌های
          حساب تا زمان فعال بودن حساب، داده‌های سفارش تا پایان مهلت قانونی مالیاتی و
          گارانتی، و داده‌های فنی/تحلیلی تا زمان لازم برای بهبود سرویس. پس از آن، داده‌ها
          حذف یا ناشناس‌سازی می‌شوند.
        </p>
      </LegalSection>

      <LegalSection title="حقوق کاربر">
        <p>شما طبق قوانین حفاظت داده حق دارید:</p>
        <LegalList
          items={[
            'به داده‌های خود دسترسی داشته باشید و رونوشت دریافت کنید.',
            'داده‌های نادرست را اصلاح کنید.',
            'حذف داده‌ها (در موارد مجاز) را درخواست کنید.',
            'انتقال داده به فرمت ساختاریافته را بخواهید.',
            'با پردازش مبتنی بر منفعت قانونی اعتراض کنید یا رضایت خود را پس بگیرید.',
          ]}
        />
        <p className="!mt-3">
          روش اعمال: از طریق بخش حساب کاربری یا تماس با پشتیبانی در صفحهٔ{' '}
          <Link href="/contact-us" className="font-medium text-[var(--offl-primary)] hover:underline">
            تماس با ما
          </Link>
          . آفلند در اسرع وقت (حداکثر طبق مهلت قانونی) پاسخ می‌دهد.
        </p>
      </LegalSection>

      <LegalSection title="امنیت داده‌ها">
        <LegalList
          items={[
            'انتقال اطلاعات از طریق پروتکل امن HTTPS (SSL/TLS).',
            'رمزنگاری داده‌های حساس در محیط ذخیره‌سازی.',
            'کنترل دسترسی مبتنی بر نقش و حداقل دسترسی برای کارکنان.',
            'پایش و ممیزی دوره‌ای برای کشف و پیشگیری از نفوذ.',
          ]}
        />
        <p className="!mt-3">
          با این حال، هیچ سامانه‌ای ۱۰۰٪ ایمن نیست؛ آفلند تلاش می‌کند بالاترین سطح
          ممکن از ایمنی را فراهم کند.
        </p>
      </LegalSection>

      <LegalSection title="کوکی‌ها" id="cookies">
        <p>
          کوکی‌ها فایل‌های کوچکی هستند که تجربهٔ شما را بهتر می‌کنند. انواع استفاده‌شده:
        </p>
        <LegalTable
          caption="انواع کوکی در آفلند"
          headers={['نوع', 'هدف', 'مثال / مدت']}
          rows={[
            ['ضروری', 'عملکرد پایهٔ سایت (سبد خرید، ورود)', 'جلسه‌ای یا تا بستن مرورگر'],
            ['عملکردی', 'به‌خاطر سپردن تنظیمات (مثل تم تاریک)', 'تا چند ماه'],
            ['تحلیلی', 'درک رفتار کاربر به‌صورت ناشناس', 'تا ۱۲ ماه'],
            ['مارکتینگ', 'نمایش تخفیف مرتبط (فقط با رضایت)', 'تا ۱۲ ماه'],
          ]}
        />
        <p className="!mt-3">
          می‌توانید کوکی‌ها را از طریق تنظیمات مرورگر یا بنر تأیید در هنگام ورود غیرفعال
          کنید. غیرفعال کردن کوکی‌های ضروری ممکن است بخشی از سایت را مختل کند.
        </p>
      </LegalSection>

      <LegalSection title="تصمیم‌گیری خودکار و پردازش AI">
        <p>
          بخشی از خدمات آفلند — از جمله{' '}
          <span className="font-medium text-[var(--offl-primary)]">دستیار هوشمند</span>{' '}
          و{' '}
          <Link href="/assemble" className="font-medium text-[var(--offl-text)] hover:underline">
            جادوگر اسمبل
          </Link>{' '}
          — بر پایهٔ مدل‌های زبانی (LLM) چندارائه‌دهنده اجرا می‌شود تا پاسخ‌ها و پیشنهادها
          را تولید کند. نکات شفافیت:
        </p>
        <LegalList
          items={[
            'درخواست‌های شما برای تولید پاسخ به سرویس‌دهندهٔ مدل زبانی ارسال می‌شود.',
            'آفلند کلیدهای دسترسی (API Key) را هرگز در سمت مرورگر منتشر نمی‌کند و پردازش در سمت سرور انجام می‌شود.',
            'خروجی‌های AI صرفاً راهنمایی است و تصمیم نهایی با خودِ شماست.',
            'در صورتی که تصمیم خودکار برای شما پیامد حقوقی یا مشابه داشته باشد، امکان بررسی انسانی از طریق پشتیبانی فراهم است.',
          ]}
        />
      </LegalSection>

      <LegalSection title="انتقال داده بین‌المللی">
        <p>
          برخی سرویس‌دهندگان پردازش AI ممکن است در خارج از ایران مستقر باشند. در این
          موارد، داده‌های ضروری (مانند متن درخواست شما به دستیار) ممکن است به سرورهای
          بین‌المللی منتقل شود. آفلند تلاش می‌کند ارائه‌دهندگانی را برگزیند که حداقل
          استانداردهای حفاظت داده را رعایت کنند و از افشای اطلاعات حساب (مانند شماره
          کارت) به این سرویس‌ها خودداری می‌شود.
        </p>
      </LegalSection>

      <LegalSection title="حریم خصوصی کودکان">
        <p>
          آفلند برای افراد زیر ۱۸ سال طراحی نشده است و آگاهانه دادهٔ کودکان را جمع‌آوری
          نمی‌کند. چنانچه متوجه شویم دادهٔ کاربر زیر سن قانونی بدون رضایت والدین ثبت شده،
          آن را حذف می‌کنیم.
        </p>
      </LegalSection>

      <LegalSection title="تغییرات سیاست‌نامه">
        <p>
          این سیاست‌نامه ممکن است به‌روزرسانی شود. نسخهٔ جدید پس از انتشار در همین صفحه
          اعمال می‌شود و «آخرین به‌روزرسانی» در پایین درج می‌گردد. در تغییرات مهم، از
          طریق کانال‌های اطلاع‌رسانی اطلاع‌رسانی می‌شود.
        </p>
      </LegalSection>

      <LegalSection title="راه‌های تماس با ما برای موضوعات حریم خصوصی">
        <LegalList
          items={[
            <>تلفن پشتیبانی: ۰۲۱-۴۳۰۰۰۲۴۰</>,
            <>ایمیل: support@offl.ir (موضوع: حریم خصوصی)</>,
            <span key="c">
              فرم تماس: صفحهٔ{' '}
              <Link href="/contact-us" className="font-medium text-[var(--offl-primary)] hover:underline">
                تماس با ما
              </Link>
            </span>,
          ]}
        />
        <p className="!mt-2 text-[14px]">
          شرایط کلی استفاده را در{' '}
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
