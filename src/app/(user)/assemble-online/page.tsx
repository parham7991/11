import { Metadata } from 'next';
import AssembleWizard from '@/components/assemble/AssembleWizard';

export const metadata: Metadata = {
  title: 'اسمبل آنلاین هوشمند | چیدن سیستم با هوش مصنوعی آفلند',
  description:
    'با اسمبلر هوشمند آفلند، بر اساس کاربری و بودجه‌ات یک سیستم کامپیوتر سازگار و بهینه بچین. محاسبهٔ دقیق قیمت قبل و بعد از تخفیف.',
  openGraph: {
    title: 'اسمبل آنلاین هوشمند آفلند',
    description: 'سیستم دلخواهت رو با هوش مصنوعی و بهترین قیمت بچین.',
  },
};

export default function Page() {
  return <AssembleWizard />;
}
