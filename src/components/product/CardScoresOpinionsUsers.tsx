import React, { useEffect, useState } from 'react';
import {
  DisLike_Icon,
  DisLikeFill_Icon,
  Like_Icon,
  LikeFill_Icon,
  Miniz_Icon,
  Plus_Icon,
} from '../common/Icon';
import { useActionProduct } from '@/hooks/product/useActionProduct';
import Button from '../common/Button';
import { useSession } from '@/lib/auth/useSession';
import { Comment } from '@/types/Home/Product';

type Props = {
  comment: Comment;
  id: number;
  isUserLoggedIn: boolean;
  onShowLoginModal?: () => void;
};

const CardScoresOpinionsUsers = ({ comment, id, isUserLoggedIn, onShowLoginModal }: Props) => {
  const [actionType, setActionType] = useState<null | 'like' | 'unlike' | 'dislike' | 'undislike'>(
    null
  );

  const { mutate, isPending, isSuccess, variables } = useActionProduct();
  const session = useSession();

  const [likes, setLikes] = useState(comment.likes_count || 0);
  const [dislikes, setDislikes] = useState(comment.dislikes_count || 0);
  const [userLiked, setUserLiked] = useState(
    comment?.likes?.includes(Number(session?.id)) || false
  );
  const [userDisLiked, setUserDisLiked] = useState(
    comment?.dislikes?.includes(Number(session?.id)) || false
  );

  const onLike = () => {
    if (!isUserLoggedIn) {
      onShowLoginModal?.();
      return;
    }
    mutate({
      url: '/comment/like',
      data: { comment_id: comment.id, product_id: id, action: 'like' },
    });
    setActionType('like');
  };

  const unLike = () => {
    if (!isUserLoggedIn) {
      onShowLoginModal?.();
      return;
    }
    mutate({
      url: '/comment/unlike',
      data: { comment_id: comment.id, product_id: id, action: 'unlike' },
    });
    setActionType('unlike');
  };

  const onDisLike = () => {
    if (!isUserLoggedIn) {
      onShowLoginModal?.();
      return;
    }
    mutate({
      url: '/comment/dislike',
      data: { comment_id: comment.id, product_id: id, action: 'dislike' },
    });
    setActionType('dislike');
  };

  const unDisLike = () => {
    if (!isUserLoggedIn) {
      onShowLoginModal?.();
      return;
    }
    mutate({
      url: '/comment/undislike',
      data: { comment_id: comment.id, product_id: id, action: 'undislike' },
    });
    setActionType('undislike');
  };

  useEffect(() => {
    if (isSuccess && actionType) {
      switch (actionType) {
        case 'like':
          setLikes((prev) => prev + 1);
          setUserLiked(true);
          if (userDisLiked) {
            setDislikes((prev) => prev - 1);
            setUserDisLiked(false);
          }
          break;
        case 'unlike':
          setLikes((prev) => prev - 1);
          setUserLiked(false);
          break;
        case 'dislike':
          setDislikes((prev) => prev + 1);
          setUserDisLiked(true);
          if (userLiked) {
            setLikes((prev) => prev - 1);
            setUserLiked(false);
          }
          break;
        case 'undislike':
          setDislikes((prev) => prev - 1);
          setUserDisLiked(false);
          break;
      }
      setActionType(null); // ریستش کن که فقط یک بار اجرا بشه
    }
  }, [isSuccess, actionType, userDisLiked, userLiked]);
  // @ts-expect-error error
  const action = variables?.data.action;
  return (
    <div className="flex gap-2 border-b pb-5 lg:gap-3">
      {/* count */}
      <span className="flex h-12 w-8 items-center justify-center rounded bg-lime-600">
        <span className="text-center font-medium text-2xl font-normal text-neutral-50">
          {comment.vote}
        </span>
      </span>
      <div className="flex-1">
        <div className="flex flex-col items-start justify-between">
          <span className="flex items-center gap-2">
            {/* title */}
            <p className="text-center font-bold text-[14px] text-black lg:text-xl">
              {comment.title}
            </p>
          </span>
          {/* name and date */}
          <div className="flex items-center text-right">
            <span className="font-medium text-[12px] text-zinc-400 lg:text-xs">
              ( {comment.user_name} -{' '}
            </span>
            <span className="font-medium text-[12px] text-zinc-400 lg:text-xs">
              {new Date(comment.created_at).toLocaleDateString('fa-IR')})
            </span>
          </div>
        </div>
        <p className="pt-2 text-right font-medium text-[13px] text-zinc-700 lg:pt-4 lg:text-base">
          {comment.content}
        </p>
        <div className="flex justify-between">
          {/* power point and low point */}
          <div className="mt-4 flex flex-col gap-2">
            {comment.strengths && comment.strengths.length >= 1 && (
              <div className="flex items-center gap-2">
                <Plus_Icon className="text-blue-500" />
                {comment.strengths.map((strength, idx) => (
                  <span key={idx} className="text-right font-medium text-xs text-blue-500">
                    {strength.value}
                  </span>
                ))}
              </div>
            )}
            {comment.weakness && comment.weakness.length >= 1 && (
              <div className="flex items-center gap-2">
                <Miniz_Icon className="text-orange-400" />
                {comment.weakness.map((item, idx) => (
                  <span key={idx} className="text-right font-medium text-xs text-orange-400">
                    {item.value}
                  </span>
                ))}
              </div>
            )}
          </div>
          {/* like and dislike */}
          <div className="flex items-center gap-5 self-end">
            <Button
              isLoading={action === 'undislike' || action === 'dislike' ? isPending : false}
              disabled={userLiked}
              onClick={userDisLiked ? unDisLike : onDisLike}
              className="flex items-center gap-2"
            >
              <span className="text-right font-medium text-base text-zinc-400">{dislikes}</span>
              {userDisLiked ? (
                <DisLikeFill_Icon className="text-[#bababa]" />
              ) : (
                <DisLike_Icon className="text-[#bababa]" />
              )}
            </Button>
            <Button
              disabled={userDisLiked}
              isLoading={action === 'like' || action === 'unlike' ? isPending : false}
              onClick={userLiked ? unLike : onLike}
              className="flex items-center gap-2"
            >
              <span className="text-right font-medium text-base font-normal text-zinc-400">
                {likes}
              </span>
              {userLiked ? (
                <LikeFill_Icon className="text-[#bababa]" />
              ) : (
                <Like_Icon className="text-[#bababa]" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardScoresOpinionsUsers;
