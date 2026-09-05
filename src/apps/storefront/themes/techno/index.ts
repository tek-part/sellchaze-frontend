/**
 * Techno (تكنو) — theme module. Sections come from the shared library (`createSectionMap()`), with
 * the three product rails overridden so cards carry spec chips and a compare affordance. Chrome +
 * skin are the theme's own (`tk-*`); `createTokens` folds the merchant's colours, fonts, radius and
 * container width into the token set.
 */
import { defaultSettings } from '../../theme-engine/settings';
import type { DesignTokens, ThemeModule, ThemeSettings } from '../../theme-engine/types';
import { createSectionMap, SECTION_LIBRARY } from '../../sections-lib';
import { technoManifest } from './manifest';
import { technoSettingsSchema } from './settings';
import { ARABIC_STACK, technoBaseTokens } from './tokens';
import { technoTemplates } from './templates';
import { technoLayouts } from './layouts';
import { TkFeaturedProducts } from './sections/FeaturedProducts';
import { TkProductTabs } from './sections/ProductTabs';
import { TkFlashDeals } from './sections/FlashDeals';
import './theme.css';
import './shared.css';

const RADIUS: Record<string, DesignTokens['radius']> = {
  sharp: { sm: '0px', base: '0px', lg: '2px', pill: '999px' },
  small: technoBaseTokens.radius,
};

function color(settings: ThemeSettings, key: string, fallback: string): string {
  const v = settings[key];
  return typeof v === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v) ? v : fallback;
}

function fontStack(family: unknown, fallback: string): string {
  if (typeof family !== 'string' || family === '' || family === 'system') return `system-ui,-apple-system,'Segoe UI',${ARABIC_STACK}`;
  return `'${family}',${fallback}`;
}

/** Perceived luminance (0–1) of a hex colour — keeps on-primary text readable. */
function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Fold validated settings into concrete tokens (pure). */
function createTokens(settings: ThemeSettings): DesignTokens {
  const light = technoBaseTokens.color.light;
  const primary = color(settings, 'primary_color', light.primary);
  const accent = color(settings, 'accent_color', light.accent);
  const bg = color(settings, 'background_color', light.bg);
  const text = color(settings, 'text_color', light.text);
  const sale = color(settings, 'sale_color', light.sale);
  const containerWidth = typeof settings['container_width'] === 'number' ? settings['container_width'] : 1360;
  const radiusKey = typeof settings['radius'] === 'string' ? settings['radius'] : 'small';
  const bodyFont = fontStack(settings['body_font'], `'Inter',${ARABIC_STACK}`);
  const headingFont = fontStack(settings['heading_font'], `'IBM Plex Sans Arabic',${ARABIC_STACK}`);

  return {
    ...technoBaseTokens,
    color: {
      light: {
        ...light,
        primary,
        onPrimary: luminance(primary) > 0.6 ? '#0B1220' : '#FFFFFF',
        accent,
        accentInk: luminance(accent) > 0.5 ? light.accentInk : accent,
        bg,
        text,
        sale,
      },
      dark: { ...technoBaseTokens.color.dark, accent, sale },
    },
    typography: { ...technoBaseTokens.typography, fontSans: bodyFont, fontSerif: headingFont },
    spacing: { ...technoBaseTokens.spacing, container: `${containerWidth}px` },
    radius: RADIUS[radiusKey] ?? technoBaseTokens.radius,
  };
}

const baseline: ThemeSettings = defaultSettings(technoSettingsSchema);

export const technoTheme: ThemeModule = {
  manifest: technoManifest,
  defaultSettings: baseline,
  tokens: createTokens(baseline),
  createTokens,
  sections: createSectionMap({
    'featured-products': TkFeaturedProducts,
    'product-tabs': TkProductTabs,
    'flash-deals': TkFlashDeals,
  }),
  sectionSchemas: SECTION_LIBRARY,
  layouts: technoLayouts,
  templates: technoTemplates,
};

export default technoTheme;
