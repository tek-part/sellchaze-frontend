import { storeFeatureDesign } from '../../apps/storefront/landing/store-feature-designs';
import { storeFeatureIcons } from '../../apps/storefront/landing/StoreFeatureIcon';

const colorValue = (value, fallback) => /^#[\da-f]{6}$/i.test(value) ? value : /^#[\da-f]{6}$/i.test(fallback) ? fallback : '#ffffff';
export function LandingColorInput({ value, onChange }) { return <input type="color" value={value} onInput={onChange} onChange={onChange} />; }
export function StoreFeatureControls({ settings: s, set }) {
    const d = storeFeatureDesign(s.variant);
    return <fieldset><legend>ألوان المميزات وحركتها</legend><div className="pl-settings-colors">{[
        ['accent', 'لون التمييز', d.accent], ['card_background', 'خلفية البطاقات', d.cardBackground], ['secondary_foreground', 'لون الوصف', d.bodyColor],
        ['icon_color', 'لون الأيقونات', d.iconColor], ['icon_background', 'خلفية الأيقونات', d.badgeBackground], ['hover_background', 'خلفية البطاقة عند التمرير', d.hoverBackground ?? d.cardBackground],
        ['hover_foreground', 'لون العنوان عند التمرير', d.hoverForeground ?? d.foreground], ['hover_secondary_foreground', 'لون الوصف عند التمرير', d.hoverForeground ?? d.bodyColor],
    ].map(([key, label, fallback]) => <label key={key}>{label}<LandingColorInput value={colorValue(s[key], fallback)} onChange={e => set(key, e.target.value)} /></label>)}</div><label><input type="checkbox" checked={s.motion !== false} onChange={e => set('motion', e.target.checked)} /> تفعيل حركة التنسيق</label></fieldset>;
}
export function StoreFeatureItemFields({ item, update }) {
    return <><label>الأيقونة<select value={storeFeatureIcons.some(([key]) => key === item.icon) ? item.icon : ''} onChange={e => update('icon', e.target.value || undefined)}><option value="">بدون أيقونة</option>{storeFeatureIcons.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><small>تُعرض الصورة المختارة بدل الأيقونة. تبقى الصورة والنص محفوظين عند تغيير التنسيق.</small><label>رابط الميزة (اختياري)<input dir="ltr" maxLength={2000} value={item.url || ''} onChange={e => update('url', e.target.value)} /></label><div className="pl-settings-colors">{[['accent', 'لون أيقونة العنصر'], ['background', 'خلفية العنصر'], ['foreground', 'لون عنوان العنصر']].map(([key, label]) => <label key={key}>{label}<LandingColorInput value={colorValue(item[key], '#171717')} onChange={e => update(key, e.target.value)} />{item[key] ? <button type="button" onClick={() => update(key, undefined)}>استخدام لون التنسيق</button> : null}</label>)}</div></>;
}
