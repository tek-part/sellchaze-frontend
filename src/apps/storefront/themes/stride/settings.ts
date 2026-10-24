/**
 * Stride — merchant settings schema. Every field carries a `group`; the manifest export folds them
 * into the backend's grouped `settings_schema`. Fonts are limited to the self-hosted families.
 */
import type { ThemeSettingsSchema } from '../../theme-engine/types';

export const STRIDE_FONTS = [
  { value: 'Rubik', label: 'Rubik' },
  { value: 'Inter', label: 'Inter' },
  { value: 'IBM Plex Sans Arabic', label: 'IBM Plex Sans Arabic' },
  { value: 'system', label: 'System default' },
] as const;

export const strideSettingsSchema: ThemeSettingsSchema = [
  /* ---- Colors ---- */
  {
    id: 'color_scheme',
    type: 'select',
    label: 'Colour scheme',
    group: 'Colors',
    options: [
      { value: 'dark', label: 'Night (dark)' },
      { value: 'light', label: 'Court (light)' },
      { value: 'auto', label: 'Follow the shopper’s device' },
    ],
    default: 'dark',
  },
  {
    id: 'accent_preset',
    type: 'select',
    label: 'Accent',
    group: 'Colors',
    options: [
      { value: 'volt', label: 'Volt (electric lime)' },
      { value: 'red', label: 'Race red' },
      { value: 'custom', label: 'Custom colour' },
    ],
    default: 'volt',
  },
  { id: 'accent_color', type: 'color', label: 'Custom accent', group: 'Colors', default: '#D4FF1E', hint: 'Used when Accent is “Custom colour”. Text on it switches between black and white automatically.' },

  /* ---- Typography ---- */
  { id: 'heading_font', type: 'select', label: 'Heading font', group: 'Typography', options: STRIDE_FONTS, default: 'Rubik' },
  { id: 'body_font', type: 'select', label: 'Body font', group: 'Typography', options: STRIDE_FONTS, default: 'Inter' },
  {
    id: 'heading_style',
    type: 'select',
    label: 'Display headings',
    group: 'Typography',
    options: [
      { value: 'slanted', label: 'Slanted (motion)' },
      { value: 'upright', label: 'Upright' },
    ],
    default: 'slanted',
    hint: 'Latin headings only — Arabic headings always stay upright.',
  },
  {
    id: 'heading_case',
    type: 'select',
    label: 'Heading case',
    group: 'Typography',
    options: [
      { value: 'upper', label: 'UPPERCASE' },
      { value: 'normal', label: 'As typed' },
    ],
    default: 'upper',
  },

  /* ---- Header ---- */
  { id: 'sticky_header', type: 'toggle', label: 'Sticky header', group: 'Header', default: true },
  { id: 'show_announcement', type: 'toggle', label: 'Show announcement ticker', group: 'Header', default: true },
  {
    id: 'announcement_text',
    type: 'text',
    label: 'Announcement text',
    group: 'Header',
    translatable: true,
    default: {
      ar: 'استبدال المقاس مجاناً خلال ١٤ يوم | إصدارات جديدة كل خميس | توصيل سريع لكل المحافظات',
      en: 'Free size exchange within 14 days | New drops every Thursday | Fast delivery nationwide',
    },
    hint: 'Separate several messages with “|”.',
  },
  { id: 'announcement_url', type: 'url', label: 'Announcement link', group: 'Header', default: '' },
  { id: 'ticker_motion', type: 'toggle', label: 'Scroll the ticker', group: 'Header', default: true, hint: 'Shoppers who prefer reduced motion always see a static bar.' },

  /* ---- Layout ---- */
  { id: 'container_width', type: 'range', label: 'Content width (px)', group: 'Layout', min: 1200, max: 1680, step: 20, default: 1440 },
  {
    id: 'corners',
    type: 'select',
    label: 'Corner style',
    group: 'Layout',
    options: [
      { value: 'sharp', label: 'Sharp' },
      { value: 'soft', label: 'Soft' },
    ],
    default: 'sharp',
  },

  /* ---- Product cards ---- */
  { id: 'show_swatches', type: 'toggle', label: 'Show colour dots', group: 'Product cards', default: true, hint: 'Built from the product’s colour options.' },
  { id: 'show_new_badge', type: 'toggle', label: 'Highlight “New” badges', group: 'Product cards', default: true },
  { id: 'show_low_stock', type: 'toggle', label: 'Show low-stock badge', group: 'Product cards', default: true },
  { id: 'low_stock_threshold', type: 'range', label: 'Low stock at or below', group: 'Product cards', min: 1, max: 20, step: 1, default: 5 },
  { id: 'show_ratings', type: 'toggle', label: 'Show ratings', group: 'Product cards', default: true },
  { id: 'show_quick_add', type: 'toggle', label: 'Show quick add', group: 'Product cards', default: true },
];
