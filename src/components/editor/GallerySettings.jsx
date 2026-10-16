import { MediaField } from './ProductDescriptionSettings';
import { galleryDesign } from '../../apps/storefront/landing/gallery-designs';
import { HiOutlineXMark } from '../workspace/WorkspaceIcons';
import './product-description-settings.css';
export default function GallerySettings({section,product,onChange,onClose,onUpload,onDesignChange,onEdit}){
    const s=section.settings,d=galleryDesign(s.variant),media=(product?.media??[]).filter(m=>m.type!=='video');
    const set=(key,value)=>{const next={...s};if(value===undefined)delete next[key];else next[key]=value;onChange({...section,settings:next});};
    const move=(i,delta)=>{const images=[...s.images];[images[i],images[i+delta]]=[images[i+delta],images[i]];set('images',images);};
    return <div className="pl-settings pl-description-settings"><header><div><h2>الإعدادات</h2><small>معرض الصور</small></div><button type="button" aria-label="إغلاق الإعدادات" onClick={onClose}><HiOutlineXMark/></button></header>
        <fieldset><legend>تنسيق معرض الصور</legend><p>{d.name}</p><button type="button" onClick={onDesignChange}>تغيير تنسيق معرض الصور</button></fieldset>
        <MediaField label="صورة خلفية القسم" value={s.background_image} media={media} onUpload={onUpload} onChange={v=>set('background_image',v)}/>
        <label>لون الخلفية<input type="color" value={s.background??'#ffffff'} onChange={e=>set('background',e.target.value)}/></label>
        <button type="button" onClick={()=>onEdit({kind:'title'})}>تعديل عنوان المعرض</button><button type="button" onClick={()=>onEdit({kind:'description'})}>تعديل وصف المعرض</button>
        <details><summary>صور المعرض</summary>{(s.images??[]).map((image,i)=><fieldset key={i}><legend>{image.alt||`صورة ${i+1}`}</legend><button type="button" onClick={()=>onEdit({kind:'image',index:i})}>تعديل صورة {i+1}</button><button type="button" disabled={i===0} onClick={()=>move(i,-1)}>تحريك لأعلى</button><button type="button" disabled={i===s.images.length-1} onClick={()=>move(i,1)}>تحريك لأسفل</button><button type="button" onClick={()=>set('images',s.images.filter((_,index)=>index!==i))}>حذف الصورة</button></fieldset>)}<button type="button" disabled={(s.images?.length??0)>=30} onClick={()=>onEdit({kind:'image',index:s.images?.length??0})}>اضافة صورة جديدة</button></details>
        <details><summary>المسافات والخط والحركة</summary><label><input type="checkbox" checked={s.motion!==false} onChange={e=>set('motion',e.target.checked)}/>تفعيل حركة الصور</label><label>المسافة الداخلية<input type="number" min={0} max={160} value={s.padding??(d.index===4?0:40)} onChange={e=>set('padding',e.target.value===''?undefined:Number(e.target.value))}/></label><label>حجم العنوان<input type="number" min={12} max={96} value={s.font_size??''} onChange={e=>set('font_size',e.target.value===''?undefined:Number(e.target.value))}/></label><label>تنسيق CSS مخصص<textarea className="pl-code" dir="ltr" maxLength={12000} rows={8} value={s.css??''} onChange={e=>set('css',e.target.value)}/></label><label>محتوى HTML إضافي<textarea className="pl-code" dir="ltr" maxLength={20000} rows={6} value={s.html??''} onChange={e=>set('html',e.target.value)}/></label></details>
    </div>;
}
