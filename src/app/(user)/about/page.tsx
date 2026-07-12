import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage, {
  LegalSection,
  LegalCard,
  LegalList,
  LegalTable,
  SITE_URL,
} from '@/components/common/LegalPage';


export const metadata: Metadata = {
  title: 'درباره آفلند | سرزمینِ تخفیف',
  description:
    'آفلند، سرزمینِ تخفیف: تخصص در قطعات کامپیوتر و لوازم دیجیتال، دستیار هوشمند خرید و جادوگر اسمبل هوشمند برای بهترین قیمت و سازگاری تضمین‌شده.',
  keywords: [
    'آفلند',
    'درباره آفلند',
    'سرزمین تخفیف',
    'فروشگاه قطعات کامپیوتر',
    'دستیار هوشمند',
    'جادوگر اسمبل',
  ],
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'درباره آفلند | سرزمینِ تخفیف',
    description:
      'تخصص در قطعات کامپیوتر، دستیار هوشمند خرید و جادوگر اسمبل هوشمند با بهترین قیمت.',
    url: `${SITE_URL}/about`,
    locale: 'fa_IR',
    siteName: 'آفلند',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'آفلند',
  alternateName: 'OffLand',
  url: SITE_URL,
  logo: `${SITE_URL}/images/logo-off-3.png`,
  slogan: 'سرزمینِ تخفیف',
  description:
    'فروشگاه اینترنتی تخصصی قطعات کامپیوتر، لپ‌تاپ، موبایل و لوازم دیجیتال با دستیار هوشمند خرید و جادوگر اسمبل هوشمند.',
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+982143000240',
    email: 'support@offl.ir',
    contactType: 'customer support',
    areaServed: 'IR',
    availableLanguage: 'Persian',
  },
};

// لیست دسته‌بندی‌های اصلی آفلند
const CATEGORIES = [
  'پردازنده (CPU)',
  'کارت گرافیک (GPU)',
  'مادربرد (Motherboard)',
  'حافظه رم (RAM)',
  'حافظه ذخیره‌سازی (SSD / HDD)',
  'منبع تغذیه (PSU)',
  'کیس و خنک‌کننده (Case / Cooler)',
  'مانیتور و نمایشگر',
  'لپ‌تاپ',
  'گوشی موبایل و تبلت',
  'لوازم جانبی و پیرامونی (Peripherals)',
  'تجهیزات شبکه (مودم / روتر / سوییچ)',
  'قطعات گیمینگ و کنسول',
  'لوازم مصرفی و کابل',
];

// مراحل جادوگر اسمبل
const ASSEMBLE_STEPS = [
  'انتخاب یوزکیس: گیمینگ، اداری، تدوین/رندر، استریم یا سفارشی (Custom).',
  'تعیین بودجه: مبلغی که مد نظر داری را وارد می‌کنی و سیستم بین بخش‌ها تقسیم می‌کند.',
  'پیشنهاد قطعات: جادوگر بر اساس کاربری و بودجه، بهینه‌ترین قطعات را پیشنهاد می‌دهد.',
  'بررسی سازگاری: سوکت CPU با مادربرد، توان پاور، نوع رم (DDR4/DDR5) و ظرفیت خنک‌کننده بررسی می‌شود.',
  'افزودن به سبد: با یک کلیک، کل سیستم به سبد خرید اضافه می‌شود تا با هم سفارش داده شود.',
];

export default function AboutPage() {
  return (
    <LegalPage
      title="درباره آفلند"
      description="آفلند، سرزمینِ تخفیف — فروشگاه اینترنتی تخصصی قطعات کامپیوتر، لپ‌تاپ، موبایل و لوازم دیجیتال، با دستیار هوشمند خرید و جادوگر اسمبل هوشمند."
      breadcrumb="درباره آفلند"
      jsonLd={jsonLd}
    >
      {/* هیرو */}
      <section className="overflow-hidden rounded-2xl border border-[var(--offl-border)] bg-gradient-to-bl from-[#386bf91a] via-[var(--offl-surface)] to-[var(--offl-surface)] p-7 lg:p-10">
        <p className="text-sm font-medium text-[var(--offl-primary)]">سرزمینِ تخفیف</p>
        <h2 className="mt-2 font-black text-3xl leading-snug text-[var(--offl-text)] lg:text-4xl">
          خرید سخت‌افزار، از این به بعد هوشمندانه‌تر است
        </h2>
        <p className="mt-4 max-w-3xl font-reqular text-[15px] leading-8 text-[var(--offl-text-muted)]">
          آفلند یعنی تخصص، قیمت رقابتی و اطمینان. ما آمده‌ایم تا خرید قطعات کامپیوتر و
          لوازم دیجیتال را برای هر کسی — از گیمر و تدوین‌گر گرفته تا ادمین‌های شرکتی —
          ساده، شفاف و مقرون‌به‌صرفه کنیم. با{' '}
          <span className="font-medium text-[var(--offl-primary)]">
            دستیار هوشمند آفلند
          </span>{' '}
          مشورت کن، یا با{' '}
          <Link href="/assemble" className="font-medium text-[var(--offl-primary)] hover:underline">
            جادوگر اسمبل
          </Link>{' '}
          سیستم دلخواهت را بچین.
        </p>
      </section>

      <LegalSection title="داستان ما">
        <p>
          آفلند از یک سؤال ساده شروع شد: «چرا خرید قطعهٔ درست برای سیستم باید این‌قدر
          گیج‌کننده و پرریسک باشد؟» ما که خودمان عاشق سخت‌افزار بودیم، می‌دیدیم خیلی‌ها
          به‌خاطر نبود مشاورهٔ درست، یا قطعهٔ ناسازگار می‌خرند یا بودجه‌شان را هدر
          می‌دهند.
        </p>
        <p>
          پس «سرزمینِ تخفیف» را ساختیم — جایی که تخصص فنی، هوش مصنوعی و قیمت منصفانه
          در کنار هم قرار گرفتند تا هر خریدار، از مبتدی تا حرفه‌ای، بهترین تصمیم را
          بگیرد. آفلند نه یک فروشگاه معمولی، بلکه همراه فنیِ تو در هر خرید است.
        </p>
      </LegalSection>

      <LegalSection title="مأموریت، چشم‌انداز و ارزش‌های ما">
        <div className="grid gap-4 md:grid-cols-3">
          <LegalCard title="مأموریت ما">
            دموکراتیزه‌کردن خرید سخت‌افزار: مشاورهٔ رایگان، مقایسهٔ شفاف و قیمتی که
            واقعاً «تخفیف» باشد — نه فقط ادعا.
          </LegalCard>
          <LegalCard title="چشم‌انداز ما">
            تبدیل شدن به اولین مقصد هوشمند خرید کالای دیجیتال در ایران؛ جایی که هر
            تصمیم، با داده و هوش مصنوعی پشتیبانی می‌شود.
          </LegalCard>
          <LegalCard title="ارزش‌های ما">
            صداقت در مشاوره، اصالت کالا، احترام به بودجهٔ مشتری، و پشتیبانی پس از فروش
            که واقعاً پاسخ‌گو باشد.
          </LegalCard>
        </div>
      </LegalSection>

      <LegalSection title="چه چیزی آفلند را متمایز می‌کند؟">
        <LegalList
          items={[
            <span key="1">
              <strong className="text-[var(--offl-text)]">تخصص در قطعات:</strong> تمرکز
              روی سخت‌افزار کامپیوتر و لوازم دیجیتال، نه هر چیزی — پس مشاوره واقعی است.
            </span>,
            <span key="2">
              <strong className="text-[var(--offl-text)]">دستیار هوشمند:</strong> چتی که
              مثل یک کارشناس فروش حرفه‌ای، محصول مناسب را پیشنهاد می‌دهد.
            </span>,
            <span key="3">
              <strong className="text-[var(--offl-text)]">جادوگر اسمبل:</strong> چیدن
              سیستم سازگار و بهینه فقط با انتخاب کاربری و بودجه.
            </span>,
            <span key="4">
              <strong className="text-[var(--offl-text)]">قیمت رقابتی:</strong> مدل
              «سرزمینِ تخفیف» یعنی قیمت‌گذاری شفاف و تخفیف‌های واقعی.
            </span>,
            <span key="5">
              <strong className="text-[var(--offl-text)]">گارانتی اصل:</strong> فقط کالای
              با گارانتی معتبر شرکت‌های مجاز — بخوانید{' '}
              <Link href="/warranty" className="font-medium text-[var(--offl-primary)] hover:underline">
                صفحهٔ گارانتی
              </Link>
              .
            </span>,
            <span key="6">
              <strong className="text-[var(--offl-text)]">ارسال سریع:</strong> پست
              پیشتاز، تیپاکس و پیک موتوری به سراسر ایران.
            </span>,
          ]}
        />
      </LegalSection>

      <LegalSection title="محصولات و دسته‌بندی‌ها">
        <p>آفلند طیف کامل سخت‌افزار و لوازم دیجیتال را پوشش می‌دهد:</p>
        <LegalTable
          caption="دسته‌بندی‌های محصولات آفلند"
          headers={['ردیف', 'دسته‌بندی']}
          rows={CATEGORIES.map((c, i) => [<span key="n">{i + 1}</span>, c])}
        />
        <p className="!mt-4 text-[14px]">
          لیست کامل و به‌روز را در{' '}
          <Link href="/category-list" className="font-medium text-[var(--offl-primary)] hover:underline">
            صفحهٔ دسته‌بندی‌ها
          </Link>{' '}
          ببینید.
        </p>
      </LegalSection>

      <LegalSection title="فناوری‌های ما">
        <p>
          آفلند روی نسل جدید وب ساخته شده است: رابط کاربری سریع و مدرن با Next.js،
          تجربهٔ یکپارچه در موبایل و دسکتاپ، و لایهٔ هوش مصنوعی که بدون پیچیدگی فنی در
          خدمت توست. ما از چندین ارائه‌دهندهٔ مدل زبانی (LLM) استفاده می‌کنیم تا دستیار
          هوشمند همیشه در دسترس و به‌صرفه بماند — بدون اینکه تو نیازی به دانستن جزئیات
          فنی داشته باشی.
        </p>
      </LegalSection>

      <LegalSection title="دستیار هوشمند آفلند">
        <p>
          <span className="font-medium text-[var(--offl-primary)]">
            دستیار هوشمند آفلند
          </span>{' '}
          یک مشاور خرید و مقایسهٔ هوشمند است که به زبان فارسی، روان و دوستانه با تو
          صحبت می‌کند. کاربردهای اصلی آن:
        </p>
        <LegalList
          items={[
            'پاسخ به سؤالات قیمت، موجودی، تخفیف و گارانتی محصولات.',
            'مشاورهٔ فنی و بررسی سازگاری قطعات (مثلاً سوکت CPU با مادربرد).',
            'مقایسهٔ چند محصول و پیشنهاد بهترین گزینه متناسب با بودجه و کاربری.',
            'راهنمایی گام‌به‌گام برای ثبت سفارش و پیگیری ارسال.',
          ]}
        />
        <p className="!mt-3 text-[14px] text-[var(--offl-text-muted)]">
          نکته: پیشنهادهای دستیار صرفاً کمک‌تصمیم‌گیری هستند و مسئولیت نهایی انتخاب با
          خودتان است.
        </p>
      </LegalSection>

      <LegalSection title="جادوگر اسمبل هوشمند" id="assemble">
        <p>
          نمی‌دانی چه قطعاتی با هم سازگارند یا چطور بودجه را تقسیم کنی؟{' '}
          <Link href="/assemble" className="font-medium text-[var(--offl-primary)] hover:underline">
            جادوگر اسمبل آفلند
          </Link>{' '}
          در ۵ گام سیستم دلخواهت را می‌چیند:
        </p>
        <LegalList ordered items={ASSEMBLE_STEPS} />
        <p className="!mt-3 text-[14px]">
          سیستم سازگاری قطعات را بررسی می‌کند، اما همیشه پیش از ثبت نهایی، یک بار
          چیدمان را چک کن.
        </p>
      </LegalSection>

      <LegalSection title="تعهد ما به مشتری">
        <div className="grid gap-4 md:grid-cols-2">
          <LegalCard title="تضمین اصالت">
            هر کالا با گارانتی معتبر و از مسیر رسمی عرضه می‌شود؛ اصل بودن اولویت ماست.
          </LegalCard>
          <LegalCard title="پشتیبانی پاسخ‌گو">
            تیم پشتیبانی برای راهنمایی، گارانتی و پیگیری سفارش در کنار توست.
          </LegalCard>
          <LegalCard title="بازگشت و انصراف">
            طبق قوانین نظام صنفی، ۷ روز مهلت تست و انصراف برای کالای سالم و بسته‌بندی‌شده.
          </LegalCard>
          <LegalCard title="ارسال مطمئن">
            بسته‌بندی استاندارد و ارسال با پست/تیپاکس به سراسر ایران با قابلیت پیگیری.
          </LegalCard>
        </div>
      </LegalSection>

      <LegalSection title="تیم ما">
        <p>
          آفلند پشتِ یک تیم کوچک اما عاشق سخت‌افزار، توسعه‌دهنده و پشتیبانی است که
          باور دارند خرید فنی باید ساده و صادقانه باشد. ما ترجیح می‌دهیم به‌جای شعار،
          با هر سفارش ثابت کنیم که «سرزمینِ تخفیف» واقعاً به نفع توست.
        </p>
      </LegalSection>

      <LegalSection title="آفلند در یک نگاه">
        {/*
          اعداد و ارقام — PLACEHOLDER:
          مقادیر زیر نمونه و قابل به‌روزرسانی‌اند؛ در صورت دسترسی به دادهٔ واقعی
          (تعداد محصول، تعداد مشتری، پوشش استان‌ها) جایگزین شوند.
          // TODO: replace with real analytics values
        */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {[
            { value: '۵۰۰۰+', label: 'محصول فعال (نمونه)' },
            { value: '۳۱ استان', label: 'پوشش ارسال (سراسر ایران)' },
            { value: '۲۴/۷', label: 'دسترسی به دستیار هوشمند' },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-[var(--offl-border)] bg-[var(--offl-bg-soft)] p-5 text-center"
            >
              <p className="font-black text-2xl text-[var(--offl-primary)] lg:text-3xl">
                {s.value}
              </p>
              <p className="mt-1 font-light text-[13px] text-[var(--offl-text-muted)]">
                {s.label}
              </p>
            </div>
          ))}
        </div>
        <p className="!mt-3 text-[13px] text-[var(--offl-text-muted)]">
          اعداد فوق نمونه و قابل به‌روزرسانی هستند.
        </p>
      </LegalSection>

      {/* CTA */}
      <section className="rounded-2xl border border-[var(--offl-border)] bg-[var(--offl-surface)] p-7 text-center lg:p-10">
        <h2 className="font-bold text-2xl text-[var(--offl-text)]">همین امروز شروع کن</h2>
        <p className="mx-auto mt-3 max-w-2xl font-reqular text-[15px] leading-7 text-[var(--offl-text-muted)]">
          بخر، مقایسه کن، یا سیستمت را هوشمندانه بچین.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/category-list"
            className="rounded-xl bg-[var(--offl-primary)] px-6 py-3 font-medium text-white transition hover:opacity-90"
          >
            شروع خرید
          </Link>
          <Link
            href="/assemble"
            className="rounded-xl border border-[var(--offl-primary)] px-6 py-3 font-medium text-[var(--offl-primary)] transition hover:bg-[#386bf91a]"
          >
            امتحان جادوگر اسمبل
          </Link>
          <span
            className="rounded-xl border border-[var(--offl-border)] px-6 py-3 font-medium text-[var(--offl-text)]"
            title="دستیار هوشمند از طریق دکمهٔ شناور روی همهٔ صفحات در دسترس است"
          >
            دستیار هوشمند (دکمهٔ شناور)
          </span>
        </div>
      </section>

      <LegalSection title="اطلاعات تماس">
        <LegalList
          items={[
            'تلفن پشتیبانی: ۰۲۱-۴۳۰۰۰۲۴۰',
            'ایمیل: support@offl.ir',
            'فرم تماس و پیگیری سفارش: صفحهٔ ',
          ]}
        />
        <p className="!mt-2 text-[14px]">
          برای ارتباط سریع‌تر به{' '}
          <Link href="/contact-us" className="font-medium text-[var(--offl-primary)] hover:underline">
            تماس با ما
          </Link>{' '}
          مراجعه کن.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
