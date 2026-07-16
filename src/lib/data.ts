import {
  Accept_icon,
  Actives_Icon,
  AgentSend_icon,
  Cart_Icon,
  CashOnEelivery_Icon,
  Comment_Icon_,
  DaysReturn_Icon,
  ExpressDelivery_Icon,
  Gift_icon,
  Heart_Icon,
  Location_Icon_,
  Money_icon,
  OriginalProducts_Icon,
  Process_icon,
  ReciveCustomer_icon,
  Support_Icon,
  User_Icon,
} from '@/components/common/Icon';
import Article from '@/../public/images/Rectangle 1116.png';
import Articles from '@/../public/images/Rectangle 1117.png';
import AllArticle from '@/../public/images/Rectangle 1120.png';
export const footer = [
  {
    title: 'صفحه اصلی',
    links: [
      {
        name: 'سیستم های اسمبل شده',
        link: '/category/487',
      },
      {
        name: 'محصولات دست دوم',
        link: '/category/4080',
      },
      {
        name: 'مقالات',
        link: '/mag',
      },
      {
        name: 'درباره ما',
        link: '/about',
      },
      {
        name: 'ارتباط با آفلند',
        link: '/contact-us',
      },
    ],
  },
  {
    title: 'خدمات مربوط کاربران',
    links: [
      {
        name: 'حساب کاربری',
        link: '/profile',
      },
      {
        name: 'سبد خرید',
        link: '/cart',
      },
      {
        name: 'شرایط و قوانین',
        link: '/Terms',
      },
      {
        name: 'حفظ حریم خصوصی',
        link: '/reules',
      },
      {
        name: 'گارانتی محصولات',
        link: '/warranty',
      },
    ],
  },

  {
    title: 'آخرین دسته بندی',
    links: [
      {
        name: 'گوشی موبایل',
        link: 'https://www.offl.ir/category/3995',
      },
      {
        name: 'لپ‌تاب',
        link: 'https://www.offl.ir/category/1837',
      },
      {
        name: 'ساعت هوشمند',
        link: 'https://www.offl.ir/category/3995',
      },
      {
        name: 'کنسول بازی',
        link: 'https://www.offl.ir/category/1705',
      },
      {
        name: 'مادربرد',
        link: 'https://www.offl.ir/category/1369',
      },
    ],
  },
];

export const sidebarUser = [
  {
    name: 'تمام فعالیت ها',
    Icon: Actives_Icon,
    url: '/profile',
  },
  {
    name: 'اطلاعات شخصی',
    Icon: User_Icon,
    url: '/profile/user/personal-information',
  },
  {
    name: 'لیست سفارشات من',
    Icon: Cart_Icon,
    url: '/profile/user/orders',
  },
  // {
  //     name: "خرید های اقساطی",
  //     Icon: Instalment_Icon,
  //     url: "/profile/investor/my-products",
  // },
  {
    name: 'آدرس های من',
    Icon: Location_Icon_,
    url: '/profile/user/address',
  },
  {
    name: 'علاقه مندی‌ها',
    Icon: Heart_Icon,
    url: '/profile/user/wishlist',
  },
  {
    name: 'نظرات داده شده',
    Icon: Comment_Icon_,
    url: '/profile/user/comment',
  },
  // {
  //     name: "اعتبار من",
  //     Icon:Wallet_Icon,
  //     url: "/profile/investor/wallet",
  // },
];

export const options_site = [
  {
    name: 'تحویل سریع',
    icon: ExpressDelivery_Icon,
  },
  {
    name: '24 ساعته ، 7 روز هفته',
    icon: Support_Icon,
  },
  {
    name: 'امکان پرداخت در محل',
    icon: CashOnEelivery_Icon,
  },
  {
    name: 'هفت روز ضمانت برگشت کالا',
    icon: DaysReturn_Icon,
  },
  {
    name: 'اصل بودن کالا',
    icon: OriginalProducts_Icon,
  },
];

export const levelsStatusSend = [
  {
    name: 'در انتظار پرداخت',
    icon: Money_icon,
    status: true,
  },
  {
    name: 'در انتظار بررسی',
    icon: Process_icon,
    status: true,
  },
  {
    name: 'تایید سفارش',
    icon: Accept_icon,
    status: false,
  },
  {
    name: 'آماده سازی سفارش',
    icon: Gift_icon,
    status: false,
  },
  {
    name: 'تایید خروج از انبار',
    icon: ReciveCustomer_icon,
    status: false,
  },
  {
    name: 'تحویل به مامور ارسال',
    icon: AgentSend_icon,
    status: false,
  },
  {
    name: 'تحویل سفارش به مشتری',
    icon: ReciveCustomer_icon,
    status: false,
  },
];

export const article = [
  {
    img: Article,
    title: 'دست مکانیکی که میتواند تمام دنیا و جهانیان را متحیر کند و جایگزین انسان شود !!!',
    id: 1,
    date: ' ۱۲ مرداد - ۱۴۰۱ ',
    type: 'نئو تکنولوژی',
  },
  {
    img: Articles,
    title: 'دست مکانیکی که میتواند تمام دنیا و جهانیان را متحیر کند و جایگزین انسان شود !!!',
    id: 2,
    date: ' ۱۲ مرداد - ۱۴۰۱ ',
    type: 'نئو تکنولوژی',
  },
  {
    img: Articles,
    title: 'دست مکانیکی که میتواند تمام دنیا و جهانیان را متحیر کند و جایگزین انسان شود !!!',
    id: 3,
    date: ' ۱۲ مرداد - ۱۴۰۱ ',
    type: 'نئو تکنولوژی',
  },
  {
    img: Articles,
    title: 'دست مکانیکی که میتواند تمام دنیا و جهانیان را متحیر کند و جایگزین انسان شود !!!',
    id: 4,
    date: ' ۱۲ مرداد - ۱۴۰۱ ',
    type: 'نئو تکنولوژی',
  },
  {
    img: Articles,
    title: 'دست مکانیکی که میتواند تمام دنیا و جهانیان را متحیر کند و جایگزین انسان شود !!!',
    id: 5,
    date: ' ۱۲ مرداد - ۱۴۰۱ ',
    type: 'نئو تکنولوژی',
  },
  {
    img: AllArticle,
    title: 'دست مکانیکی که میتواند تمام دنیا و جهانیان را متحیر کند و جایگزین انسان شود !!!',
    id: 6,
    date: ' ۱۲ مرداد - ۱۴۰۱ ',
    type: 'نئو تکنولوژی',
  },
  {
    img: AllArticle,
    title: 'دست مکانیکی که میتواند تمام دنیا و جهانیان را متحیر کند و جایگزین انسان شود !!!',
    id: 7,
    date: ' ۱۲ مرداد - ۱۴۰۱ ',
    type: 'نئو تکنولوژی',
  },
  {
    img: AllArticle,
    title: 'دست مکانیکی که میتواند تمام دنیا و جهانیان را متحیر کند و جایگزین انسان شود !!!',
    id: 8,
    date: ' ۱۲ مرداد - ۱۴۰۱ ',
    type: 'نئو تکنولوژی',
  },
  {
    img: AllArticle,
    title: 'دست مکانیکی که میتواند تمام دنیا و جهانیان را متحیر کند و جایگزین انسان شود !!!',
    id: 9,
    date: ' ۱۲ مرداد - ۱۴۰۱ ',
    type: 'نئو تکنولوژی',
  },
  {
    img: AllArticle,
    title: 'دست مکانیکی که میتواند تمام دنیا و جهانیان را متحیر کند و جایگزین انسان شود !!!',
    id: 10,
    date: ' ۱۲ مرداد - ۱۴۰۱ ',
    type: 'نئو تکنولوژی',
  },
  {
    img: AllArticle,
    title: 'دست مکانیکی که میتواند تمام دنیا و جهانیان را متحیر کند و جایگزین انسان شود !!!',
    id: 11,
    date: ' ۱۲ مرداد - ۱۴۰۱ ',
    type: 'نئو تکنولوژی',
  },
  {
    img: AllArticle,
    title: 'دست مکانیکی که میتواند تمام دنیا و جهانیان را متحیر کند و جایگزین انسان شود !!!',
    id: 12,
    date: ' ۱۲ مرداد - ۱۴۰۱ ',
    type: 'نئو تکنولوژی',
  },
  {
    img: AllArticle,
    title: 'دست مکانیکی که میتواند تمام دنیا و جهانیان را متحیر کند و جایگزین انسان شود !!!',
    id: 13,
    date: ' ۱۲ مرداد - ۱۴۰۱ ',
    type: 'نئو تکنولوژی',
  },
  {
    img: AllArticle,
    title: 'دست مکانیکی که میتواند تمام دنیا و جهانیان را متحیر کند و جایگزین انسان شود !!!',
    id: 14,
    date: ' ۱۲ مرداد - ۱۴۰۱ ',
    type: 'نئو تکنولوژی',
  },
];

export const pages = [
  '/',
  '/cart',
  '/category',
  '/category-list',
  '/checkout',
  '/product',
  '/profile',
  'result',
  '/auth',
  '/session',
  '/api',
];
