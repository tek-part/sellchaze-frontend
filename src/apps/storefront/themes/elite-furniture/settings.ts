import type { ThemeSettingsSchema } from '../../theme-engine/types';

export const eliteSettings: ThemeSettingsSchema = [
  { id: 'primary_color', type: 'color', label: 'Accent', group: 'Colors', default: '#C8AA62' },
  { id: 'background_color', type: 'color', label: 'Background', group: 'Colors', default: '#EFEFEF' },
  { id: 'text_color', type: 'color', label: 'Text', group: 'Colors', default: '#111111' },
  { id: 'body_font', type: 'select', label: 'Body font', group: 'Typography', default: 'Instrument Sans', options: ['Instrument Sans', 'IBM Plex Sans Arabic', 'system'].map(value => ({ value, label: value })) },
  { id: 'show_newsletter', type: 'toggle', label: 'Footer newsletter', group: 'Footer', default: true },
  { id: 'address', type: 'textarea', label: 'Address', group: 'Footer', translatable: true, default: '' },
];
