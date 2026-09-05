/**
 * Sahra — default page compositions (home / product / category), all from the section library.
 * Every string default is a bilingual `{ ar, en }` map; the customizer edits both languages.
 * Home: cinematic hero → newest (4-up grid) → brand story → 4 category tiles → best sellers rail →
 * brand film → editorial testimonials → gift-wrap / shipping / authenticity → brands → newsletter → FAQ.
 */
import type { SectionInstance } from '../../theme-engine/rendering';
import { baseTemplates, tr } from '../../sections-lib';

const u = (id: string, w: number, h: number): string => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

export const sahraHome: ReadonlyArray<SectionInstance> = [
  {
    type: 'hero-banner',
    id: 'hero',
    settings: {
      image: u('photo-1587017539504-67cfbddac569', 1920, 1080),
      mobile_image: u('photo-1587017539504-67cfbddac569', 900, 1200),
      eyebrow: tr('المجموعة الجديدة ٢٠٢٦', 'The 2026 collection'),
      heading: tr('عطرٌ يُروى، وذهبٌ يُهدى', 'A scent to be told, a gold to be gifted'),
      text: tr('عطور نادرة، مجوهرات مصاغة يدوياً، وعبايات بقصّات راقية — مختارة لتليق باللحظات الاستثنائية.', 'Rare perfumes, hand-finished jewellery and refined abayas — curated for moments worth remembering.'),
      cta_label: tr('اكتشف المجموعة', 'Discover the collection'),
      cta_url: '/shop',
      cta2_label: tr('دليل الهدايا', 'Gift guide'),
      cta2_url: '/collections/gifts',
      align: 'center',
      height: 'tall',
      overlay: 40,
      text_color: 'light',
      rounded: false,
    },
  },
  {
    type: 'featured-products',
    id: 'newest',
    settings: {
      title: tr('وصل حديثاً', 'New arrivals'),
      subtitle: tr('أحدث ما أضفناه إلى المجموعة', 'The latest additions to the collection'),
      collection: 'newest',
      columns: 4,
      limit: 8,
      layout: 'grid',
      show_badges: true,
      show_ratings: false,
      show_quick_add: true,
      show_wishlist: true,
      view_all_url: '/collections/new-arrivals',
      view_all_label: tr('عرض الكل', 'View all'),
    },
  },
  {
    type: 'image-with-text',
    id: 'story',
    settings: {
      image: u('photo-1594035910387-fea47794261f', 1200, 1500),
      eyebrow: tr('قصة الدار', 'The house'),
      heading: tr('حرفةٌ تُورَّث، وفخامةٌ لا تُستعجل', 'Craft that is inherited, luxury that is never rushed'),
      text: tr(
        '<p>منذ عام ٢٠١٠ ونحن نختار كل قطعة بعين الخبير: عودٌ معتّق من أشجار نادرة، ذهبٌ عيار ١٨ يُصاغ يدوياً، وأقمشة تُنسج خصيصاً لنا. كل منتج يصل إليك في علبة هدايا مبطّنة، مع بطاقة مكتوبة بخط اليد.</p>',
        '<p>Since 2010 we have chosen every piece with an expert eye: aged oud from rare trees, 18-karat gold finished by hand, and fabrics woven exclusively for us. Every order arrives in a lined gift box with a hand-written card.</p>',
      ),
      cta_label: tr('اقرأ قصتنا', 'Read our story'),
      cta_url: '/about',
      media_side: 'start',
      aspect: 'portrait',
      background: 'none',
    },
  },
  {
    type: 'category-grid',
    id: 'categories',
    settings: {
      title: tr('تسوّق حسب المجموعة', 'Shop by collection'),
      subtitle: tr('عطور · مجوهرات · عبايات · هدايا', 'Perfume · Jewellery · Abayas · Gifts'),
      columns: 4,
      limit: 4,
      style: 'overlay',
      aspect: 'portrait',
      show_count: false,
      view_all_url: '/categories',
    },
  },
  {
    type: 'featured-products',
    id: 'bestsellers',
    settings: {
      title: tr('الأكثر طلباً', 'Most coveted'),
      subtitle: tr('القطع التي يعود إليها عملاؤنا مرة بعد مرة', 'The pieces our clients return to, again and again'),
      collection: 'bestsellers',
      columns: 4,
      limit: 10,
      layout: 'carousel',
      show_badges: true,
      show_ratings: false,
      show_quick_add: true,
      show_wishlist: true,
      view_all_url: '/collections/best-sellers',
      view_all_label: tr('عرض الكل', 'View all'),
    },
  },
  {
    type: 'video',
    id: 'film',
    settings: {
      heading: tr('فيلم الدار', 'The house film'),
      text: tr('دقيقتان في ورشتنا — من قطرة العطر الأولى إلى آخر لمسة ذهب.', 'Two minutes inside our atelier — from the first drop of perfume to the final touch of gold.'),
      url: 'https://www.youtube.com/watch?v=ysz5S6PUM-U',
      poster: u('photo-1523293182086-7651a899d37f', 1600, 900),
      aspect: 'wide',
      autoplay: false,
      loop: false,
      width: 'wide',
    },
  },
  {
    type: 'testimonials',
    id: 'testimonials',
    settings: {
      title: tr('بكلماتهم', 'In their words'),
      subtitle: tr('ما يقوله عملاؤنا عن تجربة صحراء', 'What our clients say about the Sahra experience'),
      items: [
        { quote: tr('العود وصل في علبة أنيقة جداً مع بطاقة مكتوبة بخط اليد — أهديته لوالدي وكانت لحظة لا تُنسى.', 'The oud arrived in the most elegant box with a hand-written card — I gifted it to my father and it was a moment to remember.'), author: tr('ريم الدوسري', 'Reem Al-Dosari'), role: tr('الرياض', 'Riyadh'), rating: 5, avatar: '' },
        { quote: tr('العباية بقصّة مثالية وقماشها فاخر، والتوصيل كان أسرع مما توقعت.', 'The abaya has a perfect cut and luxurious fabric, and delivery was faster than I expected.'), author: tr('هند العتيبي', 'Hind Al-Otaibi'), role: tr('جدة', 'Jeddah'), rating: 5, avatar: '' },
        { quote: tr('اشتريت سواراً من الذهب لزوجتي — شهادة الأصالة والتغليف جعلا الهدية مميزة.', 'I bought a gold bracelet for my wife — the certificate of authenticity and the wrapping made the gift special.'), author: tr('فيصل الشمري', 'Faisal Al-Shammari'), role: tr('الدمام', 'Dammam'), rating: 5, avatar: '' },
        { quote: tr('خدمة العملاء ساعدتني في اختيار عطر يناسب المناسبة، والنتيجة كانت رائعة.', 'Customer care helped me choose the right scent for the occasion, and the result was wonderful.'), author: tr('لمى القحطاني', 'Lama Al-Qahtani'), role: tr('الخبر', 'Khobar'), rating: 4, avatar: '' },
      ],
      use_store_reviews: true,
      layout: 'carousel',
      columns: 3,
      background: 'surface',
    },
  },
  {
    type: 'features',
    id: 'promises',
    settings: {
      title: tr('وعد صحراء', 'The Sahra promise'),
      items: [
        { icon: 'gift', title: tr('تغليف هدايا مجاني', 'Complimentary gift wrapping'), text: tr('علبة مبطّنة وبطاقة بخط اليد مع كل طلب', 'A lined box and a hand-written card with every order'), url: '' },
        { icon: 'truck', title: tr('شحن مجاني وسريع', 'Free express shipping'), text: tr('للطلبات فوق ٥٠٠ ر.س داخل المملكة والخليج', 'On orders over 500 across the Kingdom and the Gulf'), url: '' },
        { icon: 'shield', title: tr('أصالة مضمونة', 'Guaranteed authenticity'), text: tr('شهادة أصالة مع كل عطر وقطعة مجوهرات', 'A certificate of authenticity with every perfume and jewel'), url: '' },
      ],
      columns: 3,
      style: 'plain',
      align: 'center',
      background: 'none',
    },
  },
  {
    type: 'brand-logos',
    id: 'brands',
    settings: { title: tr('دور العطور والمجوهرات', 'Houses we carry'), source: 'store', limit: 8, grayscale: true, layout: 'wrap' },
  },
  {
    type: 'newsletter',
    id: 'newsletter',
    settings: {
      eyebrow: tr('نادي صحراء', 'The Sahra circle'),
      heading: tr('كن أول من يكتشف الإصدارات المحدودة', 'Be the first to discover limited editions'),
      text: tr('دعوات خاصة، إصدارات حصرية، وهدية ترحيبية عند اشتراكك.', 'Private invitations, exclusive releases and a welcome gift when you join.'),
      note: tr('لا رسائل مزعجة — يمكنك إلغاء الاشتراك في أي وقت.', 'No noise — unsubscribe any time.'),
      align: 'center',
      background: 'primary',
      style: 'band',
    },
  },
  {
    type: 'faq',
    id: 'faq',
    settings: {
      title: tr('أسئلة شائعة', 'Questions, answered'),
      items: [
        { question: tr('هل العطور أصلية؟', 'Are the perfumes authentic?'), answer: tr('<p>نعم. نستورد مباشرة من الدور المصنّعة وترفق كل عبوة بشهادة أصالة ورقم تسلسلي.</p>', '<p>Yes. We import directly from the houses themselves, and every bottle ships with a certificate of authenticity and a serial number.</p>') },
        { question: tr('كيف يتم تغليف الهدايا؟', 'How are gifts wrapped?'), answer: tr('<p>كل طلب يصل في علبة صحراء المبطّنة مع شريط ساتان وبطاقة مكتوبة بخط اليد — مجاناً، ويمكنك إضافة رسالتك عند إتمام الطلب.</p>', '<p>Every order arrives in the lined Sahra box with a satin ribbon and a hand-written card — complimentary; add your message at checkout.</p>') },
        { question: tr('ما هي سياسة الإرجاع؟', 'What is the return policy?'), answer: tr('<p>يمكن إرجاع القطع غير المستخدمة خلال ١٤ يوماً. العطور المفتوحة والمجوهرات المخصصة غير قابلة للإرجاع.</p>', '<p>Unused pieces may be returned within 14 days. Opened perfumes and personalised jewellery are final sale.</p>') },
        { question: tr('هل تشحنون خارج المملكة؟', 'Do you ship internationally?'), answer: tr('<p>نشحن إلى دول الخليج خلال ٣–٥ أيام عمل، وإلى بقية العالم خلال ٧–١٠ أيام.</p>', '<p>We ship to the Gulf in 3–5 business days and worldwide in 7–10.</p>') },
      ],
      use_store_faq: true,
      layout: 'accordion',
      open_first: true,
    },
  },
];

export const sahraTemplates = baseTemplates({ home: sahraHome });
