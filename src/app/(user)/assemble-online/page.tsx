import { Metadata } from 'next';
import AssembleWizard from '@/components/assemble/AssembleWizard';

export const metadata: Metadata = {
  title: 'اسمبل آنلاین | چیدن سیستم متناسب با بودجه آفلند',
  description:
    'با اسمبلر آفلند، بر اساس کاربری و بودجه‌ات یک سیستم کامپیوتر سازگار و بهینه بچین. محاسبهٔ دقیق قیمت قبل و بعد از تخفیف.',
  openGraph: {
    title: 'اسمبل آنلاین آفلند',
    description: 'سیستم دلخواهت رو متناسب با بودجه‌ت و بهترین قیمت بچین.',
  },
};

export default function Page() {
  return <AssembleWizard />;
}
