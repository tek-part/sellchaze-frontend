/**
 * Stride — theme module for sneaker, sportswear and fitness stores. Standard sections come from the
 * shared library; the product sections are overridden to use the Stride card (colour dots, new /
 * low-stock badges) and six signature sections are added: kinetic hero, drop countdown, size guide,
 * shop-by-sport tiles, new-drops rail and kit builder. Chrome and skin (`st-*`) are the theme's own.
 */
import { defaultSettings } from '../../theme-engine/settings';
import type { DesignTokens, ThemeModule, ThemeSettings } from '../../theme-engine/types';
import { createSectionMap, mergeSectionSchemas } from '../../sections-lib';
import { strideManifest } from './manifest';
import { strideSettingsSchema } from './settings';
import { ARABIC_STACK, strideBaseTokens } from './tokens';
import { stridePalettes } from './palette';
import { strideTemplates } from './templates';
import { strideLayouts } from './layouts';
import { StFeaturedProducts, StFlashDeals, StProductGrid, StProductTabs, StRelatedProducts } from './sections/ProductSections';
import { StrideHero, strideHeroSchema } from './sections/Hero';
import { StrideDropCountdown, strideDropSchema } from './sections/DropCountdown';
import { StrideSizeGuide, strideSizeGuideSchema } from './sections/SizeGuide';
import { StrideSportTiles, strideSportTilesSchema } from './sections/SportTiles';
import { StrideNewDrops, strideNewDropsSchema } from './sections/NewDrops';
import { StrideKitBuilder, strideKitSchema } from './sections/KitBuilder';
import './theme.css';
import './sections.css';
import './shared.css';

const RADIUS: Record<string, DesignTokens['radius']> = {
  sharp: strideBaseTokens.radius,
  soft: { sm: '4px', base: '8px', lg: '14px', pill: '999px' },
};

const FAMILIES = new Set(['Rubik', 'Inter', 'IBM Plex Sans Arabic']);

function fontStack(family: unknown, fallback: string): string {
  if (family === 'system') return `system-ui,-apple-system,'Segoe UI',${ARABIC_STACK}`;
  if (typeof family !== 'string' || !FAMILIES.has(family)) return fallback;
  return `'${family}',${ARABIC_STACK}`;
}

/** Fold validated settings into concrete tokens (pure). */
export function createStrideTokens(settings: ThemeSettings): DesignTokens {
  const containerWidth = typeof settings['container_width'] === 'number' ? settings['container_width'] : 1440;
  const corners = typeof settings['corners'] === 'string' ? settings['corners'] : 'sharp';
  const palettes = stridePalettes(settings);
  return {
    ...strideBaseTokens,
    color: palettes,
    typography: {
      ...strideBaseTokens.typography,
      fontSans: fontStack(settings['body_font'], strideBaseTokens.typography.fontSans),
      fontSerif: fontStack(settings['heading_font'], strideBaseTokens.typography.fontSerif),
    },
    spacing: { ...strideBaseTokens.spacing, container: `${containerWidth}px` },
    radius: RADIUS[corners] ?? strideBaseTokens.radius,
    // The focus ring uses the accent *ink* (AA on the ground), never the raw fill: volt on the light
    // ground would be invisible.
    shadow: { ...strideBaseTokens.shadow, focus: '0 0 0 2px var(--bg), 0 0 0 4px var(--accent-ink)' },
  };
}

const baseline: ThemeSettings = defaultSettings(strideSettingsSchema);

export const STRIDE_SECTION_SCHEMAS = [strideHeroSchema, strideDropSchema, strideSizeGuideSchema, strideSportTilesSchema, strideNewDropsSchema, strideKitSchema] as const;

export const strideTheme: ThemeModule = {
  manifest: strideManifest,
  defaultSettings: baseline,
  tokens: createStrideTokens(baseline),
  createTokens: createStrideTokens,
  sections: createSectionMap({
    'featured-products': StFeaturedProducts,
    'product-tabs': StProductTabs,
    'flash-deals': StFlashDeals,
    'product-grid': StProductGrid,
    'related-products': StRelatedProducts,
    'stride-hero': StrideHero,
    'stride-drop-countdown': StrideDropCountdown,
    'stride-size-guide': StrideSizeGuide,
    'stride-sport-tiles': StrideSportTiles,
    'stride-new-drops': StrideNewDrops,
    'stride-kit-builder': StrideKitBuilder,
  }),
  sectionSchemas: mergeSectionSchemas(STRIDE_SECTION_SCHEMAS),
  layouts: strideLayouts,
  templates: strideTemplates,
};

export default strideTheme;
