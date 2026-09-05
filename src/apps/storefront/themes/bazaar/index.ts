/**
 * Bazaar (بازار) — theme module. Sections come from the shared library (`createSectionMap()`),
 * chrome + skin are the theme's own (`bz-*`), and `createTokens` folds the merchant's colours,
 * fonts, radius and container width into the token set.
 */
import { defaultSettings } from '../../theme-engine/settings';
import type { DesignTokens, ThemeModule, ThemeSettings } from '../../theme-engine/types';
import { createSectionMap, SECTION_LIBRARY } from '../../sections-lib';
import { bazaarManifest } from './manifest';
import { bazaarSettingsSchema } from './settings';
import { ARABIC_STACK, bazaarBaseTokens } from './tokens';
import { bazaarTemplates } from './templates';
import { bazaarLayouts } from './layouts';
import './theme.css';
import './shared.css';

const RADIUS: Record<string, DesignTokens['radius']> = {
  sharp: { sm: '0px', base: '2px', lg: '4px', pill: '999px' },
  rounded: bazaarBaseTokens.radius,
  pill: { sm: '10px', base: '16px', lg: '22px', pill: '999px' },
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
  const light = bazaarBaseTokens.color.light;
  const primary = color(settings, 'primary_color', light.primary);
  const accent = color(settings, 'accent_color', light.accent);
  const bg = color(settings, 'background_color', light.bg);
  const text = color(settings, 'text_color', light.text);
  const sale = color(settings, 'sale_color', light.sale);
  const containerWidth = typeof settings['container_width'] === 'number' ? settings['container_width'] : 1400;
  const radiusKey = typeof settings['radius'] === 'string' ? settings['radius'] : 'rounded';
  const baseSize = typeof settings['base_font_size'] === 'number' ? settings['base_font_size'] : 15;

  return {
    ...bazaarBaseTokens,
    color: {
      light: {
        ...light,
        primary,
        onPrimary: luminance(primary) > 0.6 ? '#1F2937' : '#FFFFFF',
        accent,
        accentInk: luminance(accent) > 0.5 ? light.accentInk : accent,
        bg,
        surface: bg,
        text,
        sale,
      },
      dark: { ...bazaarBaseTokens.color.dark, sale },
    },
    typography: {
      ...bazaarBaseTokens.typography,
      fontSans: fontStack(settings['body_font'], ARABIC_STACK),
      fontSerif: fontStack(settings['heading_font'], ARABIC_STACK),
      fontSize: { ...bazaarBaseTokens.typography.fontSize, base: `${baseSize}px`, sm: `${Math.max(12, baseSize - 2)}px` },
    },
    spacing: { ...bazaarBaseTokens.spacing, container: `${containerWidth}px` },
    radius: RADIUS[radiusKey] ?? bazaarBaseTokens.radius,
  };
}

const baseline: ThemeSettings = defaultSettings(bazaarSettingsSchema);

export const bazaarTheme: ThemeModule = {
  manifest: bazaarManifest,
  defaultSettings: baseline,
  tokens: createTokens(baseline),
  createTokens,
  sections: createSectionMap(),
  sectionSchemas: SECTION_LIBRARY,
  layouts: bazaarLayouts,
  templates: bazaarTemplates,
};

export default bazaarTheme;
