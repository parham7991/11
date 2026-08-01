import AssembleWizardV3 from '@/components/assemble/AssembleWizardV3';
import '@/components/assemble/assemble-v3.css';

export const metadata = {
  title: 'اسمبل هوشمند | سیستم کامپیوتر حرفه‌ای بسازید | آفلند',
  description: 'با اسمبلر هوشمند آفلند، بر اساس کاربری و بودجه خود یک سیستم کامپیوتر سازگار و بهینه بچینید.',
};

export default function AssemblePage() {
  return <AssembleWizardV3 />;
}
