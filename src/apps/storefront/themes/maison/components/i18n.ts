/** Maison chrome/section copy that has no storefront i18n key — bilingual, picked by locale code. */
const STRINGS = {
  searchPlaceholder: { ar: 'ابحث عن مصباح، مفرش، فازة…', en: 'Search lamps, linens, vases…' },
  inThisRoom: { ar: 'في هذه الغرفة', en: 'In this room' },
  pinLabel: { ar: 'القطعة رقم', en: 'Piece' },
  care: { ar: 'العناية', en: 'Care' },
  noGifts: { ar: 'لا توجد قطع في هذه الفئة حالياً.', en: 'Nothing in this price band right now.' },
  seeAllGifts: { ar: 'شاهد كل الهدايا', en: 'See every gift' },
  menu: { ar: 'القائمة', en: 'Menu' },
  swatches: { ar: 'ألوان الموسم', en: 'Season palette' },
} as const;

export type MaiKey = keyof typeof STRINGS;

export function maiText(locale: string, key: MaiKey): string {
  return locale.startsWith('ar') ? STRINGS[key].ar : STRINGS[key].en;
}
