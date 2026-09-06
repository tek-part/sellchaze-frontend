/**
 * Bazaar — merchant settings schema. Fields carry `group` (Colors / Typography / Header / Layout /
 * Product cards); the manifest export folds them into the backend's grouped `settings_schema`.
 */
import type { ThemeSettingsSchema } from '../../theme-engine/types';

/** Arabic-friendly Google fonts + a system option. `value` doubles as the Google Fonts family. */
export const BAZAAR_FONTS = [
  { value: 'Cairo', label: 'Cairo' },
  { value: 'Tajawal', label: 'Tajawal' },
  { value: 'IBM Plex Sans Arabic', label: 'IBM Plex Sans Arabic' },
  { value: 'Almarai', label: 'Almarai' },
  { value: 'Inter', label: 'Inter' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'system', label: 'System default' },
] as const;

export const bazaarSettingsSchema: ThemeSettingsSchema = [
  /* ---- Colors ---- */
  { id: 'primary_color', type: 'color', label: 'Primary', group: 'Colors', default: '#C2410C', hint: 'Buttons, search button, active states, category bar accents.' },
  { id: 'accent_color', type: 'color', label: 'Accent', group: 'Colors', default: '#FACC15', hint: 'Ratings, eyebrows, promo highlights.' },
  { id: 'background_color', type: 'color', label: 'Background', group: 'Colors', default: '#FFFFFF' },
  { id: 'text_color', type: 'color', label: 'Text', group: 'Colors', default: '#1F2937' },
  { id: 'sale_color', type: 'color', label: 'Sale / discount', group: 'Colors', default: '#E11D48', hint: 'Discount badges, sale prices, cart count.' },

  /* ---- Typography ---- */
  { id: 'heading_font', type: 'select', label: 'Heading font', group: 'Typography', options: BAZAAR_FONTS, default: 'Cairo' },
  { id: 'body_font', type: 'select', label: 'Body font', group: 'Typography', options: BAZAAR_FONTS, default: 'Tajawal' },
  { id: 'base_font_size', type: 'range', label: 'Base font size (px)', group: 'Typography', min: 14, max: 18, step: 1, default: 15 },

  /* ---- Header ---- */
  { id: 'show_top_bar', type: 'toggle', label: 'Show top utility bar', group: 'Header', default: true, hint: 'Announcement, language switcher and account links above the main row.' },
  {
    id: 'announcement_text',
    type: 'text',
    label: 'Announcement text',
    group: 'Header',
    translatable: true,
    default: { ar: 'شحن مجاني للطلبات فوق ٢٠٠ ر.س · توصيل خلال ٢٤ ساعة داخل الرياض', en: 'Free shipping on orders over SAR 200 · Same-day delivery in Riyadh' },
  },
  { id: 'announcement_url', type: 'url', label: 'Announcement link', group: 'Header', default: '' },
  { id: 'show_category_bar', type: 'toggle', label: 'Show category bar', group: 'Header', default: true, hint: 'The "All categories" mega-menu row under the search bar.' },
  { id: 'sticky_header', type: 'toggle', label: 'Sticky header', group: 'Header', default: true },
  {
    id: 'search_placeholder',
    type: 'text',
    label: 'Search placeholder',
    group: 'Header',
    translatable: true,
    default: { ar: 'ابحث عن منتجات، علامات تجارية وتصنيفات…', en: 'Search products, brands and categories…' },
  },

  /* ---- Layout ---- */
  { id: 'container_width', type: 'range', label: 'Content width (px)', group: 'Layout', min: 1200, max: 1600, step: 20, default: 1400 },
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
    id: 'card_style',
    type: 'select',
    label: 'Card style',
    group: 'Layout',
    options: [
      { value: 'compact', label: 'Compact — dense grids, small padding' },
      { value: 'comfortable', label: 'Comfortable — roomier cards' },
    ],
    default: 'compact',
  },

  /* ---- Product cards ---- */
  { id: 'show_ratings', type: 'toggle', label: 'Show ratings on cards', group: 'Product cards', default: true },
  { id: 'show_quick_add', type: 'toggle', label: 'Show quick add on cards', group: 'Product cards', default: true },
  { id: 'show_discount_badge', type: 'toggle', label: 'Show discount badge', group: 'Product cards', default: true, hint: 'The "-25%" style promo badge on discounted products.' },
];
