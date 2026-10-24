/**
 * Glow — settings → tokens (pure). The palette select picks a complete colour story; optional
 * colour fields fine-tune it. The dark slot is the Night palette only when the merchant opts in
 * (`auto_dark`) — otherwise a blush store stays blush on a dark-mode phone, as the merchant chose.
 */
import type { DesignTokens, ThemeSettings } from '../../theme-engine/types';
import { ARABIC_STACK, GLOW_PALETTES, glowBaseTokens, type GlowColors, type GlowPaletteId } from './tokens';

const RADIUS: Readonly<Record<string, DesignTokens['radius']>> = {
  soft: glowBaseTokens.radius,
  round: { sm: '10px', base: '18px', lg: '28px', pill: '999px' },
  sharp: { sm: '0px', base: '2px', lg: '4px', pill: '999px' },
};

export function glowPalette(settings: ThemeSettings): GlowPaletteId {
  const v = settings['palette'];
  return v === 'nude' || v === 'night' ? v : 'blush';
}

function hex(settings: ThemeSettings, key: string): string | undefined {
  const v = settings[key];
  return typeof v === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v) ? v : undefined;
}

/** Relative luminance (WCAG) of a #rgb / #rrggbb colour. */
export function luminance(color: string): number {
  const h = color.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(n.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p) as [number, number];
  return (x + 0.05) / (y + 0.05);
}

function tune(base: GlowColors, settings: ThemeSettings): GlowColors {
  const primary = hex(settings, 'primary_color');
  const accent = hex(settings, 'accent_color');
  const sale = hex(settings, 'sale_color');
  return {
    ...base,
    ...(primary ? { primary, onPrimary: contrast(primary, '#FFFFFF') >= contrast(primary, '#1B1214') ? '#FFFFFF' : '#1B1214' } : {}),
    ...(accent ? { accent } : {}),
    ...(sale ? { sale, danger: sale } : {}),
  };
}

function fontStack(family: unknown, fallback: string, serif = false): string {
  if (typeof family !== 'string' || family === '') return fallback;
  const tail = serif && family === 'Cormorant Garamond' ? `Georgia,'Times New Roman',${ARABIC_STACK}` : `system-ui,-apple-system,'Segoe UI',${ARABIC_STACK}`;
  return family === 'IBM Plex Sans Arabic' ? `'IBM Plex Sans Arabic',${tail}` : `'${family}','IBM Plex Sans Arabic',${tail}`;
}

export function createGlowTokens(settings: ThemeSettings): DesignTokens {
  const palette = glowPalette(settings);
  const light = tune(GLOW_PALETTES[palette], settings);
  const night = palette === 'night' ? light : tune(GLOW_PALETTES.night, { ...settings, primary_color: '' });
  const dark = palette === 'night' || settings['auto_dark'] === true ? night : light;
  const width = typeof settings['container_width'] === 'number' ? Math.min(1600, Math.max(1100, settings['container_width'])) : 1320;
  const radiusKey = typeof settings['radius'] === 'string' ? settings['radius'] : 'soft';

  return {
    ...glowBaseTokens,
    color: { light, dark },
    typography: {
      ...glowBaseTokens.typography,
      fontSans: fontStack(settings['body_font'], glowBaseTokens.typography.fontSans),
      fontSerif: fontStack(settings['heading_font'], glowBaseTokens.typography.fontSerif, true),
    },
    spacing: { ...glowBaseTokens.spacing, container: `${width}px` },
    radius: RADIUS[radiusKey] ?? glowBaseTokens.radius,
  };
}
