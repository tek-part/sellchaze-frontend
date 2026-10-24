/**
 * Glow — theme module. Built on the shared section library: the product sections are overridden
 * with the Glow card (size/volume + quick add), and six signature sections are added — hero,
 * shop-by-concern, ingredient spotlight, routine builder, results band and trust strip. Chrome and
 * skin are the theme's own (`gl-*`); `createGlowTokens` folds palette, colours, fonts, radius and
 * width into the token set.
 */
import { defaultSettings } from '../../theme-engine/settings';
import type { ThemeModule, ThemeSettings } from '../../theme-engine/types';
import { createSectionMap, mergeSectionSchemas } from '../../sections-lib';
import { glowManifest } from './manifest';
import { glowSettingsSchema } from './settings';
import { createGlowTokens } from './create-tokens';
import { glowTemplates } from './templates';
import { glowLayouts } from './layouts';
import { GlFeaturedProducts, GlProductGrid, GlRelatedProducts } from './sections/ProductRails';
import { GlowHero, glowHeroSchema } from './sections/Hero';
import { GlowConcerns, glowConcernsSchema } from './sections/Concerns';
import { GlowIngredient, glowIngredientSchema } from './sections/Ingredient';
import { GlowRoutine, glowRoutineSchema } from './sections/Routine';
import { GlowResults, glowResultsSchema } from './sections/Results';
import { GlowTrust, glowTrustSchema } from './sections/Trust';
import './theme.css';
import './sections.css';
import './shared.css';

export const GLOW_SECTION_SCHEMAS = [glowHeroSchema, glowConcernsSchema, glowIngredientSchema, glowRoutineSchema, glowResultsSchema, glowTrustSchema] as const;

const baseline: ThemeSettings = defaultSettings(glowSettingsSchema);

export const glowTheme: ThemeModule = {
  manifest: glowManifest,
  defaultSettings: baseline,
  tokens: createGlowTokens(baseline),
  createTokens: createGlowTokens,
  sections: createSectionMap({
    'featured-products': GlFeaturedProducts,
    'product-grid': GlProductGrid,
    'related-products': GlRelatedProducts,
    'glow-hero': GlowHero,
    'glow-concerns': GlowConcerns,
    'glow-ingredient': GlowIngredient,
    'glow-routine': GlowRoutine,
    'glow-results': GlowResults,
    'glow-trust': GlowTrust,
  }),
  sectionSchemas: mergeSectionSchemas(GLOW_SECTION_SCHEMAS),
  layouts: glowLayouts,
  templates: glowTemplates,
};

export default glowTheme;
