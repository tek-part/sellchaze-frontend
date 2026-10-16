import ElementDesignPreview from './ElementDesignPreview';
import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { Testimonials } from '../../apps/storefront/landing/Testimonials';
import { testimonialDefaults, testimonialDesigns } from '../../apps/storefront/landing/testimonial-designs';
import { HiOutlineXMark } from '../workspace/WorkspaceIcons';
import './testimonial-design-picker.css';

function DesignPreview({ design }) {
    const host = useRef(null); const content = useRef(null); const [size, setSize] = useState({ scale: .25, height: 160 });
    useEffect(() => {
        const measure = () => { if (!host.current || !content.current) return; const scale = host.current.clientWidth / 1440; const height = content.current.scrollHeight * scale; setSize(previous => Math.abs(previous.scale - scale) < .001 && Math.abs(previous.height - height) < 1 ? previous : { scale, height }); };
        measure(); if (typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(measure); observer.observe(host.current); observer.observe(content.current); return () => observer.disconnect();
    }, []);
    return <div ref={host} className="pl-design-preview" style={{ height: size.height }} aria-hidden><div ref={content} style={{ width: 1440, transform: `scale(${size.scale})` }}><div className="pl-design-preview-content" style={{ background: testimonialDefaults(design.id).background, textAlign: design.align }}><Testimonials settings={{ ...testimonialDefaults(design.id), title: 'آراء العملاء', description: 'تقييمات المتجر' }} preview interactive={false} /></div></div></div>;
}
export default function TestimonialDesignPicker({ selected, onSelect, onClose }) {
    return <Dialog open onClose={onClose} className="pl-design-dialog" dir="rtl"><div className="pl-design-backdrop" /><div className="pl-design-dialog-scroll"><DialogPanel className="pl-design-panel"><header><DialogTitle>اختر تنسيق التقييمات المخصصة</DialogTitle><button type="button" onClick={onClose} aria-label="إغلاق تنسيقات التقييمات"><HiOutlineXMark /></button></header><div className="pl-design-grid">{testimonialDesigns.map((design, index) => <button type="button" className="pl-design-card" key={design.id} aria-label={`استخدام التنسيق ${index + 1}: ${design.name}`} aria-pressed={selected === design.id} onClick={() => onSelect(design.id)}><ElementDesignPreview family="testimonials" index={index}><DesignPreview design={design} /></ElementDesignPreview><span className="pl-design-name">{design.name}<small>تنسيق {index + 1}</small></span></button>)}</div></DialogPanel></div></Dialog>;
}
