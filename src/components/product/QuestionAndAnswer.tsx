import React, { useEffect, useState } from 'react';
import CardQuestionAndAnswer from './CardQuestionAndAnswer';
import Button from '../common/Button';
import { Product } from '@/types/Home';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Textarea from '../common/form/Textarea';
import { useAddQuestion } from '@/hooks/product/useAddQuestion';
import BaseDialog from '../common/BaseDialog';
import { Question } from '@/types/Home/Product';
import { Answer_Icon } from '../common/Icon';
import { useAddAnswer } from '@/hooks/product/useAddAnswer';
import { useSession } from '@/lib/auth/useSession';
import { useRouter } from 'next/navigation';
import { useGetProductQuestions } from '@/hooks/product/useGetProductQuestions';
import { Spinner } from '@heroui/react';
type Props = {
  product: Product;
};
const QuestionAndAnswer = ({ product }: Props) => {
  const session = useSession();
  const router = useRouter();
  const [modal, setModal] = useState<{ open: boolean; info: Question | null }>({
    open: false,
    info: null,
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { mutate, isPending, isSuccess } = useAddQuestion();
  const {
    mutate: mutateAnswer,
    isPending: isPendingAnswer,
    isSuccess: isSuccessAnswer,
  } = useAddAnswer();
  const { data: questionsData, isLoading: isLoadingQuestions } = useGetProductQuestions(
    product.id!
  );

  // چک کردن لاگین بودن کاربر
  const isUserLoggedIn = !!session?.id;

  // هدایت به صفحه لاگین
  const handleLoginRedirect = () => {
    setShowLoginModal(false);
    router.push(`/auth?page=/product/${product.id}`);
  };
  const formik = useFormik({
    initialValues: {
      question: '',
    },
    validationSchema: Yup.object({
      question: Yup.string().required('فیلد اجباری است'),
    }),
    onSubmit: (values) => {
      if (!isUserLoggedIn) {
        setShowLoginModal(true);
        return;
      }
      const data = {
        question: values.question,
        product_id: product.id,
      };
      mutate({ data });
    },
  });
  const formikAnswer = useFormik({
    initialValues: {
      answer: '',
    },
    validationSchema: Yup.object({
      answer: Yup.string().required('فیلد اجباری است'),
    }),
    onSubmit: (values) => {
      if (!isUserLoggedIn) {
        setShowLoginModal(true);
        return;
      }
      const data = {
        answer: values?.answer,
        product_id: product.id,
        question_id: modal.info?.id,
      };
      mutateAnswer({ data });
    },
  });
  useEffect(() => {
    if (isSuccess || isSuccessAnswer) {
      formik.resetForm();
      formikAnswer.resetForm();
      setModal({ info: null, open: false });
    }
  }, [isSuccess, isSuccessAnswer]);
  return (
    <>
      <div className="flex flex-col gap-6 lg:mt-10 lg:flex-row">
        <form data-question-form className="h-fit w-full rounded-xl bg-slate-100 p-2 lg:w-72">
          <span className="text-center font-bold text-xs text-black">
            اگه سوالی داری حتما بپرس !
          </span>
          <Textarea
            // @ts-expect-error error
            formik={formik}
            name="question"
            placeholder="سوالتو بپرس ..."
            classNameInput="w-full !h-32 mt-3 bg-slate-100 rounded-lg font-reqular text-xs resize-none outline-none p-2"
          />
          <Button
            isLoading={isPending}
            onClick={() => formik.handleSubmit()}
            className="mt-2 h-9 w-full rounded-md !border !border-blue-500 !py-5"
          >
            <span className="text-center font-bold text-xs text-blue-500">ثبت پرسش جدید</span>
          </Button>
        </form>
        <div className="flex-1">
          <div>
            {isLoadingQuestions ? (
              <div className="mt-10 flex justify-center">
                <Spinner size="lg" />
              </div>
            ) : !questionsData || questionsData.length === 0 ? (
              <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 lg:p-12">
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 lg:mb-4 lg:h-20 lg:w-20">
                  <svg
                    className="h-8 w-8 text-purple-600 lg:h-10 lg:w-10"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 font-bold text-[15px] text-gray-900 lg:text-[20px]">
                  هنوز پرسشی ثبت نشده است
                </h3>
                <p className="mb-5 text-center font-medium text-[13px] text-gray-600 lg:mb-6 lg:text-[16px]">
                  اولین نفری باشید که سوال خود را درباره این محصول می‌پرسید
                </p>
                {isUserLoggedIn ? (
                  <button
                    onClick={() => {
                      const questionForm = document.querySelector('[data-question-form]');
                      if (questionForm) {
                        questionForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }}
                    className="flex items-center gap-2 rounded-lg !bg-purple-600 px-5 py-2.5 font-medium text-[14px] !text-white shadow-lg shadow-purple-500/30 transition-all hover:!bg-purple-700 hover:shadow-xl lg:px-6 lg:py-3 lg:text-[15px]"
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
                    ثبت اولین پرسش
                  </button>
                ) : (
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="flex items-center gap-2 rounded-lg !bg-purple-600 px-5 py-2.5 font-medium text-[14px] !text-white shadow-lg shadow-purple-500/30 transition-all hover:!bg-purple-700 hover:shadow-xl lg:px-6 lg:py-3 lg:text-[15px]"
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
                    ورود و ثبت پرسش
                  </button>
                )}
              </div>
            ) : (
              <>
                {questionsData?.map((question, idx) => (
                  <CardQuestionAndAnswer
                    onAnswer={() => {
                      if (!isUserLoggedIn) {
                        setShowLoginModal(true);
                        return;
                      }
                      setModal({ info: question, open: true });
                    }}
                    key={question.id || idx}
                    question={question}
                    product_id={product.id!}
                    isUserLoggedIn={isUserLoggedIn}
                    onShowLoginModal={() => setShowLoginModal(true)}
                  />
                ))}
                {/* <Pagination total={10} /> */}
              </>
            )}
          </div>
        </div>
      </div>
      <BaseDialog
        onClose={() => setModal({ open: false, info: null })}
        onClickFooter={() => formikAnswer.handleSubmit()}
        nameBtnFooter="ثبت جواب"
        title="جواب به این سوال"
        isOpen={modal.open}
        isLoadingFooterBtn={isPendingAnswer}
      >
        <div>
          <div className="flex items-center gap-2">
            <Answer_Icon className="text-[#386BF9]" />
            <div className="lg:text-center">
              <span className="font-bold text-sm text-blue-500">پاسخ : </span>
              <span className="font-regular text-[12px] text-neutral-900 lg:text-sm">
                {modal.info?.question}
              </span>
            </div>
          </div>
          <Textarea
            // @ts-expect-error error
            formik={formikAnswer}
            name="answer"
            placeholder="جوابتو بگو ..."
            classNameInput="w-full !h-32 mt-3 bg-slate-100 rounded-lg font-reqular border text-xs border-zinc-400 resize-none outline-none p-2"
          />
        </div>
      </BaseDialog>

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
            برای ثبت سوال یا پاسخ، ابتدا باید وارد حساب کاربری خود شوید
          </p>
        </div>
      </BaseDialog>
    </>
  );
};

export default QuestionAndAnswer;
