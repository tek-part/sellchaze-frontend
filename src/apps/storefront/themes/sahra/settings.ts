/**
 * Sahra (صحراء) — merchant settings schema. Fields carry `group` (Colors / Typography / Header /
 * Layout / Product cards / Appearance); the manifest export folds them into the backend's grouped
 * `settings_schema`.
 */
import type { ThemeSettingsSchema } from '../../theme-engine/types';

/** Serif display faces for headings — Latin didones + Arabic naskh. `value` doubles as the Google family. */
export const SAHRA_HEADING_FONTS = [
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Amiri', label: 'Amiri (Arabic serif)' },
  { value: 'Cormorant Garamond', label: 'Cormorant Garamond' },
  { value: 'Noto Naskh Arabic', label: 'Noto Naskh Arabic' },
  { value: 'Cairo', label: 'Cairo' },
  { value: 'system', label: 'System serif' },
] as const;

/** Quiet body faces with good Arabic coverage. */
export const SAHRA_BODY_FONTS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Tajawal', label: 'Tajawal' },
  { value: 'IBM Plex Sans Arabic', label: 'IBM Plex Sans Arabic' },
  { value: 'Almarai', label: 'Almarai' },
  { value: 'Cairo', label: 'Cairo' },
  { value: 'system', label: 'System default' },
] as const;

export const sahraSettingsSchema: ThemeSettingsSchema = [
  /* ---- Colors ---- */
  { id: 'primary_color', type: 'color', label: 'Primary (ink)', group: 'Colors', default: '#1C1A17', hint: 'Buttons, links and active states in the light scheme.' },
  { id: 'accent_color', type: 'color', label: 'Accent (gold)', group: 'Colors', default: '#C9A24D', hint: 'Thin rules, eyebrows, highlights — and the primary colour in the dark scheme.' },
  { id: 'background_color', type: 'color', label: 'Background', group: 'Colors', default: '#FBF8F3' },
  { id: 'text_color', type: 'color', label: 'Text', group: 'Colors', default: '#1C1A17' },
  { id: 'sale_color', type: 'color', label: 'Sale / discount', group: 'Colors', default: '#9B2C2C' },

  /* ---- Typography ---- */
  { id: 'heading_font', type: 'select', label: 'Heading serif', group: 'Typography', options: SAHRA_HEADING_FONTS, default: 'Playfair Display', hint: 'Amiri is paired automatically for Arabic when a Latin serif is chosen.' },
  { id: 'body_font', type: 'select', label: 'Body font', group: 'Typography', options: SAHRA_BODY_FONTS, default: 'Inter' },

  /* ---- Header ---- */
  {
    id: 'header_style',
    type: 'select',
    label: 'Header style',
    group: 'Header',
    options: [
      { value: 'centered', label: 'Centered — logo in the middle, navigation below, icons at the edges' },
      { value: 'classic', label: 'Classic — logo at the start, navigation inline, icons at the end' },
    ],
    default: 'centered',
  },
  { id: 'sticky_header', type: 'toggle', label: 'Sticky header', group: 'Header', default: true },
  { id: 'show_announcement', type: 'toggle', label: 'Show announcement bar', group: 'Header', default: true },
  {
    id: 'announcement_text',
    type: 'text',
    label: 'Announcement text',
    group: 'Header',
    translatable: true,
    default: { ar: 'تغليف هدايا مجاني · شحن مجاني للطلبات فوق ٥٠٠ ر.س', en: 'Complimentary gift wrapping · Free shipping on orders over 500' },
  },
  { id: 'announcement_url', type: 'url', label: 'Announcement link', group: 'Header', default: '' },

  /* ---- Layout ---- */
  { id: 'container_width', type: 'range', label: 'Content width (px)', group: 'Layout', min: 1200, max: 1600, step: 20, default: 1400 },
  {
    id: 'radius',
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
  { id: 'hover_second_image', type: 'toggle', label: 'Show second image on hover', group: 'Product cards', default: true },
  { id: 'show_ratings', type: 'toggle', label: 'Show ratings on cards', group: 'Product cards', default: false },
  { id: 'show_quick_add', type: 'toggle', label: 'Show quick add on cards', group: 'Product cards', default: true },

  /* ---- Appearance ---- */
  {
    id: 'color_scheme',
    type: 'select',
    label: 'Colour scheme',
    group: 'Appearance',
    options: [
      { value: 'auto', label: 'Auto (follow system)' },
      { value: 'light', label: 'Sand (light)' },
      { value: 'dark', label: 'Charcoal (dark)' },
    ],
    default: 'auto',
  },
];
