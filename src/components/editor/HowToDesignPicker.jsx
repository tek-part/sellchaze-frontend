import ElementDesignPreview from './ElementDesignPreview';
import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { HowToSteps } from '../../apps/storefront/landing/HowToSteps';
import { howToDesigns } from '../../apps/storefront/landing/howto-designs';
import { HiOutlineXMark } from '../workspace/WorkspaceIcons';
import './testimonial-design-picker.css';

function DesignPreview({ design }) {
    const host = useRef(null); const content = useRef(null); const [size, setSize] = useState({ scale: .2, height: 160 });
    useEffect(() => {
        const measure = () => { if (!host.current || !content.current) return; const scale = host.current.clientWidth / 1533; const height = content.current.scrollHeight * scale; setSize(previous => Math.abs(previous.scale - scale) < .001 && Math.abs(previous.height - height) < 1 ? previous : { scale, height }); };
        measure(); if (typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(measure); observer.observe(host.current); observer.observe(content.current); return () => observer.disconnect();
    }, []);
    return <div ref={host} className="pl-design-preview" style={{ height: size.height }} aria-hidden><div ref={content} style={{ width: 1533, transform: `scale(${size.scale})` }}><section className="sf-landing-block sf-landing-block--how_to" style={{ background: design.background, '--howto-padding': `${design.padding}px ${design.sidePadding}px` }}><HowToSteps settings={{ variant: design.id, ...(design.header ? { eyebrow: 'خطوات بسيطة', title: 'طريقة استخدام المنتج', description: 'أضف تعليمات الاستخدام المناسبة لمنتجك.' } : {}) }} preview thumbnail /></section></div></div>;
}
export default function HowToDesignPicker({ selected, onSelect, onClose }) {
    return <Dialog open onClose={onClose} className="pl-design-dialog" dir="rtl"><div className="pl-design-backdrop" /><div className="pl-design-dialog-scroll"><DialogPanel className="pl-design-panel"><header><DialogTitle>اختر تنسيق كيف تعمل</DialogTitle><button type="button" onClick={onClose} aria-label="إغلاق تنسيقات الخطوات"><HiOutlineXMark /></button></header><div className="pl-design-grid">{howToDesigns.map((design, index) => <button type="button" className="pl-design-card" key={design.id} aria-label={`استخدام تنسيق الخطوات ${index + 1}: ${design.name}`} aria-pressed={selected === design.id} onClick={() => onSelect(design.id)}><ElementDesignPreview family="howto" index={index}><DesignPreview design={design} /></ElementDesignPreview><span className="pl-design-name">{design.name}<small>تنسيق {index + 1}</small></span></button>)}</div></DialogPanel></div></Dialog>;
}
