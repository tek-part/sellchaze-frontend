import type { ThemeModule } from '../../theme-engine/types';
import { CURRENT_MANIFEST_SCHEMA_VERSION } from '../../theme-engine/migration';
import { defaultSettings } from '../../theme-engine/settings';
import { baseTemplates, createSectionMap, SECTION_LIBRARY, tr } from '../../sections-lib';
import { PetsLayout } from './DefaultLayout';
import { petsSettings, petsTokens } from './settings';
import { PetsHero, PetsCategories, PetsMarquee, PetsShelf, PetsSearch, PetsOffer, PetsLook, PetsStory, PetsNewsletterBanner, PetsProduct, PetsGrid, PetsRelated, petsHeroSchema, petsCategoriesSchema, petsMarqueeSchema, petsShelfSchema, petsSearchSchema, petsOfferSchema, petsLookSchema, petsStorySchema, petsNewsletterSchema, petsProductSchema, petsGridSchema, petsRelatedSchema, PET_CAT, PET_DOG, PET_BED } from './sections';
import './theme.css';

const defaults = defaultSettings(petsSettings);
export const petsTheme: ThemeModule = {
  manifest: { id: 'blast-pets', name: 'Blast Pets', version: '1.0.0', author: 'Sellchaze', description: 'Pet storefront with a centered brand, warm orange navigation, full-image slideshow, product rails, linked collections, editorial photography and newsletter.', archetype: 'Pets', category: 'general', tags: ['pets', 'animals', 'modern', 'rtl'], schemaVersion: CURRENT_MANIFEST_SCHEMA_VERSION, minEngineVersion: '1.0.0', supports: { colorSchemes: ['light'] }, capabilities: ['rtl', 'cart-drawer', 'quick-add', 'newsletter', 'countdown'], settingsSchema: petsSettings },
  defaultSettings: defaults, tokens: petsTokens(defaults), createTokens: petsTokens, layouts: { default: PetsLayout },
  sections: { ...createSectionMap(), 'pets-slideshow': PetsHero, 'pets-categories': PetsCategories, 'pets-marquee': PetsMarquee, 'pets-shelf': PetsShelf, 'pets-search-banner': PetsSearch, 'pets-timed-offer': PetsOffer, 'pets-linked-look': PetsLook, 'pets-editorial': PetsStory, 'pets-newsletter': PetsNewsletterBanner, 'product-details': PetsProduct, 'product-grid': PetsGrid, 'related-products': PetsRelated },
  sectionSchemas: [...SECTION_LIBRARY.filter(schema => !['product-details', 'product-grid', 'related-products'].includes(schema.type)), petsProductSchema, petsGridSchema, petsRelatedSchema, petsHeroSchema, petsCategoriesSchema, petsMarqueeSchema, petsShelfSchema, petsSearchSchema, petsOfferSchema, petsLookSchema, petsStorySchema, petsNewsletterSchema],
  templates: baseTemplates({ home: [
    { id: 'category-intro', type: 'pets-categories', settings: { layout: 'inline', limit: 3 } },
    { id: 'campaigns', type: 'pets-slideshow', settings: { slides: [
      { image: PET_CAT, title: tr('عالم القطط', 'Cat essentials'), text: tr('صُنع بحب لرفيقك الأليف', 'Made for your companion'), button: tr('تسوق الآن', 'Shop now'), url: '/collections/cat-essentials' },
      { image: PET_DOG, title: tr('عالم الكلاب', 'Dog essentials'), text: tr('كل ما يحتاجه في مكان واحد', 'Their everyday favorites in one place'), button: tr('تسوق الآن', 'Shop now'), url: '/collections/dog-essentials' },
      { image: PET_BED, title: tr('الأسرة والإكسسوارات', 'Beds & accessories'), text: tr('تفاصيل للراحة واللعب', 'Comfort, rest and play'), button: tr('تسوق الآن', 'Shop now'), url: '/collections/beds-accessories' },
    ] } },
    { id: 'marquee', type: 'pets-marquee', settings: {} },
    { id: 'cat-shelf', type: 'pets-shelf', settings: { title: tr('اختيارات القطط', 'Cat favorites'), collection: 'all', category: 'cat-essentials', url: '/collections/cat-essentials', layout: 'rail', limit: 8 } },
    { id: 'search', type: 'pets-search-banner', settings: {} },
    { id: 'dog-shelf', type: 'pets-shelf', settings: { title: tr('اختيارات الكلاب', 'Dog favorites'), collection: 'all', category: 'dog-essentials', url: '/collections/dog-essentials', layout: 'banner', limit: 6 } },
    { id: 'timed-offer', type: 'pets-timed-offer', settings: {} },
    { id: 'look', type: 'pets-linked-look', settings: {} },
    { id: 'story', type: 'pets-editorial', settings: {} },
    { id: 'accessories', type: 'pets-shelf', settings: { title: tr('الأسرة والإكسسوارات', 'Beds & accessories'), collection: 'all', category: 'beds-accessories', url: '/collections/beds-accessories', layout: 'grid', limit: 8 } },
    { id: 'animal-types', type: 'pets-categories', settings: { title: tr('تسوق حسب رفيقك الأليف', 'Shop by animal type'), text: tr('اختر ما يناسب صديقك المفضل.', 'Discover their everyday favorites.'), layout: 'cards', limit: 2 } },
    { id: 'newsletter', type: 'pets-newsletter', settings: {} },
  ], product: [{ id: 'product', type: 'product-details', settings: { show_buy_now: true, show_share: true, show_wishlist: false } }, { id: 'related', type: 'related-products', settings: { title: tr('منتجات قد تعجبك', 'Products you may like'), limit: 4 } }], category: [{ id: 'products', type: 'product-grid', settings: { source: 'all', limit: 24 } }] }),
};
export default petsTheme;
