/**
 * types.ts — تایپ‌های مشترک دستیار هوشمند آفلند
 */

/** نقش پیام در گفتگو */
export type ChatRole = 'system' | 'user' | 'assistant';

/** یک پیام در گفتگو */
export type ChatMessage = {
  role: ChatRole;
  content: string;
};

/** منبعی که در پاسخ به آن ارجاع داده شده (کارت محصول غنی) */
export type ChatSource = {
  title: string;
  url: string;
  /** قیمت نهایی (با تخفیف) به‌صورت فرمت‌شده */
  price?: string | null;
  /** قیمت اصلی قبل از تخفیف (برای خط‌خوردگی) */
  oldPrice?: string | null;
  /** درصد تخفیف (مثلاً 7) */
  discountPercent?: number | null;
  /** آدرس عکس محصول */
  image?: string | null;
  /** موجود/ناموجود */
  inStock?: boolean;
  /** برند محصول */
  brand?: string | null;
  /** گارانتی */
  warranty?: string | null;
  /** امتیاز میانگین نظرات (۱ تا ۵) */
  rating?: number | null;
  /** تعداد نظرات */
  reviewCount?: number | null;
};

/** بدنهٔ درخواست کلاینت به API */
export type ChatRequestBody = {
  /** پیام جدید کاربر */
  message: string;
  /** تاریخچهٔ گفتگو (برای حفظ زمینه) — اختیاری */
  history?: ChatMessage[];
};

/** پاسخ API به کلاینت */
export type ChatResponse = {
  reply: string;
  sources: ChatSource[];
  error?: string;
};
