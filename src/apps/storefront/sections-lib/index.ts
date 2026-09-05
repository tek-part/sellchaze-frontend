/**
 * Shared section library — public surface.
 *
 *   import { createSectionMap, SECTION_LIBRARY, baseTemplates } from '../../sections-lib';
 *
 * A theme registers `sections: createSectionMap({ 'hero-slider': MyHero })` (overrides optional),
 * `templates: baseTemplates({ home: [...] })` and `sectionSchemas: SECTION_LIBRARY` — the manifest
 * export turns those schemas into the backend `sections_schema` (contract §2).
 */
import type { SectionComponent, SectionMap } from '../theme-engine/rendering';
import type { ThemeSettings } from '../theme-engine/types';
import type { SectionSchema } from './schema';
import { sectionDefaults } from './schema';
import './styles.css';

import { AnnouncementStrip, announcementStripSchema } from './components/AnnouncementStrip';
import { BannerGrid, bannerGridSchema } from './components/BannerGrid';
import { BlogPosts, blogPostsSchema } from './components/BlogPosts';
import { BrandLogos, brandLogosSchema } from './components/BrandLogos';
import { CategoryCircles, categoryCirclesSchema } from './components/CategoryCircles';
import { CategoryGrid, categoryGridSchema } from './components/CategoryGrid';
import { CategoryHeader, categoryHeaderSchema } from './components/CategoryHeader';
import { CustomHtml, customHtmlSchema } from './components/CustomHtml';
import { Faq, faqSchema } from './components/Faq';
import { FeaturedProducts, featuredProductsSchema } from './components/FeaturedProducts';
import { Features, featuresSchema } from './components/Features';
import { FlashDeals, flashDealsSchema } from './components/FlashDeals';
import { HeroBanner, heroBannerSchema } from './components/HeroBanner';
import { HeroSlider, heroSliderSchema } from './components/HeroSlider';
import { ImageWithText, imageWithTextSchema } from './components/ImageWithText';
import { Instagram, instagramSchema } from './components/Instagram';
import { Newsletter, newsletterSchema } from './components/Newsletter';
import { ProductDetails, productDetailsSchema } from './components/ProductDetails';
import { ProductGrid, productGridSchema } from './components/ProductGrid';
import { ProductTabs, productTabsSchema } from './components/ProductTabs';
import { RecentlyViewed, recentlyViewedSchema } from './components/RecentlyViewed';
import { RelatedProducts, relatedProductsSchema } from './components/RelatedProducts';
import { RichText, richTextSchema } from './components/RichText';
import { Spacer, spacerSchema } from './components/Spacer';
import { Testimonials, testimonialsSchema } from './components/Testimonials';
import { Video, videoSchema } from './components/Video';

export interface LibrarySection {
  readonly schema: SectionSchema;
  readonly component: SectionComponent;
}

/** Every library section, in editor display order (schema + component). */
export const LIBRARY_SECTIONS: ReadonlyArray<LibrarySection> = [
  { schema: heroSliderSchema, component: HeroSlider },
  { schema: heroBannerSchema, component: HeroBanner },
  { schema: announcementStripSchema, component: AnnouncementStrip },
  { schema: categoryCirclesSchema, component: CategoryCircles },
  { schema: categoryGridSchema, component: CategoryGrid },
  { schema: featuredProductsSchema, component: FeaturedProducts },
  { schema: productTabsSchema, component: ProductTabs },
  { schema: flashDealsSchema, component: FlashDeals },
  { schema: bannerGridSchema, component: BannerGrid },
  { schema: imageWithTextSchema, component: ImageWithText },
  { schema: videoSchema, component: Video },
  { schema: richTextSchema, component: RichText },
  { schema: featuresSchema, component: Features },
  { schema: testimonialsSchema, component: Testimonials },
  { schema: brandLogosSchema, component: BrandLogos },
  { schema: newsletterSchema, component: Newsletter },
  { schema: faqSchema, component: Faq },
  { schema: blogPostsSchema, component: BlogPosts },
  { schema: instagramSchema, component: Instagram },
  { schema: customHtmlSchema, component: CustomHtml },
  { schema: spacerSchema, component: Spacer },
  { schema: categoryHeaderSchema, component: CategoryHeader },
  { schema: productGridSchema, component: ProductGrid },
  { schema: productDetailsSchema, component: ProductDetails },
  { schema: relatedProductsSchema, component: RelatedProducts },
  { schema: recentlyViewedSchema, component: RecentlyViewed },
];

/** The editor-facing schemas (contract §1), in display order. */
export const SECTION_LIBRARY: ReadonlyArray<SectionSchema> = LIBRARY_SECTIONS.map((s) => s.schema);

const BY_TYPE: ReadonlyMap<string, LibrarySection> = new Map(LIBRARY_SECTIONS.map((s) => [s.schema.type, s]));

/**
 * Build a theme's `SectionMap` from the library, optionally overriding/adding types with the
 * theme's own components. Overrides keep the library schema for that type unless the theme also
 * ships its own schema via `sectionSchemas`.
 */
export function createSectionMap(overrides: SectionMap = {}): SectionMap {
  const map: Record<string, SectionComponent> = {};
  for (const entry of LIBRARY_SECTIONS) map[entry.schema.type] = entry.component;
  for (const [type, component] of Object.entries(overrides)) map[type] = component;
  return Object.freeze(map);
}

/** Schema for a library section type, or undefined. */
export function sectionSchemaFor(type: string): SectionSchema | undefined {
  return BY_TYPE.get(type)?.schema;
}

/** Fully-defaulted settings for a library section type (empty object for unknown types). */
export function libraryDefaultsFor(type: string, locale?: string): ThemeSettings {
  const schema = sectionSchemaFor(type);
  return schema ? sectionDefaults(schema, locale) : Object.freeze({});
}

/** Library schemas with theme-specific replacements/additions merged by `type`. */
export function mergeSectionSchemas(overrides: ReadonlyArray<SectionSchema> = []): ReadonlyArray<SectionSchema> {
  const out = new Map<string, SectionSchema>(SECTION_LIBRARY.map((s) => [s.type, s]));
  for (const s of overrides) out.set(s.type, s);
  return Array.from(out.values());
}

export { baseTemplates, type BaseTemplateOptions } from './templates';
export * from './schema';
export { useSectionSettings, str, bool, num, list, gridStyle, spacingStyle, bandClass, aspectClass } from './use-section';
export { useSectionData, type SectionData } from './data';
export { useLibT, useLocaleCode, libText } from './i18n';
export {
  LibSection, LibGrid, LibCarousel, LibImage, LibButton, LibPrice, LibRating, LibProductCard, LibProductSkeleton,
  LibCategoryCard, LibEmpty, useLibId,
} from './primitives';
export { RichHtml, sanitizeHtml } from './components/RichText';
export { LibIcon } from './components/Features';
