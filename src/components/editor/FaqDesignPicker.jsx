import ElementDesignPreview from './ElementDesignPreview';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { faqDesigns } from '../../apps/storefront/landing/faq-designs';
import { HiOutlineXMark } from '../workspace/WorkspaceIcons';
import './testimonial-design-picker.css';
import './faq-design-picker.css';

function FaqDiagram({ design: d }) {
    const heading = <span className="pl-faq-diagram-heading"><i style={{ background: d.eyebrow }} /><b /></span>;
    const rows = <span className="pl-faq-diagram-items">{Array.from({ length: d.count }, (_, index) => <span className="pl-faq-diagram-row" key={index}><i /><svg viewBox="0 0 24 24" fill="none"><path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" /></svg></span>)}</span>;
    return <span className={`pl-faq-diagram${d.split ? ' pl-faq-diagram--split' : ''}${d.headerFrame ? ' pl-faq-diagram--header-frame' : ''}`} aria-hidden style={{ background: d.background, color: d.foreground, '--fd-columns': d.columns, '--fd-card': d.questionBackground, '--fd-radius': `${d.radius / 3}px`, '--fd-border': d.border, '--fd-shadow': d.shadow === 'none' ? 'none' : '-2px 2px currentColor', '--fd-group': d.groupBackground }}>{d.headerFrame ? <span className="pl-faq-diagram-frame" style={{ background: d.groupBackground, border: d.id === 'faq-25' ? '1px solid #141414' : undefined, boxShadow: d.id === 'faq-25' ? '3px 3px #141414' : undefined }}>{heading}{rows}</span> : <>{heading}{rows}</>}{d.purchase ? <i className="pl-faq-diagram-cta" /> : null}</span>;
}
export default function FaqDesignPicker({ selected, onSelect, onClose }) {
    return <Dialog open onClose={onClose} className="pl-design-dialog" dir="rtl"><div className="pl-design-backdrop" /><div className="pl-design-dialog-scroll"><DialogPanel className="pl-design-panel"><header><DialogTitle>اختر تنسيق الأسئلة الشائعة</DialogTitle><button type="button" onClick={onClose} aria-label="إغلاق تنسيقات الأسئلة"><HiOutlineXMark /></button></header><div className="pl-design-grid">{faqDesigns.map((design, index) => <button type="button" className="pl-design-card" key={design.id} aria-label={`استخدام تنسيق الأسئلة ${index + 1}: ${design.name}`} aria-pressed={selected === design.id} onClick={() => onSelect(design.id)}><ElementDesignPreview family="faq" index={index}><FaqDiagram design={design} /></ElementDesignPreview><span className="pl-design-name">{design.name}<small>تنسيق {index + 1}</small></span></button>)}</div><p className="pl-design-hint">تغيير التنسيق يحافظ على أسئلتك وإجاباتك وصورك وألوانك. النصوص الإرشادية في المعاينة لا تظهر لزوار المتجر.</p></DialogPanel></div></Dialog>;
}
