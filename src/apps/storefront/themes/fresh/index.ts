/**
 * Fresh (فريش) — theme module. Sections come from the shared library (`createSectionMap()`), with
 * the three product-listing sections overridden so cards carry Fresh's big quick-add button and
 * quantity stepper. Chrome + skin are the theme's own (`fr-*`), and `createTokens` folds the
 * merchant's colours, fonts, radius and container width into the token set.
 */
import { defaultSettings } from '../../theme-engine/settings';
import type { DesignTokens, ThemeModule, ThemeSettings } from '../../theme-engine/types';
import { createSectionMap, SECTION_LIBRARY } from '../../sections-lib';
import { freshManifest } from './manifest';
import { freshSettingsSchema } from './settings';
import { ARABIC_STACK, freshBaseTokens } from './tokens';
import { freshTemplates } from './templates';
import { freshLayouts } from './layouts';
import { FreshFeaturedProducts } from './sections/FeaturedProducts';
import { FreshFlashDeals } from './sections/FlashDeals';
import { FreshProductTabs } from './sections/ProductTabs';
import './theme.css';
import './shared.css';

const RADIUS: Record<string, DesignTokens['radius']> = {
  rounded: { sm: '8px', base: '12px', lg: '18px', pill: '999px' },
  pill: freshBaseTokens.radius,
};

function color(settings: ThemeSettings, key: string, fallback: string): string {
  const v = settings[key];
  return typeof v === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v) ? v : fallback;
}

function fontStack(family: unknown, fallback: string): string {
  if (typeof family !== 'string' || family === '' || family === 'system') return `system-ui,-apple-system,'Segoe UI',${ARABIC_STACK}`;
  return `'${family}',${fallback}`;
}

/** Perceived luminance (0–1) of a hex colour — used to keep on-primary text readable. */
function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Fold validated settings into concrete tokens (pure). */
function createTokens(settings: ThemeSettings): DesignTokens {
  const light = freshBaseTokens.color.light;
  const primary = color(settings, 'primary_color', light.primary);
  const accent = color(settings, 'accent_color', light.accent);
  const bg = color(settings, 'background_color', light.bg);
  const text = color(settings, 'text_color', light.text);
  const sale = color(settings, 'sale_color', light.sale);
  const containerWidth = typeof settings['container_width'] === 'number' ? settings['container_width'] : 1360;
  const radiusKey = typeof settings['radius'] === 'string' ? settings['radius'] : 'pill';
  const bgIsLight = luminance(bg) > 0.5;

  return {
    ...freshBaseTokens,
    color: {
      light: {
        ...light,
        primary,
        onPrimary: luminance(primary) > 0.6 ? '#1B2A1E' : '#FFFFFF',
        accent,
        accentInk: luminance(accent) > 0.5 ? light.accentInk : accent,
        bg,
        // Cards stay white on a light canvas; on a dark custom canvas they follow it.
        surface: bgIsLight ? '#FFFFFF' : bg,
        text,
        sale,
        success: primary,
      },
      dark: { ...freshBaseTokens.color.dark, accent, sale },
    },
    typography: {
      ...freshBaseTokens.typography,
      fontSans: fontStack(settings['body_font'], ARABIC_STACK),
      fontSerif: fontStack(settings['heading_font'], ARABIC_STACK),
    },
    spacing: { ...freshBaseTokens.spacing, container: `${containerWidth}px` },
    radius: RADIUS[radiusKey] ?? freshBaseTokens.radius,
  };
}

const baseline: ThemeSettings = defaultSettings(freshSettingsSchema);

export const freshTheme: ThemeModule = {
  manifest: freshManifest,
  defaultSettings: baseline,
  tokens: createTokens(baseline),
  createTokens,
  sections: createSectionMap({
    'featured-products': FreshFeaturedProducts,
    'flash-deals': FreshFlashDeals,
    'product-tabs': FreshProductTabs,
  }),
  sectionSchemas: SECTION_LIBRARY,
  layouts: freshLayouts,
  templates: freshTemplates,
};

export default freshTheme;
