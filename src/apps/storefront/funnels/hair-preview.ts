import { funnelCatalogAsset } from './catalog-asset';
import type { ApiProduct } from '../api/types';
import type { SectionInstance } from '../theme-engine/rendering';

/** Display-only composition; none of these synthetic values can reach checkout. */
export function hairPreview(locale: 'ar' | 'en'): { product: ApiProduct; sections: SectionInstance[] } {
  const ar = locale === 'ar'; const tr = (a: string, e: string): string => ar ? a : e;
  const hero = funnelCatalogAsset('/media/funnel-campaigns/hair-revive-hero-v1.png'); const image = funnelCatalogAsset('/media/funnel-campaigns/hair-revive-detail-v1.png');
  const product: ApiProduct = { id: -2, name: tr('مجموعة العناية اليومية — نموذج', 'Everyday care collection — demo'), slug: 'display-only-hair-care', price: 150, image_url: image, images: [image, hero], short_description: tr('صورة منتج ومحتوى توضيحيان لمعاينة القالب.', 'Sample product imagery and content for previewing the composition.') };
  let id = 0;
  const row = (type: string, settings: Record<string, unknown>): SectionInstance => ({ id: `hair-demo-${id++}`, type: `hair-${type}`, settings });
  const statement = (heading: string, text: string): SectionInstance => row('statement', { heading, text });
  const cta = tr('اطلب الآن', 'Order now');
  return { product, sections: [
    row('hero', { heading: tr('روتين يومي،\nبطريقتك أنت.', 'Everyday care.\nYour own routine.'), image: hero, image_alt: tr('صورة حملة أصلية للعناية اليومية', 'Original everyday grooming campaign photograph'), announcement: tr('معاينة مجموعة العناية اليومية', 'Everyday care collection preview'), cta_label: cta, badge_value: '01', badge_heading: tr('خطوة صغيرة في يومك', 'A little part of your day'), badge_text: tr('مجموعة العناية اليومية', 'Your everyday care collection') }),
    row('purchase', { heading: product.name, cta_label: cta, highlights: [tr('التصميم', 'The design'), tr('التفاصيل', 'The details'), tr('اختياراتك', 'Your options')].map(label => ({ label })) }),
    statement(tr('تعرف على التفاصيل.', 'Get to know the details.'), tr('اكتشف مجموعة مصوّرة تمنح تفاصيل المنتج المساحة التي تستحقها.', 'Explore a photographic collection that gives every product detail room to be seen.')),
    row('factors', { items: [tr('المنتج', 'The product'), tr('التفاصيل', 'The details'), tr('اختياراتك', 'Your options'), tr('روتينك', 'Your routine'), tr('نظرة أقرب', 'A closer look')].map((heading, i) => ({ heading, text: tr('تأمل تفاصيل المجموعة من زوايا مختلفة، واختر ما يناسب يومك.', 'Explore the collection from different angles and choose what fits your day.'), image: i % 2 ? hero : image, image_alt: tr('صورة أصلية للمجموعة', 'Original collection photograph') })) }),
    statement(tr('كل التفاصيل في مكان واحد.', 'All the details, in one place.'), tr('أفكار بسيطة، وصور واضحة، ومساحة لقصتك.', 'Simple ideas, clear photographs and room for your own story.')),
    row('video', { heading: tr('نظرة أقرب على المجموعة', 'A closer look at the collection'), image, image_alt: tr('صورة أصلية للمجموعة', 'Original collection photograph') }),
    statement(tr('اختر ما يناسب يومك.\nواصنع روتينك الخاص.', 'Choose what fits your day.\nMake the routine your own.'), tr('استكشف الصور والتفاصيل والاختيارات في هذه المجموعة التوضيحية.', 'Explore the photographs, details and options in this sample collection.')),
    row('comparisons', { heading: tr('الصور والتفاصيل', 'Photographs & details'), items: [tr('من كل زاوية', 'From every angle'), tr('مساحة للتفاصيل', 'Room for the details')].map((heading, i) => ({ heading, text: tr('صور توضيحية أصلية تستكشف المجموعة وتفاصيلها.', 'Original sample photographs explore the collection and its details.'), before_image: i ? hero : image, after_image: i ? image : hero, before_label: tr('المجموعة', 'The collection'), after_label: tr('التفاصيل', 'The details') })) }),
    statement(tr('تفاصيل صغيرة. اختياراتك أنت.', 'Small details. Your own choices.'), tr('روتين يومي يبدأ بالتعرّف على ما تختاره.', 'An everyday routine begins with getting to know what you choose.')),
    row('statistics', { image: hero, image_alt: tr('صورة حملة أصلية', 'Original campaign photograph'), items: [tr('عناية', 'Care'), tr('روتين', 'Routine'), tr('تفاصيل', 'Details'), tr('اختياراتك', 'You')].map((label, i) => ({ value: String(i + 1).padStart(2, '0'), label })) }),
    statement(tr('رسالة من المجموعة.', 'A note from the collection.'), tr('تفاصيل ترافق يومك، وقصة تعبّر عنك.', 'Details for your everyday life, with a story of your own.')),
    row('quote', { text: tr('روتينك اليومي يبدأ بالتفاصيل الصغيرة التي تختارها.', 'Everyday routines begin with the little details you choose.'), attribution: tr('من المجموعة', 'A collection note') }),
    row('marquee', { items: [tr('تفاصيل يومية', 'Everyday details'), tr('اختياراتك أنت', 'Your own choices'), tr('نظرة أقرب', 'A closer look'), tr('مجموعة العناية', 'The care collection')].map(label => ({ label })) }),
    row('reviews', { heading: tr('آراء العملاء', 'What customers say') }),
    row('faq', { heading: tr('أسئلة متكررة', 'Frequently asked questions'), items: [
      { question: tr('هل هذه معاينة للقالب؟', 'Is this a template preview?'), answer: tr('نعم. هذه صفحة توضيحية، ونموذج الشراء فيها معطّل.', 'Yes. This is a display-only page with checkout disabled.') },
      { question: tr('هل أستطيع تغيير الصور؟', 'Can I change the photographs?'), answer: tr('يمكن تخصيص الصور والنصوص من محرر القالب.', 'Photographs and copy can be customized in the template editor.') },
      { question: tr('كيف أختار خيارات المنتج؟', 'How do I choose product options?'), answer: tr('تظهر خيارات منتجك في نموذج الطلب عند استخدام القالب في متجرك.', 'Your product options appear in the order form when using the template in your store.') },
      { question: tr('أين تظهر تكلفة التوصيل؟', 'Where are delivery charges shown?'), answer: tr('يعرض نموذج متجرك الفعلي تكلفة التوصيل المتاحة للعنوان.', 'Your actual store checkout shows available delivery charges for the address.') },
      { question: tr('هل يمكن تعديل ترتيب الأقسام؟', 'Can I change the section order?'), answer: tr('يمكن ترتيب الأقسام وإظهارها وإخفاؤها من المحرر.', 'Sections can be reordered, shown or hidden in the editor.') },
      { question: tr('هل يمكن الطلب من هذه الصفحة؟', 'Can I place an order on this page?'), answer: tr('لا، هذه معاينة توضيحية فقط.', 'No. This page is a display-only preview.') },
    ] }),
  ] };
}
