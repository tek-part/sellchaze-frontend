import type { ContentVariant, LandingSettings } from './document';

export type ContentKind = 'benefits' | 'framed' | 'quote' | 'stats' | 'cards';
export interface ContentDesign { id: ContentVariant; name: string; kind: ContentKind; background: string; padding: number; sidePadding: number; headingSize: number; headingLine: number; align: 'start' | 'center'; count: number; purchase: boolean; enterHeading: boolean }
const preset = (id: number, name: string, kind: ContentKind, options: Partial<ContentDesign> = {}): ContentDesign => ({ id: `content-${id}` as ContentVariant, name, kind, background: '#ffffff', padding: 0, sidePadding: 0, headingSize: 36, headingLine: 40, align: 'start', count: 0, purchase: false, enterHeading: false, ...options });
export const contentDesigns: ContentDesign[] = [
  preset(1, 'محتوى ومزايا مع صورتين', 'benefits', { count: 3, purchase: true, enterHeading: true }),
  preset(2, 'عنوان بين صورتين', 'framed', { background: '#f2f3f5', align: 'center', purchase: true }),
  preset(3, 'اقتباس وصورة', 'quote', { padding: 80, sidePadding: 80, headingSize: 18, headingLine: 28, align: 'center' }),
  preset(4, 'صورة وإحصاءات', 'stats', { padding: 10, sidePadding: 10, headingSize: 48, headingLine: 48, count: 4, purchase: true }),
  preset(5, 'بطاقات محتوى بأيقونات', 'cards', { background: '#f2f3f5', padding: 30, sidePadding: 20, align: 'center', count: 4, enterHeading: true }),
];
export const contentDesign = (id?: string): ContentDesign => contentDesigns.find(d => d.id === id) ?? contentDesigns[0]!;
export const contentDefaults = (id: ContentVariant): Partial<LandingSettings> => ({ variant: id });
