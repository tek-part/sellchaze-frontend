/**
 * Bazaar — default page compositions (home / product / category), all from the section library.
 * A dense marketplace home: hero slider → category grid → flash deals → product tabs → promo
 * banners → trending → store features → brands → testimonials → blog → newsletter.
 * Every string default is a bilingual `{ ar, en }` map; the customizer edits both languages.
 */
import type { SectionInstance } from '../../theme-engine/rendering';
import { baseTemplates, tr } from '../../sections-lib';

const u = (id: string, w: number, h: number): string => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

export const bazaarHome: ReadonlyArray<SectionInstance> = [
  {
    type: 'hero-slider',
    id: 'hero',
    settings: {
      height: 'medium',
      rounded: true,
      autoplay: true,
      interval: 6,
      padding_block: 16,
      slides: [
        {
          image: u('photo-1607083206968-13611e3d76db', 1920, 900),
          eyebrow: tr('مهرجان التخفيضات الكبير', 'The big sale festival'),
          heading: tr('خصومات حتى ٧٠٪ على آلاف المنتجات', 'Up to 70% off thousands of products'),
          text: tr('إلكترونيات، أزياء، منزل، جمال والمزيد — كل ما تحتاجه من متجر واحد.', 'Electronics, fashion, home, beauty and more — everything you need from one store.'),
          cta_label: tr('تسوق العروض', 'Shop the deals'),
          cta_url: '/collections/sale',
          align: 'start',
          overlay: 40,
        },
        {
          image: u('photo-1498049794561-7780e7231661', 1920, 900),
          eyebrow: tr('إلكترونيات', 'Electronics'),
          heading: tr('أحدث الأجهزة بأفضل الأسعار', 'The latest devices at the best prices'),
          text: tr('هواتف، لابتوبات، سماعات وإكسسوارات مع ضمان رسمي.', 'Phones, laptops, headphones and accessories with official warranty.'),
          cta_label: tr('اكتشف الإلكترونيات', 'Explore electronics'),
          cta_url: '/categories/electronics',
          align: 'start',
          overlay: 45,
        },
        {
          image: u('photo-1556228453-efd6c1ff04f6', 1920, 900),
          eyebrow: tr('المنزل والمطبخ', 'Home & kitchen'),
          heading: tr('جدّد منزلك بلمسة أنيقة', 'Refresh your home with style'),
          text: tr('أثاث، ديكور وأدوات مطبخ بتوصيل مجاني للطلبات فوق ٢٠٠ ر.س.', 'Furniture, décor and kitchenware with free delivery over SAR 200.'),
          cta_label: tr('تسوق المنزل', 'Shop home'),
          cta_url: '/categories/home',
          align: 'center',
          overlay: 35,
        },
      ],
    },
  },
  {
    type: 'category-grid',
    id: 'categories',
    settings: {
      title: tr('تسوق حسب التصنيف', 'Shop by category'),
      subtitle: tr('أكثر من ٥٠ تصنيفاً في مكان واحد', 'Over 50 categories in one place'),
      columns: '4',
      limit: 8,
      style: 'below',
      aspect: 'square',
      show_count: true,
      view_all_url: '/categories',
      padding_block: 40,
    },
  },
  {
    type: 'flash-deals',
    id: 'flash-deals',
    settings: {
      title: tr('عروض البرق ⚡', 'Flash deals ⚡'),
      subtitle: tr('أسعار خاصة تنتهي قريباً — لا تفوّتها', 'Special prices ending soon — don’t miss out'),
      collection: 'sale',
      layout: 'carousel',
      columns: '5',
      limit: 10,
      background: 'surface',
      hide_when_expired: false,
      padding_block: 40,
    },
  },
  {
    type: 'product-tabs',
    id: 'product-tabs',
    settings: {
      title: tr('اكتشف منتجاتنا', 'Discover our products'),
      tabs: [
        { label: tr('وصل حديثاً', 'Newest'), collection: 'newest' },
        { label: tr('الأكثر مبيعاً', 'Best sellers'), collection: 'bestsellers' },
        { label: tr('تخفيضات', 'On sale'), collection: 'sale' },
      ],
      layout: 'grid',
      columns: '5',
      limit: 10,
      align: 'center',
      padding_block: 40,
    },
  },
  {
    type: 'banner-grid',
    id: 'promos',
    settings: {
      columns: '3',
      aspect: 'landscape',
      overlay: 30,
      style: 'overlay',
      padding_block: 24,
      banners: [
        { image: u('photo-1523275335684-37898b6baf30', 900, 675), eyebrow: tr('حتى ٤٠٪', 'Up to 40% off'), title: tr('ساعات وإكسسوارات', 'Watches & accessories'), subtitle: tr('لمسة أناقة يومية', 'Everyday elegance'), cta_label: tr('تسوق الآن', 'Shop now'), link: '/categories/accessories', align: 'start' },
        { image: u('photo-1522335789203-aabd1fc54bc9', 900, 675), eyebrow: tr('جديد', 'New in'), title: tr('العناية والجمال', 'Beauty & care'), subtitle: tr('علامات عالمية أصلية', 'Genuine global brands'), cta_label: tr('اكتشف', 'Discover'), link: '/categories/beauty', align: 'start' },
        { image: u('photo-1484704849700-f032a568e944', 900, 675), eyebrow: tr('عرض الأسبوع', 'Deal of the week'), title: tr('سماعات لاسلكية', 'Wireless audio'), subtitle: tr('اشترِ ١ واحصل على خصم ٢٠٪ على الثاني', 'Buy 1, get 20% off the second'), cta_label: tr('تسوق العرض', 'Shop the deal'), link: '/categories/electronics', align: 'start' },
      ],
    },
  },
  {
    type: 'featured-products',
    id: 'trending',
    settings: {
      title: tr('الأكثر رواجاً هذا الأسبوع', 'Trending this week'),
      subtitle: tr('اختيارات عملائنا الأعلى تقييماً', 'Our customers’ top-rated picks'),
      collection: 'trending',
      layout: 'carousel',
      columns: '5',
      limit: 10,
      view_all_url: '/collections/trending',
      view_all_label: tr('عرض الكل', 'View all'),
      padding_block: 40,
    },
  },
  {
    type: 'features',
    id: 'features',
    settings: {
      columns: '4',
      style: 'cards',
      align: 'start',
      background: 'none',
      padding_block: 24,
      items: [
        { icon: 'truck', title: tr('توصيل سريع', 'Fast delivery'), text: tr('خلال ٢٤–٧٢ ساعة لجميع مدن المملكة', 'Within 24–72 hours to every city in the Kingdom'), url: '/pages/shipping' },
        { icon: 'refresh', title: tr('إرجاع مجاني', 'Free returns'), text: tr('خلال ١٤ يوماً بدون أي أسئلة', '14 days, no questions asked'), url: '/pages/returns' },
        { icon: 'card', title: tr('دفع آمن ومرن', 'Secure, flexible payment'), text: tr('مدى، فيزا، أبل باي، تابي وتمارا', 'Mada, Visa, Apple Pay, Tabby & Tamara'), url: '/pages/payment' },
        { icon: 'headset', title: tr('دعم على مدار الساعة', '24/7 support'), text: tr('واتساب، اتصال أو بريد — نحن هنا دائماً', 'WhatsApp, phone or email — we are always here'), url: '/contact' },
      ],
    },
  },
  {
    type: 'brand-logos',
    id: 'brands',
    settings: { title: tr('تسوق من أشهر العلامات التجارية', 'Shop the most popular brands'), source: 'store', limit: 12, grayscale: true, layout: 'row', padding_block: 32 },
  },
  {
    type: 'testimonials',
    id: 'testimonials',
    settings: {
      title: tr('آراء عملائنا', 'What our customers say'),
      subtitle: tr('أكثر من ١٢٠ ألف تقييم بمتوسط ٤.٨ نجوم', 'Over 120,000 reviews averaging 4.8 stars'),
      use_store_reviews: true,
      layout: 'carousel',
      columns: '3',
      background: 'surface',
      padding_block: 40,
      items: [
        { quote: tr('طلبت هاتفاً ووصل في اليوم التالي مغلفاً بعناية. الأسعار أفضل من أي مكان آخر.', 'Ordered a phone and it arrived the next day, carefully packed. Prices beat everywhere else.'), author: tr('عبدالله السبيعي', 'Abdullah Al-Subaie'), role: tr('الرياض', 'Riyadh'), rating: 5, avatar: '' },
        { quote: tr('خدمة العملاء ممتازة وسريعة الرد على واتساب. الإرجاع كان سهلاً جداً.', 'Excellent customer service, quick to reply on WhatsApp. Returning an item was effortless.'), author: tr('نورة القحطاني', 'Noura Al-Qahtani'), role: tr('جدة', 'Jeddah'), rating: 5, avatar: '' },
        { quote: tr('تشكيلة ضخمة من التصنيفات، أشتري كل احتياجات المنزل من متجر واحد.', 'A huge range of categories — I buy everything for the house from one store.'), author: tr('محمد العتيبي', 'Mohammed Al-Otaibi'), role: tr('الدمام', 'Dammam'), rating: 4, avatar: '' },
      ],
    },
  },
  {
    type: 'blog-posts',
    id: 'blog',
    settings: { title: tr('أدلة ونصائح التسوق', 'Guides & shopping tips'), subtitle: tr('اقرأ قبل أن تشتري', 'Read before you buy'), columns: '3', limit: 3, show_excerpt: true, show_meta: true, view_all_url: '/blog', padding_block: 40 },
  },
  {
    type: 'newsletter',
    id: 'newsletter',
    settings: {
      eyebrow: tr('عروض حصرية', 'Exclusive offers'),
      heading: tr('اشترك واحصل على خصم ١٠٪ على أول طلب', 'Subscribe and get 10% off your first order'),
      text: tr('كن أول من يعرف عن العروض الأسبوعية والمنتجات الجديدة.', 'Be the first to hear about weekly deals and new arrivals.'),
      background: 'primary',
      style: 'band',
      align: 'center',
      padding_block: 48,
    },
  },
];

export const bazaarTemplates = baseTemplates({ home: bazaarHome });
