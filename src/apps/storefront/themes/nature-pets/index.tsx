import type { ThemeModule } from '../../theme-engine/types';
import { CURRENT_MANIFEST_SCHEMA_VERSION } from '../../theme-engine/migration';
import { defaultSettings } from '../../theme-engine/settings';
import { baseTemplates, createSectionMap, SECTION_LIBRARY, tr } from '../../sections-lib';
import { NaturePetsLayout } from './DefaultLayout';
import { naturePetsSettings, naturePetsTokens } from './settings';
import { NatureHero, NatureCategories, NatureShelf, NatureStory, NatureFaq, NatureSocial, NatureNewsletter, NatureProduct, NatureGrid, NatureRelated, natureHeroSchema, natureCategoriesSchema, natureShelfSchema, natureStorySchema, natureFaqSchema, natureSocialSchema, natureNewsletterSchema, natureProductSchema, natureGridSchema, natureRelatedSchema } from './sections';
import '../nature-kids/theme.css';
import './theme.css';
const cat = '/media/theme-campaigns/blast-pets-cat-v1.png';
const dog = '/media/theme-campaigns/blast-pets-dog-v1.png';
const bed = '/media/theme-campaigns/blast-pets-bed-v1.png';
const defaults = defaultSettings(naturePetsSettings);
export const naturePetsTheme: ThemeModule = {
 manifest: { id: 'nature-pets', name: 'Nature Pets', version: '1.0.0', author: 'Sellchaze', description: 'A Nature-family pet storefront with a peek slideshow, category introduction, editorial product rail, split story, compact collections, split FAQ, social photography and immersive newsletter.', archetype: 'Pets', category: 'general', tags: ['pets', 'animals', 'modern', 'rtl'], schemaVersion: CURRENT_MANIFEST_SCHEMA_VERSION, minEngineVersion: '1.0.0', supports: { colorSchemes: ['light'] }, capabilities: ['rtl', 'cart-drawer', 'quick-add', 'newsletter'], settingsSchema: naturePetsSettings },
 defaultSettings: defaults, tokens: naturePetsTokens(defaults), createTokens: naturePetsTokens, layouts: { default: NaturePetsLayout },
 sections: { ...createSectionMap(), 'nature-pets-hero': NatureHero, 'nature-pets-categories': NatureCategories, 'nature-pets-shelf': NatureShelf, 'nature-pets-story': NatureStory, 'nature-pets-faq': NatureFaq, 'nature-pets-editorial': NatureSocial, 'nature-pets-newsletter': NatureNewsletter, 'product-details': NatureProduct, 'product-grid': NatureGrid, 'related-products': NatureRelated },
 sectionSchemas: [...SECTION_LIBRARY.filter(schema => !['product-details', 'product-grid', 'related-products'].includes(schema.type)), natureHeroSchema, natureCategoriesSchema, natureShelfSchema, natureStorySchema, natureFaqSchema, natureSocialSchema, natureNewsletterSchema, natureProductSchema, natureGridSchema, natureRelatedSchema],
 templates: baseTemplates({ home: [
  { id: 'hero', type: 'nature-pets-hero', settings: { slides: [{ image: cat, mobile_image: '/media/theme-campaigns/nature-pets-cat-mobile-v1.png', url: '/collections/cat-essentials', label: tr('اختيارات يومية للقطط', 'Everyday cat essentials'), show_copy: true }, { image: dog, mobile_image: '/media/theme-campaigns/nature-pets-dog-mobile-v1.png', url: '/collections/dog-essentials', label: tr('لرفيقك في كل مغامرة', 'For every adventure together'), show_copy: true }, { image: bed, mobile_image: '/media/theme-campaigns/nature-pets-bed-mobile-v1.png', url: '/collections/beds-accessories', label: tr('راحة في كل ركن', 'A little more comfort'), show_copy: true }] } },
  { id: 'categories', type: 'nature-pets-categories', settings: {} },
  { id: 'cat-products', type: 'nature-pets-shelf', settings: { title: tr('اختيارات للقطط', 'Cat essentials'), collection: 'all', category: 'cat-essentials', layout: 'editorial', limit: 8 } },
  { id: 'story', type: 'nature-pets-story', settings: { image: dog } },
  { id: 'dog-products', type: 'nature-pets-shelf', settings: { title: tr('اختيارات للكلاب', 'Dog essentials'), collection: 'all', category: 'dog-essentials', layout: 'banner', limit: 7 } },
  { id: 'questions', type: 'nature-pets-faq', settings: { image: cat, items: [
   { question: tr('كيف أختار المقاس المناسب؟', 'How do I choose the right size?'), answer: tr('راجع المقاسات والخيارات الموضحة في صفحة المنتج، وتواصل مع المتجر إذا احتجت للمساعدة.', 'Review the sizes and options on the product page. Contact the store if you need help choosing.') },
   { question: tr('أين أجد تفاصيل المنتج؟', 'Where can I find product details?'), answer: tr('تجد الوصف والصور والخيارات المتاحة في صفحة كل منتج.', 'Each product page includes its description, photographs and available options.') },
   { question: tr('كيف أعرف تكلفة التوصيل؟', 'How can I check delivery charges?'), answer: tr('تظهر خيارات التوصيل وتكلفتها قبل تأكيد طلبك.', 'Available delivery options and charges are shown before you confirm your order.') },
   { question: tr('ما وسائل الدفع المتاحة؟', 'Which payment methods are available?'), answer: tr('تظهر وسائل الدفع المتاحة لمتجرك وعنوانك أثناء إتمام الطلب.', 'Available payment methods are shown at checkout for your order and delivery address.') },
   { question: tr('كيف أتواصل مع المتجر؟', 'How do I contact the store?'), answer: tr('استخدم بيانات التواصل المعروضة أسفل صفحات المتجر.', 'Use the contact information displayed in the store footer.') },
  ] } },
  { id: 'accessories', type: 'nature-pets-shelf', settings: { title: tr('الأسرة والإكسسوارات', 'Beds & accessories'), collection: 'all', category: 'beds-accessories', layout: 'grid', limit: 8, button: tr('تسوق كل المنتجات', 'Shop all products'), url: '/collections/beds-accessories' } },
  { id: 'editorial', type: 'nature-pets-editorial', settings: { title: tr('لحظات الراحة واللعب، معًا كل يوم', 'Rest, play and everyday moments together'), photos: [{ image: dog, label: 'Facebook', url: '' }, { image: cat, label: 'Instagram', url: '' }, { image: bed, label: 'TikTok', url: '' }] } },
  { id: 'newsletter', type: 'nature-pets-newsletter', settings: { image: bed } },
 ], product: [{ id: 'product', type: 'product-details', settings: { show_buy_now: true, show_share: false, show_wishlist: false } }, { id: 'related', type: 'related-products', settings: { limit: 8 } }], category: [{ id: 'header', type: 'category-header', settings: { banner_mode: 'none', show_breadcrumbs: true } }, { id: 'products', type: 'product-grid', settings: { limit: 24 } }] }),
};
export default naturePetsTheme;
