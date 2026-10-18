import type { ApiProduct } from '../api/types';
import type { SectionInstance } from '../theme-engine/rendering';

/** Sample catalog content cannot initialize checkout or reach a merchant product. */
export function litterPreview(locale: 'ar' | 'en'): { product: ApiProduct; sections: SectionInstance[] } {
  const ar = locale === 'ar'; const tr = (a: string, e: string): string => ar ? a : e;
  const hero = '/media/funnel-campaigns/litter-robot-hero-v1.webp'; const image = '/media/funnel-campaigns/litter-robot-detail-v1.webp';
  const product: ApiProduct = { id: -3, name: tr('صندوق القطط — نموذج', 'Cat care — demo'), slug: 'display-only-litter-robot', price: 2500, image_url: image, images: [image, hero], short_description: tr('صورة ومحتوى توضيحيان لمعاينة قالب الأجهزة الأليفة.', 'Sample imagery and content for previewing the pet-appliance campaign.') };
  let id = 0;
  const row = (type: string, settings: Record<string, unknown>): SectionInstance => ({ id: `litter-demo-${id++}`, type: `litter-${type}`, settings });
  const card = (heading: string, text: string): Record<string, string> => ({ heading, text, image, image_alt: product.name });
  const faqs = [
    [tr('هل هذه صفحة منتج حقيقي؟', 'Is this a real product listing?'), tr('هذه بيانات توضيحية لمعاينة القالب فقط.', 'This is sample content for previewing the template only.')],
    [tr('هل يمكن تغيير الصور؟', 'Can I change the photographs?'), tr('يمكن للتاجر إضافة صور منتجه وتحرير أقسام الصفحة.', 'The merchant can supply product photographs and edit the page sections.')],
    [tr('أين تظهر تفاصيل المنتج؟', 'Where do product details appear?'), tr('تتضمن الصفحة مواصفات وبطاقات وصف قابلة للتحرير.', 'The page includes editable specifications and descriptive cards.')],
    [tr('كيف يتم اختيار المنتج؟', 'How is the product selected?'), tr('يختار التاجر منتجًا فعليًا عند إنشاء صفحة الطلب.', 'The merchant chooses an actual product when creating the funnel.')],
    [tr('ما وسائل الدفع المتاحة؟', 'Which payment methods are available?'), tr('تعتمد على الوسائل التي فعّلها المتجر في نموذج الطلب الحقيقي.', 'They depend on the methods enabled by the store in the real order form.')],
    [tr('هل يمكن الشراء من هذه المعاينة؟', 'Can I buy from this preview?'), tr('الشراء معطّل في المعاينة التوضيحية.', 'Checkout is disabled in the sample preview.')],
  ].map(([question, answer]) => ({ question, answer }));
  return { product, sections: [
    row('hero', { eyebrow: tr('مكان صغير في بيتك.', 'A little space in your home.'), heading: tr('روتين جديد\nلقطتك. 👋', 'A new routine.\nFor your cat. 👋'), text: '', image: hero, image_alt: tr('صورة أصلية لجهاز عناية بالقطط في غرفة معيشة', 'Original pet-appliance campaign in a living room'), cta_label: tr('اكتشف المنتج', 'Discover the product'), announcement: tr('معاينة قالب الأجهزة الأليفة', 'Pet-appliance campaign preview'), offer_heading: tr('تفاصيل تستحق الاكتشاف', 'Details to discover'), offer_text: tr('معاينة المجموعة', 'Collection preview'), offer_value: '01' }),
    row('purchase', { heading: product.name, text: product.short_description }),
    row('assurances', { heading: tr('تفاصيل المنتج', 'Product details'), items: [card(tr('صورة أوضح', 'A clearer view'), tr('مساحة لصور المنتج.', 'A place for product photographs.')), card(tr('معلومات في مكان واحد', 'Details in one place'), tr('أضف الوصف المناسب لمنتجك.', 'Add a description for your product.')), card(tr('اختياراتك أنت', 'Your own choices'), tr('اعرض الخيارات المتاحة لعملائك.', 'Show the options available to your customers.'))], questions: faqs.slice(0, 3) }),
    row('specifications', { items: [{ image, image_alt: product.name, labels: [{ label: tr('اللوحة الأولى', 'First panel'), value: tr('مساحة للمواصفات', 'Space for specifications') }] }, { image: hero, image_alt: product.name, labels: [{ label: tr('اللوحة الثانية', 'Second panel'), value: tr('تفاصيل قابلة للتحرير', 'Editable details') }] }] }),
    row('feature-cards', { items: [card(tr('نظرة عن قرب', 'A closer look'), tr('اعرض تفاصيل المنتج من زاوية مختلفة.', 'Show a different view of the product.')), card(tr('في بيتك', 'At home'), tr('صور تساعد عميلك على اكتشاف المنتج.', 'Photographs help customers explore the product.')), card(tr('لروتينك اليومي', 'For your everyday routine'), tr('اكتب مزايا منتجك الفعلية هنا.', 'Describe your actual product features here.'))] }),
    row('feature-orbit', { image, image_alt: product.name, items: [card(tr('التصميم', 'Design'), tr('تفاصيل التصميم.', 'Design details.')), card(tr('الاستخدام', 'Use'), tr('معلومات الاستخدام.', 'Usage information.')), card(tr('العناية', 'Care'), tr('تعليمات العناية.', 'Care instructions.')), card(tr('الاختيارات', 'Options'), tr('خيارات المنتج.', 'Product options.'))] }),
    row('technical', { heading: tr('المواصفات الفنية', 'Technical specifications'), image: hero, image_alt: product.name, items: ['المعلومات|Information', 'المقاسات|Dimensions', 'المواد|Materials', 'التجهيز|Setup', 'العناية|Care', 'محتويات العبوة|In the box'].map(label => card(label.split('|')[ar ? 0 : 1]!, tr('أضف مواصفات منتجك.', 'Add your product specifications.'))) }),
    ...[tr('مكان لكل تفصيلة.', 'A place for every detail.'), tr('قريب من روتينك.', 'Part of your routine.'), tr('اكتشف الزاوية الأخرى.', 'Discover another angle.'), tr('اختيار يناسب يومك.', 'A choice for your everyday.')].map((heading, index) => row('editorial', { heading, text: tr('مساحة لصور منتجك ومعلوماته الفعلية. هذا محتوى توضيحي قابل للاستبدال.', 'A place for actual product photographs and information. This sample content can be replaced.'), image: index % 2 ? image : hero, image_alt: product.name })),
    row('feature-rows', { image, image_alt: product.name, items: [card(tr('مساحة لقصتك', 'A place for your story'), tr('أضف تفاصيل تهم عملاءك.', 'Add details that matter to your customers.')), card(tr('صورة أخرى', 'Another view'), tr('اعرض صورًا واضحة للمنتج.', 'Show clear product photographs.')), card(tr('المعلومات أولًا', 'Information first'), tr('راجع مواصفات المنتج قبل الطلب.', 'Review product details before ordering.'))].map(item => ({ heading: item['heading'], text: item['text'] })) }),
    row('quote', { text: tr('التفاصيل الصغيرة تصنع مكانًا مميزًا في يومنا.', 'Little details make a special place in our day.'), attribution: tr('رسالة توضيحية من المتجر', 'Sample store message'), images: [{ image: hero, image_alt: product.name }, { image, image_alt: product.name }] }),
    row('marquee', { items: [tr('لبيتك', 'For your home'), tr('ليومك', 'For your everyday'), tr('لقطتك', 'For your cat')].map(label => ({ label })) }),
    row('reviews', { heading: tr('آراء العملاء', 'What customers say') }),
    row('faq', { heading: tr('أسئلة متكررة', 'Frequently asked questions'), items: faqs }),
  ] };
}
