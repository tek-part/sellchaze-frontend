import { funnelCatalogAsset } from './catalog-asset';
import type { ApiProduct } from '../api/types';
import type { SectionInstance } from '../theme-engine/rendering';

/** Inert catalog content: never the initial content of an actual merchant page. */
export function habitPreview(locale: 'ar' | 'en'): { product: ApiProduct; sections: SectionInstance[] } {
  const ar = locale === 'ar'; const tr = (a: string, e: string): string => ar ? a : e;
  const asset = (name: string): string => funnelCatalogAsset(`/media/funnel-campaigns/habit-${name}-v1.webp`);
  const hero = asset('hero'); const image = asset('product'); const detail = asset('detail'); const story = asset('story');
  const product: ApiProduct = { id: -8, name: tr('عبوة بنفسجية — نموذج', 'Violet packaging — demo'), slug: 'display-only-habit', price: 250, compare_price: 500, image_url: image, images: [image, detail, story], short_description: tr('صور وبيانات توضيحية لمعاينة التصميم. العبوات المصورة ليست منتجًا معروضًا للبيع، ولا تمثل ادعاءات عن منتج حقيقي.', 'Original sample photographs and content for previewing this design. The pictured packaging is not a product offered for sale and makes no claims about a real product.') };
  let id = 0;
  const row = (type: string, settings: Record<string, unknown>): SectionInstance => ({ id: `habit-demo-${id++}`, type: `habit-${type}`, settings });
  const phrases = [tr('تصميم من أجلك', 'A design of your own'), tr('تفاصيل قابلة للتحرير', 'Editable details'), tr('صورك وكلماتك', 'Your photographs and words'), tr('مساحة لقصة المنتج', 'Room for your product story')].map(label => ({ label }));
  const figureText = tr('قيمة توضيحية لعرض التنسيق فقط؛ ليست نتيجة دراسة أو ادعاء عن منتج.', 'Illustrative figure showing the layout only, rather than a study result or product claim.');
  const faqs = [
    [tr('هل هذا منتج معروض للبيع؟', 'Is this product offered for sale?'), tr('هذه معاينة للقالب فقط، ونموذج الشراء معطّل.', 'This is a template preview only; checkout is disabled.')],
    [tr('هل يمكن تغيير الصور؟', 'Can I change the photographs?'), tr('استبدل صور المعاينة بصور منتجك الفعلية عند إنشاء الصفحة.', 'Replace preview photographs with actual product photographs when creating your page.')],
    [tr('هل يمكن تحرير المميزات؟', 'Can I edit the features?'), tr('يمكن تحرير النصوص والصور وترتيب الأقسام من منشئ الصفحة.', 'Edit text, photographs and section order in the page builder.')],
    [tr('هل هذه أرقام فعلية؟', 'Are these actual figures?'), tr('الأرقام في هذه المعاينة توضيحية فقط، ولا تنتقل إلى صفحة المنتج الفعلية.', 'Figures in this preview are illustrative only and are never copied into an actual product page.')],
    [tr('من أين تأتي التقييمات؟', 'Where do reviews come from?'), tr('تعرض الصفحة المنشورة تقييمات منتجك الفعلية؛ تقييمات هذه المعاينة موسومة كتوضيحية.', 'Published pages display actual product reviews; this preview marks its reviews as samples.')],
    [tr('كيف تعمل الأسعار والخيارات؟', 'How do prices and options work?'), tr('تستخدم الصفحة المنشورة أسعار المنتج والخيارات ونموذج الطلب الفعلي للمتجر.', 'Published pages use actual product and variant prices and the store order form.')],
  ].map(([question, answer]) => ({ question, answer }));
  const sections = [
    row('hero', { heading: tr('مساحة لقصة منتجك', 'A story of your own'), text: tr('صورك وتفاصيلك في تكوين بنفسجي واضح وقابل للتخصيص', 'Your photographs and details, in an expressive violet composition'), image: hero, image_alt: tr('صورة أصلية توضيحية لأشخاص بالغين يحملون عبوات بلا علامات تجارية', 'Original sample photograph of adults holding unbranded prop packaging'), cta_label: tr('اكتشف الآن', 'Discover now'), announcement: tr('معاينة تصميم HABIT — محتوى توضيحي', 'HABIT design preview — sample content'), expires_at: '' }),
    row('purchase', { heading: product.name, text: product.short_description, cta_label: tr('اطلب الآن', 'Order now') }),
    row('marquee', { items: phrases }),
    row('features', { image: detail, image_alt: tr('صورة أصلية توضيحية لعبوة بغطاء بنفسجي', 'Original sample of unbranded violet packaging'), items: [
      [tr('تفاصيل واضحة', 'Thoughtful details'), tr('اكتب التفاصيل التي يحتاجها زبائنك للتعرف على منتجك الحقيقي، واستبدل هذا النص بمحتوى متجرك.', 'Share the details your customers need to understand your actual product, replacing these sample words with your own.')],
      [tr('صورك الأصلية', 'Your own photographs'), tr('تستطيع تغيير الصور والعناوين من منشئ الصفحة لتناسب منتجك وهوية متجرك.', 'Change the photographs and headings in the page builder to suit your product and store identity.')],
      [tr('قصة تعبر عنك', 'Tell your story'), tr('امنح كل ميزة مساحة واضحة، وشارك المواصفات الفعلية التي تريد إظهارها لعملائك.', 'Give each feature a clear place and share the actual specifications that matter to your customers.')],
      [tr('محتوى قابل للتحرير', 'Editable content'), tr('رتّب الأقسام وعدّل الكلمات والصور لتصنع صفحة منتجك بالطريقة التي تناسبك.', 'Arrange sections and personalize the words and photographs to create a page that reflects your product.')],
    ].map(([heading, text]) => ({ heading, text })) }),
    row('marquee', { items: phrases }),
    row('numbers', { heading: tr('الأرقام في تنسيق واضح', 'Figures, clearly presented'), image: detail, image_alt: tr('صورة عبوة توضيحية', 'Sample packaging photograph'), items: ['96%', '90%', '99%', '97%'].map(value => ({ value, label: figureText })) }),
    row('marquee', { items: phrases }),
  ];
  if (ar) sections.push(
    row('story', { heading: 'صورك وقصة منتجك', text: 'مساحة لقصة منتجك الفعلية وصورك الأصلية. أضف التفاصيل التي تريد مشاركتها مع زبائنك، وغيّر الصور والعناوين من منشئ الصفحات. هذا محتوى توضيحي لعرض التصميم فقط.', items: [story, image, hero, detail].map(image => ({ image, image_alt: 'صورة أصلية توضيحية للقالب' })) }),
    row('statement', { heading: 'فكرة تعبر عن متجرك', text: 'امنح التفاصيل مكانها، وشارك قصة منتجك بكلماتك وصورك. هذا نص توضيحي قابل للتحرير، وليس شهادة عميل أو ادعاء عن منتج حقيقي.', image: detail, image_alt: 'عبوة توضيحية أصلية بغطاء بنفسجي' }),
  );
  sections.push(
    row('results', { heading: tr('تكوين يوضح التفاصيل', 'A place for the details'), subheading: tr('اجعله مناسبًا لمتجرك', 'Make it your own'), image: hero, image_alt: tr('صورة أصلية توضيحية لأشخاص وعبوات بلا علامات تجارية', 'Original sample people and unbranded packaging photograph'), items: [1, 2].map(() => ({ heading: tr('قيم توضيحية', 'Illustrative figures'), value_a: '98%', text_a: figureText, value_b: '96%', text_b: figureText })) }),
    row('reviews', { heading: tr('مساحة لآراء العملاء', 'A place for customer reviews'), subheading: tr('تقييمات توضيحية', 'Sample reviews') }),
    row('faq', { heading: '', cta_label: tr('اطلب الآن', 'Order now'), items: faqs }),
  );
  return { product, sections };
}
