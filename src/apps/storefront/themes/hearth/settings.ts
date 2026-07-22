/**
 * Theme 03 — Hearth · merchant-configurable settings (schema). Only field types the engine
 * understands are used (docs/themes/theme-03/19-manifest-specification §2). Settings that change
 * appearance flow into tokens via `createTokens`; the rest are read by chrome/sections at render.
 */
import type { ThemeSettingsSchema } from '../../theme-engine/types';

export const hearthSettingsSchema: ThemeSettingsSchema = [
  /* Appearance */
  {
    id: 'color_scheme',
    type: 'select',
    label: 'Colour scheme',
    group: 'Appearance',
    help: 'Warm-light is the default identity; a cozy dark map is available.',
    options: [
      { value: 'light', label: 'Light (default)' },
      { value: 'dark', label: 'Dark' },
      { value: 'auto', label: 'Auto (follow system)' },
    ],
    default: 'light',
  },
  {
    id: 'primary_color',
    type: 'color',
    label: 'Primary — terracotta',
    group: 'Appearance',
    help: 'The generous brand action colour (buttons, active nav, links). Overrides the light accent.',
    default: '#B5573A',
  },
  {
    id: 'accent_color',
    type: 'color',
    label: 'Accent — sage',
    group: 'Appearance',
    help: 'Natural / eco / secondary emphasis. Overrides the light-scheme sage.',
    default: '#6E7B54',
  },
  {
    id: 'heading_font',
    type: 'select',
    label: 'Heading font',
    group: 'Appearance',
    options: [
      { value: 'fraunces', label: 'Fraunces' },
      { value: 'recoleta', label: 'Recoleta' },
      { value: 'dm-serif', label: 'DM Serif Display' },
    ],
    default: 'fraunces',
  },
  {
    id: 'body_font',
    type: 'select',
    label: 'Body font',
    group: 'Appearance',
    options: [
      { value: 'general-sans', label: 'General Sans' },
      { value: 'hanken', label: 'Hanken Grotesk' },
      { value: 'inter', label: 'Inter' },
    ],
    default: 'general-sans',
  },
  {
    id: 'corner_style',
    type: 'select',
    label: 'Corners',
    group: 'Appearance',
    help: 'The soft, tactile rounding is a Hearth signature.',
    options: [
      { value: 'soft', label: 'Soft (16px)' },
      { value: 'softer', label: 'Softer (20px)' },
      { value: 'sharp', label: 'Sharp (8px)' },
    ],
    default: 'soft',
  },

  /* Layout */
  {
    id: 'container_width',
    type: 'range',
    label: 'Max content width (px)',
    group: 'Layout',
    min: 1240,
    max: 1560,
    step: 20,
    default: 1360,
  },
  {
    id: 'sticky_header',
    type: 'toggle',
    label: 'Sticky header',
    group: 'Layout',
    default: true,
  },
  {
    id: 'show_search',
    type: 'toggle',
    label: 'Show search',
    group: 'Layout',
    default: true,
  },
  {
    id: 'show_boards',
    type: 'toggle',
    label: 'Show boards (save)',
    group: 'Layout',
    default: true,
  },

  /* Commerce */
  {
    id: 'free_ship_threshold',
    type: 'number',
    label: 'Free delivery threshold',
    group: 'Commerce',
    min: 0,
    default: 0,
  },
  {
    id: 'show_swatches',
    type: 'toggle',
    label: 'Show finish / material swatches',
    group: 'Commerce',
    default: true,
  },
  {
    id: 'show_dimensions',
    type: 'toggle',
    label: 'Show dimensions on cards',
    group: 'Commerce',
    default: true,
  },
];
