/**
 * Theme 04 — Rouge · Luminous Beauty Commerce · theme module.
 *
 * Assembles the `ThemeModule` the engine consumes: manifest + base tokens + a pure
 * `createTokens(settings)` that folds merchant settings into a concrete token set. The engine
 * surface is identical to Themes 01–03, but every value/asset here is Rouge's own — no other
 * theme's code is imported. Loading the module loads Rouge's isolated `.rge-*` stylesheets.
 */
import { defaultSettings } from '../../theme-engine/settings';
import type { DesignTokens, ThemeModule, ThemeSettings } from '../../theme-engine/types';
import { rougeManifest } from './manifest';
import { rougeSettingsSchema } from './settings';
import { rougeBaseTokens } from './tokens';
import { rougeSections, rougeTemplates } from './sections';
import { rougeLayouts } from './layouts';
// Rouge owns its skin — the engine and other themes never import these, so its `.rge-*` CSS is fully
// isolated and code-split into the theme chunk.
import './theme.css';
import './sections.css';
import './chrome.css';
// Skin for the shared transactional pages (cart/checkout/account/auth/search/wishlist/static/404),
// which render the default `.sf-*` component library. Rouge re-skins that surface in its own language.
import './shared.css';

/** Fold validated settings into concrete tokens (pure, SSR-safe). Light is Rouge's default map. */
function createTokens(settings: ThemeSettings): DesignTokens {
  const primary =
    typeof settings['primary_color'] === 'string'
      ? settings['primary_color']
      : rougeBaseTokens.color.light.primary;
  const accent =
    typeof settings['accent_color'] === 'string'
      ? settings['accent_color']
      : rougeBaseTokens.color.light.accent;
  const sale =
    typeof settings['sale_color'] === 'string'
      ? settings['sale_color']
      : rougeBaseTokens.color.light.sale;
  const containerWidth =
    typeof settings['container_width'] === 'number' ? settings['container_width'] : 1440;

  return {
    ...rougeBaseTokens,
    color: {
      // Merchant primary/accent/sale apply to the light map (Rouge's home); the dark "Boudoir"
      // map keeps its lifted, AA-safe derived values.
      light: { ...rougeBaseTokens.color.light, primary, accent, sale },
      dark: { ...rougeBaseTokens.color.dark },
    },
    spacing: { ...rougeBaseTokens.spacing, container: `${containerWidth}px` },
  };
}

const baseline: ThemeSettings = defaultSettings(rougeSettingsSchema);

export const rougeTheme: ThemeModule = {
  manifest: rougeManifest,
  defaultSettings: baseline,
  tokens: createTokens(baseline),
  createTokens,
  sections: rougeSections,
  layouts: rougeLayouts,
  templates: rougeTemplates,
};

export default rougeTheme;
