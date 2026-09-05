/**
 * Naseem — default page compositions (home / product / category), all from the section library.
 * Every string default is a bilingual `{ ar, en }` map; the customizer edits both languages.
 */
import type { SectionInstance } from '../../theme-engine/rendering';
import { baseTemplates, tr } from '../../sections-lib';

const u = (id: string, w: number, h: number): string => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

export const naseemHome: ReadonlyArray<SectionInstance> = [
  {
    type: 'hero-slider',
    id: 'hero',
    settings: {
      height: 'medium',
      slides: [
        {
          image: u('photo-1441986300917-64674bd600d8', 1920, 900),
          eyebrow: tr('تشكيلة الموسم', 'This season'),
          heading: tr('كل ما تحتاجه، في مكان واحد', 'Everything you need, in one place'),
          text: tr('منتجات مختارة بعناية مع شحن سريع وإرجاع سهل.', 'Hand-picked products with fast shipping and easy returns.'),
          cta_label: tr('تسوق الآن', 'Shop now'),
          cta_url: '/shop',
          align: 'start',
          overlay: 35,
        },
        {
          image: u('photo-1607083206968-13611e3d76db', 1920, 900),
          eyebrow: tr('عروض محدودة', 'Limited offers'),
          heading: tr('خصومات تصل إلى ٥٠٪', 'Up to 50% off'),
          text: tr('على مجموعة مختارة من المنتجات الأكثر مبيعاً.', 'On a curated selection of best sellers.'),
          cta_label: tr('اكتشف العروض', 'See the deals'),
          cta_url: '/collections/best-sellers',
          align: 'center',
          overlay: 40,
        },
      ],
    },
  },
  { type: 'category-circles', id: 'categories', settings: { title: tr('تسوق حسب التصنيف', 'Shop by category'), limit: 10, size: 'md' } },
  {
    type: 'featured-products',
    id: 'newest',
    settings: { title: tr('وصل حديثاً', 'New arrivals'), subtitle: tr('أحدث ما أضفناه هذا الأسبوع', 'The latest additions this week'), collection: 'newest', columns: 4, limit: 8, layout: 'grid', view_all_url: '/collections/new-arrivals' },
  },
  {
    type: 'banner-grid',
    id: 'banners',
    settings: {
      columns: 2,
      aspect: 'landscape',
      banners: [
        { image: u('photo-1523381210434-271e8be1f52b', 1200, 800), eyebrow: tr('جديد', 'New'), title: tr('تشكيلة الرجال', 'Men’s edit'), cta_label: tr('تسوق', 'Shop'), link: '/shop', align: 'start' },
        { image: u('photo-1490481651871-ab68de25d43d', 1200, 800), eyebrow: tr('الأكثر طلباً', 'Most wanted'), title: tr('تشكيلة النساء', 'Women’s edit'), cta_label: tr('تسوق', 'Shop'), link: '/shop', align: 'start' },
      ],
    },
  },
  {
    type: 'featured-products',
    id: 'bestsellers',
    settings: { title: tr('الأكثر مبيعاً', 'Best sellers'), collection: 'bestsellers', columns: 4, limit: 8, layout: 'carousel', view_all_url: '/collections/best-sellers' },
  },
  { type: 'flash-deals', id: 'deals', settings: { title: tr('عروض اليوم', 'Deals of the day'), collection: 'sale', layout: 'carousel', background: 'surface' } },
  {
    type: 'image-with-text',
    id: 'story',
    settings: {
      image: u('photo-1556740749-887f6717d7e4', 1200, 900),
      eyebrow: tr('قصتنا', 'Our story'),
      heading: tr('جودة نثق بها، وخدمة تليق بك', 'Quality you can trust, service you deserve'),
      text: tr('<p>نختار كل منتج بعناية ونختبره قبل أن يصل إليك. هدفنا تجربة تسوق سهلة وسريعة من الطلب إلى الاستلام.</p>', '<p>We hand-pick and test every product before it reaches you. Our goal is a simple, fast shopping experience from order to delivery.</p>'),
      cta_label: tr('اعرف المزيد', 'Learn more'),
      cta_url: '/about',
      media_side: 'end',
    },
  },
  { type: 'features', id: 'features', settings: { style: 'plain', background: 'surface' } },
  { type: 'testimonials', id: 'testimonials', settings: { title: tr('ماذا يقول عملاؤنا', 'What our customers say'), layout: 'carousel', background: 'none' } },
  { type: 'brand-logos', id: 'brands', settings: { title: tr('علاماتنا التجارية', 'Brands we carry') } },
  { type: 'newsletter', id: 'newsletter', settings: { background: 'primary', style: 'band' } },
  { type: 'faq', id: 'faq', settings: { title: tr('الأسئلة الشائعة', 'Frequently asked questions') } },
];

export const naseemTemplates = baseTemplates({ home: naseemHome });
