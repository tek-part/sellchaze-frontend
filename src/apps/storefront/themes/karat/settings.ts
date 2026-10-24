/**
 * Karat — merchant settings schema. Every field carries a `group`; the manifest export folds them
 * into the backend's grouped `settings_schema`. Fonts are limited to the self-hosted families.
 */
import type { ThemeSettingsSchema } from '../../theme-engine/types';

export const KARAT_HEADING_FONTS = [
  { value: 'Cormorant Garamond', label: 'Cormorant Garamond (serif)' },
  { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans' },
  { value: 'IBM Plex Sans Arabic', label: 'IBM Plex Sans Arabic' },
] as const;

export const KARAT_BODY_FONTS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'IBM Plex Sans Arabic', label: 'IBM Plex Sans Arabic' },
  { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans' },
  { value: 'Rubik', label: 'Rubik' },
] as const;

export const karatSettingsSchema: ThemeSettingsSchema = [
  /* ---- Colors ---- */
  {
    id: 'palette',
    type: 'select',
    label: 'Palette',
    group: 'Colors',
    options: [
      { value: 'emerald', label: 'Emerald night (deep ink-green)' },
      { value: 'onyx', label: 'Onyx (black)' },
      { value: 'ivory', label: 'Ivory (light)' },
    ],
    default: 'emerald',
    hint: 'The whole storefront follows this palette; gold stays the only accent.',
  },
  { id: 'accent_color', type: 'color', label: 'Gold accent', group: 'Colors', default: '', hint: 'Leave empty for the palette’s champagne gold.' },

  /* ---- Typography ---- */
  { id: 'heading_font', type: 'select', label: 'Display font', group: 'Typography', options: KARAT_HEADING_FONTS, default: 'Cormorant Garamond', hint: 'Arabic headings always use IBM Plex Sans Arabic.' },
  { id: 'body_font', type: 'select', label: 'Body font', group: 'Typography', options: KARAT_BODY_FONTS, default: 'Inter' },

  /* ---- Header ---- */
  { id: 'show_announcement', type: 'toggle', label: 'Show announcement bar', group: 'Header', default: true },
  {
    id: 'announcement_text',
    type: 'text',
    label: 'Announcement text',
    group: 'Header',
    translatable: true,
    default: { ar: 'نقش مجاني على الخواتم والأساور · تغليف هدايا أنيق مع كل طلب', en: 'Complimentary engraving on rings and bracelets · Gift-ready packaging on every order' },
  },
  { id: 'announcement_url', type: 'url', label: 'Announcement link', group: 'Header', default: '' },
  { id: 'sticky_header', type: 'toggle', label: 'Sticky header', group: 'Header', default: true },

  /* ---- Concierge ---- */
  { id: 'whatsapp_number', type: 'text', label: 'WhatsApp number', group: 'Concierge', default: '', hint: 'International format, e.g. +20 100 000 0000. Falls back to the store phone.' },
  { id: 'show_header_concierge', type: 'toggle', label: 'Show concierge link in header', group: 'Concierge', default: true },

  /* ---- Layout ---- */
  { id: 'container_width', type: 'range', label: 'Content width (px)', group: 'Layout', min: 1160, max: 1600, step: 20, default: 1320 },
  {
    id: 'corners',
    type: 'select',
    label: 'Corner style',
    group: 'Layout',
    options: [
      { value: 'square', label: 'Square (classic)' },
      { value: 'soft', label: 'Softly rounded' },
    ],
    default: 'square',
  },

  /* ---- Product cards ---- */
  { id: 'show_specs', type: 'toggle', label: 'Show metal, karat and weight on cards', group: 'Product cards', default: true, hint: 'Read from the product material and variant options (Metal / Karat / Weight).' },
  { id: 'show_vendor', type: 'toggle', label: 'Show brand / maker on cards', group: 'Product cards', default: true },
  { id: 'show_ratings', type: 'toggle', label: 'Show ratings on cards', group: 'Product cards', default: false },
  { id: 'show_quick_add', type: 'toggle', label: 'Show “Add to bag” on cards', group: 'Product cards', default: true },
  {
    id: 'card_ratio',
    type: 'select',
    label: 'Card image shape',
    group: 'Product cards',
    options: [
      { value: 'portrait', label: 'Portrait 4:5' },
      { value: 'square', label: 'Square 1:1' },
    ],
    default: 'portrait',
  },

  /* ---- Motion ---- */
  {
    id: 'motion',
    type: 'select',
    label: 'Motion',
    group: 'Motion',
    options: [
      { value: 'subtle', label: 'Slow and subtle' },
      { value: 'none', label: 'None' },
    ],
    default: 'subtle',
    hint: 'Visitors who ask their device for reduced motion never see animation.',
  },
];
