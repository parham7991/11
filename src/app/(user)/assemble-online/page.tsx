export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import AssembleOnlineWizard from '@/components/assemble/AssembleOnlineWizard';
import CategoryDescription from '@/components/common/CategoryDescription';

export const metadata: Metadata = {
  title: 'اسمبل آنلاین هوشمند | موتور واقعی آفلند',
  description:
    'نسخه جدید اسمبل آنلاین — منطق از صفر با موتور اسمبل 20143، موجودی زنده، سازگاری Real-time و تحلیل AI. UI همین اما روان‌تر.',
  openGraph: {
    title: 'اسمبل آنلاین هوشمند — Engine v5',
    description:
      'بک‌اند واقعی (147.45.43.25:20143) → فرانت تمیز — پیشنهاد دقیق بر اساس بودجه و کاربری',
  },
};

const ASSEMBLE_SEO = `
<h2>اسمبل هوشمند Engine v5 — نسل جدید چیدن سیستم</h2>
<p>نسخه جدید اسمبل آنلاین آفلند از صفر با <strong>Assembly Engine v5</strong> بازنویسی شد: بک‌اند (پورت ۲۰۱۴۳) موجودی و قیمت را زنده می‌خواند، سازگاری سوکت/DDR/توان پاور را چک می‌کند و بهترین ترکیب را به فرانت تحویل می‌دهد. UI همان مانده اما تمیزتر و سریع‌تر.</p>

<h2>تفاوت نسخه موتورمحور</h2>
<ul>
  <li><strong>Single Source of Truth:</strong> اسلایدر بودجه (min/recommended/max) مستقیماً از موتور می‌آید</li>
  <li><strong>Real-time:</strong> هر درخواست POST /api/assemble → 20143/assemble با موجودی لحظه‌ای</li>
  <li><strong>سازگاری ۱۰۰٪:</strong> سوکت CPU↔مادربرد، نوع رم، توان پاور با فرمول (TDP+100)*1.3</li>
  <li><strong>تحلیل AI:</strong> offl-assemble-elite سه خط فارسی بدون ایموجی</li>
  <li><strong>Retry ۳×:</strong> تحمل خطای شبکه با backoff</li>
</ul>

<h2>۸ کاربری حرفه‌ای</h2>
<p>گیمینگ، اداری، تدوین، رندرینگ، برنامه‌نویسی، استریم، سرور، خانگی — هرکدام وزن بودجهٔ متفاوت (مثلاً گیمینگ GPU ۳۲٪)</p>

<h2>قطعات تحت پوشش</h2>
<p>CPU 925، مادربرد 1369، رم 943، کارت گرافیک 1081، SSD 559، پاور 775، کیس 1201، خنک‌کننده 2071</p>
`;

export default function Page() {
  return (
    <>
      <AssembleOnlineWizard />
      <CategoryDescription description={ASSEMBLE_SEO} />
    </>
  );
}
