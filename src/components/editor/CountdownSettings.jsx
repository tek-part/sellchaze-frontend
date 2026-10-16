import { countdownDesign } from '../../apps/storefront/landing/countdown-designs';
import { countdownEditableCss } from '../../apps/storefront/landing/countdown-effects';
import { MediaField } from './ProductDescriptionSettings';
import { HiOutlineXMark } from '../workspace/WorkspaceIcons';
import './product-description-settings.css';
export default function CountdownSettings({section,product,onChange,onClose,onUpload,onDesignChange,onEdit}){
    const s=section.settings,d=countdownDesign(s.variant),media=(product?.media??[]).filter(row=>row.type!=='video');
    const set=(key,value)=>{const next={...s};if(value===undefined)delete next[key];else next[key]=value;onChange({...section,settings:next});};
    const template=countdownEditableCss[d.id]??'',custom=s.countdown_css_mode==='custom';
    const currentCss=custom?s.css??'':template+(s.countdown_css_mode===undefined&&s.css?'\n'+s.css:'');
    const mode=value=>onChange({...section,settings:{...s,countdown_css_mode:value,...(value==='custom'?{css:currentCss}:{})}});
    return <div className="pl-settings pl-description-settings"><header><div><h2>الإعدادات</h2><small>العداد التنازلي</small></div><button type="button" onClick={onClose} aria-label="إغلاق الإعدادات"><HiOutlineXMark/></button></header>
        <fieldset><legend>تنسيق العداد التنازلي</legend><p>{d.name}</p><button type="button" onClick={onDesignChange}>تغيير تنسيق العداد التنازلي</button></fieldset>
        <label>عدد الساعات<input type="number" min={1} max={720} value={s.hours??4} onChange={e=>set('hours',Number(e.target.value))}/></label>
        <MediaField label="صورة خلفية القسم" value={s.background_image} media={media} onUpload={onUpload} onChange={v=>set('background_image',v)}/>
        {[['background','لون الخلفية',d.rootColor],['foreground','لون النص',d.numberColor],['card_background','لون خلفية العداد',d.cardColor]].map(([key,label,fallback])=><label key={key}>{label}<input type="color" value={/^#[\da-f]{6}$/i.test(s[key])?s[key]:fallback} onChange={e=>set(key,e.target.value)}/></label>)}
        <button type="button" onClick={()=>onEdit('title')}>تعديل عنوان العداد</button><button type="button" onClick={()=>onEdit('description')}>تعديل وصف العداد</button>
        <fieldset><legend>CSS</legend><label>مصدر التنسيق<select value={custom?'custom':'template'} onChange={e=>mode(e.target.value)}><option value="template">قواعد القالب</option><option value="custom">CSS مخصص كامل</option></select></label><label>تنسيق CSS للعداد<textarea className="pl-code" dir="ltr" rows={9} maxLength={12000} value={currentCss} onChange={e=>onChange({...section,settings:{...s,css:e.target.value,countdown_css_mode:'custom'}})}/></label><button type="button" onClick={()=>mode('template')}>استعادة قواعد القالب</button></fieldset>
        <details><summary>الموعد الثابت والمسافات والحركة</summary><label>موعد انتهاء ثابت (UTC)<input type="datetime-local" step={1} value={s.ends_at?.slice(0,19)??''} onChange={e=>set('ends_at',e.target.value?e.target.value+(e.target.value.length===16?':00':'')+'Z':undefined)}/><small>عند تركه فارغًا تُحفظ المدة لجلسة الزائر؛ تبديل التنسيق لا يعيد تشغيل الوقت.</small></label><label><input type="checkbox" checked={s.motion!==false} onChange={e=>set('motion',e.target.checked)}/>تفعيل الحركة</label><label>المسافة الداخلية<input type="number" min={0} max={160} value={s.padding??''} onChange={e=>set('padding',e.target.value===''?undefined:Number(e.target.value))}/></label><label>حجم العداد<input type="number" min={12} max={96} value={s.font_size??''} onChange={e=>set('font_size',e.target.value===''?undefined:Number(e.target.value))}/></label><label>نص زر الشراء<input maxLength={120} value={s.button_text??''} onChange={e=>set('button_text',e.target.value)}/></label><button type="button" onClick={()=>set('card_background','transparent')}>إخفاء خلفية البطاقات</button><label>محتوى HTML إضافي<textarea className="pl-code" dir="ltr" maxLength={20000} rows={5} value={s.html??''} onChange={e=>set('html',e.target.value)}/></label></details>
    </div>;
}
