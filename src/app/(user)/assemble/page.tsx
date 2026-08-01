import AssembleWizardV2 from '@/components/assemble/AssembleWizardV2';
import '@/components/assemble/assemble-v2.css';

export const metadata = {
  title: 'اسمبل هوشمند | آفلند',
  description: 'سیستم رویایی خودت رو با هوش مصنوعی بساز - مشاوره تخصصی قطعات کامپیوتر',
};

export default function AssemblePage() {
  return <AssembleWizardV2 />;
}
