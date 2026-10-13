import type { ThemeModule } from '../../theme-engine/types';
import { CURRENT_MANIFEST_SCHEMA_VERSION } from '../../theme-engine/migration';
import { defaultSettings } from '../../theme-engine/settings';
import { baseTemplates, createSectionMap, SECTION_LIBRARY, tr } from '../../sections-lib';
import { PureLayout } from './DefaultLayout';
import { pureSettings, pureTokens } from './settings';
import { PureHero, PureCategories, PureMarquee, PureShelf, PureStory, PureCompare, PureNewsletterSection, PureProductDetails, PureProductGrid, PureRelated, pureHeroSchema, pureCategoriesSchema, pureMarqueeSchema, pureShelfSchema, pureStorySchema, pureCompareSchema, pureNewsletterSchema, pureProductSchema, pureGridSchema, pureRelatedSchema } from './sections';
import './theme.css';

const room = 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1920&q=85';
const sofa = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1400&q=85';
const chair = 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1400&q=85';
const defaults = defaultSettings(pureSettings);
export const pureTheme: ThemeModule = {
  manifest: { id: 'pure-furniture', name: 'Pure Furniture', version: '1.0.0', author: 'Sellchaze', description: 'A warm furniture storefront with a side logo, Jost typography, video hero, rounded category photos, scrolling messages, product grids and image comparison.', archetype: 'Furniture', category: 'general', tags: ['furniture', 'warm', 'modern', 'rtl'], schemaVersion: CURRENT_MANIFEST_SCHEMA_VERSION, minEngineVersion: '1.0.0', supports: { colorSchemes: ['light'] }, capabilities: ['rtl', 'cart-drawer', 'quick-add', 'newsletter'], settingsSchema: pureSettings },
  defaultSettings: defaults, tokens: pureTokens(defaults), createTokens: pureTokens, layouts: { default: PureLayout },
  sections: { ...createSectionMap(), 'pure-hero': PureHero, 'pure-categories': PureCategories, 'pure-marquee': PureMarquee, 'pure-shelf': PureShelf, 'pure-story': PureStory, 'pure-image-compare': PureCompare, 'pure-newsletter': PureNewsletterSection, 'product-details': PureProductDetails, 'product-grid': PureProductGrid, 'related-products': PureRelated },
  sectionSchemas: [...SECTION_LIBRARY.filter(schema => !['product-details', 'product-grid', 'related-products'].includes(schema.type)), pureProductSchema, pureGridSchema, pureRelatedSchema, pureHeroSchema, pureCategoriesSchema, pureMarqueeSchema, pureShelfSchema, pureStorySchema, pureCompareSchema, pureNewsletterSchema],
  templates: baseTemplates({ home: [
    { id: 'hero', type: 'pure-hero', settings: { image: room, mobile_image: room } },
    { id: 'categories', type: 'pure-categories', settings: { limit: 4 } },
    { id: 'welcome', type: 'pure-marquee', settings: {} },
    { id: 'featured', type: 'pure-shelf', settings: { title: tr('مقاعد وكراسي', 'Chairs and stools'), collection: 'featured', limit: 4 } },
    { id: 'story', type: 'pure-story', settings: { image: room } },
    { id: 'sofas', type: 'pure-shelf', settings: { title: tr('راحة لكل مساحة', 'Comfort for every room'), collection: 'bestsellers', limit: 8 } },
    { id: 'comparison', type: 'pure-image-compare', settings: { before_image: sofa, after_image: chair } },
    { id: 'tables', type: 'pure-shelf', settings: { title: tr('تفاصيل المنزل', 'Finishing touches'), collection: 'newest', layout: 'banner', limit: 6 } },
    { id: 'newsletter', type: 'pure-newsletter', settings: {} },
  ], product: [{ id: 'product', type: 'product-details', settings: { show_buy_now: true, show_wishlist: false, show_share: false } }, { id: 'related', type: 'related-products', settings: { limit: 4 } }], category: [{ id: 'header', type: 'category-header', settings: { banner_mode: 'none', show_breadcrumbs: false } }, { id: 'products', type: 'product-grid', settings: { limit: 24 } }] }),
};
export default pureTheme;
