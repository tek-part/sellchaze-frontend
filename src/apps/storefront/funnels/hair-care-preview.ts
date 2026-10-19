import { funnelCatalogAsset } from './catalog-asset';
import type { ApiProduct } from '../api/types';
import type { SectionInstance } from '../theme-engine/rendering';

/** Inert catalog content: never used to initialize a merchant's page. */
export function hairCarePreview(locale: 'ar' | 'en'): { product: ApiProduct; sections: SectionInstance[] } {
  const ar = locale === 'ar'; const tr = (a: string, e: string): string => ar ? a : e;
  const hero = funnelCatalogAsset('/media/funnel-campaigns/hair-care-hero-v1.webp');
  const image = funnelCatalogAsset('/media/funnel-campaigns/hair-care-product-v1.webp');
  const portrait = funnelCatalogAsset('/media/funnel-campaigns/hair-care-portrait-v1.webp');
  const product: ApiProduct = { id: -5, name: tr('شامبو العناية بالشعر — نموذج', 'Hair care shampoo — demo'), slug: 'display-only-hair-care', price: 250, image_url: image, images: [image, portrait, hero], short_description: tr('صور وبيانات توضيحية لعرض القالب فقط؛ ليست مواصفات منتج معروض للبيع.', 'Sample images and content for the template preview, rather than specifications for a product offered for sale.') };
  let id = 0;
  const row = (type: string, settings: Record<string, unknown>): SectionInstance => ({ id: `haircare-demo-${id++}`, type: `haircare-${type}`, settings });
  const phrases = [tr('قصة كل يوم', 'Everyday stories'), tr('تفاصيل تستحق الاكتشاف', 'Details to discover'), tr('مساحة لمنتجك', 'A place for your product')].map(label => ({ label }));
  const feature = (heading: string, photo: string): Record<string, string> => ({ heading, text: tr('صور توضيحية ومساحة قابلة للتحرير. أضف قصة منتجك ومعلوماته الفعلية هنا.', 'Sample photography and an editable space. Add your product story and actual information here.'), image: photo, image_alt: tr('صورة توضيحية أصلية لمعاينة القالب', 'Original sample photograph for the template preview'), cta_label: tr('اكتشف الآن', 'Discover now') });
  const faqs = [
    [tr('هل هذه صفحة منتج حقيقي؟', 'Is this a real product listing?'), tr('هذه صور وبيانات توضيحية لمعاينة التصميم فقط.', 'These are sample photographs and content for previewing the design only.')],
    [tr('هل يمكن تغيير الصور؟', 'Can I change the photographs?'), tr('يمكنك إضافة صور منتجك في كل قسم من منشئ الصفحة.', 'You can add your own product photographs to each section in the page builder.')],
    [tr('كيف أضيف المواصفات؟', 'How do I add specifications?'), tr('حرّر صفوف التفاصيل وأضف المعلومات الفعلية لمنتجك.', 'Edit the detail rows and add actual information about your product.')],
    [tr('كيف تظهر التقييمات؟', 'How are reviews shown?'), tr('تعرض الصفحة المنشورة تقييمات المنتج الفعلية. التقييمات هنا توضيحية.', 'The published page displays actual product reviews. Reviews here are sample content.')],
    [tr('ما وسائل الدفع المتاحة؟', 'Which payment methods are available?'), tr('يعرض نموذج الطلب الحقيقي وسائل الدفع التي فعّلها المتجر.', 'The real order form displays the methods enabled by the store.')],
    [tr('هل يمكن الشراء هنا؟', 'Can I buy from this preview?'), tr('الشراء معطّل في هذه المعاينة.', 'Checkout is disabled in this preview.')],
  ].map(([question, answer]) => ({ question, answer }));
  return { product, sections: [
    row('hero', { heading: tr('شعرك. قصتك. بطريقتك.', 'Your hair. Your story. Your way.'), text: tr('مساحة لصور منتجك وقصته، بتصميم أخضر وبنفسجي.', 'A place for your product photographs and story, in lime and violet.'), image: hero, image_alt: tr('صورة حملة توضيحية أصلية', 'Original sample campaign photograph'), cta_label: tr('اكتشف الآن', 'Discover now'), announcement: tr('معاينة قالب Hair Care — بيانات توضيحية', 'Hair Care template preview — sample content') }),
    row('intro', { heading: tr('تفاصيل تُلهم يومك', 'Details for your everyday'), text: tr('امنح قصة منتجك مساحة مميزة. حرّر النصوص والصور والشارات لتناسب متجرك.', 'Give your product story a distinctive space. Edit the text, photographs and badges to suit your store.'), cta_label: tr('اكتشف التفاصيل', 'Explore the details'), photos: [portrait, image, hero].map(src => ({ image: src, image_alt: '' })), badges: [tr('صورة نموذجية', 'Sample image'), tr('نص قابل للتحرير', 'Editable copy'), tr('متجرك أنت', 'Your own store'), tr('تفاصيل المنتج', 'Product details')].map(label => ({ label })) }),
    row('purchase', { heading: product.name, text: product.short_description }),
    row('details', { image: portrait, image_alt: tr('صورة توضيحية أصلية', 'Original sample photograph'), items: [tr('المكونات', 'Ingredients'), tr('تفاصيل المنتج', 'Product details'), tr('طريقة الاستخدام', 'How to use')].map(heading => ({ heading, text: tr('أضف معلومات منتجك الفعلية هنا. هذا النص لعرض التنسيق فقط.', 'Add actual product information here. This text only demonstrates the layout.') })) }),
    row('marquee', { items: phrases }),
    row('features', { items: [feature(tr('قصة تستحق الاكتشاف…', 'A story worth discovering…'), portrait), feature(tr('نظرة أقرب إلى التفاصيل…', 'A closer look at the details…'), hero), feature(tr('مساحة لكل ما يميزك…', 'Room for your own story…'), image)] }),
    row('marquee', { items: phrases }),
    row('assurances', { items: [tr('معلومات التوصيل', 'Delivery information'), tr('تواصل مع المتجر', 'Contact the store'), tr('سياسة الاسترجاع', 'Return policy'), tr('وسائل الدفع', 'Payment methods')].map(heading => ({ heading, text: tr('نص توضيحي قابل للتحرير', 'Editable sample content') })) }),
    row('marquee', { items: phrases }),
    row('reviews', { heading: tr('آراء العملاء…', 'What customers say…') }),
    row('faq', { heading: tr('الأسئلة الشائعة وإجاباتها…', 'Frequently asked questions…'), items: faqs }),
  ] };
}
