import type { HowToVariant, LandingSettings } from './document';

export type HowToKind = 'images' | 'overlap' | 'cards' | 'wave' | 'connected' | 'accordion';
export interface HowToDesign { id: HowToVariant; name: string; kind: HowToKind; padding: number; sidePadding: number; background: string; accent: string; eyebrow: string; headingSize: number; headingLine: number; align: 'start' | 'center' | 'left'; header: boolean; count: number }
const preset = (id: number, name: string, kind: HowToKind, options: Partial<HowToDesign> = {}): HowToDesign => ({ id: `howto-${id}` as HowToVariant, name, kind, padding: 40, sidePadding: 15, background: '#ffffff', accent: '#4bde1c', eyebrow: '#ff8142', headingSize: 36, headingLine: 40, align: 'center', header: true, count: 3, ...options });
export const howToDesigns: HowToDesign[] = [
  preset(1, 'خطوات مصورة ببطاقات مرقمة', 'images', { headingSize: 40, headingLine: 58 }),
  preset(2, 'صورة وصندوق خطوات متداخل', 'overlap', { padding: 80, sidePadding: 80, header: false, align: 'start' }),
  preset(3, 'بطاقات بأيقونات وخلفية هادئة', 'cards', { background: '#f8fafc', accent: '#0ea5e9', eyebrow: '#0ea5e9', align: 'left' }),
  preset(4, 'مسار متدرج بأرقام كبيرة', 'wave', { eyebrow: '#4bde1c', align: 'start' }),
  preset(5, 'خطوات دائرية بخطوط متصلة', 'connected', { eyebrow: '#05796b' }),
  preset(6, 'صورة وخطوات قابلة للفتح', 'accordion', { padding: 48, sidePadding: 48, header: false, align: 'start' }),
];
export const howToDesign = (id?: string): HowToDesign => howToDesigns.find(d => d.id === id) ?? howToDesigns[0]!;
export const howToDefaults = (id: HowToVariant): Partial<LandingSettings> => ({ variant: id });
