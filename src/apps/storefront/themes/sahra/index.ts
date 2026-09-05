/**
 * Sahra (صحراء) — theme module. Sections come from the shared library (`createSectionMap()`),
 * chrome + skin are the theme's own (`sh-*`), and `createTokens` folds the merchant's colours,
 * serif/sans fonts, corner style and container width into the token set.
 */
import { defaultSettings } from '../../theme-engine/settings';
import type { DesignTokens, ThemeModule, ThemeSettings } from '../../theme-engine/types';
import { createSectionMap, SECTION_LIBRARY } from '../../sections-lib';
import { sahraManifest } from './manifest';
import { sahraSettingsSchema } from './settings';
import { ARABIC_SANS, ARABIC_SERIF, sahraBaseTokens } from './tokens';
import { sahraTemplates } from './templates';
import { sahraLayouts } from './layouts';
import './theme.css';
import './shared.css';

const RADIUS: Record<string, DesignTokens['radius']> = {
  sharp: sahraBaseTokens.radius,
  soft: { sm: '4px', base: '8px', lg: '14px', pill: '999px' },
};

function color(settings: ThemeSettings, key: string, fallback: string): string {
  const v = settings[key];
  return typeof v === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v) ? v : fallback;
}

function serifStack(family: unknown): string {
  if (typeof family !== 'string' || family === '' || family === 'system') return `Georgia,'Times New Roman',${ARABIC_SERIF}`;
  return `'${family}',${ARABIC_SERIF}`;
}

function sansStack(family: unknown): string {
  if (typeof family !== 'string' || family === '' || family === 'system') return `system-ui,-apple-system,'Segoe UI',${ARABIC_SANS}`;
  return `'${family}',${ARABIC_SANS}`;
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
  const light = sahraBaseTokens.color.light;
  const dark = sahraBaseTokens.color.dark;
  const primary = color(settings, 'primary_color', light.primary);
  const accent = color(settings, 'accent_color', light.accent);
  const bg = color(settings, 'background_color', light.bg);
  const text = color(settings, 'text_color', light.text);
  const sale = color(settings, 'sale_color', light.sale);
  const containerWidth = typeof settings['container_width'] === 'number' ? settings['container_width'] : 1400;
  const radiusKey = typeof settings['radius'] === 'string' ? settings['radius'] : 'sharp';
  const lightBg = luminance(bg) > 0.5;

  return {
    ...sahraBaseTokens,
    color: {
      light: {
        ...light,
        primary,
        onPrimary: luminance(primary) > 0.6 ? '#1C1A17' : '#FBF8F3',
        accent,
        accentInk: luminance(accent) > 0.5 ? light.accentInk : accent,
        bg,
        surface: lightBg ? '#FFFFFF' : bg,
        text,
        sale,
      },
      // Charcoal mood: the gold accent doubles as the action colour on the dark canvas.
      dark: {
        ...dark,
        primary: accent,
        onPrimary: luminance(accent) > 0.6 ? '#14120F' : '#F2EBDD',
        accent,
        accentInk: luminance(accent) > 0.4 ? accent : dark.accentInk,
      },
    },
    typography: {
      ...sahraBaseTokens.typography,
      fontSans: sansStack(settings['body_font']),
      fontSerif: serifStack(settings['heading_font']),
    },
    spacing: { ...sahraBaseTokens.spacing, container: `${containerWidth}px` },
    radius: RADIUS[radiusKey] ?? sahraBaseTokens.radius,
  };
}

const baseline: ThemeSettings = defaultSettings(sahraSettingsSchema);

export const sahraTheme: ThemeModule = {
  manifest: sahraManifest,
  defaultSettings: baseline,
  tokens: createTokens(baseline),
  createTokens,
  sections: createSectionMap(),
  sectionSchemas: SECTION_LIBRARY,
  layouts: sahraLayouts,
  templates: sahraTemplates,
};

export default sahraTheme;
