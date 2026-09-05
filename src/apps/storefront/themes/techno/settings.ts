/**
 * Techno — merchant settings schema. Fields carry `group` (Colors / Typography / Header / Layout /
 * Product cards / Appearance); the manifest export folds them into the backend's grouped
 * `settings_schema`.
 */
import type { ThemeSettingsSchema } from '../../theme-engine/types';

/** Technical sans options with Arabic coverage + a system option. `value` doubles as the Google family. */
export const TECHNO_FONTS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'IBM Plex Sans Arabic', label: 'IBM Plex Sans Arabic' },
  { value: 'Rubik', label: 'Rubik' },
  { value: 'Cairo', label: 'Cairo' },
  { value: 'Tajawal', label: 'Tajawal' },
  { value: 'Almarai', label: 'Almarai' },
  { value: 'system', label: 'System default' },
] as const;

export const technoSettingsSchema: ThemeSettingsSchema = [
  /* ---- Colors ---- */
  { id: 'primary_color', type: 'color', label: 'Primary', group: 'Colors', default: '#2563EB', hint: 'Buttons, links, active states, search button.' },
  { id: 'accent_color', type: 'color', label: 'Accent', group: 'Colors', default: '#06B6D4', hint: 'Cyan highlights: eyebrows, countdown, chips.' },
  { id: 'background_color', type: 'color', label: 'Background', group: 'Colors', default: '#F3F4F6', hint: 'Page background (cards stay white).' },
  { id: 'text_color', type: 'color', label: 'Text', group: 'Colors', default: '#0B1220' },
  { id: 'sale_color', type: 'color', label: 'Sale / discount', group: 'Colors', default: '#EF4444' },

  /* ---- Typography ---- */
  { id: 'heading_font', type: 'select', label: 'Heading font', group: 'Typography', options: TECHNO_FONTS, default: 'Inter' },
  { id: 'body_font', type: 'select', label: 'Body font', group: 'Typography', options: TECHNO_FONTS, default: 'IBM Plex Sans Arabic' },

  /* ---- Header ---- */
  { id: 'show_support_line', type: 'toggle', label: 'Show support hotline strip', group: 'Header', default: true },
  { id: 'support_phone', type: 'text', label: 'Support phone', group: 'Header', default: '+966 800 244 1200', hint: 'Shown in the top strip and footer; tapping dials it.' },
  { id: 'sticky_header', type: 'toggle', label: 'Sticky header', group: 'Header', default: true },
  { id: 'show_announcement', type: 'toggle', label: 'Show announcement bar', group: 'Header', default: true },
  {
    id: 'announcement_text',
    type: 'text',
    label: 'Announcement text',
    group: 'Header',
    translatable: true,
    default: { ar: 'شحن مجاني للطلبات فوق ٣٠٠ ر.س · تقسيط بدون فوائد مع تابي وتمارا', en: 'Free shipping over 300 SAR · 0% instalments with Tabby & Tamara' },
  },
  { id: 'announcement_url', type: 'url', label: 'Announcement link', group: 'Header', default: '' },

  /* ---- Layout ---- */
  { id: 'container_width', type: 'range', label: 'Content width (px)', group: 'Layout', min: 1200, max: 1600, step: 20, default: 1360 },
  {
    id: 'radius',
    type: 'select',
    label: 'Corner style',
    group: 'Layout',
    options: [
      { value: 'sharp', label: 'Sharp' },
      { value: 'small', label: 'Small' },
    ],
    default: 'small',
  },

  /* ---- Product cards ---- */
  { id: 'show_spec_chips', type: 'toggle', label: 'Show spec chips on cards', group: 'Product cards', default: true, hint: 'Material, sizes/capacities and tags as small chips.' },
  { id: 'show_ratings', type: 'toggle', label: 'Show ratings on cards', group: 'Product cards', default: true },
  { id: 'show_quick_add', type: 'toggle', label: 'Show quick add on cards', group: 'Product cards', default: true },
  { id: 'show_compare', type: 'toggle', label: 'Show compare button on cards', group: 'Product cards', default: true },

  /* ---- Appearance ---- */
  {
    id: 'color_scheme',
    type: 'select',
    label: 'Colour scheme',
    group: 'Appearance',
    options: [
      { value: 'auto', label: 'Auto (follow device)' },
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' },
    ],
    default: 'auto',
  },
];
