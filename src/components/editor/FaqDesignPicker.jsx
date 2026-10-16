import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { faqDesigns } from '../../apps/storefront/landing/faq-designs';
import { HiOutlineXMark } from '../workspace/WorkspaceIcons';
import './testimonial-design-picker.css';
import './faq-design-picker.css';

function FaqDiagram({ design: d }) {
    return <span className={`pl-faq-diagram${d.split ? ' pl-faq-diagram--split' : ''}`} aria-hidden style={{ background: d.background, color: d.foreground, '--fd-columns': d.columns, '--fd-card': d.questionBackground, '--fd-radius': `${d.radius / 3}px`, '--fd-border': d.border, '--fd-shadow': d.shadow === 'none' ? 'none' : '-2px 2px currentColor', '--fd-group': d.groupBackground }}><span className="pl-faq-diagram-heading"><i style={{ background: d.eyebrow }} /><b /></span><span className="pl-faq-diagram-items">{Array.from({ length: d.count }, (_, index) => <span className="pl-faq-diagram-row" key={index}><i /><svg viewBox="0 0 24 24" fill="none"><path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" /></svg></span>)}</span></span>;
}
export default function FaqDesignPicker({ selected, onSelect, onClose }) {
    return <Dialog open onClose={onClose} className="pl-design-dialog" dir="rtl"><div className="pl-design-backdrop" /><div className="pl-design-dialog-scroll"><DialogPanel className="pl-design-panel"><header><DialogTitle>اختر تنسيق الأسئلة الشائعة</DialogTitle><button type="button" onClick={onClose} aria-label="إغلاق تنسيقات الأسئلة"><HiOutlineXMark /></button></header><div className="pl-design-grid">{faqDesigns.map((design, index) => <button type="button" className="pl-design-card" key={design.id} aria-label={`استخدام تنسيق الأسئلة ${index + 1}: ${design.name}`} aria-pressed={selected === design.id} onClick={() => onSelect(design.id)}><FaqDiagram design={design} /><span className="pl-design-name">{design.name}<small>تنسيق {index + 1}</small></span></button>)}</div><p className="pl-design-hint">تغيير التنسيق يحافظ على أسئلتك وإجاباتك وصورك وألوانك. النصوص الإرشادية في المعاينة لا تظهر لزوار المتجر.</p></DialogPanel></div></Dialog>;
}
