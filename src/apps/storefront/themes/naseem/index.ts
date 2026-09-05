/**
 * Naseem (نسيم) — theme module. Sections come from the shared library (`createSectionMap()`),
 * chrome + skin are the theme's own (`nsm-*`), and `createTokens` folds the merchant's colours,
 * fonts, radius and container width into the token set.
 */
import { defaultSettings } from '../../theme-engine/settings';
import type { DesignTokens, ThemeModule, ThemeSettings } from '../../theme-engine/types';
import { createSectionMap, SECTION_LIBRARY } from '../../sections-lib';
import { naseemManifest } from './manifest';
import { naseemSettingsSchema } from './settings';
import { ARABIC_STACK, naseemBaseTokens } from './tokens';
import { naseemTemplates } from './templates';
import { naseemLayouts } from './layouts';
import './theme.css';
import './shared.css';

const RADIUS: Record<string, DesignTokens['radius']> = {
  sharp: { sm: '0px', base: '2px', lg: '4px', pill: '999px' },
  rounded: naseemBaseTokens.radius,
  pill: { sm: '10px', base: '16px', lg: '24px', pill: '999px' },
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
  const light = naseemBaseTokens.color.light;
  const primary = color(settings, 'primary_color', light.primary);
  const accent = color(settings, 'accent_color', light.accent);
  const bg = color(settings, 'background_color', light.bg);
  const text = color(settings, 'text_color', light.text);
  const sale = color(settings, 'sale_color', light.sale);
  const containerWidth = typeof settings['container_width'] === 'number' ? settings['container_width'] : 1320;
  const radiusKey = typeof settings['radius'] === 'string' ? settings['radius'] : 'rounded';
  const baseSize = typeof settings['base_font_size'] === 'number' ? settings['base_font_size'] : 16;

  return {
    ...naseemBaseTokens,
    color: {
      light: {
        ...light,
        primary,
        onPrimary: luminance(primary) > 0.6 ? '#0F172A' : '#FFFFFF',
        accent,
        accentInk: luminance(accent) > 0.5 ? light.accentInk : accent,
        bg,
        surface: bg,
        text,
        sale,
      },
      dark: { ...naseemBaseTokens.color.dark, accent, sale },
    },
    typography: {
      ...naseemBaseTokens.typography,
      fontSans: fontStack(settings['body_font'], ARABIC_STACK),
      fontSerif: fontStack(settings['heading_font'], ARABIC_STACK),
      fontSize: { ...naseemBaseTokens.typography.fontSize, base: `${baseSize}px`, sm: `${Math.max(12, baseSize - 2)}px` },
    },
    spacing: { ...naseemBaseTokens.spacing, container: `${containerWidth}px` },
    radius: RADIUS[radiusKey] ?? naseemBaseTokens.radius,
  };
}

const baseline: ThemeSettings = defaultSettings(naseemSettingsSchema);

export const naseemTheme: ThemeModule = {
  manifest: naseemManifest,
  defaultSettings: baseline,
  tokens: createTokens(baseline),
  createTokens,
  sections: createSectionMap(),
  sectionSchemas: SECTION_LIBRARY,
  layouts: naseemLayouts,
  templates: naseemTemplates,
};

export default naseemTheme;
