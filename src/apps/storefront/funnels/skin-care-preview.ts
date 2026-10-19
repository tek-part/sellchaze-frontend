import type { ApiProduct } from '../api/types';
import type { SectionInstance } from '../theme-engine/rendering';

/** Explicit inert catalog content, never used to initialize a merchant's funnel. */
export function skinCarePreview(locale: 'ar' | 'en'): { product: ApiProduct; sections: SectionInstance[] } {
  const ar = locale === 'ar'; const tr = (a: string, e: string): string => ar ? a : e;
  const hero = '/media/funnel-campaigns/skin-care-hero-v1.webp';
  const image = '/media/funnel-campaigns/skin-care-product-v1.webp';
  const portrait = '/media/funnel-campaigns/skin-care-portrait-v1.webp';
  const backdrop = '/media/funnel-campaigns/skin-care-forest-v1.webp';
  const mosaic = '/media/funnel-campaigns/skin-care-mosaic-v1.webp';
  const product: ApiProduct = { id: -6, name: tr('عبوة عناية بالبشرة — نموذج', 'Skin care jar — demo'), slug: 'display-only-skin-care', price: 250, compare_price: 500, image_url: image, images: [image, portrait, hero], short_description: tr('صور وبيانات توضيحية لمعاينة التصميم فقط. ليست مواصفات منتج معروض للبيع.', 'Sample photographs and content for previewing the design only, rather than specifications for a product offered for sale.') };
  let id = 0;
  const row = (type: string, settings: Record<string, unknown>): SectionInstance => ({ id: `skincare-demo-${id++}`, type: `skincare-${type}`, settings });
  const cta = tr('اكتشف الآن', 'Discover now');
  const phrases = [tr('قصة كل يوم', 'Everyday stories'), tr('تفاصيل تستحق الاكتشاف', 'Details to discover'), tr('مساحة لمنتجك', 'A place for your product'), tr('تصميم قابل للتخصيص', 'A design of your own')].map(label => ({ label }));
  const features = (): SectionInstance => row('features', { image: backdrop, image_alt: tr('صورة غابة توضيحية أصلية', 'Original sample woodland photograph'), items: [tr('مساحة أصلية لقصة منتجك', 'An original space for your product story'), tr('صورك واختياراتك', 'Your own photographs'), tr('تفاصيل تستحق الاستكشاف', 'Details worth exploring'), tr('تصميم يمكنك تخصيصه', 'A design you can personalize'), tr('متجرك وقصتك', 'Your store and your story')].map(label => ({ label })) });
  const quote = (): SectionInstance => row('quote', { text: tr('«صفحة مدروسة تمنح كل تفصيلة مساحتها. استبدل هذا النص التوضيحي بكلماتك، وأضف صورك وقصة منتجك، واعرض ما يميز متجرك بالطريقة التي تناسبك وتمنح زبائنك تجربة واضحة ومتكاملة.»', '“A thoughtful page gives every detail room to breathe. Replace this sample story with your own words, add your photographs, and show customers what makes your product and your store distinctive.”'), attribution: '', logos: [] });
  const faqs = [
    [tr('هل هذه صفحة منتج حقيقي؟', 'Is this a real product listing?'), tr('هذه صور وبيانات توضيحية لمعاينة التصميم فقط.', 'These are sample photographs and content for previewing the design only.')],
    [tr('هل يمكن تغيير الصور؟', 'Can I change the photographs?'), tr('يمكنك إضافة صور منتجك في الأقسام من منشئ الصفحة.', 'You can add your own product photographs to the sections in the page builder.')],
    [tr('كيف أضيف سياسة التوصيل؟', 'How do I add my delivery policy?'), tr('حرّر السياسة وأدخل معلومات متجرك الفعلية.', 'Edit the policy and enter the actual information for your store.')],
    [tr('كيف تظهر التقييمات؟', 'How are reviews shown?'), tr('تعرض الصفحة المنشورة تقييمات المنتج الفعلية. التقييمات هنا توضيحية.', 'The published page displays actual product reviews. Reviews here are sample content.')],
    [tr('ما وسائل الدفع المتاحة؟', 'Which payment methods are available?'), tr('يعرض نموذج الطلب الحقيقي الوسائل التي فعّلها المتجر.', 'The real order form displays the methods enabled by the store.')],
    [tr('هل يمكن الشراء هنا؟', 'Can I buy from this preview?'), tr('الشراء معطّل في هذه المعاينة.', 'Checkout is disabled in this preview.')],
  ].map(([question, answer]) => ({ question, answer }));
  const sections = [
    row('hero', { heading: tr('مساحة مميزة لعرض منتجك وقصته وتفاصيله، بصور أصلية وتصميم يمنح كل جزء من التجربة مساحة واضحة للتخصيص. اجعلها تعبر عن متجرك بطريقتك.', 'An original way to tell your product story, with thoughtful details and photographs that make every part of the experience feel considered.'), text: '', image: hero, image_alt: tr('صورة حملة توضيحية أصلية', 'Original sample campaign photograph'), cta_label: cta, announcement: tr('معاينة قالب Skin Care — بيانات توضيحية', 'Skin Care template preview — sample content'), expires_at: '' }),
    row('intro', { text: tr('امنح قصة منتجك مساحة مميزة، بصور أصلية وتفاصيل واضحة تستطيع تخصيصها لتناسب متجرك وزبائنك وتجربتك الخاصة.', 'Give your product story a distinctive space, with original photographs and thoughtful details that you can personalize for your own store and its customers.') }),
    row('purchase', { heading: product.name, text: product.short_description, cta_label: cta }),
    row('specs', { heading: tr('المواصفات والتفاصيل', 'Specifications & details'), image: hero, image_alt: tr('صورة حملة توضيحية أصلية', 'Original sample campaign photograph'), backdrop, items: [tr('مساحة قابلة للتحرير لمعلومات منتجك الفعلية.', 'An editable space for actual product information.'), tr('أضف المواصفات التي تناسب منتجك ومتجرك.', 'Add the specifications that suit your product and store.'), tr('هذه الصور والنصوص لعرض التصميم فقط.', 'These photographs and text demonstrate the design only.'), tr('يمكن تخصيص كل قسم من منشئ الصفحة.', 'Every section can be personalized in the page builder.')].map(label => ({ label })), policies: [tr('معلومات التوصيل', 'Delivery information'), tr('معلومات خدمة العملاء', 'Customer service information'), tr('سياسة الاسترجاع', 'Return policy')].map(question => ({ question, answer: tr('نص توضيحي. أضف السياسة الفعلية لمتجرك هنا قبل النشر.', 'Sample content. Add your store’s actual policy here before publishing.') })) }),
    row('story', { heading: tr('مساحة لقصة منتجك', 'A place for your product story'), text: tr('كل منتج له قصة. اكتب هنا التفاصيل التي تريد مشاركتها، وأضف صورك ونصوصك لتجعل الصفحة تعبر عن متجرك. هذا نص توضيحي قابل للتحرير.', 'Every product has a story. Use this space for the details you want to share, then add your own photographs and words to make the page your own. This is editable sample content.'), image: portrait, image_alt: tr('صورة تحريرية توضيحية أصلية', 'Original sample editorial portrait'), backdrop, cta_label: cta }),
    row('marquee', { items: phrases }), features(), quote(),
  ];
  if (!ar) sections.push(features(), quote());
  sections.push(
    row('experiences', { heading: tr('لقطات توضيحية للقالب', 'Sample editorial photographs'), image: mosaic, image_alt: tr('مونتاج صور توضيحية أصلية، وليس تقييمات زبائن', 'Original sample photographic montage, not customer testimonials') }),
    row('marquee', { items: phrases }),
    row('reviews', { heading: tr('مساحة لآراء العملاء', 'A place for customer reviews'), subheading: tr('تقييمات توضيحية للقالب', 'Sample reviews for the template') }),
    row('faq', { heading: '', image, image_alt: tr('عبوة توضيحية أصلية للمعاينة', 'Original sample jar for the preview'), backdrop, items: faqs }),
  );
  return { product, sections };
}
