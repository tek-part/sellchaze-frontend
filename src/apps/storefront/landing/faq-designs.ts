import type { FaqVariant, LandingSettings } from './document';

export interface FaqDesign {
  id: FaqVariant; name: string; count: number; columns: number; width: number; gap: string;
  background: string; foreground: string; questionColor: string; questionBackground: string;
  border: string; radius: number; shadow: string; groupBackground: string; groupPadding: string;
  groupRadius: number; groupShadow: string; eyebrow: string; headingSize: number;
  headingAlign: 'center' | 'start'; icon: 'chevron' | 'circle' | 'square'; iconColor: string;
  rule?: string; gradient?: boolean; split?: boolean; frame?: boolean; badge?: boolean; descriptionBelow?: boolean;
  headerFrame?: boolean; purchase?: boolean; questionSize?: number; questionPadding?: number;
}
const base = {
  count: 6, columns: 2, width: 1200, gap: '20px', background: '#ffffff', foreground: '#171717',
  questionColor: '#020202', questionBackground: 'transparent', border: '1px solid #e1e1e1', radius: 14,
  shadow: 'none', groupBackground: 'transparent', groupPadding: '0px', groupRadius: 0, groupShadow: 'none',
  eyebrow: '#171717', headingSize: 40, headingAlign: 'center', icon: 'chevron', iconColor: 'currentColor',
} as const;
const preset = (id: number, name: string, changes: Partial<FaqDesign> = {}): FaqDesign => ({ ...base, id: `faq-${id}`, name, ...changes });

/** Native accordion geometry. Examples are confined to the editor, never merchant policies. */
export const faqDesigns: FaqDesign[] = [
  preset(1, 'صفوف بظل أسود جانبي', { count: 3, columns: 1, border: '2px solid #000000', radius: 8, shadow: '-6px 6px 0 #000000', questionBackground: '#ffffff', headingSize: 25.6, questionSize: 19.2, questionPadding: 16 }),
  preset(2, 'كبسولات داخل مجموعة خضراء', { width: 1280, groupBackground: '#bff3855e', groupPadding: '60px 24px', groupRadius: 22, questionBackground: '#ffffff', border: '0px solid transparent', radius: 35, questionColor: '#393e46', icon: 'circle', iconColor: '#bff385', badge: true }),
  preset(3, 'بطاقات بيضاء وعنوان أحمر', { width: 1280, background: '#fafafa', questionBackground: '#ffffff', border: '0px solid transparent', radius: 20, foreground: '#be1300', eyebrow: '#032346', questionColor: '#101010' }),
  preset(4, 'مجموعة كريمية بظل بارز', { width: 1280, groupBackground: '#fffcdd', groupPadding: '50px', groupRadius: 40, groupShadow: '10px 10px 0 #141414', border: '2px solid #141414' }),
  preset(5, 'إطار أبيض على الأسود', { background: '#000000', foreground: '#e5e5e5', questionColor: '#ffffff', border: '1px solid #ffffff', radius: 16 }),
  preset(6, 'شبكة هادئة بلمسة بنفسجية', { width: 1220, gap: '5px 20px', questionBackground: '#ffffff', border: '1px solid #d6dce999', questionColor: '#483b36', foreground: '#365486', eyebrow: '#ad88c6', badge: true }),
  preset(7, 'حدود وظلال بنفسجية', { width: 1220, gap: '5px 20px', questionBackground: '#ffffff', border: '1px solid #0f4c75', radius: 11, shadow: '-6px 6px 0 #9b7ebd', questionColor: '#483b36', foreground: '#365486', eyebrow: '#ad88c6', gradient: true, badge: true, icon: 'square', iconColor: '#9b7ebd' }),
  preset(8, 'بطاقات بظل ناعم وعنوان متدرج', { width: 1220, gap: '5px 20px', questionBackground: '#ffffff', border: '1px solid #d6dce999', radius: 16, shadow: '0 2px 4px #0000001a', questionColor: '#483b36', foreground: '#365486', eyebrow: '#ad88c6', gradient: true, badge: true, icon: 'square', iconColor: '#d6dce9' }),
  preset(9, 'خلفية زرقاء فاتحة', { width: 1220, gap: '5px 20px', background: '#eff7fe', questionBackground: '#ffffff', border: '1px solid #cccccc', questionColor: '#053148', foreground: '#053148', eyebrow: '#1f7fc8', badge: true }),
  preset(10, 'حدود بيضاء متقطعة', { background: '#000000', foreground: '#e5e5e5', questionColor: '#ffffff', border: '1px dashed #ffffff', radius: 0 }),
  preset(11, 'بطاقات فحمية على الأبيض', { questionBackground: '#252525', questionColor: '#ffffff', border: '2px solid #d6dce999', radius: 20, foreground: '#252525' }),
  preset(12, 'مجموعة بيضاء على الرمادي', { width: 1280, background: '#f5f5f5', groupBackground: '#ffffff', groupPadding: '20px', groupRadius: 24, border: '1px solid #999999', foreground: '#4d4d4d' }),
  preset(13, 'إطار مربع بلون ذهبي', { width: 1280, border: '1px solid #000000', radius: 0, questionColor: '#473300', foreground: '#946b00' }),
  preset(14, 'شبكة بحدود مربعة رفيعة', { border: '1px solid #cdcdcd', radius: 0, questionColor: '#1a1a1a', foreground: '#1a1a1a' }),
  preset(15, 'عمودان بفواصل سفلية', { gap: '0px 45px', border: '0px solid transparent', rule: '1px solid #cdcdcd', radius: 0, foreground: '#2c2c2c' }),
  preset(16, 'حدود كريمية مستديرة', { border: '1px solid #dbd8b4', radius: 16, questionColor: '#333333', foreground: '#1a1a1a' }),
  preset(17, 'بطاقات بنفسجية شفافة', { questionBackground: '#9786c96b', border: '1px dashed #cdcdcd', radius: 16, questionColor: '#5c0f8b', foreground: '#4d4d4d', eyebrow: '#5c0f8b' }),
  preset(18, 'كبسولات بإشارات خضراء', { questionBackground: '#ffffff', border: '0px solid transparent', radius: 35, questionColor: '#393e46', foreground: '#152c31', eyebrow: '#152c31', groupPadding: '0px 10px', groupBackground: '#bff3855e', groupRadius: 22, icon: 'circle', iconColor: '#bff385', badge: true, headerFrame: true }),
  preset(19, 'أخضر زيتوني هادئ', { questionBackground: '#49730c1f', border: '1px solid #999999', radius: 16, questionColor: '#203403', foreground: '#4d4d4d', eyebrow: '#49730c' }),
  preset(20, 'إطار رمادي بسيط', { border: '1px solid #999999', foreground: '#4d4d4d' }),
  preset(21, 'فواصل فاتحة على الفحم', { gap: '0px 45px', background: '#141414', foreground: '#ffffff', questionColor: '#ffffff', border: '0px solid transparent', rule: '1px solid #cdcdcd', radius: 0 }),
  preset(22, 'حدود متقطعة وخلفية رملية', { background: '#d3bfa9', border: '1px dashed #ffffff', radius: 0, foreground: '#000000', purchase: true }),
  preset(23, 'لافندر على الأخضر الليموني', { background: '#ecffb5', questionBackground: '#f6e6ff', border: '1px dashed #cdcdcd', radius: 16, questionColor: '#5c0f8b', foreground: '#4d4d4d', eyebrow: '#5c0f8b' }),
  preset(24, 'إطار أسود على الأخضر الفاتح', { background: '#e8fdda', border: '2px solid #141414', radius: 16, questionColor: '#1d1d1d', eyebrow: '#1d1d1d' }),
  preset(25, 'إطار كريمي بظلال سوداء', { groupBackground: '#fffcdd', groupPadding: '0px', groupRadius: 40, groupShadow: '10px 10px 0 #141414', border: '2px solid #141414', radius: 16, shadow: '-6px 6px 0 #000000', questionColor: '#141414', foreground: '#152c31', eyebrow: '#152c31', icon: 'circle', iconColor: '#141414', badge: true, frame: true, headerFrame: true }),
  preset(26, 'بطاقات داكنة بإطار فاتح', { background: '#252525', foreground: '#e5e5e5', questionColor: '#ffffff', border: '1px solid #ffffff', radius: 16 }),
  preset(27, 'فحمي بتمييز أحمر', { background: '#ffffff', questionBackground: '#1b1b1b', border: '1px dashed #ffffff', radius: 0, foreground: '#d92d36', questionColor: '#d92d36', frame: true }),
  preset(28, 'عنوان مركزي بتمييز أخضر', { radius: 16, eyebrow: '#0abb45' }),
  preset(29, 'عنوان كبير وأسئلة خضراء', { questionBackground: '#f7f7fa', questionColor: '#0abb45', radius: 20, eyebrow: '#586174', headingSize: 48, descriptionBelow: true }),
  preset(30, 'عنوان كبير وصفوف بخط سفلي', { gap: '0px 20px', questionBackground: '#ffffff', border: '0px solid transparent', rule: '1px solid #e1e1e1', radius: 0, eyebrow: '#586174', headingSize: 48, descriptionBelow: true }),
  preset(31, 'عنوان جانبي وبطاقات رمادية', { questionBackground: '#f7f7fa', radius: 20, eyebrow: '#0abb45', headingAlign: 'start' }),
  preset(32, 'أسئلة متكررة بفواصل خفيفة', { gap: '0px 20px', questionBackground: '#ffffff', border: '0px solid transparent', rule: '1px solid #e1e1e1', radius: 0, eyebrow: '#586174', headingSize: 48, descriptionBelow: true }),
  preset(33, 'بطاقات مربعة بتمييز أخضر', { border: '1px solid #eeeeee', radius: 0, eyebrow: '#0abb45' }),
  preset(34, 'عنوان بجوار مجموعة مدمجة', { count: 4, columns: 1, width: 1200, gap: '0px', groupPadding: '30px', groupRadius: 20, questionBackground: '#ffffff', border: '0px solid transparent', rule: '1px solid #eeeeee', radius: 0, eyebrow: '#0abb45', headingAlign: 'start', split: true }),
  preset(35, 'عمود واسع بحواف ناعمة', { columns: 1, radius: 20, eyebrow: '#0abb45' }),
];
export const faqDesign = (id?: string): FaqDesign => faqDesigns.find(d => d.id === id) ?? faqDesigns[0]!;
// A variant supplies its own paint defaults at render time. Existing merchant
// colors, spacing and images survive changing design, just like question content.
export function faqDefaults(id: FaqVariant): Partial<LandingSettings> { return { variant: id }; }
