import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { BuyButton } from '../../apps/storefront/landing/BuyButton';
import { buyButtonDesigns } from '../../apps/storefront/landing/buy-button-designs';
import ElementDesignPreview from './ElementDesignPreview';
import { HiOutlineXMark } from '../workspace/WorkspaceIcons';
import './testimonial-design-picker.css';

function DesignPreview({ design }) {
    const host = useRef(null); const [width, setWidth] = useState(300);
    useEffect(() => { const measure = () => { if (host.current) setWidth(host.current.clientWidth); }; measure(); if (typeof ResizeObserver === 'undefined') return; const observer = new ResizeObserver(measure); observer.observe(host.current); return () => observer.disconnect(); }, []);
    const scale = width / design.preview.width;
    return <div ref={host} className="pl-design-preview" style={{ height: design.preview.height * scale }} aria-hidden><div style={{ width: design.preview.width, height: design.preview.height, transform: `scale(${scale})` }}><BuyButton settings={{ variant: design.id, button_text: 'الشراء الان' }} preview thumbnail /></div></div>;
}
export default function BuyButtonDesignPicker({ selected, onSelect, onClose }) {
    return <Dialog open onClose={onClose} className="pl-design-dialog" dir="rtl"><div className="pl-design-backdrop" /><div className="pl-design-dialog-scroll"><DialogPanel className="pl-design-panel"><header><DialogTitle>اختر تنسيق زر الشراء</DialogTitle><button type="button" onClick={onClose} aria-label="إغلاق تنسيقات زر الشراء"><HiOutlineXMark /></button></header><div className="pl-design-grid">{buyButtonDesigns.map((design, index) => <button type="button" className="pl-design-card" key={design.id} aria-label={`استخدام تنسيق زر الشراء ${index + 1}: ${design.name}`} aria-pressed={selected === design.id} onClick={() => onSelect(design.id)}><ElementDesignPreview family="buy" index={index}><DesignPreview design={design} /></ElementDesignPreview><span className="pl-design-name">{design.name}<small>تنسيق {index + 1}</small></span></button>)}</div></DialogPanel></div></Dialog>;
}
