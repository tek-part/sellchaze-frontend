import type { ThemeModule } from '../../theme-engine/types';
import { CURRENT_MANIFEST_SCHEMA_VERSION } from '../../theme-engine/migration';
import { defaultSettings } from '../../theme-engine/settings';
import { baseTemplates, createSectionMap, SECTION_LIBRARY, tr } from '../../sections-lib';
import { HypeLayout } from './DefaultLayout';
import { hypeSettings, hypeTokens } from './settings';
import { HypeHero, HypeCategories, HypeMarquee, HypeShelf, HypeCompare, HypeStory, HypeTestimonials, HypeReviewPhotos, HypeNewsletter, HypeProduct, HypeGrid, HypeRelated, hypeHeroSchema, hypeCategoriesSchema, hypeMarqueeSchema, hypeShelfSchema, hypeCompareSchema, hypeStorySchema, hypeTestimonialsSchema, hypeReviewPhotosSchema, hypeNewsletterSchema, hypeProductSchema, hypeGridSchema, hypeRelatedSchema, HYPE_HERO, HYPE_AMBER, HYPE_BOTANICAL } from './sections';
import '../nature-kids/theme.css';
import './theme.css';

const defaults = defaultSettings(hypeSettings);
export const hypeTheme: ThemeModule = {
  manifest: { id: 'hype-perfumes', name: 'Hype Perfumes', version: '1.0.0', author: 'Sellchaze', description: 'A full-width fragrance storefront with Jost and Newsreader typography, centered campaigns, category tiles, product rails, image comparison, editorial stories and merchant customer reviews.', archetype: 'Perfumes', category: 'general', tags: ['perfumes', 'beauty', 'modern', 'rtl'], schemaVersion: CURRENT_MANIFEST_SCHEMA_VERSION, minEngineVersion: '1.0.0', supports: { colorSchemes: ['light'] }, capabilities: ['rtl', 'cart-drawer', 'quick-add', 'newsletter'], settingsSchema: hypeSettings },
  defaultSettings: defaults, tokens: hypeTokens(defaults), createTokens: hypeTokens, layouts: { default: HypeLayout },
  sections: { ...createSectionMap(), 'hype-hero': HypeHero, 'hype-categories': HypeCategories, 'hype-marquee': HypeMarquee, 'hype-shelf': HypeShelf, 'hype-image-compare': HypeCompare, 'hype-story': HypeStory, 'hype-testimonials': HypeTestimonials, 'hype-review-photos': HypeReviewPhotos, 'hype-newsletter': HypeNewsletter, 'product-details': HypeProduct, 'product-grid': HypeGrid, 'related-products': HypeRelated },
  sectionSchemas: [...SECTION_LIBRARY.filter(schema => !['product-details', 'product-grid', 'related-products'].includes(schema.type)), hypeHeroSchema, hypeCategoriesSchema, hypeMarqueeSchema, hypeShelfSchema, hypeCompareSchema, hypeStorySchema, hypeTestimonialsSchema, hypeReviewPhotosSchema, hypeNewsletterSchema, hypeProductSchema, hypeGridSchema, hypeRelatedSchema],
  templates: baseTemplates({ home: [
    { id: 'hero', type: 'hype-hero', settings: { image: HYPE_HERO } },
    { id: 'categories', type: 'hype-categories', settings: { title: '', limit: 4 } },
    { id: 'message', type: 'hype-marquee', settings: {} },
    { id: 'featured', type: 'hype-shelf', settings: { title: tr('اختيارات المتجر', 'Store selection'), collection: 'featured', limit: 8 } },
    { id: 'comparison', type: 'hype-image-compare', settings: { before_image: HYPE_AMBER, after_image: HYPE_BOTANICAL } },
    { id: 'new-arrivals', type: 'hype-shelf', settings: { title: tr('وصل حديثًا', 'New arrivals'), collection: 'newest', limit: 8 } },
    { id: 'story', type: 'hype-story', settings: { image: HYPE_AMBER } },
    { id: 'all-products', type: 'hype-shelf', settings: { title: tr('اكتشف المجموعة', 'Explore the collection'), collection: 'all', layout: 'grid', limit: 10, button: tr('عرض المزيد', 'Load more'), url: '/shop' } },
    { id: 'reviews', type: 'hype-testimonials', settings: {} },
    { id: 'collection-banner', type: 'hype-shelf', settings: { title: '', layout: 'banner', collection: 'bestsellers', image: HYPE_BOTANICAL, banner_title: tr('الأكثر طلبًا', 'Best sellers'), limit: 6, url: '/collections/best-sellers' } },
    { id: 'review-photos', type: 'hype-review-photos', settings: { photos: [] } },
    { id: 'newsletter', type: 'hype-newsletter', settings: {} },
  ], product: [{ id: 'product', type: 'product-details', settings: { show_buy_now: true, show_wishlist: true, show_share: false } }, { id: 'related', type: 'related-products', settings: { limit: 8 } }], category: [{ id: 'header', type: 'category-header', settings: { banner_mode: 'none', show_breadcrumbs: false } }, { id: 'products', type: 'product-grid', settings: { limit: 24 } }] }),
};
export default hypeTheme;
