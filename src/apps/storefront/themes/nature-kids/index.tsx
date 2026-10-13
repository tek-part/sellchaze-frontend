import type { ThemeModule } from '../../theme-engine/types';
import { CURRENT_MANIFEST_SCHEMA_VERSION } from '../../theme-engine/migration';
import { defaultSettings } from '../../theme-engine/settings';
import { baseTemplates, createSectionMap, SECTION_LIBRARY, tr } from '../../sections-lib';
import { KidsLayout } from './DefaultLayout';
import { kidsSettings, kidsTokens } from './settings';
import { KidsHero, KidsCategories, KidsShelf, KidsStory, KidsLook, KidsPromotions, KidsSocial, KidsNewsletterBanner, KidsProduct, KidsGrid, KidsRelated, kidsHeroSchema, kidsCategoriesSchema, kidsShelfSchema, kidsStorySchema, kidsLookSchema, kidsPromotionsSchema, kidsSocialSchema, kidsNewsletterSchema, kidsProductSchema, kidsGridSchema, kidsRelatedSchema } from './sections';
import './theme.css';

const clothes = '/media/theme-campaigns/nature-kids-pink-desktop-v1.png';
const wardrobe = '/media/theme-campaigns/nature-kids-green-desktop-v1.png';
const shirts = wardrobe;
const defaults = defaultSettings(kidsSettings);
export const kidsTheme: ThemeModule = {
  manifest: { id: 'nature-kids', name: 'Nature Kids', version: '1.0.0', author: 'Sellchaze', description: 'A playful storefront with a blue header, peek slideshow, category introduction, colorful stories, clothing rails, toy shelves, linked looks and newsletter photography.', archetype: 'Kids & Lifestyle', category: 'general', tags: ['kids', 'clothing', 'toys', 'modern', 'rtl'], schemaVersion: CURRENT_MANIFEST_SCHEMA_VERSION, minEngineVersion: '1.0.0', supports: { colorSchemes: ['light'] }, capabilities: ['rtl', 'cart-drawer', 'newsletter'], settingsSchema: kidsSettings },
  defaultSettings: defaults, tokens: kidsTokens(defaults), createTokens: kidsTokens, layouts: { default: KidsLayout },
  sections: { ...createSectionMap(), 'kids-peek-hero': KidsHero, 'kids-category-intro': KidsCategories, 'kids-product-shelf': KidsShelf, 'kids-story': KidsStory, 'kids-shop-look': KidsLook, 'kids-promotions': KidsPromotions, 'kids-social-photos': KidsSocial, 'kids-newsletter-banner': KidsNewsletterBanner, 'product-details': KidsProduct, 'product-grid': KidsGrid, 'related-products': KidsRelated },
  sectionSchemas: [...SECTION_LIBRARY.filter(schema => !['product-details', 'product-grid', 'related-products'].includes(schema.type)), kidsProductSchema, kidsGridSchema, kidsRelatedSchema, kidsHeroSchema, kidsCategoriesSchema, kidsShelfSchema, kidsStorySchema, kidsLookSchema, kidsPromotionsSchema, kidsSocialSchema, kidsNewsletterSchema],
  templates: baseTemplates({ home: [
    { id: 'hero', type: 'kids-peek-hero', settings: { slides: [{ image: shirts, mobile_image: '/media/theme-campaigns/nature-kids-green-mobile-v1.png', url: '/shop', label: tr('اختيارات للأيام المميزة', 'Made for happy days'), show_copy: true }, { image: clothes, mobile_image: '/media/theme-campaigns/nature-kids-pink-mobile-v1.png', url: '/collections/new-arrivals', label: tr('إطلالات جديدة', 'New everyday favorites'), show_copy: true }] } },
    { id: 'categories', type: 'kids-category-intro', settings: {} },
    { id: 'first-story', type: 'kids-story', settings: { image: wardrobe, background: '#F48A9D' } },
    { id: 'clothing', type: 'kids-product-shelf', settings: { title: tr('ملابس لكل يوم', 'Everyday clothing'), collection: 'featured', limit: 8 } },
    { id: 'look', type: 'kids-shop-look', settings: { image: clothes, collection: 'featured' } },
    { id: 'toys', type: 'kids-product-shelf', settings: { title: tr('وقت اللعب', 'Playtime favorites'), collection: 'bestsellers', layout: 'banner', limit: 7 } },
    { id: 'second-story', type: 'kids-story', settings: { title: tr('إطلالات مريحة ومميزة', 'Comfortable looks to love'), image: shirts, background: '#9BAD83', reverse: true } },
    { id: 'new-clothing', type: 'kids-product-shelf', settings: { title: tr('اختيارات جديدة', 'New favorites'), collection: 'newest', limit: 8 } },
    { id: 'weekly', type: 'kids-promotions', settings: { items: [{ image: wardrobe, title: tr('راحة لكل مغامرة', 'Playful and comfy'), text: tr('اكتشف مجموعات المتجر', 'Explore our collections'), url: '/shop' }, { image: shirts, title: tr('قطع تحبها', 'Everyday favorites'), text: tr('اختيارات للأيام المميزة', 'Thoughtful choices for happy days'), url: '/collections/new-arrivals' }, { image: clothes, title: tr('وصل حديثًا', 'Just arrived'), text: tr('أحدث اختيارات المتجر', 'The latest store arrivals'), url: '/shop' }] } },
    { id: 'toy-grid', type: 'kids-product-shelf', settings: { title: tr('تشكيلة المتجر', 'Shop the collection'), collection: 'sale', layout: 'grid', limit: 8, button: tr('تسوق كل المنتجات', 'Shop all products'), url: '/shop' } },
    { id: 'social', type: 'kids-social-photos', settings: { photos: [{ image: clothes, label: 'Instagram', url: '' }, { image: wardrobe, label: 'Facebook', url: '' }, { image: shirts, label: 'TikTok', url: '' }] } },
    { id: 'newsletter', type: 'kids-newsletter-banner', settings: { image: wardrobe } },
  ], product: [{ id: 'product', type: 'product-details', settings: { show_buy_now: true, show_share: false, show_wishlist: false } }, { id: 'related', type: 'related-products', settings: { limit: 8 } }], category: [{ id: 'header', type: 'category-header', settings: { banner_mode: 'none', show_breadcrumbs: true } }, { id: 'products', type: 'product-grid', settings: { limit: 24 } }] }),
};
export default kidsTheme;
