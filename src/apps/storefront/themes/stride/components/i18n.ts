/** Stride chrome + card copy that has no storefront i18n key — bilingual, picked by locale code. */
const STRINGS = {
  newBadge: { ar: 'جديد', en: 'New' },
  lowStock: { ar: 'باقي {n} فقط', en: 'Only {n} left' },
  colours: { ar: 'الألوان المتاحة', en: 'Available colours' },
  moreColours: { ar: '+{n} ألوان', en: '+{n} more' },
  searchPlaceholder: { ar: 'ابحث عن حذاء، ماركة أو رياضة…', en: 'Search shoes, brands, sports…' },
  shopAll: { ar: 'تسوق الكل', en: 'Shop all' },
  freeShipping: { ar: 'شحن مجاني مع عرض الكمية المختار؛ يُؤكد عند الدفع', en: 'Free shipping with the selected quantity offer; confirmed at checkout' },
  scrollPrev: { ar: 'السابق', en: 'Previous' },
  scrollNext: { ar: 'التالي', en: 'Next' },
  progress: { ar: 'تقدّم التمرير', en: 'Scroll progress' },
  dropLive: { ar: 'متاح الآن', en: 'Out now' },
  dropsIn: { ar: 'يُطرح خلال', en: 'Drops in' },
  yourLength: { ar: 'طول قدمك (سم)', en: 'Your foot length (cm)' },
  recommended: { ar: 'المقاس المقترح', en: 'Suggested size' },
  noMatch: { ar: 'خارج جدول المقاسات — تواصل معنا وسنساعدك.', en: 'Outside this chart — contact us and we’ll help.' },
  kitTotal: { ar: 'إجمالي الطقم', en: 'Kit total' },
  choose: { ar: 'اختر', en: 'Choose' },
  view: { ar: 'عرض المنتج', en: 'View product' },
  step: { ar: 'خطوة', en: 'Step' },
  menu: { ar: 'القائمة', en: 'Menu' },
  followUs: { ar: 'تابعنا', en: 'Follow us' },
  announcements: { ar: 'إعلانات المتجر', en: 'Store announcements' },
  tickerPause: { ar: 'إيقاف شريط الإعلانات', en: 'Pause the announcements' },
  tickerPlay: { ar: 'تشغيل شريط الإعلانات', en: 'Play the announcements' },
} as const;

export type StKey = keyof typeof STRINGS;

export function stText(locale: string, key: StKey, vars?: Readonly<Record<string, string | number>>): string {
  const raw: string = locale.startsWith('ar') ? STRINGS[key].ar : STRINGS[key].en;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}
