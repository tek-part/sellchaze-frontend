/**
 * Glow — merchant settings schema. Every field carries a `group`; the manifest export folds them
 * into the backend's grouped `settings_schema`. Fonts are limited to the self-hosted families.
 */
import type { ThemeSettingsSchema } from '../../theme-engine/types';

export const GLOW_HEADING_FONTS = [
  { value: 'Cormorant Garamond', label: 'Cormorant Garamond (serif)' },
  { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans' },
  { value: 'IBM Plex Sans Arabic', label: 'IBM Plex Sans Arabic' },
] as const;

export const GLOW_BODY_FONTS = [
  { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans' },
  { value: 'Inter', label: 'Inter' },
  { value: 'IBM Plex Sans Arabic', label: 'IBM Plex Sans Arabic' },
  { value: 'Rubik', label: 'Rubik' },
] as const;

export const glowSettingsSchema: ThemeSettingsSchema = [
  /* ---- Colors ---- */
  {
    id: 'palette',
    type: 'select',
    label: 'Palette',
    group: 'Colors',
    options: [
      { value: 'blush', label: 'Blush — porcelain & rose' },
      { value: 'nude', label: 'Nude — sand & espresso' },
      { value: 'night', label: 'Night — plum-black & blush' },
    ],
    default: 'blush',
    hint: 'The whole colour story in one choice. The fields below fine-tune it.',
  },
  { id: 'primary_color', type: 'color', label: 'Ink / buttons', group: 'Colors', default: '', hint: 'Leave empty to use the palette colour.' },
  { id: 'accent_color', type: 'color', label: 'Glow accent', group: 'Colors', default: '', hint: 'Soft highlight used for glows, rings and step numbers.' },
  { id: 'sale_color', type: 'color', label: 'Sale / discount', group: 'Colors', default: '' },
  { id: 'auto_dark', type: 'toggle', label: 'Switch to the Night palette when the shopper’s device is in dark mode', group: 'Colors', default: false },

  /* ---- Typography ---- */
  { id: 'heading_font', type: 'select', label: 'Heading font', group: 'Typography', options: GLOW_HEADING_FONTS, default: 'Cormorant Garamond' },
  { id: 'body_font', type: 'select', label: 'Body font', group: 'Typography', options: GLOW_BODY_FONTS, default: 'Plus Jakarta Sans' },

  /* ---- Header ---- */
  {
    id: 'logo_position',
    type: 'select',
    label: 'Logo position',
    group: 'Header',
    options: [
      { value: 'center', label: 'Centered' },
      { value: 'start', label: 'Start' },
    ],
    default: 'center',
  },
  { id: 'sticky_header', type: 'toggle', label: 'Sticky header', group: 'Header', default: true },
  { id: 'show_announcement', type: 'toggle', label: 'Show announcement bar', group: 'Header', default: true },
  {
    id: 'announcement_text',
    type: 'text',
    label: 'Announcement text',
    group: 'Header',
    translatable: true,
    default: { ar: 'عيّنات مجانية مع كل طلب · توصيل سريع لكل المحافظات', en: 'Complimentary samples with every order · Fast delivery nationwide' },
    hint: 'Separate several messages with “ | ” to rotate them.',
  },
  { id: 'announcement_url', type: 'url', label: 'Announcement link', group: 'Header', default: '' },

  /* ---- Layout ---- */
  { id: 'container_width', type: 'range', label: 'Content width (px)', group: 'Layout', min: 1100, max: 1600, step: 20, default: 1320 },
  {
    id: 'radius',
    type: 'select',
    label: 'Corner style',
    group: 'Layout',
    options: [
      { value: 'soft', label: 'Soft' },
      { value: 'round', label: 'Round' },
      { value: 'sharp', label: 'Sharp' },
    ],
    default: 'soft',
  },

  /* ---- Product cards ---- */
  {
    id: 'card_ratio',
    type: 'select',
    label: 'Product image shape',
    group: 'Product cards',
    options: [
      { value: 'portrait', label: 'Portrait 4:5' },
      { value: 'square', label: 'Square 1:1' },
    ],
    default: 'portrait',
  },
  { id: 'show_size', type: 'toggle', label: 'Show size / volume on cards', group: 'Product cards', default: true, hint: 'Read from the product’s size option (e.g. 30 ml · 50 ml).' },
  { id: 'show_vendor', type: 'toggle', label: 'Show brand on cards', group: 'Product cards', default: true },
  { id: 'show_ratings', type: 'toggle', label: 'Show ratings on cards', group: 'Product cards', default: true },
  { id: 'show_quick_add', type: 'toggle', label: 'Show quick add on cards', group: 'Product cards', default: true },
];
