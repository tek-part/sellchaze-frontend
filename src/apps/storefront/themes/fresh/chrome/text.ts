/**
 * Fresh — the handful of chrome strings that live in neither the app dictionary nor the section
 * library (Arabic + English). Merchant-facing copy always comes from settings.
 */
const DICT = {
  en: {
    add: 'Add',
    inBasket: 'In basket',
    allCategories: 'All aisles',
    searchPlaceholder: 'Search for fruit, veg, bakery…',
    deliveryPromise: 'Delivery promise',
    freshPick: 'Fresh pick',
    quantity: 'Quantity',
    decrease: 'Decrease quantity',
    increase: 'Increase quantity',
    basketTotal: 'Basket total',
  },
  ar: {
    add: 'أضف',
    inBasket: 'في السلة',
    allCategories: 'كل الأقسام',
    searchPlaceholder: 'ابحث عن فواكه، خضار، مخبوزات…',
    deliveryPromise: 'وعد التوصيل',
    freshPick: 'اختيار طازج',
    quantity: 'الكمية',
    decrease: 'تقليل الكمية',
    increase: 'زيادة الكمية',
    basketTotal: 'إجمالي السلة',
  },
} as const;

export type FreshKey = keyof typeof DICT.en;

export function frText(locale: string, key: FreshKey): string {
  return (locale.startsWith('ar') ? DICT.ar : DICT.en)[key];
}
