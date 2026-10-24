/**
 * Maison — theme module. Standard sections come from the shared library (`createSectionMap()`); the
 * product rails (featured, related, collection grid) are overridden so every card carries Maison's
 * material/dimension line, and six home-décor signature sections are added (`maison-*`). Chrome and
 * skin are the theme's own (`mai-*`); `createTokens` folds the palette preset, colour overrides,
 * fonts, corner style and container width into the token set.
 */
import { defaultSettings } from '../../theme-engine/settings';
import type { ColorTokens, DesignTokens, ThemeModule, ThemeSettings } from '../../theme-engine/types';
import { createSectionMap, mergeSectionSchemas } from '../../sections-lib';
import { maisonManifest } from './manifest';
import { maisonSettingsSchema } from './settings';
import { ARABIC_STACK, MAISON_PALETTES, maisonBaseTokens, type MaisonPalette } from './tokens';
import { maisonTemplates } from './templates';
import { maisonLayouts } from './layouts';
import { MaisonFeaturedProducts, MaisonProductGrid, MaisonRelatedProducts } from './sections/ProductRails';
import { MaisonHero, maisonHeroSchema } from './sections/Hero';
import { MaisonRooms, maisonRoomsSchema } from './sections/Rooms';
import { MaisonShopTheRoom, maisonShopTheRoomSchema } from './sections/ShopTheRoom';
import { MaisonMoodboard, maisonMoodboardSchema } from './sections/Moodboard';
import { MaisonMaterials, maisonMaterialsSchema } from './sections/Materials';
import { MaisonGiftGuide, maisonGiftGuideSchema } from './sections/GiftGuide';
import './theme.css';
import './shared.css';

const RADIUS: Record<string, DesignTokens['radius']> = {
  soft: maisonBaseTokens.radius,
  round: { sm: '14px', base: '22px', lg: '32px', pill: '999px' },
  crisp: { sm: '3px', base: '6px', lg: '10px', pill: '999px' },
};

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function color(settings: ThemeSettings, key: string): string | undefined {
  const v = settings[key];
  return typeof v === 'string' && HEX.test(v.trim()) ? v.trim() : undefined;
}

function rgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16)) as [number, number, number];
}

/** WCAG relative luminance (0–1). */
export function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function fontStack(family: unknown, fallback: string, serif = false): string {
  if (typeof family !== 'string' || family === '') return fallback;
  const tail = serif && family === 'Cormorant Garamond' ? `'IBM Plex Sans Arabic',Georgia,'Times New Roman',serif` : ARABIC_STACK;
  return `'${family}',${tail}`;
}

function paletteOf(settings: ThemeSettings): MaisonPalette {
  return settings['palette'] === 'olive' ? 'olive' : 'terracotta';
}

/** Fold validated settings into concrete tokens (pure). */
export function createMaisonTokens(settings: ThemeSettings): DesignTokens {
  const preset = MAISON_PALETTES[paletteOf(settings)];
  const primary = color(settings, 'primary_color');
  const accent = color(settings, 'accent_color');
  const bg = color(settings, 'background_color');
  const text = color(settings, 'text_color');
  const sale = color(settings, 'sale_color');

  const light: ColorTokens = {
    ...preset.light,
    ...(primary ? { primary, onPrimary: luminance(primary) > 0.2 ?'#1E1915' : '#FFFFFF' } : {}),
    ...(accent ? { accent } : {}),
    ...(bg ? { bg } : {}),
    ...(text ? { text } : {}),
    ...(sale ? { sale, danger: sale } : {}),
  };
  const dark: ColorTokens = { ...preset.dark, ...(accent ? { accent } : {}) };
  const [r, g, b] = rgb(light.primary);

  const containerWidth = typeof settings['container_width'] === 'number' ? settings['container_width'] : 1320;
  const radiusKey = typeof settings['radius'] === 'string' ? settings['radius'] : 'soft';

  return {
    ...maisonBaseTokens,
    color: { light, dark },
    typography: {
      ...maisonBaseTokens.typography,
      fontSans: fontStack(settings['body_font'], maisonBaseTokens.typography.fontSans),
      fontSerif: fontStack(settings['heading_font'], maisonBaseTokens.typography.fontSerif, true),
    },
    spacing: { ...maisonBaseTokens.spacing, container: `${containerWidth}px` },
    radius: RADIUS[radiusKey] ?? maisonBaseTokens.radius,
    shadow: { ...maisonBaseTokens.shadow, focus: `0 0 0 3px rgba(${r},${g},${b},.38)` },
  };
}

const baseline: ThemeSettings = defaultSettings(maisonSettingsSchema);

/** The signature section schemas Maison adds to the library set. */
export const MAISON_SECTION_SCHEMAS = [
  maisonHeroSchema,
  maisonRoomsSchema,
  maisonShopTheRoomSchema,
  maisonMoodboardSchema,
  maisonMaterialsSchema,
  maisonGiftGuideSchema,
] as const;

export const maisonTheme: ThemeModule = {
  manifest: maisonManifest,
  defaultSettings: baseline,
  tokens: createMaisonTokens(baseline),
  createTokens: createMaisonTokens,
  sections: createSectionMap({
    'featured-products': MaisonFeaturedProducts,
    'related-products': MaisonRelatedProducts,
    'product-grid': MaisonProductGrid,
    'maison-hero': MaisonHero,
    'maison-rooms': MaisonRooms,
    'maison-shop-the-room': MaisonShopTheRoom,
    'maison-moodboard': MaisonMoodboard,
    'maison-materials': MaisonMaterials,
    'maison-gift-guide': MaisonGiftGuide,
  }),
  sectionSchemas: mergeSectionSchemas(MAISON_SECTION_SCHEMAS),
  layouts: maisonLayouts,
  templates: maisonTemplates,
};

export default maisonTheme;
