/**
 * Theme 02 — Voltage · merchant-configurable settings (schema). Only field types the engine
 * understands are used. Appearance settings flow into tokens via `createTokens`. Voltage is
 * dark-first; the default scheme reflects that.
 *
 * Source of truth: docs/themes/theme-02/03-theme-tokens.md, 10-theme-manifest.md.
 */
import type { ThemeSettingsSchema } from '../../theme-engine/types';

export const voltageSettingsSchema: ThemeSettingsSchema = [
  {
    id: 'color_scheme',
    type: 'select',
    label: 'Colour scheme',
    group: 'Appearance',
    options: [
      { value: 'auto', label: 'Auto (follow system)' },
      { value: 'dark', label: 'Dark (default)' },
      { value: 'light', label: 'Light' },
    ],
    default: 'dark',
  },
  {
    id: 'primary_color',
    type: 'color',
    label: 'Primary — voltage cyan',
    group: 'Appearance',
    help: 'Primary CTAs, active nav, links. Overrides the dark-scheme primary.',
    default: '#22D3EE',
  },
  {
    id: 'accent_color',
    type: 'color',
    label: 'Accent — signal lime',
    group: 'Appearance',
    help: 'Energy flourish: deals, "new", live, stat count-up. Overrides the dark-scheme accent.',
    default: '#A3E635',
  },
  {
    id: 'container_width',
    type: 'range',
    label: 'Max content width (px)',
    group: 'Layout',
    min: 1360,
    max: 1600,
    step: 20,
    default: 1520,
  },
];
