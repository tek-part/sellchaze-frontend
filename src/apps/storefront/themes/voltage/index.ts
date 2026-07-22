/**
 * Theme 02 — Voltage · Tech Commerce · theme module.
 *
 * Assembles the `ThemeModule` the engine consumes: manifest + base tokens + a pure
 * `createTokens(settings)` that folds merchant settings into a concrete token set. Sections,
 * layouts, templates, and the CSS skin are added in later phases; the engine surface is identical
 * to Theme 01's, but every value/asset here is Voltage's own — no Theme 01 code is imported.
 */
import { defaultSettings } from '../../theme-engine/settings';
import type { DesignTokens, ThemeModule, ThemeSettings } from '../../theme-engine/types';
import { voltageManifest } from './manifest';
import { voltageSettingsSchema } from './settings';
import { voltageBaseTokens } from './tokens';
import { voltageSections, voltageTemplates } from './sections';
import { voltageLayouts } from './layouts';
// Voltage owns its skin — loading the module loads its stylesheets. The engine and Theme 01 never
// import these, so Voltage's `.vlt-*` CSS is fully isolated and code-split into the theme chunk.
import './theme.css';
import './sections.css';
import './chrome.css';
import './overlays.css';
import './shop.css';

/** Fold validated settings into concrete tokens (pure). */
function createTokens(settings: ThemeSettings): DesignTokens {
  const primary =
    typeof settings['primary_color'] === 'string'
      ? settings['primary_color']
      : voltageBaseTokens.color.dark.primary;
  const accent =
    typeof settings['accent_color'] === 'string'
      ? settings['accent_color']
      : voltageBaseTokens.color.dark.accent;
  const containerWidth =
    typeof settings['container_width'] === 'number' ? settings['container_width'] : 1520;

  return {
    ...voltageBaseTokens,
    color: {
      // Merchant primary/accent apply to the dark map (Voltage's home); the light map keeps its
      // AA-safe derived values.
      dark: { ...voltageBaseTokens.color.dark, primary, accent },
      light: { ...voltageBaseTokens.color.light },
    },
    spacing: { ...voltageBaseTokens.spacing, container: `${containerWidth}px` },
  };
}

const baseline: ThemeSettings = defaultSettings(voltageSettingsSchema);

export const voltageTheme: ThemeModule = {
  manifest: voltageManifest,
  defaultSettings: baseline,
  tokens: createTokens(baseline),
  createTokens,
  sections: voltageSections,
  layouts: voltageLayouts,
  templates: voltageTemplates,
};

export default voltageTheme;
