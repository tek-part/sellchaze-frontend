/**
 * Theme 04 — Rouge · merchant-configurable settings (schema). Only field types the engine
 * understands are used. Appearance settings flow into tokens via `createTokens`. Rouge is
 * light-first ("Boudoir" dark is the secondary mood).
 *
 * Source of truth: docs/themes/theme-04/03-theme-tokens.md, 10-theme-manifest.md.
 */
import type { ThemeSettingsSchema } from '../../theme-engine/types';

export const rougeSettingsSchema: ThemeSettingsSchema = [
  {
    id: 'color_scheme',
    type: 'select',
    label: 'Colour scheme',
    group: 'Appearance',
    options: [
      { value: 'light', label: 'Light (default)' },
      { value: 'dark', label: 'Boudoir (dark)' },
      { value: 'auto', label: 'Auto (follow system)' },
    ],
    default: 'light',
  },
  {
    id: 'primary_color',
    type: 'color',
    label: 'Primary — rouge',
    group: 'Appearance',
    help: 'The single action colour: primary CTAs, active nav, links, selected shade ring.',
    default: '#B23052',
  },
  {
    id: 'accent_color',
    type: 'color',
    label: 'Accent — gilded rose',
    group: 'Appearance',
    help: 'Metallic flourish for “New/Limited”, the wordmark, and eyebrow rules. Used sparingly.',
    default: '#C79A6D',
  },
  {
    id: 'sale_color',
    type: 'color',
    label: 'Sale — hot petal',
    group: 'Appearance',
    help: 'Sale prices, discount %, urgency, “back in stock”. Reserved — never decorative.',
    default: '#A62D50',
  },
  {
    id: 'glow_enabled',
    type: 'toggle',
    label: 'Aura glow',
    group: 'Appearance',
    help: 'Soft blush→peach→lilac halo behind hero, featured, and empty states.',
    default: true,
  },
  {
    id: 'product_card_shades',
    type: 'toggle',
    label: 'Show shade dots on product cards',
    group: 'Commerce',
    help: 'Preview available shades as a row of circular swatches on each card.',
    default: true,
  },
  {
    id: 'free_ship_threshold',
    type: 'number',
    label: 'Free-shipping threshold',
    group: 'Commerce',
    min: 0,
    max: 500,
    step: 5,
    default: 50,
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
