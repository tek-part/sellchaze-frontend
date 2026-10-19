import { funnelCatalogAsset } from './catalog-asset';
import type { ApiProduct } from '../api/types';
import type { SectionInstance } from '../theme-engine/rendering';

/** Isolated catalog content. These images and claims never seed merchant funnels. */
export function electricPreview(locale: 'ar' | 'en'): { product: ApiProduct; sections: SectionInstance[] } {
  const ar = locale === 'ar'; const tr = (a: string, e: string): string => ar ? a : e;
  const hero = funnelCatalogAsset('/media/funnel-campaigns/electric-biker-hero-v1.webp');
  const image = funnelCatalogAsset('/media/funnel-campaigns/electric-biker-product-v1.webp');
  const detail = funnelCatalogAsset('/media/funnel-campaigns/electric-biker-detail-v1.webp');
  const product: ApiProduct = { id: -4, name: tr('الدراجة الكهربائية — نموذج', 'Electric bike — demo'), slug: 'display-only-electric-biker', price: 2500, image_url: image, images: [image, detail, hero], short_description: tr('صور ومحتوى توضيحيان لمعاينة تصميم القالب، وليست مواصفات منتج معروض للبيع.', 'Sample imagery and content to preview the template design, rather than specifications for a product offered for sale.') };
  let id = 0;
  const row = (type: string, settings: Record<string, unknown>): SectionInstance => ({ id: `electric-demo-${id++}`, type: `electric-${type}`, settings });
  const card = (heading: string, text = '', photo = detail): Record<string, string> => ({ heading, text, image: photo, image_alt: tr('صورة دراجة توضيحية مولّدة لمعاينة القالب', 'Generated sample bicycle photograph for the template preview'), cta_label: tr('اكتشف التفاصيل', 'Explore the details') });
  const faqs = [
    [tr('هل هذه صفحة منتج حقيقي؟', 'Is this a real product listing?'), tr('هذه بيانات وصور توضيحية لمعاينة القالب فقط.', 'These are sample photographs and content for previewing the template only.')],
    [tr('هل يمكن تغيير الصور؟', 'Can I change the photographs?'), tr('أضف صور منتجك وحرّر كل لوحة من منشئ الصفحة.', 'Supply your own product photographs and edit each panel in the page builder.')],
    [tr('كيف أضيف المواصفات؟', 'How do I add specifications?'), tr('أضف المعلومات الفعلية في قسم التفاصيل المصورة.', 'Add actual product information to the illustrated details section.')],
    [tr('هل تتغير الأسعار؟', 'How are prices updated?'), tr('تستخدم الصفحة الحقيقية سعر المنتج وخياراته الفعلية.', 'The real page uses the selected product and its actual option prices.')],
    [tr('ما وسائل الدفع المتاحة؟', 'Which payment methods are available?'), tr('تظهر وسائل الدفع التي فعّلها المتجر في نموذج الطلب الحقيقي.', 'Methods enabled by the store appear in the real order form.')],
    [tr('هل يمكن الشراء هنا؟', 'Can I buy from this preview?'), tr('الشراء معطّل في هذه المعاينة.', 'Checkout is disabled in this preview.')],
  ].map(([question, answer]) => ({ question, answer }));
  return { product, sections: [
    row('hero', { eyebrow: tr('الدراجة الكهربائية', 'Electric bicycle'), heading: tr('اجعل كل رحلة\nلحظة خاصة.', 'Make every ride\na special pleasure.'), image: hero, image_alt: tr('دراجان على طريق ريفي — صورة توضيحية أصلية', 'Two cyclists on a country road — original sample photograph'), cta_label: tr('اكتشف الآن', 'Discover now'), announcement: tr('معاينة قالب Electric Biker', 'Electric Biker template preview') }),
    row('purchase', { heading: product.name, text: product.short_description }),
    row('technical', { heading: tr('تفاصيل من كل زاوية', 'Details from every angle'), items: ['التصميم|Design', 'التجهيز|Setup', 'القياسات|Dimensions', 'العناية|Care', 'الخيارات|Options', 'المواصفات|Specifications'].map(label => card(label.split('|')[ar ? 0 : 1]!, '', image)) }),
    row('stories', { items: [card(tr('نظرة أقرب إلى التصميم', 'A closer look at the design'), '', detail), card(tr('التفاصيل تصنع الفرق', 'The details make the difference'), '', image), card(tr('اكتشف زاوية جديدة', 'Discover another angle'), '', detail)] }),
    row('benefits', { items: [card(tr('مكان لكل تفصيلة.', 'A place for every detail.'), tr('اعرض مميزات منتجك الفعلية وصوره في هذه المساحة.', 'Present actual product details and photographs in this space.'), detail), card(tr('تصميم يستحق الاكتشاف.', 'A design to discover.'), tr('اكتب الوصف المناسب لمنتجك هنا.', 'Add the description that fits your product here.'), image), card(tr('اختياراتك أنت.', 'Your own choices.'), tr('ساعد عميلك على اكتشاف الخيارات المتاحة.', 'Help your customer discover the available options.'), detail), card(tr('في يومك كل يوم.', 'Part of your everyday.'), tr('صورة أخرى لقصة منتجك.', 'Another photograph in your product story.'), hero)] }),
    row('editorial', { items: [card(tr('اكتشف الطريق.', 'Discover the road.'), tr('صور توضيحية ومساحة قابلة للتحرير لقصة المنتج.', 'Sample photographs and an editable space for your product story.'), hero), card(tr('اختر رحلتك.', 'Choose your journey.'), tr('هذه معاينة للتصميم. أضف محتوى متجرك الحقيقي.', 'This is a design preview. Add your actual store content.'), image)] }),
    row('closing', { heading: tr('رحلتك. بطريقتك.', 'Your journey. Your way.'), text: tr('مكان لقصتك وصور منتجك.', 'A place for your story and product photographs.'), image: hero, image_alt: product.name }),
    row('marquee', { items: [tr('اكتشف التفاصيل', 'Discover the details'), tr('اختر طريقك', 'Choose your way'), tr('كل يوم قصة', 'Everyday stories')].map(label => ({ label })) }),
    row('mosaic', { heading: tr('صور تلهم رحلتك', 'Photographs for your journey'), items: [hero, image, detail, hero, image, detail].map(photo => ({ image: photo, image_alt: tr('صورة توضيحية للقالب', 'Sample template photograph') })) }),
    row('reviews', { heading: tr('ماذا يقول العملاء؟', 'What are customers saying?') }),
    row('faq', { heading: tr('أسئلة متكررة', 'Frequently asked questions'), items: faqs, image: detail, image_alt: product.name }),
  ] };
}
