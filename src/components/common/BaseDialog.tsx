import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Spinner } from '@heroui/react';
import { ReactNode } from 'react';
import Button from './Button';

type Props = {
  children?: ReactNode;
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full' | undefined;
  onClickFooter?: () => void;
  nameBtnFooter?: string;
  classBody?: string;
  isLoading?: boolean;
  isLoadingFooterBtn?: boolean;
};
export default function BaseDialog({
  isLoading,
  isLoadingFooterBtn,
  children,
  classBody = 'w-[94%] mx-auto',
  isOpen,
  onClose,
  title,
  nameBtnFooter = 'تائید',
  size = '2xl',
  onClickFooter,
}: Props) {
  return (
    <>
      <Modal
        className="relative"
        scrollBehavior="inside"
        size={size}
        hideCloseButton
        isOpen={isOpen}
        onClose={onClose}
      >
        <ModalContent>
          {() => (
            <>
              {isLoading ? (
                <div className="flex min-h-[350px] flex-col items-center justify-center gap-4">
                  <Spinner size="lg" color="success" />
                  <p className="text-iridium text-[13px] font-medium">در حال گرفتن اطلاعات ...</p>
                </div>
              ) : (
                <>
                  {title ? (
                    <ModalHeader>
                      <p className="w-full border-b border-gray-200 pb-4 text-center font-bold">
                        {title}
                      </p>
                    </ModalHeader>
                  ) : null}
                  <ModalBody className={`px-0 pt-0 ${classBody}`}>{children}</ModalBody>
                  {Boolean(onClickFooter) ? (
                    <ModalFooter className="bg-spring flex items-center justify-between rounded-lg">
                      <Button onClick={onClose} className="w-[140px] border border-gray-200">
                        <span>بازگشت</span>
                      </Button>
                      <Button
                        isLoading={isLoadingFooterBtn}
                        onClick={onClickFooter}
                        className="bg-main !w-fit !min-w-[140px] !px-2 font-light text-white"
                      >
                        {nameBtnFooter}
                      </Button>
                    </ModalFooter>
                  ) : null}
                </>
              )}
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
