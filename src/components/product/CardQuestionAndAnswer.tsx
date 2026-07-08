import React, { useEffect, useState } from 'react';
import {
  Answer_Icon,
  DisLike_Icon,
  DisLikeFill_Icon,
  Like_Icon,
  LikeFill_Icon,
  Question_Icon,
} from '../common/Icon';
import Button from '../common/Button';
import { useActionProduct } from '@/hooks/product/useActionProduct';
import { useSession } from '@/lib/auth/useSession';
import { Question, Answer } from '@/types/Home/Product';

type AnswerWithUserState = Answer & {
  userLiked: boolean;
  userDisLiked: boolean;
};

type Props = {
  product_id?: number;
  question: Question;
  onAnswer: () => void;
  isUserLoggedIn?: boolean;
  onShowLoginModal?: () => void;
};

const CardQuestionAndAnswer = ({
  question,
  onAnswer,
  product_id,
  isUserLoggedIn,
  onShowLoginModal,
}: Props) => {
  const { mutate, isPending, isSuccess } = useActionProduct();
  const session = useSession();

  const [answers, setAnswers] = useState<AnswerWithUserState[]>(
    () =>
      question.answers?.map((a) => ({
        ...a,
        userLiked: a?.likes?.some((like) => like.user_id === Number(session?.id)) ?? false,
        userDisLiked:
          a?.dislikes?.some((dislike) => dislike.user_id === Number(session?.id)) ?? false,
      })) || []
  );

  const [actionType, setActionType] = useState<null | 'like' | 'unlike' | 'dislike' | 'undislike'>(
    null
  );
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);

  const handleAction = async (id: string, action: 'like' | 'dislike') => {
    if (!isUserLoggedIn) {
      onShowLoginModal?.();
      return;
    }
    const answer = answers.find((a) => a.id === id);
    if (!answer) return;

    // اگر کاربر قبلاً لایک کرده بود و الان دیسلایک میزنه، اول unlike رو بفرست
    // if (action === 'dislike' && answer.userLiked) {
    //   await mutate({
    //     url: `/answer/unlike`,
    //     data: { answer_id: id, product_id, action: 'unlike' },
    //   });
    // }

    // // اگر کاربر قبلاً دیسلایک کرده بود و الان لایک میزنه، اول undislike رو بفرست
    // if (action === 'like' && answer.userDisLiked) {
    //   await mutate({
    //     url: `/answer/undislike`,
    //     data: { answer_id: id, product_id, action: 'undislike' },
    //   });
    // }

    // حالا اکشن اصلی رو بفرست
    mutate({
      url: `/answer/${action}`,
      data: { answer_id: id, product_id, action },
    });

    setActionType(action);
    setSelectedAnswerId(id);
  };

  useEffect(() => {
    if (isSuccess && actionType && selectedAnswerId !== null) {
      setAnswers((prev) =>
        prev.map((answer) => {
          if (answer.id !== selectedAnswerId) return answer;

          const updated: AnswerWithUserState = { ...answer };

          switch (actionType) {
            case 'like':
              updated.likes.push({
                id: 'temp',
                user_id: Number(session?.id),
                likeable_id: answer.id,
                likeable_type: 'answer',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
              if (updated.userDisLiked) {
                updated.dislikes = updated.dislikes.filter(
                  (d) => d.user_id !== Number(session?.id)
                );
                updated.userDisLiked = false;
              }
              updated.userLiked = true;
              break;
            case 'unlike':
              updated.likes = updated.likes.filter((l) => l.user_id !== Number(session?.id));
              updated.userLiked = false;
              break;
            case 'dislike':
              updated.dislikes.push({
                id: 'temp',
                user_id: Number(session?.id),
                likeable_id: answer.id,
                likeable_type: 'answer',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
              if (updated.userLiked) {
                updated.likes = updated.likes.filter((l) => l.user_id !== Number(session?.id));
                updated.userLiked = false;
              }
              updated.userDisLiked = true;
              break;
            case 'undislike':
              updated.dislikes = updated.dislikes.filter((d) => d.user_id !== Number(session?.id));
              updated.userDisLiked = false;
              break;
          }
          return updated;
        })
      );

      setActionType(null);
      setSelectedAnswerId(null);
    }
  }, [isSuccess]);
  return (
    <div className="flex flex-col gap-1 border-b py-4 lg:gap-7">
      {/* نمایش سؤال */}
      <div className="flex flex-col-reverse items-center justify-between lg:flex-row">
        <div className="flex items-center gap-1">
          <Question_Icon className="text-[#F9A038]" />
          <p className="text-start font-bold text-[12px] text-neutral-900 lg:text-center lg:text-base">
            {question.question}
          </p>
        </div>
        <div className="self-start text-right">
          <span className="font-medium text-xs text-zinc-400">( {question.user_name} - </span>
          <span className="font-medium text-xs text-zinc-400">{question.created_at}</span>
        </div>
      </div>

      {/* پاسخ‌ها */}
      {answers.map((answer) => (
        <div key={answer.id} className="flex flex-col items-center justify-between lg:flex-row">
          <div className="flex items-center gap-2">
            <Answer_Icon className="text-[#386BF9]" />
            <div className="lg:text-center">
              <span className="font-bold text-sm text-blue-500">پاسخ : </span>
              <span className="font-medium text-[12px] text-neutral-900 lg:text-sm">
                {answer.answer}
              </span>
            </div>
          </div>

          {/* دکمه‌های لایک و دیسلایک */}
          <div className="flex items-center gap-5 self-end">
            <Button
              isLoading={selectedAnswerId === answer.id && actionType === 'dislike' && isPending}
              disabled={answer.userDisLiked}
              onClick={() => handleAction(answer.id, 'dislike')}
              className="flex items-center gap-2"
            >
              <span className="text-right font-medium text-base text-zinc-400">
                {answer.dislikes?.length || 0}
              </span>
              {answer.userDisLiked ? (
                <DisLikeFill_Icon className="text-[#bababa]" />
              ) : (
                <DisLike_Icon className="text-[#bababa]" />
              )}
            </Button>

            <Button
              isLoading={selectedAnswerId === answer.id && actionType === 'like' && isPending}
              disabled={answer.userLiked}
              onClick={() => handleAction(answer.id, 'like')}
              className="flex items-center gap-2"
            >
              <span className="text-right font-medium text-base text-zinc-400">
                {answer.likes?.length || 0}
              </span>
              {answer.userLiked ? (
                <LikeFill_Icon className="text-[#bababa]" />
              ) : (
                <Like_Icon className="text-[#bababa]" />
              )}
            </Button>
          </div>
        </div>
      ))}

      <Button
        onClick={onAnswer}
        className="!mr-auto mt-2 h-9 w-full rounded-md !border !border-blue-500 !py-5 lg:w-[200px]"
      >
        <span className="text-center font-bold text-xs text-blue-500">ثبت پاسخ</span>
      </Button>
    </div>
  );
};

export default CardQuestionAndAnswer;
