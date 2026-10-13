import type { ReactElement } from 'react';
import type { ThemeModule } from '../../theme-engine/types';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { defaultSettings } from '../../theme-engine/settings';
import { createSectionMap, SECTION_LIBRARY } from '../../sections-lib';
import { defineSection } from '../../sections-lib/schema';
import { EliteHero, EliteCategories, EliteShelf, EliteImageCompare, EliteProductDetails, EliteProductGrid, EliteRelatedProducts, eliteHeroSchema, eliteCategoriesSchema, eliteShelfSchema, eliteCompareSchema, eliteProductSchema, eliteGridSchema, eliteRelatedSchema } from './sections';
import { EliteLayout, EliteNewsletter } from './DefaultLayout';
import { eliteManifest } from './manifest';
import { eliteSettings } from './settings';
import { eliteTokens } from './tokens';
import { eliteTemplates } from './templates';
import './theme.css';

const newsletterSchema = defineSection({ type: 'elite-newsletter', label: 'Email newsletter', category: 'marketing', settings: [] });
function NewsletterSection(_props: SectionRenderProps): ReactElement { return <section className="elt-newsletter-section"><EliteNewsletter /></section>; }
const defaults = defaultSettings(eliteSettings);
export const eliteTheme: ThemeModule = {
  manifest: eliteManifest, defaultSettings: defaults, tokens: eliteTokens(defaults), createTokens: eliteTokens,
  layouts: { default: EliteLayout }, templates: eliteTemplates,
  sections: { ...createSectionMap(), 'elite-hero': EliteHero, 'elite-categories': EliteCategories, 'elite-shelf': EliteShelf, 'elite-image-compare': EliteImageCompare, 'elite-newsletter': NewsletterSection, 'product-details': EliteProductDetails, 'product-grid': EliteProductGrid, 'related-products': EliteRelatedProducts },
  sectionSchemas: [...SECTION_LIBRARY.filter(schema => !['product-details', 'product-grid', 'related-products'].includes(schema.type)), eliteProductSchema, eliteGridSchema, eliteRelatedSchema, eliteHeroSchema, eliteCategoriesSchema, eliteShelfSchema, eliteCompareSchema, newsletterSchema],
};
export default eliteTheme;
