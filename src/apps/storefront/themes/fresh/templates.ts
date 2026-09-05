/**
 * Fresh — default page compositions (home / product / category), all from the section library.
 * Every string default is a bilingual `{ ar, en }` map; the customizer edits both languages.
 */
import type { SectionInstance } from '../../theme-engine/rendering';
import { baseTemplates, tr } from '../../sections-lib';

const u = (id: string, w: number, h: number): string => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

export const freshHome: ReadonlyArray<SectionInstance> = [
  {
    type: 'hero-slider',
    id: 'hero',
    settings: {
      height: 'medium',
      rounded: true,
      autoplay: true,
      interval: 7,
      slides: [
        {
          image: u('photo-1542838132-92c53300491e', 1920, 900),
          eyebrow: tr('طازج كل صباح', 'Fresh every morning'),
          heading: tr('خضار وفواكه من المزرعة إلى بابك', 'Farm-fresh fruit & veg to your door'),
          text: tr('نقطف اليوم ونوصّل اليوم. جودة مضمونة أو نستبدلها مجاناً.', 'Picked today, delivered today. Guaranteed fresh or we replace it free.'),
          cta_label: tr('تسوق الطازج', 'Shop fresh'),
          cta_url: '/shop',
          align: 'start',
          overlay: 35,
        },
        {
          image: u('photo-1488459716781-31db52582fe9', 1920, 900),
          eyebrow: tr('عروض الأسبوع', 'This week’s deals'),
          heading: tr('وفّر حتى ٤٠٪ على السلة الأسبوعية', 'Save up to 40% on your weekly basket'),
          text: tr('أسعار خاصة على الفواكه والخضار والمخبوزات حتى نهاية الأسبوع.', 'Special prices on fruit, vegetables and bakery until the weekend.'),
          cta_label: tr('اكتشف العروض', 'See the deals'),
          cta_url: '/collections/sale',
          align: 'center',
          overlay: 40,
        },
      ],
    },
  },
  {
    type: 'features',
    id: 'promise',
    settings: {
      style: 'cards',
      columns: 4,
      align: 'start',
      background: 'none',
      padding_block: 24,
      items: [
        { icon: 'truck', title: tr('توصيل مجاني', 'Free delivery'), text: tr('للطلبات فوق ١٥٠ ر.س', 'On orders over 150'), url: '' },
        { icon: 'clock', title: tr('توصيل في نفس اليوم', 'Same-day delivery'), text: tr('اطلب قبل ١٠ مساءً', 'Order before 10 pm'), url: '' },
        { icon: 'check', title: tr('ضمان الطزاجة', 'Fresh guarantee'), text: tr('استبدال مجاني إن لم يعجبك', 'Free replacement if it’s not right'), url: '' },
        { icon: 'headset', title: tr('دعم على مدار الساعة', '24/7 support'), text: tr('واتساب واتصال في أي وقت', 'WhatsApp & phone, any time'), url: '' },
      ],
    },
  },
  { type: 'category-circles', id: 'categories', settings: { title: tr('تسوق حسب القسم', 'Shop by aisle'), limit: 10, size: 'md', layout: 'scroll', view_all_url: '/categories' } },
  {
    type: 'flash-deals',
    id: 'weekly-deals',
    settings: {
      title: tr('عروض الأسبوع', 'Weekly offers'),
      subtitle: tr('أسعار خاصة تنتهي مع نهاية الأسبوع', 'Special prices until the end of the week'),
      collection: 'sale',
      layout: 'carousel',
      columns: 5,
      limit: 10,
      background: 'surface',
    },
  },
  {
    type: 'featured-products',
    id: 'newest',
    settings: { title: tr('وصل حديثاً', 'Just arrived'), subtitle: tr('أحدث ما وصلنا من المزارع هذا الأسبوع', 'The latest from the farms this week'), collection: 'newest', columns: 5, limit: 10, layout: 'grid', view_all_url: '/collections/new-arrivals' },
  },
  {
    type: 'banner-grid',
    id: 'banners',
    settings: {
      columns: 2,
      aspect: 'landscape',
      overlay: 25,
      banners: [
        { image: u('photo-1610832958506-aa56368176cf', 1200, 800), eyebrow: tr('عضوي', 'Organic'), title: tr('سلة الفواكه العضوية', 'Organic fruit basket'), subtitle: tr('مختارة من مزارع معتمدة', 'From certified farms'), cta_label: tr('تسوق', 'Shop'), link: '/collections/organic', align: 'start' },
        { image: u('photo-1509440159596-0249088772ff', 1200, 800), eyebrow: tr('مخبوز اليوم', 'Baked today'), title: tr('خبز ومعجنات طازجة', 'Fresh bread & pastries'), subtitle: tr('من الفرن إلى بابك', 'Oven to door'), cta_label: tr('تسوق', 'Shop'), link: '/collections/bakery', align: 'start' },
      ],
    },
  },
  {
    type: 'product-tabs',
    id: 'aisles',
    settings: {
      title: tr('اكتشف الأقسام', 'Browse the aisles'),
      tabs: [
        { label: tr('فواكه', 'Fruits'), collection: 'newest' },
        { label: tr('خضار', 'Vegetables'), collection: 'bestsellers' },
        { label: tr('مخبوزات', 'Bakery'), collection: 'sale' },
      ],
      layout: 'grid',
      columns: 5,
      limit: 10,
      align: 'center',
    },
  },
  {
    type: 'image-with-text',
    id: 'farm-story',
    settings: {
      image: u('photo-1500937386664-56d1dfef3854', 1200, 900),
      eyebrow: tr('من المزرعة', 'From the farm'),
      heading: tr('نعرف المزارع الذي زرع طعامك', 'We know the farmer who grew your food'),
      text: tr('<p>نعمل مباشرة مع مزارع محلية صغيرة، نقطف في الصباح ونوصّل في نفس اليوم. بدون وسطاء، بدون تخزين طويل — فقط طعام طازج بسعر عادل للجميع.</p>', '<p>We work directly with small local farms, harvest in the morning and deliver the same day. No middlemen, no long storage — just fresh food at a fair price for everyone.</p>'),
      cta_label: tr('تعرّف على مزارعنا', 'Meet our farms'),
      cta_url: '/about',
      media_side: 'start',
      background: 'surface',
    },
  },
  { type: 'testimonials', id: 'testimonials', settings: { title: tr('ماذا يقول جيراننا', 'What our neighbours say'), layout: 'carousel', background: 'none' } },
  { type: 'blog-posts', id: 'recipes', settings: { title: tr('وصفات من مطبخنا', 'Recipes from our kitchen'), subtitle: tr('أفكار سريعة لما في سلتك', 'Quick ideas for what’s in your basket'), columns: 3, limit: 3, view_all_url: '/blog' } },
  {
    type: 'newsletter',
    id: 'newsletter',
    settings: {
      eyebrow: tr('عروض الأسبوع في بريدك', 'Weekly deals in your inbox'),
      heading: tr('اشترك واحصل على ١٠٪ على أول طلب', 'Subscribe and get 10% off your first order'),
      background: 'primary',
      style: 'card',
    },
  },
];

export const freshTemplates = baseTemplates({ home: freshHome });
