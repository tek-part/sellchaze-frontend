/**
 * Techno — default page compositions (home / product / category), all from the section library.
 * Every string default is a bilingual `{ ar, en }` map; the customizer edits both languages.
 */
import type { SectionInstance } from '../../theme-engine/rendering';
import { baseTemplates, tr } from '../../sections-lib';

const u = (id: string, w: number, h: number): string => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

/** Flash-deal deadline: three days out, on the hour — a demo that never starts expired. */
function dealEndsAt(): string {
  const d = new Date(Date.now() + 3 * 24 * 3600 * 1000);
  d.setMinutes(0, 0, 0);
  return d.toISOString().slice(0, 16);
}

export const technoHome: ReadonlyArray<SectionInstance> = [
  {
    type: 'hero-slider',
    id: 'hero',
    settings: {
      height: 'medium',
      interval: 7,
      slides: [
        {
          image: u('photo-1498049794561-7780e7231661', 1920, 900),
          eyebrow: tr('الإصدار الجديد ٢٠٢٦', 'The 2026 line-up'),
          heading: tr('أجهزة لابتوب أقوى، أخف، وأطول عمراً', 'Faster, lighter, longer-lasting laptops'),
          text: tr('معالجات الجيل الجديد وشاشات OLED بأسعار تبدأ من ٢٬٩٩٩ ر.س، مع ضمان سنتين.', 'Next-gen processors and OLED displays from 2,999 SAR — with a two-year warranty.'),
          cta_label: tr('تسوق اللابتوبات', 'Shop laptops'),
          cta_url: '/shop',
          align: 'start',
          overlay: 45,
        },
        {
          image: u('photo-1546435770-a3e426bf472b', 1920, 900),
          eyebrow: tr('صوت بلا حدود', 'Sound without limits'),
          heading: tr('سماعات بإلغاء ضوضاء نشط', 'Active noise-cancelling headphones'),
          text: tr('حتى ٤٠ ساعة بطارية وشحن سريع في ١٠ دقائق. خصم ٢٥٪ لفترة محدودة.', 'Up to 40 hours of battery and a 10-minute fast charge. 25% off for a limited time.'),
          cta_label: tr('اكتشف العروض', 'See the deals'),
          cta_url: '/collections/sale',
          align: 'center',
          overlay: 40,
        },
        {
          image: u('photo-1605236453806-6ff36851218e', 1920, 900),
          eyebrow: tr('ركن الألعاب', 'Gaming corner'),
          heading: tr('جهّز محطتك للجيل القادم', 'Build your next-gen battle station'),
          text: tr('بطاقات رسومية، شاشات ١٤٤Hz ولوحات مفاتيح ميكانيكية — تقسيط بدون فوائد.', 'Graphics cards, 144Hz monitors and mechanical keyboards — 0% instalments.'),
          cta_label: tr('تسوق الألعاب', 'Shop gaming'),
          cta_url: '/shop',
          align: 'start',
          overlay: 50,
        },
      ],
    },
  },
  {
    type: 'features',
    id: 'trust',
    settings: {
      style: 'inline',
      background: 'surface',
      columns: 4,
      align: 'start',
      padding_block: 20,
      items: [
        { icon: 'shield', title: tr('ضمان سنتين', '2-year warranty'), text: tr('على جميع الأجهزة الإلكترونية', 'On every device we sell'), url: '' },
        { icon: 'card', title: tr('تقسيط بدون فوائد', '0% instalments'), text: tr('مع تابي وتمارا حتى ١٢ شهراً', 'Tabby & Tamara, up to 12 months'), url: '' },
        { icon: 'refresh', title: tr('إرجاع خلال ١٤ يوماً', '14-day returns'), text: tr('استرداد كامل بدون أسئلة', 'Full refund, no questions asked'), url: '' },
        { icon: 'headset', title: tr('دعم فني ٢٤/٧', '24/7 tech support'), text: tr('خبراء جاهزون عبر الهاتف والدردشة', 'Experts on phone and chat'), url: '' },
      ],
    },
  },
  {
    type: 'flash-deals',
    id: 'deals',
    settings: {
      title: tr('عروض البرق', 'Flash deals'),
      subtitle: tr('أسعار تنتهي مع انتهاء العداد — الكمية محدودة', 'Prices end when the timer does — limited stock'),
      ends_at: dealEndsAt(),
      collection: 'sale',
      layout: 'carousel',
      background: 'none',
      limit: 8,
    },
  },
  {
    type: 'category-grid',
    id: 'categories',
    settings: { title: tr('تسوق حسب الفئة', 'Shop by category'), subtitle: tr('كل ما تحتاجه لمكتبك، منزلك وجيبك', 'Everything for your desk, home and pocket'), columns: 6, limit: 6, style: 'below', aspect: 'square', show_count: true, view_all_url: '/categories' },
  },
  {
    type: 'product-tabs',
    id: 'tabs',
    settings: {
      title: tr('اكتشف الأجهزة', 'Discover devices'),
      tabs: [
        { label: tr('الأحدث', 'Newest'), collection: 'newest' },
        { label: tr('الأكثر مبيعاً', 'Best sellers'), collection: 'bestsellers' },
        { label: tr('تخفيضات', 'On sale'), collection: 'sale' },
      ],
      layout: 'grid',
      columns: 4,
      limit: 8,
      align: 'center',
    },
  },
  {
    type: 'banner-grid',
    id: 'banners',
    settings: {
      columns: 3,
      aspect: 'landscape',
      overlay: 40,
      banners: [
        { image: u('photo-1572569511254-d8f925fe2cbb', 1200, 900), eyebrow: tr('هواتف', 'Phones'), title: tr('أحدث الهواتف الذكية', 'The latest smartphones'), subtitle: tr('استبدل جهازك القديم ووفّر حتى ١٬٠٠٠ ر.س', 'Trade in and save up to 1,000 SAR'), cta_label: tr('تسوق', 'Shop'), link: '/shop', align: 'start' },
        { image: u('photo-1546868871-7041f2a55e12', 1200, 900), eyebrow: tr('أجهزة قابلة للارتداء', 'Wearables'), title: tr('ساعات ذكية وأساور', 'Smartwatches & bands'), subtitle: tr('تتبّع صحتك بدقة', 'Track your health precisely'), cta_label: tr('تسوق', 'Shop'), link: '/shop', align: 'start' },
        { image: u('photo-1519389950473-47ba0277781c', 1200, 900), eyebrow: tr('العمل من المنزل', 'Work from home'), title: tr('مكتب أذكى', 'A smarter desk'), subtitle: tr('شاشات، لوحات مفاتيح وإكسسوارات', 'Monitors, keyboards & accessories'), cta_label: tr('تسوق', 'Shop'), link: '/shop', align: 'start' },
      ],
    },
  },
  {
    type: 'featured-products',
    id: 'trending',
    settings: { title: tr('الأكثر رواجاً', 'Trending now'), subtitle: tr('ما يشتريه عملاؤنا هذا الأسبوع', 'What our customers are buying this week'), collection: 'trending', layout: 'carousel', columns: 5, limit: 10, view_all_url: '/collections/trending' },
  },
  {
    type: 'video',
    id: 'launch',
    settings: {
      heading: tr('شاهد إطلاق المنتج', 'Watch the product launch'),
      text: tr('جولة سريعة في أبرز مزايا الجيل الجديد.', 'A quick tour of the new generation’s headline features.'),
      url: 'https://www.youtube.com/watch?v=ysz5S6PUM-U',
      poster: u('photo-1593642702821-c8da6771f0c6', 1600, 900),
      aspect: 'wide',
      width: 'wide',
    },
  },
  { type: 'brand-logos', id: 'brands', settings: { title: tr('علامات نثق بها', 'Brands we trust'), layout: 'row', grayscale: true, limit: 12 } },
  {
    type: 'testimonials',
    id: 'testimonials',
    settings: {
      title: tr('آراء العملاء', 'Customer reviews'),
      subtitle: tr('تقييم ٤٫٨ من ٥ من أكثر من ١٢٬٠٠٠ طلب', 'Rated 4.8 / 5 across 12,000+ orders'),
      layout: 'carousel',
      background: 'surface',
      items: [
        { quote: tr('وصل اللابتوب في اليوم التالي مغلفاً بعناية، والدعم الفني ساعدني في نقل بياناتي.', 'The laptop arrived next day, well packed, and tech support helped me migrate my data.'), author: tr('فيصل ر.', 'Faisal R.'), role: tr('الرياض', 'Riyadh'), rating: 5, avatar: '' },
        { quote: tr('سعر السماعات كان أقل من كل المتاجر، والتقسيط بدون فوائد سهّل القرار.', 'Best headphone price anywhere, and the 0% instalments made it an easy call.'), author: tr('لمى ح.', 'Lama H.'), role: tr('جدة', 'Jeddah'), rating: 5, avatar: '' },
        { quote: tr('مقارنة المواصفات على الموقع وفّرت عليّ وقت البحث. الإرجاع أيضاً كان سلساً.', 'Comparing specs on the site saved me hours of research. Returns were painless too.'), author: tr('عبدالله م.', 'Abdullah M.'), role: tr('الخبر', 'Khobar'), rating: 4, avatar: '' },
      ],
    },
  },
  {
    type: 'faq',
    id: 'faq',
    settings: {
      title: tr('الأسئلة الشائعة', 'Frequently asked questions'),
      items: [
        { question: tr('هل الأجهزة أصلية وبضمان الوكيل؟', 'Are devices genuine and covered by the official warranty?'), answer: tr('نعم، جميع منتجاتنا أصلية ١٠٠٪ وبضمان الوكيل المعتمد لمدة سنتين.', 'Yes — every product is 100% genuine and carries the authorised two-year warranty.') },
        { question: tr('كيف يعمل التقسيط؟', 'How do instalments work?'), answer: tr('اختر تابي أو تمارا عند الدفع وقسّم المبلغ حتى ١٢ شهراً بدون فوائد.', 'Pick Tabby or Tamara at checkout and split the total over up to 12 months at 0%.') },
        { question: tr('كم يستغرق التوصيل؟', 'How long does delivery take?'), answer: tr('التوصيل خلال ٢٤ ساعة داخل المدن الرئيسية و٢-٤ أيام لبقية المناطق.', 'Next-day in major cities and 2–4 days elsewhere.') },
        { question: tr('هل يمكن إرجاع جهاز تم فتحه؟', 'Can I return an opened device?'), answer: tr('نعم خلال ١٤ يوماً بشرط سلامة الجهاز وكامل الملحقات.', 'Yes, within 14 days as long as the device and all accessories are intact.') },
      ],
      layout: 'columns',
    },
  },
  {
    type: 'newsletter',
    id: 'newsletter',
    settings: {
      eyebrow: tr('لا تفوّت العروض', 'Never miss a drop'),
      heading: tr('اشترك لتصلك عروض التقنية أولاً', 'Get tech deals before anyone else'),
      text: tr('إطلاقات جديدة، خصومات حصرية وعروض البرق في بريدك كل أسبوع.', 'New launches, exclusive discounts and flash deals in your inbox every week.'),
      background: 'primary',
      style: 'band',
    },
  },
];

export const technoTemplates = baseTemplates({ home: technoHome });
