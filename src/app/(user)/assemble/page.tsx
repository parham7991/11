export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import AssembleWizard from '@/components/assemble/AssembleWizard';

export const metadata: Metadata = {
  title: 'اسمبل هوشمند | آفلند',
  description: 'سیستم رویایی خودت رو با هوش مصنوعی بساز',
};

export default function AssemblePage() {
  return <AssembleWizard />;
}
