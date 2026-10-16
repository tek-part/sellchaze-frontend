import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { NativeReviews } from '../../apps/storefront/landing/NativeReviews';
import { reviewDesigns } from '../../apps/storefront/landing/review-designs';
import ElementDesignPreview from './ElementDesignPreview';
import { HiOutlineXMark } from '../workspace/WorkspaceIcons';
import './testimonial-design-picker.css';

function DesignPreview({ design }) {
    const host = useRef(null); const [width, setWidth] = useState(300); const [contentHeight, setContentHeight] = useState(1);
    useEffect(() => { const measure = () => { if (host.current) { setWidth(host.current.getBoundingClientRect().width); const root = host.current.querySelector('.lp-native-reviews'); if (root) setContentHeight(root.offsetHeight); } }; measure(); if (typeof ResizeObserver === 'undefined') return; const observer = new ResizeObserver(measure); observer.observe(host.current); const root = host.current.querySelector('.lp-native-reviews'); if (root) observer.observe(root); return () => observer.disconnect(); }, []);
    const canvasWidth = 1268; const canvasHeight = design.preview.height / design.preview.width * canvasWidth;
    const height = canvasHeight * width / canvasWidth;
    const scale = Math.min(width / canvasWidth, height / Math.max(1, contentHeight));
    return <div ref={host} className="pl-design-preview" style={{ height }} aria-hidden><div style={{ width: canvasWidth, height: canvasHeight, transform: `scale(${scale})`, insetInlineStart: (width - canvasWidth * scale) / 2 }}><NativeReviews settings={{ variant: design.id }} preview thumbnail /></div></div>;
}
export default function ReviewDesignPicker({ selected, onSelect, onClose }) {
    return <Dialog open onClose={onClose} className="pl-design-dialog" dir="rtl"><div className="pl-design-backdrop" /><div className="pl-design-dialog-scroll"><DialogPanel className="pl-design-panel"><header><DialogTitle>اختر تنسيق التقييمات</DialogTitle><button type="button" onClick={onClose} aria-label="إغلاق تنسيقات التقييمات"><HiOutlineXMark /></button></header><div className="pl-design-grid">{reviewDesigns.map((design, index) => <button type="button" className="pl-design-card" key={design.id} aria-label={`استخدام تنسيق التقييمات ${index + 1}: ${design.name}`} aria-pressed={selected === design.id} onClick={() => onSelect(design.id)}><ElementDesignPreview family="reviews" index={index}><DesignPreview design={design} /></ElementDesignPreview><span className="pl-design-name">{design.name}<small>تنسيق {index + 1}</small></span></button>)}</div></DialogPanel></div></Dialog>;
}
