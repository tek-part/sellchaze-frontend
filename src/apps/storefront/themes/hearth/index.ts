/**
 * Theme 03 — Hearth · Home & Living · theme module.
 *
 * Assembles the `ThemeModule` the engine consumes: manifest + base tokens + a pure
 * `createTokens(settings)` that folds merchant settings into a concrete token set, plus the theme's
 * bespoke sections/layouts/templates. The engine surface is identical for every theme; everything
 * visual here is Hearth's own — it reuses only the frozen platform contracts, never Theme 01/02 UI.
 */
import { defaultSettings } from '../../theme-engine/settings';
import type { DesignTokens, ThemeModule, ThemeSettings } from '../../theme-engine/types';
import { hearthManifest } from './manifest';
import { hearthSettingsSchema } from './settings';
import { hearthBaseTokens } from './tokens';
import { hearthSections, hearthTemplates } from './sections';
import { hearthLayouts } from './layouts';
// The theme OWNS its stylesheets — importing the module loads them. The engine and the app-level
// design system never import these, so a different active theme brings its own skin.
import './theme.css';
import './chrome.css';
import './sections.css';

const SERIF_STACKS: Readonly<Record<string, string>> = {
  fraunces: "'Fraunces','Recoleta','Cooper BT',Georgia,serif",
  recoleta: "'Recoleta','Fraunces',Georgia,serif",
  'dm-serif': "'DM Serif Display','Fraunces',Georgia,serif",
};

const SANS_STACKS: Readonly<Record<string, string>> = {
  'general-sans': "'General Sans','Hanken Grotesk','Inter',system-ui,-apple-system,sans-serif",
  hanken: "'Hanken Grotesk','General Sans','Inter',system-ui,-apple-system,sans-serif",
  inter: "'Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif",
};

const CORNERS: Readonly<Record<string, { sm: string; base: string; lg: string }>> = {
  soft: { sm: '10px', base: '16px', lg: '24px' },
  softer: { sm: '14px', base: '20px', lg: '28px' },
  sharp: { sm: '6px', base: '8px', lg: '14px' },
};

/** Fold validated settings into concrete tokens (pure). */
function createTokens(settings: ThemeSettings): DesignTokens {
  const primary =
    typeof settings['primary_color'] === 'string'
      ? settings['primary_color']
      : hearthBaseTokens.color.light.primary;
  const accent =
    typeof settings['accent_color'] === 'string'
      ? settings['accent_color']
      : hearthBaseTokens.color.light.accent;
  const containerWidth =
    typeof settings['container_width'] === 'number' ? settings['container_width'] : 1360;

  const headingKey = typeof settings['heading_font'] === 'string' ? settings['heading_font'] : 'fraunces';
  const bodyKey = typeof settings['body_font'] === 'string' ? settings['body_font'] : 'general-sans';
  const cornerKey = typeof settings['corner_style'] === 'string' ? settings['corner_style'] : 'soft';

  const fontSerif = SERIF_STACKS[headingKey] ?? hearthBaseTokens.typography.fontSerif;
  const fontSans = SANS_STACKS[bodyKey] ?? hearthBaseTokens.typography.fontSans;
  const corner = CORNERS[cornerKey] ?? CORNERS['soft']!;

  return {
    ...hearthBaseTokens,
    color: {
      light: { ...hearthBaseTokens.color.light, primary, accent },
      dark: hearthBaseTokens.color.dark,
    },
    typography: { ...hearthBaseTokens.typography, fontSerif, fontSans },
    spacing: { ...hearthBaseTokens.spacing, container: `${containerWidth}px` },
    radius: { ...hearthBaseTokens.radius, sm: corner.sm, base: corner.base, lg: corner.lg },
  };
}

const baseline: ThemeSettings = defaultSettings(hearthSettingsSchema);

export const hearthTheme: ThemeModule = {
  manifest: hearthManifest,
  defaultSettings: baseline,
  tokens: createTokens(baseline),
  createTokens,
  sections: hearthSections,
  layouts: hearthLayouts,
  templates: hearthTemplates,
};

export default hearthTheme;
