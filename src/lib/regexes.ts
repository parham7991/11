// Define the reusable pattern for all numbers (English and Persian)
export const allNumbersPattern = `[0-9\u06F0-\u06F9]`;

// Pattern allowing letters (both uppercase and lowercase), numbers, spaces, punctuation (.,،!?"'()@#-)
export const allowedPattern = /^[a-zA-Z0-9\u0600-\u06FF\s.,،!?'"()@#-]*$/;

export const phoneNumberPattern = new RegExp(`^${allNumbersPattern}{11}$`);

export const namePattern = /^[\u0600-\u06FF \-']+$/;

export const emailPattern = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const nationalIdPattern = new RegExp(`^${allNumbersPattern}{10}$`);

export const shabaIdPattern = new RegExp(`^${allNumbersPattern}{24}$`);

export const dangerousCharsPattern = /[.,،!?'"()@#-]/g;

export const allPatternNum = /^[0-9\u06F0-\u06F9]+$/;
export const AllowNumAndPer = /^[\u0600-\u06FF\u0660-\u0669\u06F0-\u06F9 0-9\-'‌]+$/;
