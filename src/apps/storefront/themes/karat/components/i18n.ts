/** Karat chrome copy that has no storefront i18n key — bilingual, picked by locale code. */
const STRINGS = {
  searchPlaceholder: { ar: 'ابحث عن خاتم، عقد، ساعة…', en: 'Search rings, necklaces, watches…' },
  concierge: { ar: 'استشارة خاصة', en: 'Private concierge' },
  conciergeShort: { ar: 'استشارة', en: 'Concierge' },
  whatsapp: { ar: 'واتساب', en: 'WhatsApp' },
  callUs: { ar: 'اتصل بنا', en: 'Call us' },
  addToBag: { ar: 'أضف إلى الحقيبة', en: 'Add to bag' },
  addedToBag: { ar: 'أضيفت إلى الحقيبة', en: 'Added to bag' },
  details: { ar: 'التفاصيل', en: 'Details' },
  bagTitle: { ar: 'حقيبة التسوق', en: 'Your bag' },
  emptyBag: { ar: 'حقيبتك فارغة', en: 'Your bag is empty' },
  emptyBagHint: { ar: 'اكتشف قطعاً صُنعت لتدوم وتُهدى.', en: 'Discover pieces made to be kept, and to be given.' },
  explore: { ar: 'اكتشف المجموعة', en: 'Explore the collection' },
  discover: { ar: 'اكتشف', en: 'Discover' },
  privateList: { ar: 'القائمة الخاصة', en: 'The private list' },
  privateListNote: { ar: 'إصدارات جديدة ومواعيد العرض الخاصة، دون إزعاج.', en: 'New pieces and private viewings — never noise.' },
  menu: { ar: 'القائمة', en: 'Menu' },
  specs: { ar: 'المواصفات', en: 'Specifications' },
  grams: { ar: 'جم', en: 'g' },
  karat: { ar: 'عيار', en: 'K' },
} as const;

export type KaratKey = keyof typeof STRINGS;

export function krText(locale: string, key: KaratKey): string {
  return locale.startsWith('ar') ? STRINGS[key].ar : STRINGS[key].en;
}

/** Digits only (with a leading +) for tel: and wa.me links. */
export function phoneDigits(value: string): string {
  return value.replace(/[^\d+]/g, '');
}

/** A wa.me link for a phone number, or '' when it has too few digits. */
export function whatsappHref(phone: string, message = ''): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 8) return '';
  return `https://wa.me/${digits}${message.trim() ? `?text=${encodeURIComponent(message.trim())}` : ''}`;
}
