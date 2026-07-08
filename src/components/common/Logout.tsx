import Button from './Button';
import BaseDialog from './BaseDialog';
import { useState, useTransition } from 'react';
import { Logout_Icon } from './Icon';
import { removeSession } from '@/lib/auth/storage';
import { useRouter } from 'next/navigation';

const Logout = ({ className }: { className?: string }) => {
  const [isOpen, setOpen] = useState(false);
  const [isPending, startTransaction] = useTransition();
  const router = useRouter();
  const onLogout = async () => {
    startTransaction(async () => {
      await removeSession();
      //   setLogout()
      router.push('/auth?page=/');
    });
  };
  const onClose = () => {
    setOpen(!open);
  };

  return (
    <div className={`mb-3 px-3 ${className}`}>
      <Button onClick={() => setOpen(true)} className="bg-red-100 text-red-500">
        <Logout_Icon className="text-red-500" />
        <span>خروج از حساب</span>
      </Button>
      <BaseDialog onClose={onClose} size="lg" isOpen={isOpen} title="خروج از حساب کاربری">
        <p className="p-6 text-center font-medium text-lg">
          آیا مطمئن هستید که میخواهید از حساب کاربری خود خارج شوید
        </p>
        <div className="flex items-center gap-8">
          <Button onClick={onClose} className="border">
            انصراف
          </Button>
          <Button isLoading={isPending} onClick={onLogout} className="bg-red-500 text-white">
            خروج از حساب
          </Button>
        </div>
      </BaseDialog>
    </div>
  );
};

export default Logout;
