import type { ThemeModule } from '../../theme-engine/types';
import { CURRENT_MANIFEST_SCHEMA_VERSION } from '../../theme-engine/migration';
import { defaultSettings } from '../../theme-engine/settings';
import { baseTemplates, createSectionMap, SECTION_LIBRARY, tr } from '../../sections-lib';
import { WalletLayout } from './DefaultLayout';
import { walletSettings, walletTokens } from './settings';
import { WalletCampaign, walletCampaignSchema, WalletCategories, walletCategoriesSchema, WalletShelf, walletShelfSchema, WalletCompare, walletCompareSchema, WalletLook, walletLookSchema, WalletBanner, walletBannerSchema, WalletNewsletter, walletNewsletterSchema, WalletProduct, WalletGrid, walletGridSchema, WalletRelated } from './sections';
import { hypeProductSchema, hypeRelatedSchema } from '../hype-perfumes/sections';
import '../nature-kids/theme.css';
import '../hype-perfumes/theme.css';
import './theme.css';
const defaults = defaultSettings(walletSettings);
export const walletTheme: ThemeModule = {
  manifest: { id: 'elite-wallets', name: 'Elite Wallets', version: '1.0.0', author: 'Sellchaze', description: 'Accessories storefront with centered overlay navigation, numbered campaigns, category tiles, product collections, image comparison, linked looks and immersive newsletter.', archetype: 'Accessories', category: 'general', tags: ['accessories', 'wallets', 'bags', 'modern', 'rtl'], schemaVersion: CURRENT_MANIFEST_SCHEMA_VERSION, minEngineVersion: '1.0.0', supports: { colorSchemes: ['light'] }, capabilities: ['rtl', 'cart-drawer', 'quick-add', 'newsletter'], settingsSchema: walletSettings },
  defaultSettings: defaults, tokens: walletTokens(defaults), createTokens: walletTokens, layouts: { default: WalletLayout },
  sections: { ...createSectionMap(), 'wallet-campaign': WalletCampaign, 'wallet-categories': WalletCategories, 'wallet-shelf': WalletShelf, 'wallet-comparison': WalletCompare, 'wallet-linked-look': WalletLook, 'wallet-editorial': WalletBanner, 'wallet-newsletter': WalletNewsletter, 'product-details': WalletProduct, 'product-grid': WalletGrid, 'related-products': WalletRelated },
  sectionSchemas: [...SECTION_LIBRARY.filter(schema => !['product-details', 'product-grid', 'related-products'].includes(schema.type)), walletCampaignSchema, walletCategoriesSchema, walletShelfSchema, walletCompareSchema, walletLookSchema, walletBannerSchema, walletNewsletterSchema, hypeProductSchema, walletGridSchema, hypeRelatedSchema],
  templates: baseTemplates({ home: [
    { id: 'campaign', type: 'wallet-campaign', settings: {} },
    { id: 'categories', type: 'wallet-categories', settings: {} },
    { id: 'collection-one', type: 'wallet-shelf', settings: { title: tr('اختيارات المتجر', 'Store selection'), collection: 'featured', limit: 8 } },
    { id: 'comparison', type: 'wallet-comparison', settings: {} },
    { id: 'collection-two', type: 'wallet-shelf', settings: { title: tr('اكتشف المجموعة', 'Explore the collection'), collection: 'all', layout: 'grid', limit: 8 } },
    { id: 'linked-look', type: 'wallet-linked-look', settings: {} },
    { id: 'collection-three', type: 'wallet-shelf', settings: { title: tr('وصل حديثًا', 'New arrivals'), collection: 'newest', limit: 8 } },
    { id: 'editorial', type: 'wallet-editorial', settings: {} },
    { id: 'collection-four', type: 'wallet-shelf', settings: { title: tr('الأكثر طلبًا', 'Best sellers'), collection: 'bestsellers', limit: 8 } },
    { id: 'newsletter', type: 'wallet-newsletter', settings: {} },
  ], product: [{ id: 'product', type: 'product-details', settings: { show_buy_now: true, show_wishlist: false, show_share: false } }, { id: 'related', type: 'related-products', settings: { limit: 8 } }], category: [{ id: 'header', type: 'category-header', settings: { banner_mode: 'none', show_breadcrumbs: false, show_description: false } }, { id: 'products', type: 'product-grid', settings: { limit: 20 } }] }),
};
export default walletTheme;
