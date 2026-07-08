import BaseDialog from '@/components/common/BaseDialog';
import { useRemoveAddress } from '@/hooks/profile/useRemoveAddress';
import { Address } from '@/types/Home';
import React, { useEffect } from 'react';
type Props = {
  open: {
    open: boolean;
    info: null | Address;
  };
  setOpen: React.Dispatch<
    React.SetStateAction<{
      open: boolean;
      info: Address | null;
    }>
  >;
};
const DeleteAddress = ({ open, setOpen }: Props) => {
  const { mutate, isPending, isSuccess } = useRemoveAddress();
  const onClose = () => setOpen({ open: false, info: null });
  useEffect(() => {
    if (isSuccess) {
      onClose();
    }
  }, [isSuccess]);
  return (
    <BaseDialog
      size="md"
      isLoadingFooterBtn={isPending}
      title="حذف آدرس"
      isOpen={open.open}
      // @ts-expect-error error
      onClickFooter={() => mutate({ id: open.info?.id })}
      nameBtnFooter="حذف آدرس"
      onClose={onClose}
    >
      <p className="py-5 text-center font-medium text-[18px]">
        آیا مطمئن هستید که میخواهید، آدرس را حذف کنید؟
      </p>
    </BaseDialog>
  );
};

export default DeleteAddress;
