import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import ProductRichText from '../store/ProductRichText';
import { descriptionRichHtml } from '../../apps/storefront/landing/description-rich';
import { HiOutlineXMark } from '../workspace/WorkspaceIcons';
import './description-rich-dialog.css';

export default function DescriptionRichDialog({ section, media, disabled, onChange, onClose }) {
    const s=section.settings;
    const rawValue=s.description_mode==='formatted'?s.html??'':descriptionRichHtml(s)+(s.description_mode!=='fields'?s.html??'':'');
    const value=rawValue.replace(/var\(--pd-align,([^)]+)\)/g,(_,fallback)=>s.align||fallback);
    const tooLong=s.description_mode!=='formatted'&&value.length>20000;
    return <Dialog open onClose={onClose} className="pl-rich-dialog" dir="rtl"><div className="pl-rich-backdrop"/><div className="pl-rich-scroll"><DialogPanel className="pl-rich-panel">
        <DialogTitle className="sr-only">تحرير وصف المنتج المنسق</DialogTitle><button type="button" className="pl-rich-close" aria-label="إغلاق محرر الوصف" onClick={onClose}><HiOutlineXMark/></button>
        {tooLong?<p role="status">هذا المحتوى أكبر من حد النص المنسق البالغ 20000 حرف. استخدم حقول القالب لتحريره كاملًا.</p>:null}
        <ProductRichText ar locale="ar" pageContent allowMedia compact landingContent value={value} media={media} disabled={disabled||tooLong} label="وصف المنتج المنسق" onChange={html=>onChange({...section,settings:{...s,html,description_mode:'formatted'}})}/>
    </DialogPanel></div></Dialog>;
}
