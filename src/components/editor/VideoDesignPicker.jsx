import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { videoDesigns } from '../../apps/storefront/landing/video-designs';
import { HiOutlineXMark } from '../workspace/WorkspaceIcons';
import './testimonial-design-picker.css';
import './video-design-picker.css';

function Diagram({ design }) {
    return <span className={`pl-video-diagram pl-video-diagram--${design.kind}`} aria-hidden><span className="pl-video-diagram-heading"><b /><i /></span><span className="pl-video-diagram-media"><svg viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="14" stroke="currentColor" /><path d="m13 9 10 7-10 7V9Z" fill="currentColor" /></svg></span>{design.kind === 'benefits' ? <span className="pl-video-diagram-benefits"><i /><i /><i /></span> : null}{design.kind === 'split' ? <span className="pl-video-diagram-buy" /> : null}</span>;
}
export default function VideoDesignPicker({ selected, onSelect, onClose }) {
    return <Dialog open onClose={onClose} className="pl-design-dialog" dir="rtl"><div className="pl-design-backdrop" /><div className="pl-design-dialog-scroll"><DialogPanel className="pl-design-panel"><header><DialogTitle>اختر تنسيق الفيديو</DialogTitle><button type="button" onClick={onClose} aria-label="إغلاق تنسيقات الفيديو"><HiOutlineXMark /></button></header><div className="pl-design-grid">{videoDesigns.map((design, index) => <button type="button" className="pl-design-card" key={design.id} aria-label={`استخدام تنسيق الفيديو ${index + 1}: ${design.name}`} aria-pressed={selected === design.id} onClick={() => onSelect(design.id)}><Diagram design={design} /><span className="pl-design-name">{design.name}<small>تنسيق {index + 1}</small></span></button>)}</div><p className="pl-design-hint">يحافظ تغيير التنسيق على رابط الفيديو والنصوص والمزايا والصور. المعاينة لا تشغّل الفيديو؛ اختبره من صفحة المنتج بعد الحفظ.</p></DialogPanel></div></Dialog>;
}
