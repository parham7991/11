'use client';
import React, { useTransition } from 'react';
import { Accordion, AccordionItem } from '@heroui/accordion';
import useGlobalStore from '@/store/global-store';
import { useRouter } from 'next/navigation';
import Button from '@/components/common/Button';
import Loading from '@/components/common/Loading';
// const startContent = (
//   <p>
//     <svg
//       width="20"
//       height="20"
//       viewBox="0 0 20 20"
//       fill="none"
//       xmlns="http://www.w3.org/2000/svg"
//     >
//       <g clipPath="url(#clip0_1927_61768)">
//         <path
//           d="M9.5192 0.400024H9.96807C10.8351 0.504274 11.6192 1.13877 11.8449 1.99077C12.1018 2.83902 11.7553 3.7934 11.0638 4.3304C11.0458 4.61765 11.0578 4.90752 11.0582 5.1959C11.5022 5.20827 11.9469 5.1929 12.3909 5.20227C12.6039 5.20865 12.7914 5.39652 12.7982 5.60952C12.808 6.0539 12.7918 6.49865 12.8049 6.94265C13.1034 6.95202 13.4027 6.9374 13.7016 6.94827C13.9206 6.95502 14.1099 7.1534 14.1088 7.3724C14.1186 7.8839 14.1021 8.39615 14.1163 8.90765C15.0302 9.6704 15.7809 10.6413 16.2231 11.7516C16.7698 13.0934 16.8733 14.6088 16.5264 16.0147C16.2088 17.3302 15.4952 18.5459 14.5067 19.4699C14.4426 19.531 14.3601 19.567 14.2791 19.6H5.21607C5.10545 19.5618 5.0057 19.4977 4.9262 19.4118C4.05432 18.5793 3.4052 17.5173 3.06057 16.3627C2.60757 14.863 2.67657 13.2089 3.26757 11.7569C3.70857 10.6439 4.46045 9.6719 5.37732 8.90915C5.39232 8.3984 5.37657 7.88652 5.38445 7.3754C5.38182 7.1579 5.56857 6.9584 5.78607 6.94902C6.0857 6.93665 6.38607 6.95278 6.68607 6.94228C6.70257 6.4994 6.68345 6.0554 6.6947 5.61252C6.70107 5.39952 6.88595 5.21127 7.09932 5.20302C7.54445 5.19252 7.98995 5.2079 8.43507 5.19627C8.43507 4.9064 8.44782 4.61465 8.42907 4.3259C7.70232 3.77165 7.3682 2.75202 7.68095 1.88427C7.93895 1.08365 8.69382 0.506899 9.5192 0.400024ZM9.59082 1.2824C9.02082 1.3424 8.5292 1.81902 8.45195 2.38752C8.36682 2.91065 8.63945 3.46602 9.1037 3.72027C9.53907 3.97415 10.1196 3.9389 10.5216 3.63515C10.9783 3.30927 11.1767 2.67365 10.9798 2.14677C10.7919 1.5809 10.1818 1.2014 9.59082 1.2824ZM9.31557 4.76315C9.30732 4.9079 9.3092 5.05302 9.31407 5.19777C9.60282 5.20152 9.89195 5.2019 10.1807 5.19777C10.1856 5.05302 10.1837 4.90827 10.1826 4.76352C9.89345 4.76877 9.6047 4.76952 9.31557 4.76315ZM7.5662 6.07602C7.5632 6.35652 7.5647 6.63777 7.56545 6.91827C9.0107 6.95727 10.4743 6.92727 11.9267 6.93327C11.9293 6.64715 11.9304 6.36065 11.9263 6.07452C10.4728 6.0794 9.01932 6.07677 7.5662 6.07602ZM6.2582 7.8224C6.25332 8.10965 6.2552 8.39727 6.25707 8.68415C8.5832 8.69015 10.9101 8.6894 13.2362 8.68452C13.2384 8.39577 13.2384 8.10703 13.2358 7.81827C10.9104 7.8299 8.58357 7.82165 6.2582 7.8224ZM4.45332 11.3095C6.94895 11.3137 9.44495 11.3088 11.9406 11.3118C12.1742 11.3095 12.3812 11.5296 12.3624 11.7633C12.3606 12.0006 12.1356 12.1983 11.9004 12.1814C9.2792 12.1852 6.65757 12.1791 4.03632 12.1844C3.1667 14.3943 3.75582 17.077 5.46882 18.721C8.31882 18.7334 11.1707 18.7285 14.0211 18.7236C15.6036 17.2023 16.24 14.7929 15.6235 12.6865C15.2946 11.5117 14.5952 10.4474 13.6558 9.67002C13.6011 9.63027 13.5527 9.56315 13.4773 9.57102C10.9753 9.57215 8.47332 9.56802 5.97132 9.57327C5.35295 10.0364 4.83957 10.6409 4.45332 11.3095Z"
//           fill="#DD338B"
//         />
//         <path
//           d="M12.6613 0.860516C13.703 0.807266 14.7545 0.853016 15.8 0.837266C16.0468 0.805391 16.2928 1.01089 16.2898 1.26214C16.3048 1.50552 16.0809 1.71964 15.8405 1.70989C14.8385 1.71214 13.8365 1.71102 12.8341 1.71064C12.6283 1.72189 12.4224 1.57939 12.3785 1.37464C12.3211 1.16389 12.4531 0.925391 12.6613 0.860516Z"
//           fill="#DD338B"
//         />
//         <path
//           d="M13.5659 2.59716C14.8967 2.56304 16.2329 2.59229 17.5656 2.58254C17.8019 2.56041 18.0295 2.75691 18.0351 2.99541C18.0557 3.23616 17.8412 3.46004 17.6001 3.45366C16.3004 3.45666 15.0002 3.45479 13.7001 3.45441C13.4755 3.46866 13.2587 3.29016 13.2415 3.06366C13.2145 2.85516 13.3615 2.64479 13.5659 2.59716Z"
//           fill="#DD338B"
//         />
//         <path
//           d="M13.5259 4.35366C14.2786 4.29366 15.0428 4.34429 15.8003 4.32741C16.0444 4.29966 16.2912 4.49879 16.2901 4.74929C16.3073 4.99266 16.0834 5.21279 15.8412 5.19966C15.1268 5.20041 14.4121 5.20004 13.6973 5.20004C13.4809 5.21166 13.2698 5.04329 13.2447 4.82654C13.2072 4.62666 13.3384 4.42154 13.5259 4.35366Z"
//           fill="#DD338B"
//         />
//         <path
//           d="M13.1123 11.3282C13.427 11.2172 13.7641 11.5559 13.6535 11.8705C13.574 12.19 13.1116 12.2886 12.9083 12.0295C12.6995 11.8082 12.8187 11.4044 13.1123 11.3282Z"
//           fill="#DD338B"
//         />
//         <path
//           d="M6.95653 13.756C7.50928 12.9269 8.84915 12.8043 9.5264 13.5442C10.2097 12.8024 11.5567 12.928 12.1075 13.7669C12.3978 14.1802 12.427 14.7314 12.2635 15.1998C12.1008 15.6854 11.746 16.0739 11.3767 16.4155C10.8697 16.873 10.3225 17.2833 9.8174 17.7434C9.65503 17.8915 9.38615 17.8882 9.22828 17.7355C8.7179 17.2672 8.16028 16.8543 7.64878 16.3878C7.30828 16.0705 6.98765 15.7117 6.81703 15.2722C6.62728 14.7832 6.6419 14.191 6.95653 13.756ZM7.5884 14.4288C7.4924 14.8252 7.72303 15.211 7.98553 15.4904C8.45878 15.9824 9.01003 16.3897 9.5294 16.8299C9.9839 16.4429 10.4605 16.0807 10.8933 15.6689C11.2207 15.3607 11.5578 14.9482 11.4775 14.467C11.365 13.9739 10.7133 13.7894 10.3034 14.029C10.1024 14.1577 10.0008 14.3827 9.87553 14.5762C9.72065 14.8023 9.34978 14.8102 9.1874 14.5882C9.05015 14.3812 8.94365 14.1322 8.7149 14.008C8.3159 13.8089 7.72265 13.9743 7.5884 14.4288Z"
//           fill="#DD338B"
//         />
//       </g>
//       <defs>
//         <clipPath id="clip0_1927_61768">
//           <rect
//             width="19.2"
//             height="19.2"
//             fill="white"
//             transform="translate(0.799988 0.400024)"
//           />
//         </clipPath>
//       </defs>
//     </svg>
//   </p>
// );
const CategoryPage = () => {
  const [isPending, stratTransition] = useTransition();
  const router = useRouter();
  const { categories } = useGlobalStore();

  const onRedirect = (url: string) => {
    stratTransition(() => {
      router.push(`${url}`);
    });
  };

  return (
    <div className="container_page mb-3 mt-2 py-4 pb-32">
      <div className="flex items-center gap-2 font-medium text-[14px]">
        <span>
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M14.4 8.4H16C17.6 8.4 18.4 7.6 18.4 6V4.4C18.4 2.8 17.6 2 16 2H14.4C12.8 2 12 2.8 12 4.4V6C12 7.6 12.8 8.4 14.4 8.4Z"
              stroke="#616A76"
              strokeWidth="1.5"
              strokeMiterlimit="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4.79999 18H6.39999C7.99999 18 8.79999 17.2 8.79999 15.6V14C8.79999 12.4 7.99999 11.6 6.39999 11.6H4.79999C3.19999 11.6 2.39999 12.4 2.39999 14V15.6C2.39999 17.2 3.19999 18 4.79999 18Z"
              stroke="#616A76"
              strokeWidth="1.5"
              strokeMiterlimit="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M5.59999 8.4C7.36731 8.4 8.79999 6.96731 8.79999 5.2C8.79999 3.43269 7.36731 2 5.59999 2C3.83268 2 2.39999 3.43269 2.39999 5.2C2.39999 6.96731 3.83268 8.4 5.59999 8.4Z"
              stroke="#616A76"
              strokeWidth="1.5"
              strokeMiterlimit="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M15.2 18C16.9673 18 18.4 16.5673 18.4 14.8C18.4 13.0327 16.9673 11.6 15.2 11.6C13.4327 11.6 12 13.0327 12 14.8C12 16.5673 13.4327 18 15.2 18Z"
              stroke="#616A76"
              strokeWidth="1.5"
              strokeMiterlimit="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="text-[#232429]">دسته‌بندی‌ها</span>
      </div>
      <div className="container_category mt-2">
        {Array.isArray(categories) ? (
          <Accordion className="!px-0">
            {categories?.map((item, idx) => {
              if (!item.status) return null;

              return (
                <AccordionItem
                  // startContent={item.Icon ? <item.Icon /> : undefined}
                  key={idx}
                  aria-label="Accordion 1"
                  title={
                    <Button
                      className="!h-fit w-fit min-w-fit bg-transparent !p-0"
                      onClick={() => onRedirect(item.link)}
                    >
                      {item.name}
                    </Button>
                  }
                  subtitle={item.sub_category?.map((item) => item.name).join('_ ')}
                  classNames={{
                    base: 'border-b border-[#E4E7E9] !px-0',
                    title: 'font-medium !text-[14px] text-[#232429]',
                    subtitle: 'text-[10px] text-[#7D8793] font-light line-clamp-1',
                    trigger: 'items-start',
                    content: '!py-0',
                  }}
                >
                  <Accordion className="!p-0">
                    {Array.isArray(item?.sub_category) ? (
                      item?.sub_category?.map((child, idx) => {
                        if (!child.status) return null;

                        return (
                          <AccordionItem
                            key={idx}
                            title={
                              <Button
                                className="!h-fit w-fit min-w-fit bg-transparent !p-0 text-right"
                                onClick={() => onRedirect(child.link)}
                              >
                                {child.name}
                              </Button>
                            }
                            classNames={{
                              heading: 'py-0',
                              trigger: '!pb-2 pt-2',
                              title: 'text-[14px] text-[#7D8793] font-regular line-clamp-1',
                              indicator: `pl-5 ${
                                item.sub_category?.filter((item) => child.title === item.position)
                                  ?.length === 1
                                  ? '!hidden'
                                  : ''
                              }`,
                            }}
                          >
                            <div className="flex flex-col gap-2">
                              {child.sub_category.map((sub, idx) => {
                                if (!sub.status) return null;

                                return (
                                  <Button
                                    className="font-regular line-clamp-1 !h-fit w-fit justify-normal px-0 py-1 text-right text-[12px] text-[#7d8793c3]"
                                    key={idx}
                                    onClick={() => onRedirect(sub.link)}
                                  >
                                    {sub.name}
                                  </Button>
                                );
                              })}
                            </div>
                          </AccordionItem>
                        );
                      })
                    ) : (
                      <AccordionItem></AccordionItem>
                    )}
                  </Accordion>
                </AccordionItem>
              );
            })}
          </Accordion>
        ) : null}

        {/* لینک به صفحه مگ */}
        <Accordion className="!px-0">
          <AccordionItem
            key="mag"
            aria-label="Magazine"
            title={
              <Button
                className="!h-fit w-fit min-w-fit bg-transparent !p-0"
                onClick={() => onRedirect('/mag')}
              >
                مجله و مقالات
              </Button>
            }
            subtitle="مطالعه جدیدترین مقالات و اخبار"
            classNames={{
              base: 'border-b border-[#E4E7E9] !px-0',
              title: 'font-medium !text-[14px] text-[#232429]',
              subtitle: 'text-[10px] text-[#7D8793] font-light line-clamp-1',
              trigger: 'items-start',
              content: '!py-0',
              indicator: '!hidden',
            }}
          >
            <div></div>
          </AccordionItem>
        </Accordion>
      </div>

      {isPending ? <Loading /> : null}
    </div>
  );
};

export default CategoryPage;
