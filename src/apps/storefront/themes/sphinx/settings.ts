import type { ThemeSettingsSchema } from '../../theme-engine/types';

const fonts = ['Raleway', 'Cairo', 'IBM Plex Sans Arabic', 'system'].map((value) => ({ value, label: value === 'system' ? 'System font' : value }));
export const sphinxSettingsSchema: ThemeSettingsSchema = [
  { id: 'primary_color', type: 'color', label: 'Primary color', group: 'Colors', default: '#006C35' },
  { id: 'background_color', type: 'color', label: 'Background', group: 'Colors', default: '#FFFFFF' },
  { id: 'text_color', type: 'color', label: 'Text', group: 'Colors', default: '#131316' },
  { id: 'sale_color', type: 'color', label: 'Discount badges', group: 'Colors', default: '#E8434C' },
  { id: 'heading_font', type: 'select', label: 'Heading font', group: 'Typography', options: fonts, default: 'Raleway' },
  { id: 'body_font', type: 'select', label: 'Body font', group: 'Typography', options: fonts, default: 'system' },
  { id: 'container_width', type: 'range', label: 'Content width', group: 'Layout', min: 960, max: 1600, step: 4, default: 1316 },
  { id: 'show_announcement', type: 'toggle', label: 'Show announcement', group: 'Header', default: true },
  { id: 'announcement_text', type: 'text', label: 'Announcement', group: 'Header', translatable: true, default: { ar: 'أهلًا بكم في متجرنا', en: 'Welcome to our store' } },
  { id: 'show_newsletter', type: 'toggle', label: 'Show newsletter form', group: 'Footer', default: true },
  { id: 'newsletter_heading', type: 'text', label: 'Newsletter heading', group: 'Footer', translatable: true, default: { ar: 'اشترك في نشرتنا لتصلك أخبار المتجر', en: 'Subscribe to our newsletter for store updates' } },
  { id: 'newsletter_text', type: 'text', label: 'Newsletter description', group: 'Footer', translatable: true, default: { ar: 'الجديد والعروض، مباشرة إليك', en: 'New arrivals and offers, directly to you' } },
  { id: 'address', type: 'textarea', label: 'Store address', group: 'Footer', translatable: true, default: '' },
];
