import type { DesignTokens, ThemeSettings } from './theme-engine/types';

export interface StoreIdentity {
  site_title?: string | null;
  header_mode?: 'theme' | 'custom' | 'hidden' | null;
  header_text?: string | null;
  primary_color?: string | null;
  font_family?: string | null;
  favicon_url?: string | null;
}

type FontCatalog = Readonly<Record<string, { weights: ReadonlyArray<number>; arabic: boolean; italic?: boolean }>>;
let fonts: FontCatalog = {};
let fontCatalogLoad: Promise<void> | undefined;

/** Unconfigured stores and system fonts do not download the 1,950-family catalog. */
export async function loadIdentityFonts(family?: string | null): Promise<void> {
  if (!family || family === 'system') return;
  fontCatalogLoad ??= import('../../shared/store-fonts.json').then(module => { fonts = module.default; });
  await fontCatalogLoad;
}

export function identityFont(family: string | null | undefined): string | undefined {
  return family === 'system' || (family && Object.hasOwn(fonts, family)) ? family : undefined;
}

export function identityFontStylesheet(family: string | null | undefined): string | undefined {
  if (!family || !Object.hasOwn(fonts, family)) return undefined;
  const entries = [family, ...(fonts[family]?.arabic ? [] : ['Cairo'])].sort();
  return `https://fonts.googleapis.com/css2?${entries.map(f => {
    const entry = fonts[f];
    const axes = entry?.italic ? `ital,wght@${entry.weights.map(weight => `1,${weight}`).join(';')}` : `wght@${entry?.weights.join(';')}`;
    return `family=${encodeURIComponent(f).replace(/%20/g, '+')}:${axes}`;
  }).join('&')}&display=swap`;
}

export function identitySettings(settings: ThemeSettings, identity?: StoreIdentity): ThemeSettings {
  if (!identity || !identity.header_mode || identity.header_mode === 'theme') return settings;
  const text = identity.header_mode === 'custom' ? identity.header_text?.trim() ?? '' : '';
  return { ...settings, announcement_text: text, announcement_url: '', show_announcement: Boolean(text), show_top_bar: Boolean(text) };
}

/** WCAG relative luminance. Choose the more readable of black and white. */
export function identityForeground(hex: string): string {
  const channels = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = (channels[0] ?? 0) * 0.2126 + (channels[1] ?? 0) * 0.7152 + (channels[2] ?? 0) * 0.0722;
  return (luminance + 0.05) / 0.05 >= 1.05 / (luminance + 0.05) ? '#000000' : '#FFFFFF';
}

export function identityFontStack(identity?: StoreIdentity): string | undefined {
  const family = identityFont(identity?.font_family);
  if (!family) return undefined;
  return family === 'system' ? "system-ui,-apple-system,'Segoe UI',sans-serif" : `'${family}','Cairo',system-ui,sans-serif`;
}

/** General identity wins for all installed themes, schemes and directions; unset inherits. */
export function identityTokens(tokens: DesignTokens, identity?: StoreIdentity): DesignTokens {
  const primary = identity?.primary_color && /^#[0-9a-f]{6}$/i.test(identity.primary_color) ? identity.primary_color : undefined;
  const font = identityFontStack(identity);
  if (!primary && !font) return tokens;
  const color = primary ? Object.fromEntries(['light', 'dark'].map(scheme => [scheme,
    { ...tokens.color[scheme as 'light' | 'dark'], primary, onPrimary: identityForeground(primary) }])) as DesignTokens['color'] : tokens.color;
  return { ...tokens, color, typography: font ? { ...tokens.typography, fontSans: font, fontSerif: font, fontArabic: font } : tokens.typography };
}
