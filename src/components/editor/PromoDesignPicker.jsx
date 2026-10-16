import ElementDesignPreview from './ElementDesignPreview';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { promoDesigns } from '../../apps/storefront/landing/promo-designs';
import { HiOutlineXMark } from '../workspace/WorkspaceIcons';
import './testimonial-design-picker.css';
import './promo-design-picker.css';

export default function PromoDesignPicker({ selected, onSelect, onClose }) {
    return <Dialog open onClose={onClose} className="pl-design-dialog" dir="rtl"><div className="pl-design-backdrop" /><div className="pl-design-dialog-scroll"><DialogPanel className="pl-design-panel"><header><DialogTitle>اختر تنسيق اللافتات الترويجية</DialogTitle><button type="button" onClick={onClose} aria-label="إغلاق تنسيقات اللافتات"><HiOutlineXMark /></button></header><div className="pl-design-grid">{promoDesigns.map((design, index) => <button type="button" className="pl-design-card" key={design.id} aria-label={`استخدام تنسيق اللافتات ${index + 1}: ${design.name}`} aria-pressed={selected === design.id} onClick={() => onSelect(design.id)}><ElementDesignPreview family="banners" index={index}><span className={`pl-promo-diagram pl-promo-diagram--${index + 1}`} aria-hidden>{Array.from({ length: design.count }, (_, slot) => <span key={slot} />)}</span></ElementDesignPreview><span className="pl-design-name">{design.name}<small>تنسيق {index + 1}</small></span></button>)}</div></DialogPanel></div></Dialog>;
}
