/**
 * Naseem — merchant settings schema. Fields carry `group` (Colors / Typography / Layout / Product
 * cards); the manifest export folds them into the backend's grouped `settings_schema`.
 */
import type { ThemeSettingsSchema } from '../../theme-engine/types';

/** Arabic-friendly Google fonts + a system option. `value` doubles as the Google Fonts family. */
export const NASEEM_FONTS = [
  { value: 'Tajawal', label: 'Tajawal' },
  { value: 'Cairo', label: 'Cairo' },
  { value: 'IBM Plex Sans Arabic', label: 'IBM Plex Sans Arabic' },
  { value: 'Almarai', label: 'Almarai' },
  { value: 'Rubik', label: 'Rubik' },
  { value: 'Inter', label: 'Inter' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'system', label: 'System default' },
] as const;

export const naseemSettingsSchema: ThemeSettingsSchema = [
  /* ---- Colors ---- */
  { id: 'primary_color', type: 'color', label: 'Primary', group: 'Colors', default: '#1D4ED8', hint: 'Buttons, links, active states.' },
  { id: 'accent_color', type: 'color', label: 'Accent', group: 'Colors', default: '#F59E0B', hint: 'Highlights, eyebrows, ratings.' },
  { id: 'background_color', type: 'color', label: 'Background', group: 'Colors', default: '#FFFFFF' },
  { id: 'text_color', type: 'color', label: 'Text', group: 'Colors', default: '#0F172A' },
  { id: 'sale_color', type: 'color', label: 'Sale / discount', group: 'Colors', default: '#DC2626' },

  /* ---- Typography ---- */
  { id: 'heading_font', type: 'select', label: 'Heading font', group: 'Typography', options: NASEEM_FONTS, default: 'Cairo' },
  { id: 'body_font', type: 'select', label: 'Body font', group: 'Typography', options: NASEEM_FONTS, default: 'Tajawal' },
  { id: 'base_font_size', type: 'range', label: 'Base font size (px)', group: 'Typography', min: 14, max: 18, step: 1, default: 16 },

  /* ---- Layout ---- */
  { id: 'container_width', type: 'range', label: 'Content width (px)', group: 'Layout', min: 1200, max: 1600, step: 20, default: 1320 },
  {
    id: 'radius',
    type: 'select',
    label: 'Corner style',
    group: 'Layout',
    options: [
      { value: 'sharp', label: 'Sharp' },
      { value: 'rounded', label: 'Rounded' },
      { value: 'pill', label: 'Pill' },
    ],
    default: 'rounded',
  },
  {
    id: 'header_style',
    type: 'select',
    label: 'Header style',
    group: 'Layout',
    options: [
      { value: 'classic', label: 'Classic — logo, search bar, icons + category row' },
      { value: 'centered', label: 'Centered — logo in the middle' },
      { value: 'minimal', label: 'Minimal — logo and icons only' },
    ],
    default: 'classic',
  },
  { id: 'sticky_header', type: 'toggle', label: 'Sticky header', group: 'Layout', default: true },
  { id: 'show_announcement', type: 'toggle', label: 'Show announcement bar', group: 'Layout', default: true },
  {
    id: 'announcement_text',
    type: 'text',
    label: 'Announcement text',
    group: 'Layout',
    translatable: true,
    default: { ar: 'شحن مجاني للطلبات فوق ٢٠٠ ر.س — إرجاع مجاني خلال ١٤ يوماً', en: 'Free shipping on orders over 200 — free returns within 14 days' },
  },
  { id: 'announcement_url', type: 'url', label: 'Announcement link', group: 'Layout', default: '' },

  /* ---- Product cards ---- */
  {
    id: 'card_style',
    type: 'select',
    label: 'Card style',
    group: 'Product cards',
    options: [
      { value: 'card', label: 'Bordered card' },
      { value: 'plain', label: 'Plain (image + text)' },
      { value: 'minimal', label: 'Minimal' },
    ],
    default: 'card',
  },
  { id: 'show_ratings', type: 'toggle', label: 'Show ratings on cards', group: 'Product cards', default: true },
  { id: 'show_quick_add', type: 'toggle', label: 'Show quick add on cards', group: 'Product cards', default: true },
  {
    id: 'card_ratio',
    type: 'select',
    label: 'Card image ratio',
    group: 'Product cards',
    options: [
      { value: 'square', label: 'Square' },
      { value: 'portrait', label: 'Portrait 4:5' },
      { value: 'tall', label: 'Tall 3:4' },
    ],
    default: 'square',
  },
];
