/**
 * Fresh — merchant settings schema. Fields carry `group` (Colors / Typography / Header / Layout /
 * Product cards); the manifest export folds them into the backend's grouped `settings_schema`.
 */
import type { ThemeSettingsSchema } from '../../theme-engine/types';

/** Friendly rounded sans + Arabic-friendly Google fonts + a system option. `value` doubles as the Google Fonts family. */
export const FRESH_FONTS = [
  { value: 'Cairo', label: 'Cairo' },
  { value: 'Nunito', label: 'Nunito' },
  { value: 'Tajawal', label: 'Tajawal' },
  { value: 'Almarai', label: 'Almarai' },
  { value: 'IBM Plex Sans Arabic', label: 'IBM Plex Sans Arabic' },
  { value: 'Rubik', label: 'Rubik' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'system', label: 'System default' },
] as const;

export const freshSettingsSchema: ThemeSettingsSchema = [
  /* ---- Colors ---- */
  { id: 'primary_color', type: 'color', label: 'Primary', group: 'Colors', default: '#15803D', hint: 'Buttons, links, quick-add, active states.' },
  { id: 'accent_color', type: 'color', label: 'Accent', group: 'Colors', default: '#84CC16', hint: 'Lime highlights, eyebrows, deal badges.' },
  { id: 'background_color', type: 'color', label: 'Background', group: 'Colors', default: '#FFFBF2', hint: 'Cream page canvas; cards stay white.' },
  { id: 'text_color', type: 'color', label: 'Text', group: 'Colors', default: '#1B2A1E' },
  { id: 'sale_color', type: 'color', label: 'Sale / discount', group: 'Colors', default: '#DC2626' },

  /* ---- Typography ---- */
  { id: 'heading_font', type: 'select', label: 'Heading font', group: 'Typography', options: FRESH_FONTS, default: 'Cairo' },
  { id: 'body_font', type: 'select', label: 'Body font', group: 'Typography', options: FRESH_FONTS, default: 'Nunito' },

  /* ---- Header ---- */
  {
    id: 'delivery_promise',
    type: 'text',
    label: 'Delivery promise',
    group: 'Header',
    translatable: true,
    hint: 'Shown in the strip above the header. Leave empty to hide.',
    default: { ar: 'توصيل خلال ٦٠ دقيقة — اطلب قبل ١٠ مساءً', en: 'Delivery in 60 minutes — order before 10 pm' },
  },
  { id: 'sticky_header', type: 'toggle', label: 'Sticky header', group: 'Header', default: true },
  { id: 'show_mobile_tabbar', type: 'toggle', label: 'Show bottom tab bar on mobile', group: 'Header', default: true, hint: 'Home · Categories · Cart · Account, pinned to the bottom on phones.' },
  { id: 'show_announcement', type: 'toggle', label: 'Show announcement bar', group: 'Header', default: true },
  {
    id: 'announcement_text',
    type: 'text',
    label: 'Announcement text',
    group: 'Header',
    translatable: true,
    default: { ar: 'توصيل مجاني للطلبات فوق ١٥٠ ر.س', en: 'Free delivery on orders over 150' },
  },

  /* ---- Layout ---- */
  { id: 'container_width', type: 'range', label: 'Content width (px)', group: 'Layout', min: 1200, max: 1600, step: 20, default: 1360 },
  {
    id: 'radius',
    type: 'select',
    label: 'Corner style',
    group: 'Layout',
    options: [
      { value: 'rounded', label: 'Rounded' },
      { value: 'pill', label: 'Pill (very rounded)' },
    ],
    default: 'pill',
  },

  /* ---- Product cards ---- */
  { id: 'show_quick_add', type: 'toggle', label: 'Show quick add + quantity stepper on cards', group: 'Product cards', default: true },
  { id: 'show_unit_label', type: 'toggle', label: 'Show unit label on cards', group: 'Product cards', default: true, hint: 'e.g. "1 kg", "per piece" — uses the product unit when the catalogue provides one.' },
  {
    id: 'default_unit_label',
    type: 'text',
    label: 'Default unit label',
    group: 'Product cards',
    translatable: true,
    default: { ar: 'للقطعة', en: 'per piece' },
  },
  { id: 'show_ratings', type: 'toggle', label: 'Show ratings on cards', group: 'Product cards', default: true },
];
