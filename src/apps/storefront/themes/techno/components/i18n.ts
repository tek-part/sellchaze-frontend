/** Techno chrome copy that has no storefront i18n key — bilingual, picked by locale code. */
const STRINGS = {
  compare: { ar: 'مقارنة', en: 'Compare' },
  addToCompare: { ar: 'أضف إلى المقارنة', en: 'Add to compare' },
  removeFromCompare: { ar: 'إزالة من المقارنة', en: 'Remove from compare' },
  compareFull: { ar: 'يمكنك مقارنة ٤ منتجات كحد أقصى', en: 'You can compare up to 4 products' },
  compareEmpty: { ar: 'لم تضف أي منتج للمقارنة بعد', en: 'No products to compare yet' },
  compareHint: { ar: 'اضغط زر المقارنة على بطاقة المنتج لإضافته هنا.', en: 'Use the compare button on a product card to add it here.' },
  clearAll: { ar: 'مسح الكل', en: 'Clear all' },
  specs: { ar: 'المواصفات', en: 'Specs' },
  support: { ar: 'الدعم الفني', en: 'Tech support' },
  hotline: { ar: 'خط الدعم', en: 'Support hotline' },
  allCategories: { ar: 'كل الفئات', en: 'All categories' },
  deals: { ar: 'العروض', en: 'Deals' },
  searchProducts: { ar: 'ابحث عن جهاز، ماركة أو موديل…', en: 'Search devices, brands, models…' },
  callUs: { ar: 'اتصل بنا', en: 'Call us' },
  compareTray: { ar: 'قائمة المقارنة', en: 'Compare list' },
} as const;

export type TkKey = keyof typeof STRINGS;

export function tkText(locale: string, key: TkKey): string {
  return locale.startsWith('ar') ? STRINGS[key].ar : STRINGS[key].en;
}
