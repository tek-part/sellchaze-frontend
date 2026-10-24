/**
 * Karat (قيراط) — theme module. Standard sections come from the shared library; the product rails
 * and the collection grid are overridden so they use the Karat card (metal · karat · weight), and six
 * Karat sections add the jewellery-specific story: the arched hero, the metal & stone showcase, the
 * gift finder, craftsmanship & certification, the merchant-written gold-rate notice and the
 * concierge. `createTokens` maps the palette preset + optional gold override to tokens.
 */
import { defaultSettings } from '../../theme-engine/settings';
import type { DesignTokens, ThemeModule, ThemeSettings } from '../../theme-engine/types';
import { createSectionMap, mergeSectionSchemas } from '../../sections-lib';
import { karatManifest } from './manifest';
import { karatSettingsSchema } from './settings';
import { ARABIC_STACK, KARAT_PALETTES, karatBaseTokens, type KaratPaletteId } from './tokens';
import { karatTemplates } from './templates';
import { karatLayouts } from './layouts';
import { KaratFeaturedProducts, KaratProductGrid, KaratRelatedProducts } from './sections/ProductRails';
import { KaratHero, karatHeroSchema } from './sections/Hero';
import { KaratMetals, karatMetalsSchema } from './sections/Metals';
import { KaratGiftFinder, karatGiftFinderSchema } from './sections/GiftFinder';
import { KaratCraft, karatCraftSchema } from './sections/Craft';
import { KaratRateNotice, karatRateNoticeSchema } from './sections/RateNotice';
import { KaratConcierge, karatConciergeSchema } from './sections/Concierge';
import './theme.css';
import './shared.css';

const RADIUS: Record<string, DesignTokens['radius']> = {
  square: karatBaseTokens.radius,
  soft: { sm: '4px', base: '8px', lg: '14px', pill: '999px' },
};

function hex(settings: ThemeSettings, key: string): string | undefined {
  const v = settings[key];
  return typeof v === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v) ? v : undefined;
}

/** Perceived luminance (0–1) of a #rgb / #rrggbb colour. */
export function luminance(color: string): number {
  const h = color.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function paletteId(value: unknown): KaratPaletteId {
  return value === 'onyx' || value === 'ivory' ? value : 'emerald';
}

const HEADING_FALLBACK = `Georgia,'Times New Roman',${ARABIC_STACK}`;

function stack(family: unknown, allowed: ReadonlyArray<string>, fallback: string): string {
  const f = typeof family === 'string' && allowed.includes(family) ? family : allowed[0]!;
  // Arabic glyphs always come from IBM Plex Sans Arabic (Latin-only families fall through to it).
  return f === 'IBM Plex Sans Arabic' ? `'IBM Plex Sans Arabic',${fallback}` : `'${f}','IBM Plex Sans Arabic',${fallback}`;
}

/** Fold validated settings into concrete tokens (pure). */
export function createKaratTokens(settings: ThemeSettings): DesignTokens {
  const id = paletteId(settings['palette']);
  const base = KARAT_PALETTES[id];
  const gold = hex(settings, 'accent_color');
  const dark = id !== 'ivory';
  const palette = gold
    ? {
        ...base,
        accent: gold,
        // On the dark palettes gold is also the primary button and readable text colour.
        ...(dark ? { primary: gold, onPrimary: luminance(gold) > 0.45 ? base.bg : '#FFFFFF', accentInk: luminance(gold) > 0.35 ? gold : base.accentInk } : {}),
      }
    : base;
  const width = typeof settings['container_width'] === 'number' ? settings['container_width'] : 1320;
  const corners = typeof settings['corners'] === 'string' ? settings['corners'] : 'square';
  return {
    ...karatBaseTokens,
    color: { light: palette, dark: palette },
    typography: {
      ...karatBaseTokens.typography,
      fontSerif: stack(settings['heading_font'], ['Cormorant Garamond', 'Plus Jakarta Sans', 'IBM Plex Sans Arabic'], HEADING_FALLBACK),
      fontSans: stack(settings['body_font'], ['Inter', 'IBM Plex Sans Arabic', 'Plus Jakarta Sans', 'Rubik'], `system-ui,-apple-system,${ARABIC_STACK}`),
    },
    spacing: { ...karatBaseTokens.spacing, container: `${width}px` },
    radius: RADIUS[corners] ?? karatBaseTokens.radius,
  };
}

const baseline: ThemeSettings = defaultSettings(karatSettingsSchema);

export const KARAT_SECTION_SCHEMAS = [karatHeroSchema, karatRateNoticeSchema, karatMetalsSchema, karatGiftFinderSchema, karatCraftSchema, karatConciergeSchema] as const;

export const karatTheme: ThemeModule = {
  manifest: karatManifest,
  defaultSettings: baseline,
  tokens: createKaratTokens(baseline),
  createTokens: createKaratTokens,
  sections: createSectionMap({
    'featured-products': KaratFeaturedProducts,
    'product-grid': KaratProductGrid,
    'related-products': KaratRelatedProducts,
    'karat-hero': KaratHero,
    'karat-rate-notice': KaratRateNotice,
    'karat-metals': KaratMetals,
    'karat-gift-finder': KaratGiftFinder,
    'karat-craft': KaratCraft,
    'karat-concierge': KaratConcierge,
  }),
  sectionSchemas: mergeSectionSchemas(KARAT_SECTION_SCHEMAS),
  layouts: karatLayouts,
  templates: karatTemplates,
};

export default karatTheme;
