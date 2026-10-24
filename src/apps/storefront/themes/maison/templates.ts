/**
 * Maison — default page compositions. Home reads like a magazine issue: the editorial opening,
 * shop by room, new arrivals, a room to shop from, the seasonal mood board, the gift guide, words
 * from customers, material & care notes and the service promises. Every string is bilingual.
 * Demo photographs are Unsplash URLs (the same source the demo catalogue uses); every Maison
 * section also has a drawn fallback when a photo is removed.
 */
import type { SectionInstance } from '../../theme-engine/rendering';
import { baseTemplates, tr } from '../../sections-lib';

const u = (id: string, w: number, h: number): string => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

export const maisonHome: ReadonlyArray<SectionInstance> = [
  {
    type: 'maison-hero',
    id: 'hero',
    settings: {
      image: u('photo-1586023492125-27b2c045efd7', 1100, 1375),
      detail_image: u('photo-1513506003901-1e6a229e2d15', 480, 480),
      caption: tr('ضوء هادئ لكل ركن', 'Soft light for every corner'),
    },
  },
  {
    type: 'maison-rooms',
    id: 'rooms',
    settings: {
      rooms: [
        { room: 'living', title: tr('غرفة المعيشة', 'Living room'), caption: tr('مصابيح، خداديات وبطانيات', 'Lamps, cushions & throws'), image: u('photo-1555041469-a586c61ea9bc', 1000, 1250), url: '/collections/living' },
        { room: 'bedroom', title: tr('غرفة النوم', 'Bedroom'), caption: tr('مفارش كتان وإضاءة هادئة', 'Linen bedding & soft light'), image: u('photo-1505693416388-ac5ce068fe85', 900, 600), url: '/collections/bedroom' },
        { room: 'kitchen', title: tr('المطبخ والسفرة', 'Kitchen & table'), caption: tr('فخّار، أطباق وأدوات تقديم', 'Stoneware, plates & serving'), image: u('photo-1556911220-bff31c812dba', 700, 600), url: '/collections/tableware' },
        { room: 'bath', title: tr('الحمّام', 'Bath'), caption: tr('مناشف قطن وسلال تخزين', 'Cotton towels & baskets'), image: u('photo-1552321554-5fefe8c9ef14', 700, 600), url: '/collections/baskets' },
        { room: 'outdoor', title: tr('البلكونة والحديقة', 'Outdoor & balcony'), caption: tr('فوانيس، أصص وجلسات خارجية', 'Lanterns, planters & seating'), image: '', url: '/collections/outdoor' },
      ],
    },
  },
  {
    type: 'featured-products',
    id: 'new',
    settings: {
      title: tr('وصل حديثاً', 'New in the house'),
      subtitle: tr('قطع جديدة لهذا الموسم', 'Fresh pieces for the season'),
      collection: 'newest',
      layout: 'carousel',
      columns: 4,
      limit: 8,
      view_all_url: '/shop',
    },
  },
  {
    type: 'maison-shop-the-room',
    id: 'room',
    settings: {
      image: u('photo-1600210492486-724fe5c67fb0', 1500, 1000),
      collection: 'newest',
      hotspots: [
        { product: 'p1', x: 78, y: 56, note: tr('بوكليه بلون الشوفان', 'Oatmeal bouclé') },
        { product: 'p14', x: 50, y: 68, note: tr('رخام طبيعي', 'Natural marble') },
        { product: 'p4', x: 40, y: 90, note: tr('صوف منسوج يدوياً', 'Hand-woven wool') },
        { product: 'p5', x: 32, y: 42, note: tr('سيراميك بلون الطين', 'Clay-glazed ceramic') },
      ],
    },
  },
  {
    type: 'maison-moodboard',
    id: 'edit',
    settings: {
      tiles: [
        { image: u('photo-1507473885765-e6ed057f782c', 800, 1100), caption: tr('ضوء دافئ', 'Warm light'), url: '/collections/lighting' },
        { image: u('photo-1578500494198-246f612d3b3d', 900, 700), caption: tr('بطانيات منسوجة', 'Woven throws'), url: '/collections/textiles' },
        { image: u('photo-1612196808214-b8e1d6145a8c', 800, 1100), caption: tr('فخّار يدوي', 'Hand-thrown clay'), url: '/collections/accessories' },
        { image: u('photo-1603006905003-be475563bc59', 900, 600), caption: tr('أمسيات على ضوء الشموع', 'Candlelit evenings'), url: '/collections/accessories' },
        { image: u('photo-1600166898405-da9535204843', 900, 600), caption: tr('سجاد صوف', 'Wool underfoot'), url: '/collections/rugs' },
      ],
    },
  },
  { type: 'maison-gift-guide', id: 'gifts', settings: { collection: 'newest' } },
  {
    type: 'testimonials',
    id: 'words',
    settings: {
      title: tr('من بيوت عملائنا', 'From our customers’ homes'),
      layout: 'carousel',
      background: 'none',
      items: [
        { quote: tr('المفرش الكتان أنعم مما توقعت، والتغليف كان كأنه هدية.', 'The linen is softer than I expected, and it arrived wrapped like a gift.'), author: tr('مريم ع.', 'Mariam A.'), role: tr('القاهرة', 'Cairo'), rating: 5, avatar: '' },
        { quote: tr('المصباح السيراميك غيّر جو الصالة بالكامل. الضوء دافئ وهادئ.', 'The ceramic lamp changed the whole feel of our living room. Warm, gentle light.'), author: tr('نورة س.', 'Noura S.'), role: tr('الرياض', 'Riyadh'), rating: 5, avatar: '' },
        { quote: tr('اشتريت طقم الأطباق هدية لأختي، وطلبت واحد لي بعدها بأسبوع.', 'Bought the dinner set as a gift for my sister — ordered one for myself a week later.'), author: tr('هالة م.', 'Hala M.'), role: tr('دبي', 'Dubai'), rating: 5, avatar: '' },
      ],
    },
  },
  { type: 'maison-materials', id: 'materials' },
  {
    type: 'features',
    id: 'promises',
    settings: {
      layout: 'icons-row',
      background: 'surface',
      columns: 4,
      align: 'center',
      padding_block: 48,
      items: [
        { icon: 'truck', title: tr('توصيل بعناية', 'Delivered with care'), text: tr('تغليف آمن للقطع الهشّة', 'Fragile pieces packed safely'), url: '' },
        { icon: 'gift', title: tr('تغليف هدايا', 'Gift wrapping'), text: tr('مع بطاقة بخط اليد عند الطلب', 'With a handwritten card on request'), url: '' },
        { icon: 'refresh', title: tr('إرجاع خلال ١٤ يوم', '14-day returns'), text: tr('إرجاع سهل للقطع غير المستعملة', 'Easy returns on unused pieces'), url: '' },
        { icon: 'shield', title: tr('دفع آمن', 'Secure checkout'), text: tr('الدفع عند الاستلام أو بالبطاقة', 'Cash on delivery or card'), url: '' },
      ],
    },
  },
];

export const maisonProduct: ReadonlyArray<SectionInstance> = [
  { type: 'product-details', id: 'pdp', settings: { show_share: true, show_sku: false, show_wishlist: true } },
  {
    type: 'maison-materials',
    id: 'care',
    settings: {
      eyebrow: tr('العناية بالقطعة', 'Caring for your piece'),
      title: tr('عِش معها طويلاً', 'Made to be lived with'),
      text: tr('نصائح بسيطة تحافظ على جمال الخامات الطبيعية.', 'A few simple habits keep natural materials at their best.'),
      layout: 'cards',
    },
  },
  { type: 'related-products', id: 'related', settings: { title: tr('يكمّل الركن', 'Complete the corner'), limit: 8 } },
  { type: 'recently-viewed', id: 'recent' },
];

export const maisonCategory: ReadonlyArray<SectionInstance> = [
  { type: 'category-header', id: 'head' },
  { type: 'product-grid', id: 'grid', settings: { source: 'all', columns: 4, limit: 24 } },
];

export const maisonTemplates = baseTemplates({ home: maisonHome, product: maisonProduct, category: maisonCategory });
