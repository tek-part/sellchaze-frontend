/**
 * Maison — merchant settings schema. Every field carries a `group` (Colors / Typography / Header /
 * Layout / Product cards / Footer / Appearance); the manifest export folds them into the backend's
 * grouped `settings_schema`. Colour overrides default to empty so the chosen palette preset wins
 * until the merchant picks a colour of their own.
 */
import type { ThemeSettingsSchema } from '../../theme-engine/types';

/** Display families — all self-hosted (public/media/fonts/storefront). */
export const MAISON_HEADING_FONTS = [
  { value: 'Cormorant Garamond', label: 'Cormorant Garamond (serif)' },
  { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans' },
  { value: 'IBM Plex Sans Arabic', label: 'IBM Plex Sans Arabic' },
  { value: 'Inter', label: 'Inter' },
] as const;

export const MAISON_BODY_FONTS = [
  { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans' },
  { value: 'IBM Plex Sans Arabic', label: 'IBM Plex Sans Arabic' },
  { value: 'Inter', label: 'Inter' },
  { value: 'Rubik', label: 'Rubik' },
] as const;

const colorHint = 'Leave empty to use the palette colour.';

export const maisonSettingsSchema: ThemeSettingsSchema = [
  /* ---- Colors ---- */
  {
    id: 'palette',
    type: 'select',
    label: 'Palette',
    group: 'Colors',
    options: [
      { value: 'terracotta', label: 'Linen & terracotta' },
      { value: 'olive', label: 'Olive grove' },
    ],
    default: 'terracotta',
    hint: 'A coordinated set of page, surface, accent and button colours.',
  },
  { id: 'primary_color', type: 'color', label: 'Primary', group: 'Colors', default: '', hint: `Buttons, links and hotspot pins. ${colorHint}` },
  { id: 'accent_color', type: 'color', label: 'Accent', group: 'Colors', default: '', hint: `Soft highlights and swatches. ${colorHint}` },
  { id: 'background_color', type: 'color', label: 'Background', group: 'Colors', default: '', hint: colorHint },
  { id: 'text_color', type: 'color', label: 'Text', group: 'Colors', default: '', hint: colorHint },
  { id: 'sale_color', type: 'color', label: 'Sale price', group: 'Colors', default: '', hint: colorHint },

  /* ---- Typography ---- */
  { id: 'heading_font', type: 'select', label: 'Heading font', group: 'Typography', options: MAISON_HEADING_FONTS, default: 'Cormorant Garamond', hint: 'Arabic headings always use IBM Plex Sans Arabic.' },
  { id: 'body_font', type: 'select', label: 'Body font', group: 'Typography', options: MAISON_BODY_FONTS, default: 'Plus Jakarta Sans' },

  /* ---- Header ---- */
  {
    id: 'header_layout',
    type: 'select',
    label: 'Header layout',
    group: 'Header',
    options: [
      { value: 'centered', label: 'Centred logo, menu below' },
      { value: 'classic', label: 'Logo at the start, menu beside it' },
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
    default: { ar: 'تغليف هدايا مجاني مع كل طلب · إرجاع سهل خلال ١٤ يوم', en: 'Complimentary gift wrapping on every order · Easy 14-day returns' },
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
      { value: 'soft', label: 'Soft (default)' },
      { value: 'round', label: 'Extra round' },
      { value: 'crisp', label: 'Crisp' },
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
      { value: 'tall', label: 'Tall 2:3' },
    ],
    default: 'portrait',
  },
  { id: 'show_material_line', type: 'toggle', label: 'Show material & dimensions line', group: 'Product cards', default: true, hint: 'Shown only when the product has a material or a size in its name (e.g. 200×300 cm).' },
  { id: 'show_ratings', type: 'toggle', label: 'Show ratings on cards', group: 'Product cards', default: true },
  { id: 'show_quick_add', type: 'toggle', label: 'Show quick add on cards', group: 'Product cards', default: true },

  /* ---- Footer ---- */
  {
    id: 'footer_statement',
    type: 'text',
    label: 'Footer statement',
    group: 'Footer',
    translatable: true,
    default: { ar: 'بيت يتكوّن على مهل، قطعة بعد قطعة.', en: 'A home, gathered slowly — piece by piece.' },
  },

  /* ---- Appearance ---- */
  {
    id: 'color_scheme',
    type: 'select',
    label: 'Colour scheme',
    group: 'Appearance',
    options: [
      { value: 'light', label: 'Light' },
      { value: 'auto', label: 'Auto (follow device)' },
      { value: 'dark', label: 'Dark' },
    ],
    default: 'light',
  },
];
