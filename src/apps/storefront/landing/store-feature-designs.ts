import type { LandingItem, LandingSettings, StoreFeatureVariant } from './document';

export type FeatureKind = 'cards' | 'benefits' | 'horizontal' | 'split' | 'logos' | 'ticker' | 'numbers' | 'statement';
export interface StoreFeatureDesign {
  id: StoreFeatureVariant; name: string; count: number; kind: FeatureKind; columns: number; gap: number;
  accent: string; background: string; foreground: string; bodyColor: string; cardBackground: string;
  cardPadding: string; radius: number; border: string; badge: 'tile' | 'circle' | 'ring' | 'plain' | 'offset' | 'orbit' | 'soft';
  badgeSize: number; iconSize: number; badgeBackground: string; iconColor: string;
  align: 'start' | 'center'; headingAlign: 'start' | 'center'; header: boolean;
  hoverBackground?: string; hoverForeground?: string; shadow?: boolean; frame?: boolean; wobble?: boolean; glow?: boolean;
}
const base = {
  kind: 'benefits', columns: 4, gap: 25, accent: '#171717', background: '#ffffff', foreground: '#171717', bodyColor: '#757575',
  cardBackground: 'transparent', cardPadding: '0px', radius: 0, border: '0px solid transparent', badge: 'plain', badgeSize: 48,
  iconSize: 32, badgeBackground: 'transparent', iconColor: '#171717', align: 'center', headingAlign: 'center', header: false,
} as const;
const design = (id: number, name: string, count: number, changes: Partial<StoreFeatureDesign> = {}): StoreFeatureDesign => ({ ...base, id: `features-${id}`, name, count, ...changes });

/** Native structures and geometric presets. No reference images, CSS or commercial sample claims are bundled. */
export const storeFeatureDesigns: StoreFeatureDesign[] = [
  design(1, 'بطاقات بإطار وأيقونة رمادية', 6, { kind: 'cards', columns: 3, gap: 40, radius: 18, border: '1px solid #e7e7e7', cardBackground: '#ffffff', cardPadding: '25px', badge: 'tile', badgeSize: 45, iconSize: 24, badgeBackground: '#ececec', accent: '#0abb45', header: true, wobble: true }),
  design(2, 'أربع بطاقات بأيقونات خطية', 4, { kind: 'cards', gap: 20, radius: 18, border: '2px solid #e7e7e7', cardBackground: '#ffffff', cardPadding: '30px 20px', foreground: '#253d4e', bodyColor: '#778399', iconSize: 40 }),
  design(3, 'شبكة بشارات وردية', 6, { columns: 3, gap: 40, radius: 28, badge: 'circle', badgeSize: 48, iconSize: 24, badgeBackground: '#ff5670', iconColor: '#ffffff', accent: '#ff5670', header: true, headingAlign: 'start', wobble: true }),
  design(4, 'أيقونة بجوار كبسولة النص', 3, { kind: 'horizontal', columns: 3, gap: 10, radius: 14, badge: 'soft', badgeSize: 70, iconSize: 36, badgeBackground: '#f6f3ff', iconColor: '#2563eb', foreground: '#152c31', bodyColor: '#243f2f', header: true, headingAlign: 'start', align: 'start', wobble: true }),
  design(5, 'بطاقات ناعمة بتمييز برتقالي', 4, { kind: 'cards', columns: 2, gap: 20, cardPadding: '25px', radius: 18, cardBackground: '#f3f3f7ab', badge: 'tile', badgeSize: 60, badgeBackground: '#ffffff', iconSize: 32, accent: '#ff813b', hoverBackground: '#ff813b', hoverForeground: '#ffffff', align: 'start', headingAlign: 'start', header: true }),
  design(6, 'بطاقات بإطار وتمييز توتي', 8, { kind: 'cards', gap: 20, cardPadding: '20px', radius: 18, border: '1px solid #e7e7e7', cardBackground: '#ffffff', badge: 'tile', badgeSize: 45, iconSize: 24, badgeBackground: '#ececec', accent: '#bc254e', hoverBackground: '#bc254e', hoverForeground: '#ffffff', header: true, wobble: true }),
  design(7, 'بطاقات بشارات دائرية حمراء', 4, { kind: 'cards', columns: 2, gap: 40, cardPadding: '25px', radius: 18, border: '1px solid #e7e7e7', cardBackground: '#ffffff', badge: 'circle', badgeSize: 45, iconSize: 24, badgeBackground: '#8d0023', iconColor: '#ffffff', accent: '#8d0023', align: 'start', header: true, wobble: true }),
  design(8, 'ثلاث مزايا بنفسجية بظل تفاعلي', 3, { columns: 3, gap: 40, cardPadding: '25px', radius: 28, iconSize: 44, iconColor: '#7b4cdf', accent: '#7b4cdf', background: '#f8f9fc', hoverBackground: '#ffffff', header: true, align: 'start', headingAlign: 'start', wobble: true }),
  design(9, 'بطاقات دائرية بتمييز أسود', 6, { kind: 'cards', columns: 3, gap: 20, cardPadding: '25px', radius: 24, border: '1px solid #e6ddfe', badge: 'circle', badgeSize: 45, iconSize: 24, badgeBackground: '#000000', iconColor: '#ffffff', hoverBackground: '#000000', hoverForeground: '#ffffff', header: true, wobble: true }),
  design(10, 'أيقونات بارزة وتمييز ليموني', 4, { kind: 'cards', gap: 20, cardPadding: '25px', radius: 24, border: '1px solid #e7e7e7', cardBackground: '#ffffff', iconSize: 60, badgeSize: 60, accent: '#b5ef35', hoverBackground: '#b5ef35', hoverForeground: '#171717', shadow: true, align: 'start', headingAlign: 'start', header: true }),
  design(11, 'بطاقات بأيقونات فيروزية', 6, { kind: 'cards', columns: 3, gap: 20, cardPadding: '25px', radius: 18, border: '1px solid #d8d8d866', cardBackground: '#ffffff', badge: 'tile', badgeSize: 52, iconSize: 30, badgeBackground: '#0d9488', iconColor: '#ffffff', accent: '#0d9488', shadow: true, align: 'start', headingAlign: 'start', header: true }),
  design(12, 'عنوان جانبي وبطاقات متدرجة', 4, { kind: 'split', columns: 2, gap: 20, cardPadding: '25px', radius: 18, border: '1px solid #d8d8d866', cardBackground: '#ffffff', badge: 'tile', badgeSize: 60, iconSize: 36, badgeBackground: '#ff6e3556', iconColor: '#ff6e35', accent: '#ff6e35', shadow: true, align: 'start', headingAlign: 'start', header: true }),
  design(13, 'صف بطاقات أفقية بنفسجية', 4, { kind: 'horizontal', gap: 10, cardPadding: '14px', radius: 14, border: '1px solid #f4f5f7', cardBackground: '#f4f6fa', badge: 'tile', badgeSize: 46, iconColor: '#603664', foreground: '#152c31', bodyColor: '#243f2f', align: 'start' }),
  design(14, 'دوائر بنفسجية بحافة ليمونية', 4, { badge: 'ring', badgeSize: 70, iconSize: 40, badgeBackground: '#5c0f8b', iconColor: '#ffffff', accent: '#d8f38a', foreground: '#5c0f8b', bodyColor: '#000000b3' }),
  design(15, 'أيقونات خطية بدوائر خفيفة', 4, { badge: 'soft', badgeSize: 70, iconSize: 40, badgeBackground: '#dbe2ef30', foreground: '#000000', bodyColor: '#000000b3' }),
  design(16, 'ثلاث أيقونات بظل جانبي', 3, { columns: 3, gap: 40, badge: 'offset', badgeSize: 58, iconSize: 44, iconColor: '#3a4d5f', accent: '#a48ac0', foreground: '#3a4d5f', background: '#f4f7f7' }),
  design(17, 'مجموعة بإطار وتوهج وردي', 4, { gap: 35, badge: 'orbit', badgeSize: 65, iconSize: 44, iconColor: '#bf58a0', accent: '#bf58a0', foreground: '#603664', header: true, frame: true, glow: true }),
  design(18, 'مزايا وردية بتوهج ناعم', 4, { gap: 35, badgeSize: 65, iconSize: 44, iconColor: '#bf58a0', accent: '#bf58a0', foreground: '#112d4e', header: true, glow: true }),
  design(19, 'كبسولة بأيقونات جانبية', 4, { kind: 'horizontal', gap: 35, badge: 'orbit', badgeSize: 70, iconSize: 42, badgeBackground: '#dbe2ef', iconColor: '#2f6b72', accent: '#e8cf6e', foreground: '#8e741b', frame: true }),
  design(20, 'ثلاث مزايا ضمن إطار ناعم', 3, { columns: 3, gap: 40, badge: 'soft', badgeSize: 70, iconSize: 42, badgeBackground: '#dbe2ef', iconColor: '#bf8c18', foreground: '#3a4d5f', frame: true }),
  design(21, 'كبسولة بيضاء وأيقونات بحواف', 4, { gap: 35, badge: 'orbit', badgeSize: 70, iconSize: 42, badgeBackground: '#ececec', iconColor: '#603664', foreground: '#5c0f8b', background: '#ececec', frame: true }),
  design(22, 'أربع دوائر وعناوين بنفسجية', 4, { gap: 35, badge: 'soft', badgeSize: 60, iconSize: 36, badgeBackground: '#ffffff', iconColor: '#603664', foreground: '#5c0f8b', background: '#fafafa' }),
  design(23, 'أيقونات صغيرة بألوان هادئة', 4, { gap: 35, badge: 'soft', badgeSize: 42, iconSize: 28, badgeBackground: '#e9e9d8', iconColor: '#66645a', foreground: '#4a4a4a', bodyColor: '#777777' }),
  design(24, 'بطاقات مستديرة وأيقونات حمراء', 4, { kind: 'cards', gap: 40, radius: 40, border: '1px solid #b6a5aa', cardPadding: '25px', iconSize: 64, badgeSize: 70, iconColor: '#c64d55' }),
  design(25, 'ثلاث أيقونات كبيرة بنفسجية', 3, { columns: 3, gap: 40, badgeSize: 80, iconSize: 72, iconColor: '#8172b4', foreground: '#3a4d5f', accent: '#8c2d82', header: true }),
  design(26, 'صف أيقونات بهالات خفيفة', 4, { badge: 'soft', badgeSize: 70, iconSize: 32, badgeBackground: '#dbe2ef30', iconColor: '#171717', frame: true }),
  design(27, 'أربع مزايا بأيقونات سوداء', 4, { iconSize: 42, bodyColor: '#243f2f' }),
  design(28, 'ثلاث مزايا مختصرة', 3, { columns: 3, iconSize: 32, foreground: '#253d4e' }),
  design(29, 'أيقونات ملوّنة مع الوصف', 4, { iconSize: 44, iconColor: '#2f6b72', foreground: '#243f2f', bodyColor: '#243f2f' }),
  design(30, 'كبسولات صغيرة بإطار وظل', 4, { kind: 'horizontal', gap: 10, cardPadding: '14px', radius: 14, border: '1px solid #f4f5f7', cardBackground: '#ffffff', badge: 'tile', badgeSize: 46, badgeBackground: '#f4f5f7', foreground: '#152c31', bodyColor: '#243f2f', shadow: true, align: 'start' }),
  design(31, 'لوحة خوخية بأربع مزايا', 4, { cardPadding: '0px', gap: 25, background: '#ffc09d', foreground: '#231f1d', bodyColor: '#5d5656', radius: 10, iconSize: 32 }),
  design(32, 'شريط أسود بأيقونة ونص', 4, { kind: 'horizontal', background: '#000000', foreground: '#ffffff', iconColor: '#ffffff', iconSize: 32, badgeSize: 36 }),
  design(33, 'أربع خلايا بفواصل مستقيمة', 4, { kind: 'cards', gap: 0, border: '1px solid #1c1c1c1a', cardPadding: '20px', badge: 'soft', badgeSize: 55, badgeBackground: '#dbe2ef30', iconSize: 40, foreground: '#243f2f', bodyColor: '#243f2f' }),
  design(34, 'شريط أسود مضغوط', 4, { kind: 'horizontal', background: '#000000', foreground: '#ffffff', iconColor: '#ffffff', iconSize: 30, badgeSize: 32 }),
  design(35, 'شريط شعارات على خلفية سوداء', 5, { kind: 'logos', columns: 5, background: '#000000', foreground: '#ffffff', iconColor: '#ffffff', badgeSize: 80, iconSize: 70 }),
  design(36, 'خلفية رمادية وأيقونات نعناعية', 4, { background: '#374657', foreground: '#ffffff', bodyColor: '#ffffff', iconColor: '#5be3ac', iconSize: 52, badgeSize: 58 }),
  design(37, 'رموز ثقة على خلفية رمادية', 4, { background: '#eeeeee', cardPadding: '13px', radius: 24, iconSize: 48, foreground: '#000000', bodyColor: '#272727' }),
  design(38, 'رموز ثقة بيضاء على الأسود', 4, { background: '#000000', cardPadding: '13px', radius: 24, iconSize: 48, iconColor: '#ffffff', foreground: '#ffffff', bodyColor: '#ffffff' }),
  design(39, 'أيقونات وعناوين باللون الكحلي', 4, { cardPadding: '13px', radius: 24, iconSize: 48, iconColor: '#001675', foreground: '#001675', bodyColor: '#272727' }),
  design(40, 'شريط نصي متحرك بنفسجي', 6, { kind: 'ticker', background: '#603664', foreground: '#ffffff', iconColor: '#ffffff' }),
  design(41, 'بطاقات الأرقام والإحصاءات', 3, { kind: 'numbers', columns: 3, gap: 30, radius: 36, cardBackground: '#ffffff', cardPadding: '30px', accent: '#8bcd2b', foreground: '#8bcd2b', bodyColor: '#101010', background: '#f7f8fa', header: true }),
  design(42, 'عبارة ذهبية على خلفية سوداء', 0, { kind: 'statement', columns: 1, background: '#000000', foreground: '#ddb76a', bodyColor: '#ddb76a', accent: '#ddb76a', header: true }),
  design(43, 'شريط نصي متحرك أسود', 6, { kind: 'ticker', background: '#000000', foreground: '#ffffff' }),
  design(44, 'شريط فحمي وأيقونات فيروزية', 4, { background: '#222222', foreground: '#ffffff', bodyColor: '#ffffff', iconColor: '#38b8c2', iconSize: 48 }),
  design(45, 'شريط نصي متحرك أحمر', 6, { kind: 'ticker', background: '#d92d36', foreground: '#ffffff' }),
];
export const storeFeatureDesign = (id?: string) => storeFeatureDesigns.find(value => value.id === id) ?? storeFeatureDesigns[0]!;
export function storeFeatureDefaults(variant: StoreFeatureVariant): Partial<LandingSettings> {
  const d = storeFeatureDesign(variant);
  return { variant, accent: d.accent, background: d.background, foreground: d.foreground, secondary_foreground: d.bodyColor, card_background: d.cardBackground, icon_color: d.iconColor, icon_background: d.badgeBackground, hover_background: d.hoverBackground ?? d.cardBackground, hover_foreground: d.hoverForeground ?? d.foreground, hover_secondary_foreground: d.hoverForeground ?? d.bodyColor, padding: d.kind === 'ticker' ? 15 : 30, align: d.headingAlign, motion: true };
}
/** Neutral examples are only used inside the editor/gallery and never added to a saved document. */
export function storeFeatureExamples(variant: StoreFeatureVariant): LandingItem[] {
  const d = storeFeatureDesign(variant);
  return Array.from({ length: d.count }, (_, index) => ({ title: d.kind === 'numbers' ? '—' : `عنوان الميزة ${index + 1}`, text: 'اكتب تفاصيل هذه الميزة من إعدادات القسم.', icon: ['truck', 'box', 'shield', 'support', 'gift', 'card'][index % 6] }));
}
