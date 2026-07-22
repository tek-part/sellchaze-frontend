/**
 * Theme 01 — Modern Luxury Fashion · theme module.
 *
 * Assembles the `ThemeModule` the engine consumes: manifest + base tokens + a pure
 * `createTokens(settings)` that folds merchant settings into a concrete token set. In later
 * phases this package also exports the theme's components/sections/layouts; the engine surface
 * stays identical.
 */
import { defaultSettings } from '../../theme-engine/settings';
import type { DesignTokens, ThemeModule, ThemeSettings } from '../../theme-engine/types';
import { luxuryManifest } from './manifest';
import { luxurySettingsSchema } from './settings';
import { luxuryBaseTokens } from './tokens';
import { luxurySections, luxuryTemplates } from './sections';
import { luxuryLayouts } from './layouts';
// The theme owns its component + section skin — loading the module loads its stylesheets. The engine
// and the app-level design system never import these, so a different active theme brings its own CSS.
import './theme.css';
import './sections.css';
import './chrome.css';
import './pages.css';

/** Fold validated settings into concrete tokens (pure). */
function createTokens(settings: ThemeSettings): DesignTokens {
  const accent =
    typeof settings['accent_color'] === 'string'
      ? settings['accent_color']
      : luxuryBaseTokens.color.light.accent;
  const containerWidth =
    typeof settings['container_width'] === 'number' ? settings['container_width'] : 1440;

  return {
    ...luxuryBaseTokens,
    color: {
      light: { ...luxuryBaseTokens.color.light, accent },
      dark: luxuryBaseTokens.color.dark,
    },
    spacing: { ...luxuryBaseTokens.spacing, container: `${containerWidth}px` },
  };
}

const baseline: ThemeSettings = defaultSettings(luxurySettingsSchema);

export const luxuryFashionTheme: ThemeModule = {
  manifest: luxuryManifest,
  defaultSettings: baseline,
  tokens: createTokens(baseline),
  createTokens,
  sections: luxurySections,
  layouts: luxuryLayouts,
  templates: luxuryTemplates,
};

export default luxuryFashionTheme;
