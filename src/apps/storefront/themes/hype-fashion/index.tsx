import type { ThemeModule } from '../../theme-engine/types';
import { CURRENT_MANIFEST_SCHEMA_VERSION } from '../../theme-engine/migration';
import { defaultSettings } from '../../theme-engine/settings';
import { baseTemplates, createSectionMap, SECTION_LIBRARY, tr } from '../../sections-lib';
import { FashionLayout } from './DefaultLayout';
import { fashionSettings, fashionTokens } from './settings';
import { FashionHero, fashionHeroSchema, FashionMarquee, fashionMarqueeSchema, FashionShelf, fashionShelfSchema, FashionCompare, fashionCompareSchema, FashionLook, fashionLookSchema, FashionPromotion, fashionPromotionSchema, FashionReviews, fashionReviewsSchema, FashionFeatures, fashionFeaturesSchema, FashionNewsletter, fashionNewsletterSchema, FASHION_HERO, FASHION_LOOK } from './sections';
import { HypeProduct, hypeProductSchema, HypeGrid, hypeGridSchema, HypeRelated, hypeRelatedSchema } from '../hype-perfumes/sections';
import '../nature-kids/theme.css';
import '../hype-perfumes/theme.css';
import './theme.css';

const defaults = defaultSettings(fashionSettings);
export const fashionTheme: ThemeModule = {
  manifest: { id: 'hype-fashion', name: 'Hype Fashion', version: '1.0.0', author: 'Sellchaze', description: 'Black fashion navigation, responsive editorial campaigns, collection rails, linked looks, image comparison, merchant review photos and newsletter.', archetype: 'Fashion', category: 'general', tags: ['fashion', 'clothing', 'modern', 'rtl'], schemaVersion: CURRENT_MANIFEST_SCHEMA_VERSION, minEngineVersion: '1.0.0', supports: { colorSchemes: ['light'] }, capabilities: ['rtl', 'cart-drawer', 'quick-add', 'newsletter'], settingsSchema: fashionSettings },
  defaultSettings: defaults, tokens: fashionTokens(defaults), createTokens: fashionTokens, layouts: { default: FashionLayout },
  sections: { ...createSectionMap(), 'fashion-hero': FashionHero, 'fashion-marquee': FashionMarquee, 'fashion-shelf': FashionShelf, 'fashion-comparison': FashionCompare, 'fashion-linked-look': FashionLook, 'fashion-promotion': FashionPromotion, 'fashion-review-photos': FashionReviews, 'fashion-features': FashionFeatures, 'fashion-newsletter': FashionNewsletter, 'product-details': HypeProduct, 'product-grid': HypeGrid, 'related-products': HypeRelated },
  sectionSchemas: [...SECTION_LIBRARY.filter(schema => !['product-details', 'product-grid', 'related-products'].includes(schema.type)), fashionHeroSchema, fashionMarqueeSchema, fashionShelfSchema, fashionCompareSchema, fashionLookSchema, fashionPromotionSchema, fashionReviewsSchema, fashionFeaturesSchema, fashionNewsletterSchema, hypeProductSchema, hypeGridSchema, hypeRelatedSchema],
  templates: baseTemplates({ home: [
    { id: 'campaign', type: 'fashion-hero', settings: { image: FASHION_HERO, mobile_image: FASHION_LOOK } },
    { id: 'message', type: 'fashion-marquee', settings: {} },
    { id: 'collection-preview', type: 'fashion-shelf', settings: { title: '', collection: 'featured', limit: 4 } },
    { id: 'collection-one', type: 'fashion-shelf', settings: { title: tr('اختيارات الموسم', 'Season selection'), collection: 'featured', limit: 8 } },
    { id: 'comparison', type: 'fashion-comparison', settings: {} },
    { id: 'collection-two', type: 'fashion-shelf', settings: { title: tr('وصل حديثًا', 'New arrivals'), collection: 'newest', limit: 8 } },
    { id: 'promotion', type: 'fashion-promotion', settings: {} },
    { id: 'collection-three', type: 'fashion-shelf', settings: { title: tr('إطلالات يومية', 'Everyday looks'), collection: 'bestsellers', limit: 8 } },
    { id: 'linked-look', type: 'fashion-linked-look', settings: { image: FASHION_LOOK } },
    { id: 'collection-four', type: 'fashion-shelf', settings: { title: tr('اكتشف المجموعة', 'Explore the collection'), collection: 'all', limit: 8 } },
    { id: 'review-photos', type: 'fashion-review-photos', settings: { photos: [] } },
    { id: 'service-information', type: 'fashion-features', settings: { items: [] } },
    { id: 'newsletter', type: 'fashion-newsletter', settings: {} },
  ], product: [{ id: 'product', type: 'product-details', settings: { show_buy_now: true, show_wishlist: true, show_share: false } }, { id: 'related', type: 'related-products', settings: { limit: 8 } }], category: [{ id: 'header', type: 'category-header', settings: { banner_mode: 'none', show_breadcrumbs: true } }, { id: 'products', type: 'product-grid', settings: { limit: 24 } }] }),
};
export default fashionTheme;
