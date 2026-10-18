import type { ApiProduct } from '../api/types';
import type { SectionInstance } from '../theme-engine/rendering';

/** Display-only catalog example. These IDs and values are never sent to checkout. */
export function glassesPreview(locale: 'ar' | 'en'): { product: ApiProduct; sections: SectionInstance[] } {
  const ar = locale === 'ar'; const label = (a: string, e: string): string => ar ? a : e;
  const hero = '/media/funnel-campaigns/glasses-hero-v1.png'; const image = '/media/funnel-campaigns/glasses-detail-v1.png';
  const product: ApiProduct = { id: -1, name: label('نظارات — نموذج توضيحي', 'Glasses — demo product'), slug: 'display-only-glasses', price: 170, image_url: image, images: [image, hero], short_description: label('بيانات توضيحية لمعاينة التصميم. ستستخدم صفحة متجرك بيانات منتجك الفعلية.', 'Sample content for previewing the design. Your store page uses your actual product details.'), specifications: { [label('القالب', 'Template')]: 'Glasses', [label('المحتوى', 'Content')]: label('قابل للتخصيص', 'Editable'), [label('العرض', 'Preview')]: label('بيانات توضيحية فقط', 'Sample data only') } };
  const row = (type: string, settings: Record<string, unknown>): SectionInstance => ({ id: `demo-${type}`, type: `glasses-${type}`, settings });
  const cta = label('اطلب الآن', 'Shop now');
  return { product, sections: [
    row('hero', { heading: label('أسلوبك، من زاوية جديدة.', 'Your style. A fresh perspective.'), text: label('مجموعة من التفاصيل التي تعبّر عنك. خصّص هذه المساحة بصور منتجك وقصته.', 'Make space for your own point of view. Bring your product, its details and its story into focus.'), image: hero, image_alt: label('صورة حملة أصلية للنظارات', 'Original glasses campaign photograph'), cta_label: cta, announcement: label('معاينة قالب النظارات', 'Glasses template preview') }),
    row('purchase', { heading: product.name, cta_label: cta }),
    row('details', { heading: label('التفاصيل الفنية', 'Technical details') }),
    row('story', { heading: label('مساحة لقصة منتجك.', 'A space for your product story.'), text: label('أضف وصفًا واضحًا لمنتجك، واختر الصور التي تعرض تفاصيله. كل النصوص والصور والأقسام قابلة للتحرير من لوحة متجرك.', 'Introduce your product in your own words and choose photographs that show its details. Edit the copy, imagery and sections from your store dashboard.'), image, cta_label: cta }),
    row('features', { heading: label('كل تفصيلة لها مكان.', 'Every detail has its place.'), items: [label('التصميم', 'The design'), label('التفاصيل', 'The details'), label('مجموعتك', 'Your collection')].map((heading, i) => ({ heading, text: label('استبدل هذا النص بميزة فعلية لمنتجك، وأضف الصورة المناسبة لتوضيحها.', 'Replace this sample paragraph with an actual product feature and choose a photograph to illustrate it.'), image: i % 2 ? hero : image })) }),
    row('media', { image: hero, image_alt: label('صورة حملة أصلية', 'Original campaign photograph') }),
    row('quote', { text: label('ضع منتجك في قلب القصة.', 'Put your product at the center of the story.'), attribution: label('نص توضيحي قابل للتحرير', 'Editable sample content') }),
    row('faq', { heading: label('الأسئلة الشائعة', 'Frequently asked questions'), image, items: [
      { question: label('هل يمكن تعديل هذا القالب؟', 'Can I edit this template?'), answer: label('نعم. اختر منتجًا من متجرك، ثم خصّص الأقسام والنصوص والصور قبل النشر.', 'Yes. Select one of your store products, then customize the sections, copy and images before publishing.') },
      { question: label('هل تنشئ هذه المعاينة طلب شراء؟', 'Does this preview place an order?'), answer: label('لا. هذه معاينة توضيحية فقط، ونموذج الطلب فيها معطّل.', 'No. This is a display-only preview with checkout disabled.') },
    ] }),
    row('closing', { heading: label('مجموعتك، قصتك.', 'Your collection, your story.'), cta_label: cta }),
  ] };
}
