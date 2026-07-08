'use client';
import BackPrevPage from '@/components/common/BackPrevPage';
import EmptyComments from '@/components/empty/EmptyComments';
import { useGetComment } from '@/hooks/profile/useGetComment';
import { Comment } from '@/types/Home';
import { Spinner } from '@heroui/react';
import React from 'react';

const Page = () => {
  const { data, isPending } = useGetComment();
  if (isPending) return <Spinner className="mt-10 flex items-center justify-center" />;
  return (
    <>
      <BackPrevPage title="نظرات" />
      <p className="hidden border-b border-gray-200 pb-3 font-medium text-[14px] text-[#0C0C0C] lg:block lg:text-[18px]">
        لیست کامنت‌ها
      </p>
      {Number(data?.response?.data.length) >= 1 ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {data?.response?.data?.map((comment: Comment, idx: number) => (
            <div key={idx} className="rounded-lg bg-[#F5F5F5] p-3 font-medium lg:p-5">
              <div className="flex items-center justify-between border-b border-[#CCCCCC]">
                {/* title */}
                <div className="flex items-center gap-1">
                  <span>
                    <svg
                      width="40"
                      height="41"
                      viewBox="0 0 40 41"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect x="8" y="8.25" width="24" height="24" rx="6" fill="#386BF9" />
                      <g filter="url(#filter0_d_1343_9425)">
                        <path
                          d="M24.6667 12.25H15.3333C13.4953 12.25 12 13.7453 12 15.5833V24.9167C12 26.7547 13.4953 28.25 15.3333 28.25H24.6667C26.5047 28.25 28 26.7547 28 24.9167V15.5833C28 13.7453 26.5047 12.25 24.6667 12.25ZM20 24.9167C19.448 24.9167 19 24.4687 19 23.9167C19 23.3647 19.448 22.9167 20 22.9167C20.552 22.9167 21 23.3647 21 23.9167C21 24.4687 20.552 24.9167 20 24.9167ZM21.2853 20.5753C20.938 20.7667 20.6667 21.21 20.6667 21.5833C20.6667 21.952 20.368 22.25 20 22.25C19.632 22.25 19.3333 21.952 19.3333 21.5833C19.3333 20.7273 19.8713 19.8327 20.642 19.4073C21.1507 19.1273 21.4133 18.5713 21.3113 17.9907C21.2193 17.466 20.7713 17.0187 20.2473 16.9267C19.8433 16.8553 19.4507 16.958 19.1433 17.2167C18.84 17.4707 18.6667 17.8433 18.6667 18.2387C18.6667 18.6067 18.368 18.9053 18 18.9053C17.632 18.9053 17.3333 18.6067 17.3333 18.2387C17.3333 17.4487 17.6807 16.704 18.286 16.196C18.8913 15.688 19.692 15.478 20.4773 15.614C21.5527 15.802 22.436 16.6847 22.6247 17.7607C22.8233 18.8933 22.2853 20.024 21.2853 20.5753Z"
                          fill="#FCFCFC"
                        />
                      </g>
                      <defs>
                        <filter
                          id="filter0_d_1343_9425"
                          x="0"
                          y="0.25"
                          width="40"
                          height="40"
                          filterUnits="userSpaceOnUse"
                          colorInterpolationFilters="sRGB"
                        >
                          <feFlood floodOpacity="0" result="BackgroundImageFix" />
                          <feColorMatrix
                            in="SourceAlpha"
                            type="matrix"
                            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                            result="hardAlpha"
                          />
                          <feOffset />
                          <feGaussianBlur stdDeviation="6" />
                          <feComposite in2="hardAlpha" operator="out" />
                          <feColorMatrix
                            type="matrix"
                            values="0 0 0 0 0.988235 0 0 0 0 0.988235 0 0 0 0 0.988235 0 0 0 0.25 0"
                          />
                          <feBlend
                            mode="normal"
                            in2="BackgroundImageFix"
                            result="effect1_dropShadow_1343_9425"
                          />
                          <feBlend
                            mode="normal"
                            in="SourceGraphic"
                            in2="effect1_dropShadow_1343_9425"
                            result="shape"
                          />
                        </filter>
                      </defs>
                    </svg>
                  </span>
                  <span className="text-[12px]">{comment.title}</span>
                </div>
                {/* date */}
                <div className="flex items-center gap-1">
                  <span>
                    <svg
                      width="16"
                      height="17"
                      viewBox="0 0 16 17"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g clipPath="url(#clip0_1343_9280)">
                        <path
                          d="M12.6667 1.58333H12V0.916667C12 0.739856 11.9298 0.570286 11.8047 0.445262C11.6797 0.320238 11.5101 0.25 11.3333 0.25C11.1565 0.25 10.987 0.320238 10.8619 0.445262C10.7369 0.570286 10.6667 0.739856 10.6667 0.916667V1.58333H5.33333V0.916667C5.33333 0.739856 5.2631 0.570286 5.13807 0.445262C5.01305 0.320238 4.84348 0.25 4.66667 0.25C4.48986 0.25 4.32029 0.320238 4.19526 0.445262C4.07024 0.570286 4 0.739856 4 0.916667V1.58333H3.33333C2.4496 1.58439 1.60237 1.93592 0.97748 2.56081C0.352588 3.18571 0.00105857 4.03294 0 4.91667L0 12.9167C0.00105857 13.8004 0.352588 14.6476 0.97748 15.2725C1.60237 15.8974 2.4496 16.2489 3.33333 16.25H12.6667C13.5504 16.2489 14.3976 15.8974 15.0225 15.2725C15.6474 14.6476 15.9989 13.8004 16 12.9167V4.91667C15.9989 4.03294 15.6474 3.18571 15.0225 2.56081C14.3976 1.93592 13.5504 1.58439 12.6667 1.58333ZM1.33333 4.91667C1.33333 4.38623 1.54405 3.87753 1.91912 3.50245C2.29419 3.12738 2.8029 2.91667 3.33333 2.91667H12.6667C13.1971 2.91667 13.7058 3.12738 14.0809 3.50245C14.456 3.87753 14.6667 4.38623 14.6667 4.91667V5.58333H1.33333V4.91667ZM12.6667 14.9167H3.33333C2.8029 14.9167 2.29419 14.706 1.91912 14.3309C1.54405 13.9558 1.33333 13.4471 1.33333 12.9167V6.91667H14.6667V12.9167C14.6667 13.4471 14.456 13.9558 14.0809 14.3309C13.7058 14.706 13.1971 14.9167 12.6667 14.9167Z"
                          fill="#F9A038"
                        />
                        <path
                          d="M8 11.25C8.55228 11.25 9 10.8023 9 10.25C9 9.69772 8.55228 9.25 8 9.25C7.44772 9.25 7 9.69772 7 10.25C7 10.8023 7.44772 11.25 8 11.25Z"
                          fill="#F9A038"
                        />
                        <path
                          d="M4.66406 11.25C5.21635 11.25 5.66406 10.8023 5.66406 10.25C5.66406 9.69772 5.21635 9.25 4.66406 9.25C4.11178 9.25 3.66406 9.69772 3.66406 10.25C3.66406 10.8023 4.11178 11.25 4.66406 11.25Z"
                          fill="#F9A038"
                        />
                        <path
                          d="M11.3359 11.25C11.8882 11.25 12.3359 10.8023 12.3359 10.25C12.3359 9.69772 11.8882 9.25 11.3359 9.25C10.7837 9.25 10.3359 9.69772 10.3359 10.25C10.3359 10.8023 10.7837 11.25 11.3359 11.25Z"
                          fill="#F9A038"
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_1343_9280">
                          <rect width="16" height="16" fill="white" transform="translate(0 0.25)" />
                        </clipPath>
                      </defs>
                    </svg>
                  </span>
                  <span className="text-[12px]">{comment.created_at}</span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 pt-3">
                  <span className="flex h-[25px] w-[24px] items-center justify-center rounded-lg bg-orange">
                    <svg
                      width="36"
                      height="41"
                      viewBox="0 0 36 41"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g filter="url(#filter0_d_1343_9431)">
                        <path
                          d="M17.9997 20.2495C20.2087 20.2495 21.9995 18.4587 21.9995 16.2497C21.9995 14.0407 20.2087 12.25 17.9997 12.25C15.7907 12.25 14 14.0407 14 16.2497C14 18.4587 15.7907 20.2495 17.9997 20.2495Z"
                          fill="#FCFCFC"
                        />
                      </g>
                      <g filter="url(#filter1_d_1343_9431)">
                        <path
                          d="M17.9996 21.582C14.6876 21.5857 12.0037 24.2697 12 27.5816C12 27.9498 12.2984 28.2483 12.6666 28.2483H23.3326C23.7007 28.2483 23.9992 27.9498 23.9992 27.5816C23.9955 24.2697 21.3116 21.5857 17.9996 21.582Z"
                          fill="#FCFCFC"
                        />
                      </g>
                      <defs>
                        <filter
                          id="filter0_d_1343_9431"
                          x="2"
                          y="0.25"
                          width="32"
                          height="32"
                          filterUnits="userSpaceOnUse"
                          colorInterpolationFilters="sRGB"
                        >
                          <feFlood floodOpacity="0" result="BackgroundImageFix" />
                          <feColorMatrix
                            in="SourceAlpha"
                            type="matrix"
                            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                            result="hardAlpha"
                          />
                          <feOffset />
                          <feGaussianBlur stdDeviation="6" />
                          <feComposite in2="hardAlpha" operator="out" />
                          <feColorMatrix
                            type="matrix"
                            values="0 0 0 0 0.988235 0 0 0 0 0.988235 0 0 0 0 0.988235 0 0 0 0.25 0"
                          />
                          <feBlend
                            mode="normal"
                            in2="BackgroundImageFix"
                            result="effect1_dropShadow_1343_9431"
                          />
                          <feBlend
                            mode="normal"
                            in="SourceGraphic"
                            in2="effect1_dropShadow_1343_9431"
                            result="shape"
                          />
                        </filter>
                        <filter
                          id="filter1_d_1343_9431"
                          x="0"
                          y="9.58203"
                          width="36"
                          height="30.668"
                          filterUnits="userSpaceOnUse"
                          colorInterpolationFilters="sRGB"
                        >
                          <feFlood floodOpacity="0" result="BackgroundImageFix" />
                          <feColorMatrix
                            in="SourceAlpha"
                            type="matrix"
                            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                            result="hardAlpha"
                          />
                          <feOffset />
                          <feGaussianBlur stdDeviation="6" />
                          <feComposite in2="hardAlpha" operator="out" />
                          <feColorMatrix
                            type="matrix"
                            values="0 0 0 0 0.988235 0 0 0 0 0.988235 0 0 0 0 0.988235 0 0 0 0.25 0"
                          />
                          <feBlend
                            mode="normal"
                            in2="BackgroundImageFix"
                            result="effect1_dropShadow_1343_9431"
                          />
                          <feBlend
                            mode="normal"
                            in="SourceGraphic"
                            in2="effect1_dropShadow_1343_9431"
                            result="shape"
                          />
                        </filter>
                      </defs>
                    </svg>
                  </span>
                  <span className="text-[12px] lg:text-[14px]">{comment.user_name}</span>
                </div>
                <p className="pt-3 font-light text-[12px] text-[#AAAAAA] lg:text-[14px]">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyComments />
      )}
    </>
  );
};

export default Page;
