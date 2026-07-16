'use client';

import { FormEvent, useState } from 'react';

/**
 * ContactForm — فرم تماس آفلند (Client Component).
 * فعلاً فقط اعتبارسنجی سمت‌کلاینت دارد و پس از submit پیام موفقیت نشان می‌دهد.
 *
 * TODO: این فرم باید به `POST /api/contact` متصل شود. در حال حاضر submit
 * صرفاً state محلی را ست می‌کند (noop) تا روی Vercel به API وصل شود.
 */

type FormState = {
  name: string;
  mobile: string;
  email: string;
  subject: string;
  message: string;
};

type Errors = Partial<Record<keyof FormState, string>>;

const SUBJECTS = [
  { value: 'support', label: 'پشتیبانی' },
  { value: 'consult', label: 'مشاوره خرید' },
  { value: 'warranty', label: 'گارانتی و خدمات پس از فروش' },
  { value: 'suggest', label: 'پیشنهاد' },
  { value: 'critic', label: 'انتقاد' },
  { value: 'other', label: 'سایر' },
] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^09\d{9}$/;

const EMPTY: FormState = {
  name: '',
  mobile: '',
  email: '',
  subject: '',
  message: '',
};

function validate(v: FormState): Errors {
  const e: Errors = {};
  if (v.name.trim().length < 2) e.name = 'نام و نام خانوادگی باید حداقل ۲ حرف باشد.';
  if (!MOBILE_RE.test(v.mobile.trim())) e.mobile = 'شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود.';
  if (!EMAIL_RE.test(v.email.trim())) e.email = 'لطفاً یک ایمیل معتبر وارد کنید.';
  if (!v.subject) e.subject = 'لطفاً موضوع پیام را انتخاب کنید.';
  if (v.message.trim().length < 10) e.message = 'متن پیام باید حداقل ۱۰ حرف باشد.';
  return e;
}

export default function ContactForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormState]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      setSubmitted(false);
      return;
    }
    // TODO: اتصال به API — await fetch('/api/contact', { method: 'POST', body: JSON.stringify(form) })
    setSubmitted(true);
  };

  const fieldClass = (key: keyof FormState) =>
    `w-full rounded-xl border bg-[var(--offl-bg-soft)] px-4 py-3 font-reqular text-[14px] text-[var(--offl-text)] outline-none transition focus:border-[var(--offl-primary)] ${
      errors[key] ? 'border-red-500' : 'border-[var(--offl-border)]'
    }`;

  return (
    <div className="rounded-2xl border border-[var(--offl-border)] bg-[var(--offl-surface)] p-6 lg:p-8">
      <h2 className="mb-1 font-bold text-xl text-[var(--offl-text)]">فرم تماس با ما</h2>
      <p className="mb-6 font-reqular text-[14px] text-[var(--offl-text-muted)]">
        پیامت را بنویس؛ تیم پشتیبانی آفلند در اسرع وقت پاسخ می‌دهد.
      </p>

      {submitted ? (
        <div
          role="status"
          className="rounded-xl border border-green-500/40 bg-green-500/10 p-5 text-center"
        >
          <p className="font-bold text-base text-green-600 dark:text-green-400">
            پیام شما با موفقیت ثبت شد
          </p>
          <p className="mt-1 font-reqular text-[14px] text-[var(--offl-text-muted)]">
            کارشناسان آفلند به زودی با شما تماس می‌گیرند.
          </p>
          <button
            type="button"
            onClick={() => {
              setForm(EMPTY);
              setSubmitted(false);
            }}
            className="mt-4 rounded-xl border border-[var(--offl-border)] px-5 py-2 font-medium text-[var(--offl-text)] transition hover:bg-[var(--offl-bg-soft)]"
          >
            ارسال پیام دیگر
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label
              htmlFor="cf-name"
              className="mb-1.5 block font-medium text-[14px] text-[var(--offl-text)]"
            >
              نام و نام خانوادگی <span className="text-red-500">*</span>
            </label>
            <input
              id="cf-name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'cf-name-err' : undefined}
              placeholder="مثلاً علی محمدی"
              className={fieldClass('name')}
            />
            {errors.name && (
              <p id="cf-name-err" className="mt-1 text-[12px] text-red-500">
                {errors.name}
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="cf-mobile"
                className="mb-1.5 block font-medium text-[14px] text-[var(--offl-text)]"
              >
                موبایل <span className="text-red-500">*</span>
              </label>
              <input
                id="cf-mobile"
                name="mobile"
                type="tel"
                inputMode="numeric"
                dir="ltr"
                value={form.mobile}
                onChange={handleChange}
                aria-invalid={!!errors.mobile}
                aria-describedby={errors.mobile ? 'cf-mobile-err' : undefined}
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                className={fieldClass('mobile')}
              />
              {errors.mobile && (
                <p id="cf-mobile-err" className="mt-1 text-[12px] text-red-500">
                  {errors.mobile}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="cf-email"
                className="mb-1.5 block font-medium text-[14px] text-[var(--offl-text)]"
              >
                ایمیل <span className="text-red-500">*</span>
              </label>
              <input
                id="cf-email"
                name="email"
                type="email"
                dir="ltr"
                value={form.email}
                onChange={handleChange}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'cf-email-err' : undefined}
                placeholder="you@example.com"
                className={fieldClass('email')}
              />
              {errors.email && (
                <p id="cf-email-err" className="mt-1 text-[12px] text-red-500">
                  {errors.email}
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="cf-subject"
              className="mb-1.5 block font-medium text-[14px] text-[var(--offl-text)]"
            >
              موضوع <span className="text-red-500">*</span>
            </label>
            <select
              id="cf-subject"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              aria-invalid={!!errors.subject}
              aria-describedby={errors.subject ? 'cf-subject-err' : undefined}
              className={fieldClass('subject')}
            >
              <option value="" disabled>
                انتخاب کنید…
              </option>
              {SUBJECTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            {errors.subject && (
              <p id="cf-subject-err" className="mt-1 text-[12px] text-red-500">
                {errors.subject}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="cf-message"
              className="mb-1.5 block font-medium text-[14px] text-[var(--offl-text)]"
            >
              پیام <span className="text-red-500">*</span>
            </label>
            <textarea
              id="cf-message"
              name="message"
              rows={5}
              value={form.message}
              onChange={handleChange}
              aria-invalid={!!errors.message}
              aria-describedby={errors.message ? 'cf-message-err' : undefined}
              placeholder="سؤال یا درخواست خود را بنویسید…"
              className={`${fieldClass('message')} resize-y`}
            />
            {errors.message && (
              <p id="cf-message-err" className="mt-1 text-[12px] text-red-500">
                {errors.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-[var(--offl-primary)] px-6 py-3 font-medium text-white transition hover:opacity-90"
          >
            ارسال پیام
          </button>
        </form>
      )}
    </div>
  );
}
