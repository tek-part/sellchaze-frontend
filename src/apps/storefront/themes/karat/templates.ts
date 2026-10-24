/**
 * Karat — default page compositions. Every string default is a bilingual `{ ar, en }` map. The demo
 * photographs are Unsplash images (free licence) chosen for the jewellery vertical; every section
 * also renders a finished composition without them.
 */
import type { SectionInstance } from '../../theme-engine/rendering';
import { baseTemplates, tr } from '../../sections-lib';

const u = (id: string, w: number, h: number): string => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

export const KARAT_DEMO_IMAGES = {
  hero: u('photo-1601121141461-9d6647bca1ed', 1200, 1500),
  gold: u('photo-1617038220319-276d3cfab638', 900, 1200),
  silver: u('photo-1588444837495-c6cfeb53f32d', 900, 1200),
  diamonds: u('photo-1605100804763-247f67b3557e', 900, 1200),
  pearls: u('photo-1515562141207-7a88fb7ce338', 900, 1200),
  concierge: u('photo-1602173574767-37ac01994b2a', 900, 1200),
} as const;

export const karatHome: ReadonlyArray<SectionInstance> = [
  { type: 'karat-hero', id: 'hero', settings: { layout: 'split', image: KARAT_DEMO_IMAGES.hero } },
  { type: 'karat-rate-notice', id: 'gold-rate', settings: {} },
  {
    type: 'karat-metals',
    id: 'metals',
    settings: {
      items: [
        { label: tr('الذهب', 'Gold'), caption: tr('عيار ١٨ · ٢١ · ٢٤', '18K · 21K · 24K'), image: KARAT_DEMO_IMAGES.gold, url: '/collections/gold', tone: 'gold', motif: 'chain' },
        { label: tr('الفضة والذهب الأبيض', 'Silver & white gold'), caption: tr('فضة ٩٢٥ وذهب أبيض', 'Sterling 925 and white gold'), image: KARAT_DEMO_IMAGES.silver, url: '/collections/silver', tone: 'silver', motif: 'ring' },
        { label: tr('الألماس', 'Diamonds'), caption: tr('أحجار بشهادات معتمدة', 'Certified stones'), image: KARAT_DEMO_IMAGES.diamonds, url: '/collections/diamonds', tone: 'diamond', motif: 'diamond' },
        { label: tr('اللؤلؤ', 'Pearls'), caption: tr('لؤلؤ طبيعي ومستزرع', 'Natural and cultured'), image: KARAT_DEMO_IMAGES.pearls, url: '/collections/pearls', tone: 'pearl', motif: 'pearl' },
      ],
    },
  },
  {
    type: 'featured-products',
    id: 'new-in',
    settings: {
      title: tr('وصل حديثاً إلى المعرض', 'New to the vitrine'),
      subtitle: tr('أحدث القطع التي اخترناها هذا الموسم', 'The latest pieces we have chosen this season'),
      collection: 'newest',
      layout: 'grid',
      columns: 4,
      limit: 8,
      show_ratings: false,
      view_all_url: '/collections/new-arrivals',
      view_all_label: tr('عرض الكل', 'View all'),
    },
  },
  { type: 'karat-gift-finder', id: 'gifts', settings: {} },
  { type: 'karat-craft', id: 'craft', settings: { layout: 'band' } },
  {
    type: 'featured-products',
    id: 'most-gifted',
    settings: {
      title: tr('الأكثر إهداءً', 'Most gifted'),
      subtitle: tr('قطع اختارها عملاؤنا لمن يحبون', 'Pieces our clients chose for the people they love'),
      collection: 'bestsellers',
      layout: 'carousel',
      columns: 4,
      limit: 8,
      show_ratings: false,
      view_all_url: '/collections/best-sellers',
    },
  },
  { type: 'karat-concierge', id: 'concierge', settings: { image: KARAT_DEMO_IMAGES.concierge } },
  {
    type: 'faq',
    id: 'faq',
    settings: {
      title: tr('أسئلة يطرحها عملاؤنا', 'Questions our clients ask'),
      layout: 'two-columns',
      open_first: false,
      items: [
        { question: tr('كيف يُحسب سعر قطعة الذهب؟', 'How is the price of a gold piece calculated?'), answer: tr('يُحسب على وزن القطعة وسعر العيار في يوم الشراء، مضافاً إليه المصنعية. تجد الوزن والعيار في صفحة كل منتج.', 'By the piece’s weight at the day’s rate for its karat, plus craftsmanship. Weight and karat are listed on every product page.') },
        { question: tr('هل يمكن تعديل مقاس الخاتم؟', 'Can a ring be resized?'), answer: tr('معظم الخواتم يمكن تعديل مقاسها؛ تواصل معنا قبل الطلب أو بعده لنؤكد لك إمكانية ذلك لقطعتك.', 'Most rings can be resized — contact us before or after ordering and we will confirm it for your piece.') },
        { question: tr('هل تقبلون استبدال الذهب القديم؟', 'Do you accept old gold in exchange?'), answer: tr('اسألنا عن سياسة الاستبدال الحالية وشروطها قبل زيارتك للمعرض.', 'Ask us about the current trade-in policy and its terms before you visit the boutique.') },
        { question: tr('كيف أعتني بمجوهراتي؟', 'How should I care for my jewellery?'), answer: tr('احفظ كل قطعة منفصلة في علبتها، وأبعدها عن العطور والكلور، وامسحها بقطعة قماش ناعمة بعد الاستخدام.', 'Store each piece separately in its box, keep it away from perfume and chlorine, and wipe it with a soft cloth after wearing.') },
      ],
    },
  },
];

export const karatProduct: ReadonlyArray<SectionInstance> = [
  { type: 'product-details', id: 'pdp', settings: { show_share: true, show_sku: true } },
  { type: 'karat-craft', id: 'assurance', settings: { layout: 'compact' } },
  { type: 'related-products', id: 'related', settings: { title: tr('قد تكمل إطلالتك', 'To complete the look'), layout: 'carousel', show_ratings: false } },
  { type: 'recently-viewed', id: 'recent' },
];

export const karatCategory: ReadonlyArray<SectionInstance> = [
  { type: 'category-header', id: 'head', settings: { align: 'center' } },
  { type: 'product-grid', id: 'grid', settings: { source: 'all', columns: 4, limit: 24, show_ratings: false, padding_block: 64 } },
];

export const karatTemplates = baseTemplates({ home: karatHome, product: karatProduct, category: karatCategory });
