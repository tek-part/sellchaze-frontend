import { billboardRichHtml } from '../../apps/storefront/landing/billboard-rich';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import ProductRichText from '../store/ProductRichText';
import { descriptionRichHtml } from '../../apps/storefront/landing/description-rich';
import { HiOutlineXMark } from '../workspace/WorkspaceIcons';
import './description-rich-dialog.css';

export default function DescriptionRichDialog({ section, media, disabled, onChange, onClose }) {
    const s=section.settings;const preset=section.type==='product_preset';const billboard=section.type==='billboard';const mode=preset?'formatted':billboard?s.billboard_mode:s.description_mode;const compile=billboard?billboardRichHtml:descriptionRichHtml;
    const rawValue=mode==='formatted'?s.html??'':compile(s)+(mode!=='fields'?s.html??'':'');
    const value=rawValue.replace(/var\(--pd-align,([^)]+)\)/g,(_,fallback)=>s.align||fallback);
    const tooLong=mode!=='formatted'&&value.length>20000;
    return <Dialog open onClose={onClose} className="pl-rich-dialog" dir="rtl"><div className="pl-rich-backdrop"/><div className="pl-rich-scroll"><DialogPanel className="pl-rich-panel">
        <DialogTitle className="sr-only">{billboard?'تحرير نص اللوحة الإعلانية':'تحرير وصف المنتج المنسق'}</DialogTitle><button type="button" className="pl-rich-close" aria-label={billboard?'إغلاق محرر اللوحة':'إغلاق محرر الوصف'} onClick={onClose}><HiOutlineXMark/></button>
        {tooLong?<p role="status">هذا المحتوى أكبر من حد النص المنسق البالغ 20000 حرف. استخدم حقول القالب لتحريره كاملًا.</p>:null}
        <ProductRichText ar locale="ar" pageContent allowMedia compact landingContent value={value} media={media} disabled={disabled||tooLong} label={billboard?'نص اللوحة الإعلانية':'وصف المنتج المنسق'} onChange={html=>onChange({...section,settings:{...s,html,...(preset?{}:{[billboard?'billboard_mode':'description_mode']:'formatted'})}})}/>
    </DialogPanel></div></Dialog>;
}
