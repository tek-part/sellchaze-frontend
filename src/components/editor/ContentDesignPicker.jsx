import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { ContentLayouts } from '../../apps/storefront/landing/ContentLayouts';
import { contentDesigns } from '../../apps/storefront/landing/content-designs';
import ElementDesignPreview from './ElementDesignPreview';
import { HiOutlineXMark } from '../workspace/WorkspaceIcons';
import './testimonial-design-picker.css';

function DesignPreview({ design }) {
    const host = useRef(null); const content = useRef(null); const [size, setSize] = useState({ scale: .2, height: 160 });
    useEffect(() => {
        const measure = () => { if (!host.current || !content.current) return; const scale = host.current.clientWidth / 1533; const height = content.current.scrollHeight * scale; setSize(previous => Math.abs(previous.scale - scale) < .001 && Math.abs(previous.height - height) < 1 ? previous : { scale, height }); };
        measure(); if (typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(measure); observer.observe(host.current); observer.observe(content.current); return () => observer.disconnect();
    }, []);
    const settings = { variant: design.id, title: design.kind === 'cards' ? 'عنوان المحتوى' : 'عنوان المحتوى\nبتفاصيل واضحة', description: design.kind === 'quote' ? 'اكتب الاقتباس هنا.\nأضف تجربة صاحب الاقتباس.\nيمكنك تعديل النص والصورة.' : 'اكتب وصف المحتوى هنا.\nأضف التفاصيل المناسبة لمنتجك.', ...(['framed', 'stats'].includes(design.kind) ? { eyebrow: 'عن المنتج' } : {}) };
    return <div ref={host} className="pl-design-preview" style={{ height: size.height }} aria-hidden><div ref={content} style={{ width: 1533, transform: `scale(${size.scale})` }}><section className="sf-landing-block sf-landing-block--content" style={{ background: design.background, '--content-padding': `${design.padding}px ${design.sidePadding}px` }}><ContentLayouts settings={settings} preview thumbnail /></section></div></div>;
}
export default function ContentDesignPicker({ selected, onSelect, onClose }) {
    return <Dialog open onClose={onClose} className="pl-design-dialog" dir="rtl"><div className="pl-design-backdrop" /><div className="pl-design-dialog-scroll"><DialogPanel className="pl-design-panel"><header><DialogTitle>اختر تنسيق المحتوى</DialogTitle><button type="button" onClick={onClose} aria-label="إغلاق تنسيقات المحتوى"><HiOutlineXMark /></button></header><div className="pl-design-grid">{contentDesigns.map((design, index) => <button type="button" className="pl-design-card" key={design.id} aria-label={`استخدام تنسيق المحتوى ${index + 1}: ${design.name}`} aria-pressed={selected === design.id} onClick={() => onSelect(design.id)}><ElementDesignPreview family="content" index={index}><DesignPreview design={design} /></ElementDesignPreview><span className="pl-design-name">{design.name}<small>تنسيق {index + 1}</small></span></button>)}</div></DialogPanel></div></Dialog>;
}
