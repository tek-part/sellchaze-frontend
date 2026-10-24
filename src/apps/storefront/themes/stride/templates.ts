/**
 * Stride — default page compositions. Every string default is a bilingual `{ ar, en }` map. The
 * hero photo is a verified, unbranded Unsplash frame; every other section is typographic so a
 * store with no uploads still looks finished.
 */
import type { SectionInstance } from '../../theme-engine/rendering';
import { baseTemplates, tr } from '../../sections-lib';

export const STRIDE_HERO_IMAGE = 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1600&h=1600&q=80';

export const strideHome: ReadonlyArray<SectionInstance> = [
  { type: 'stride-hero', id: 'hero', settings: { layout: 'split', image: STRIDE_HERO_IMAGE, image_alt: tr('عدّاؤون وقت الغروب', 'Runners at sunset') } },
  { type: 'stride-sport-tiles', id: 'sports' },
  { type: 'stride-new-drops', id: 'drops' },
  { type: 'stride-drop-countdown', id: 'launch', settings: { style: 'accent' } },
  {
    type: 'product-tabs',
    id: 'shop',
    settings: {
      title: tr('تسوق التشكيلة', 'Shop the line-up'),
      tabs: [
        { label: tr('الأكثر مبيعاً', 'Best sellers'), collection: 'bestsellers' },
        { label: tr('وصل حديثاً', 'Just in'), collection: 'newest' },
        { label: tr('تخفيضات', 'On sale'), collection: 'sale' },
      ],
      layout: 'grid',
      columns: '4',
      limit: 8,
    },
  },
  { type: 'stride-kit-builder', id: 'kit' },
  { type: 'stride-size-guide', id: 'size', settings: { __style: { anchor: 'size' } } },
  {
    type: 'features',
    id: 'promise',
    settings: {
      layout: 'strip',
      columns: '4',
      items: [
        { icon: 'refresh', title: tr('استبدال المقاس مجاناً', 'Free size exchange'), text: tr('خلال ١٤ يوم من الاستلام', 'Within 14 days of delivery'), url: '' },
        { icon: 'truck', title: tr('توصيل سريع', 'Fast delivery'), text: tr('لكل المحافظات', 'Nationwide'), url: '' },
        { icon: 'medal', title: tr('منتجات أصلية', 'Authentic gear'), text: tr('من موزعين معتمدين', 'From authorised distributors'), url: '' },
        { icon: 'lock', title: tr('دفع آمن', 'Secure checkout'), text: tr('كارت، محفظة أو كاش عند الاستلام', 'Card, wallet or cash on delivery'), url: '' },
      ],
    },
  },
];

export const strideProduct: ReadonlyArray<SectionInstance> = [
  { type: 'product-details', id: 'pdp', settings: { show_share: true, show_sku: false } },
  {
    type: 'stride-size-guide',
    id: 'size',
    settings: { eyebrow: tr('محتار في المقاس؟', 'Not sure about size?'), title: tr('جدول المقاسات', 'Size chart'), __style: { anchor: 'size' } },
  },
  { type: 'related-products', id: 'related', settings: { title: tr('كمّل الطقم', 'Complete the kit') } },
  { type: 'recently-viewed', id: 'recent' },
];

export const strideCategory: ReadonlyArray<SectionInstance> = [
  { type: 'category-header', id: 'head' },
  { type: 'product-grid', id: 'grid', settings: { source: 'all', columns: '4', limit: 24 } },
];

export const strideTemplates = baseTemplates({ home: strideHome, product: strideProduct, category: strideCategory });
