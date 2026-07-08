import React, { useState } from 'react';
import TotalScoresOpinionsUsers from './TotalScoresOpinionsUsers';
import CardScoresOpinionsUsers from './CardScoresOpinionsUsers';
import { useGetProductComments } from '@/hooks/product/useGetProductComments';
import { Spinner } from '@heroui/react';
import { Product } from '@/types/Home';
import { useSession } from '@/lib/auth/useSession';
import { useRouter } from 'next/navigation';
import BaseDialog from '../common/BaseDialog';

type Props = {
  product: Product;
};
const ScoresOpinionsUsers = ({ product }: Props) => {
  const session = useSession();
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { data: commentsData, isLoading: isLoadingComments } = useGetProductComments(product.id!);

  // محاسبه میانگین امتیازها از commentsData
  const votes =
    commentsData && commentsData.length > 0
      ? commentsData.reduce((sum, comment) => sum + comment.vote, 0) / commentsData.length
      : 0;

  // چک کردن لاگین بودن کاربر
  const isUserLoggedIn = !!session?.id;

  // هدایت به صفحه لاگین
  const handleLoginRedirect = () => {
    setShowLoginModal(false);
    router.push(`/auth?page=/product/${product.id}`);
  };

  return (
    <div className="flex flex-col gap-10 lg:mt-10 lg:flex-row">
      <TotalScoresOpinionsUsers
        product={product}
        votes={votes}
        isUserLoggedIn={isUserLoggedIn}
        onShowLoginModal={() => setShowLoginModal(true)}
      />
      <div className="flex-1">
        {isLoadingComments ? (
          <div className="mt-20 flex justify-center">
            <Spinner size="lg" />
          </div>
        ) : !commentsData || commentsData.length === 0 ? (
          <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 lg:p-12">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 lg:mb-4 lg:h-20 lg:w-20">
              <svg
                className="h-8 w-8 text-blue-600 lg:h-10 lg:w-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                />
              </svg>
            </div>
            <h3 className="mb-2 font-bold text-[15px] text-gray-900 lg:text-[20px]">
              هنوز نظری ثبت نشده است
            </h3>
            <p className="mb-5 text-center font-medium text-[13px] text-gray-600 lg:mb-6 lg:text-[16px]">
              اولین نفری باشید که نظر خود را درباره این محصول ثبت می‌کنید
            </p>
            {isUserLoggedIn ? (
              <button
                onClick={() => {
                  const addCommentBtn = document.querySelector('[data-add-comment]');
                  if (addCommentBtn) {
                    addCommentBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
                className="flex items-center gap-2 rounded-lg !bg-blue-600 px-5 py-2.5 font-medium text-[14px] !text-white shadow-lg shadow-blue-500/30 transition-all hover:!bg-blue-700 hover:shadow-xl lg:px-6 lg:py-3 lg:text-[15px]"
              >
                <svg
                  className="h-4 w-4 lg:h-5 lg:w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                ثبت اولین نظر
              </button>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-2 rounded-lg !bg-blue-600 px-5 py-2.5 font-medium text-[14px] !text-white shadow-lg shadow-blue-500/30 transition-all hover:!bg-blue-700 hover:shadow-xl lg:px-6 lg:py-3 lg:text-[15px]"
              >
                <svg
                  className="h-4 w-4 lg:h-5 lg:w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
                ورود و ثبت نظر
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4">
              {commentsData?.map((comment) => (
                <CardScoresOpinionsUsers
                  id={product.id!}
                  comment={comment}
                  key={comment.id}
                  isUserLoggedIn={isUserLoggedIn}
                  onShowLoginModal={() => setShowLoginModal(true)}
                />
              ))}
            </div>
            {/* <Pagination top={0} total={10} /> */}
          </>
        )}
      </div>

      {/* مدال لاگین */}
      <BaseDialog
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="ورود به حساب کاربری"
        onClickFooter={handleLoginRedirect}
        nameBtnFooter="ورود"
        size="md"
      >
        <div className="text-center">
          <p className="font-reqular text-gray-600">
            برای ثبت نظر یا لایک کردن، ابتدا باید وارد حساب کاربری خود شوید
          </p>
        </div>
      </BaseDialog>
    </div>
  );
};

export default ScoresOpinionsUsers;
