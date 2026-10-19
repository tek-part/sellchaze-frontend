import { funnelCatalogAsset } from './catalog-asset';
import type { ApiProduct } from '../api/types';
import type { SectionInstance } from '../theme-engine/rendering';

/** Explicit inert catalog content, never used to initialize a merchant's funnel. */
export function writingBoardPreview(locale: 'ar' | 'en'): { product: ApiProduct; sections: SectionInstance[] } {
  const ar = locale === 'ar'; const tr = (a: string, e: string): string => ar ? a : e;
  const asset = (name: string): string => funnelCatalogAsset(`/media/funnel-campaigns/writing-board-${name}-v1.webp`);
  const image = asset('hero'); const detail = asset('detail'); const exploded = asset('exploded'); const rear = asset('rear');
  const product: ApiProduct = { id: -7, name: tr('جهاز كتابة — نموذج', 'Writing device — demo'), slug: 'display-only-writing-board', price: 250, compare_price: 500, image_url: image, images: [image, detail, exploded, rear], short_description: tr('صور وبيانات توضيحية لمعاينة التصميم فقط. ليست مواصفات منتج معروض للبيع.', 'Sample photographs and content for previewing the design only, rather than specifications for a product offered for sale.') };
  let id = 0;
  const row = (type: string, settings: Record<string, unknown>): SectionInstance => ({ id: `writingboard-demo-${id++}`, type: `writingboard-${type}`, settings });
  const phrases = [tr('مساحة لقصتك', 'A place for your story'), tr('تفاصيل واضحة', 'Thoughtful details'), tr('تصميم يمكنك تخصيصه', 'A design of your own'), tr('صورك وكلماتك', 'Your photographs and words')].map(label => ({ label }));
  const faqs = [
    [tr('هل هذا منتج معروض للبيع؟', 'Is this product offered for sale?'), tr('هذه معاينة للقالب فقط، ونموذج الشراء معطّل.', 'This is a template preview only; checkout is disabled.')],
    [tr('هل يمكن تغيير الصور؟', 'Can I change the photographs?'), tr('نعم، تستبدل صور المعاينة بصور منتجك الفعلية عند إنشاء الصفحة.', 'Yes. Your actual product photographs replace demo assets when you create a page.')],
    [tr('هل الأقسام قابلة للتحرير؟', 'Can I edit the sections?'), tr('يمكن تحرير النصوص والصور والترتيب من منشئ الصفحة.', 'Text, photographs and section order are editable in the page builder.')],
    [tr('من أين تأتي الأسعار؟', 'Where do prices come from?'), tr('تستخدم الصفحة المنشورة أسعار المنتج والخيارات الفعلية.', 'Published pages use actual product and variant prices.')],
    [tr('هل هذه تقييمات حقيقية؟', 'Are these real reviews?'), tr('تقييمات المعاينة توضيحية؛ تعرض الصفحة المنشورة تقييمات منتجك الفعلية.', 'Preview reviews are samples; published pages display actual product reviews.')],
    [tr('هل يمكن عرض الصفحة على الهاتف؟', 'Can customers use a phone?'), tr('يتكيف التصميم ونموذج الطلب مع عرض شاشة الهاتف.', 'The layout and order form adapt to phone screens.')],
  ].map(([question, answer]) => ({ question, answer }));
  return { product, sections: [
    row('hero', { heading: tr('مساحة للكتابة', 'Write your story'), image, image_alt: tr('جهاز كتابة توضيحي أصلي باللون الأحمر', 'Original unbranded red writing-device illustration'), cta_label: tr('اكتشف الآن', 'Discover now'), announcement: tr('تصميم أصلي لقصة منتجك', 'An original space for your product story'), expires_at: '' }),
    row('intro', { text: tr('كل فكرة تستحق مساحة تظهر فيها بوضوح. تمنحك هذه الصفحة تكوينًا بصريًا جريئًا، وصورًا واسعة، ونصوصًا تستطيع تحريرها لتشارك قصة منتجك الحقيقي بالطريقة التي تناسب متجرك وزبائنك. هذه بيانات وصور توضيحية لعرض التصميم فقط.', 'Every idea deserves room to come into focus. This page gives your product story a bold visual setting, expansive photography and editable words. Replace the sample content with the details that matter to your store and its customers.') }),
    row('purchase', { heading: product.name, text: product.short_description, cta_label: tr('اطلب الآن', 'Order now') }),
    row('story', { heading: tr('تفاصيل تستحق الاكتشاف', 'Details worth discovering'), text: tr('مساحة واضحة لتفاصيل منتجك الفعلية. اكتب المواصفات التي تريد مشاركتها، وأضف صورك الأصلية، واجعل كل قسم يعبر عن متجرك. هذه الصورة المركبة توضيحية لعرض التصميم، وليست مخططًا فنيًا أو مواصفات لجهاز حقيقي.', 'Give the details of your actual product room to stand out. Add your own photographs, describe the features that matter, and make each section reflect your store. This original exploded-view image illustrates the layout; it is not a technical diagram or specifications for a real device.'), image: exploded, image_alt: tr('تكوين توضيحي أصلي لأجزاء جهاز كتابة', 'Original sample exploded assembly of a writing device') }),
    row('marquee', { items: phrases }),
    row('features', { heading: tr('نظرة أقرب', 'A closer look'), text: tr('صور أصلية وتفاصيل مختلفة تمنح زبائنك فرصة أفضل للتعرف على المنتج. يمكنك تغيير كل صورة وتعديل هذا النص وإضافة ما يناسب قصتك. الصور المعروضة هنا لمعاينة التكوين فقط.', 'Original photographs and different perspectives help tell a clear product story. Replace each image and edit these words to share the details that suit your own store. These sample images demonstrate the composition only.'), items: [detail, rear, exploded, image].map(image => ({ image, image_alt: tr('تفصيل توضيحي أصلي للقالب', 'Original sample template detail') })) }),
    row('heritage', { heading: tr('فكرة تعبر عنك', 'Make it your own'), text: tr('لون جريء وصورة واسعة ومساحة للكلمات. أضف قصة منتجك الفعلية، وعدّل الصور والعناوين لتصنع صفحة تتناسب مع هوية متجرك. هذه معاينة توضيحية قابلة للتخصيص.', 'A bold color, an expansive photograph and room for your words. Add your actual product story and personalize the images and headings to create a page that reflects your store.'), image: rear, image_alt: tr('لقطة توضيحية خلفية لجهاز كتابة', 'Original sample rear product photograph') }),
    row('statement', { heading: tr('صورك وقصتك', 'Your story, in focus'), text: tr('امنح كل تفصيلة مكانها، وشارك ما يميز منتجك بكلماتك وصورك. هذه مساحة قابلة للتحرير وليست شهادة عميل أو ادعاء عن منتج حقيقي.', 'Give each detail a place and share what makes your product distinctive through your own words and photographs. This editable sample statement is not a customer endorsement or a claim about a real product.'), image: detail, image_alt: tr('تفصيل توضيحي للوحة المفاتيح والشاشة', 'Sample keyboard and display detail') }),
    row('marquee', { items: phrases }),
    row('reviews', { heading: tr('مساحة لآراء العملاء', 'A place for customer reviews'), subheading: tr('تقييمات توضيحية للقالب', 'Sample reviews for the template') }),
    row('faq', { heading: tr('الأسئلة الشائعة وإجاباتها', 'Frequently asked questions'), items: faqs }),
  ] };
}
