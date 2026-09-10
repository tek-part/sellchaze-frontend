/**
 * Library-local UI copy (buttons, states, a11y labels) in Arabic + English. Kept here rather than in
 * the app dictionary so the library is self-contained and adding a section never touches
 * `i18n/en.ts` / `i18n/ar.ts`. Merchant-facing copy (headings, CTAs) always comes from settings.
 */
import { useTranslation } from 'react-i18next';

const DICT = {
  en: {
    viewAll: 'View all',
    shopNow: 'Shop now',
    addToCart: 'Add to cart',
    added: 'Added',
    soldOut: 'Sold out',
    sale: 'Sale',
    new: 'New',
    previous: 'Previous',
    next: 'Next',
    goToSlide: 'Go to slide {n}',
    products: 'Products',
    categories: 'Categories',
    emptyProducts: 'No products to show yet.',
    emptyCategories: 'No categories yet.',
    loadFailed: 'We couldn’t load this right now.',
    days: 'Days',
    hours: 'Hours',
    minutes: 'Min',
    seconds: 'Sec',
    endsIn: 'Ends in',
    expired: 'This offer has ended.',
    emailPlaceholder: 'Your email address',
    subscribe: 'Subscribe',
    subscribing: 'Subscribing…',
    subscribed: 'Thank you — you’re on the list.',
    subscribeError: 'We couldn’t subscribe that address. Please try again.',
    invalidEmail: 'Enter a valid email address.',
    readMore: 'Read more',
    followUs: 'Follow us',
    addToWishlist: 'Add to wishlist',
    removeFromWishlist: 'Remove from wishlist',
    items: '{n} items',
    play: 'Play video',
    tabs: 'Product tabs',
    verified: 'Verified buyer',
    minRead: '{n} min read',
    name: 'Your name',
    email: 'Email address',
    subject: 'Subject',
    message: 'Message',
    send: 'Send message',
    sending: 'Sending…',
    sent: 'Thanks — we’ll get back to you shortly.',
    sendError: 'We couldn’t send your message. Please try again.',
    required: 'Please fill in every required field.',
    callUs: 'Call us',
    emailUs: 'Email us',
    viewProduct: 'View product',
  },
  ar: {
    viewAll: 'عرض الكل',
    shopNow: 'تسوق الآن',
    addToCart: 'أضف إلى السلة',
    added: 'تمت الإضافة',
    soldOut: 'نفدت الكمية',
    sale: 'تخفيض',
    new: 'جديد',
    previous: 'السابق',
    next: 'التالي',
    goToSlide: 'الانتقال إلى الشريحة {n}',
    products: 'المنتجات',
    categories: 'التصنيفات',
    emptyProducts: 'لا توجد منتجات لعرضها بعد.',
    emptyCategories: 'لا توجد تصنيفات بعد.',
    loadFailed: 'تعذّر تحميل هذا المحتوى حالياً.',
    days: 'يوم',
    hours: 'ساعة',
    minutes: 'دقيقة',
    seconds: 'ثانية',
    endsIn: 'ينتهي خلال',
    expired: 'انتهى هذا العرض.',
    emailPlaceholder: 'بريدك الإلكتروني',
    subscribe: 'اشترك',
    subscribing: 'جارٍ الاشتراك…',
    subscribed: 'شكراً لك — تم تسجيلك في القائمة.',
    subscribeError: 'تعذّر تسجيل هذا البريد. حاول مرة أخرى.',
    invalidEmail: 'أدخل بريداً إلكترونياً صحيحاً.',
    readMore: 'اقرأ المزيد',
    followUs: 'تابعنا',
    addToWishlist: 'أضف إلى المفضلة',
    removeFromWishlist: 'إزالة من المفضلة',
    items: '{n} منتج',
    play: 'تشغيل الفيديو',
    tabs: 'تبويبات المنتجات',
    verified: 'عميل موثّق',
    minRead: '{n} دقائق قراءة',
    name: 'اسمك',
    email: 'البريد الإلكتروني',
    subject: 'الموضوع',
    message: 'الرسالة',
    send: 'إرسال الرسالة',
    sending: 'جارٍ الإرسال…',
    sent: 'شكراً لك — سنتواصل معك قريباً.',
    sendError: 'تعذّر إرسال رسالتك. حاول مرة أخرى.',
    required: 'يرجى تعبئة جميع الحقول المطلوبة.',
    callUs: 'اتصل بنا',
    emailUs: 'راسلنا',
    viewProduct: 'عرض المنتج',
  },
} as const;

export type LibKey = keyof typeof DICT.en;

export function libText(locale: string, key: LibKey, vars?: Record<string, string | number>): string {
  const table = locale.startsWith('ar') ? DICT.ar : DICT.en;
  let out: string = table[key];
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.replace(`{${k}}`, String(v));
  return out;
}

/** Active locale code ('ar' | 'en' | …) from react-i18next. */
export function useLocaleCode(): string {
  const { i18n } = useTranslation();
  return i18n.language || 'en';
}

/** `t('addToCart')` for library copy in the active language. */
export function useLibT(): (key: LibKey, vars?: Record<string, string | number>) => string {
  const locale = useLocaleCode();
  return (key, vars) => libText(locale, key, vars);
}
