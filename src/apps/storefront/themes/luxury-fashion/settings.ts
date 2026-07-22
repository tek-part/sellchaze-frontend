/**
 * Theme 01 — merchant-configurable settings (schema). Only field types the engine understands
 * are used. Settings that change appearance flow into tokens via `createTokens`.
 */
import type { ThemeSettingsSchema } from '../../theme-engine/types';

export const luxurySettingsSchema: ThemeSettingsSchema = [
  {
    id: 'color_scheme',
    type: 'select',
    label: 'Colour scheme',
    group: 'Appearance',
    options: [
      { value: 'auto', label: 'Auto (follow system)' },
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' },
    ],
    default: 'auto',
  },
  {
    id: 'accent_color',
    type: 'color',
    label: 'Accent — champagne gold',
    group: 'Appearance',
    help: 'Used sparingly (~5%). Overrides the light-scheme accent.',
    default: '#B08D57',
  },
  {
    id: 'container_width',
    type: 'range',
    label: 'Max content width (px)',
    group: 'Layout',
    min: 1200,
    max: 1600,
    step: 20,
    default: 1440,
  },
];
