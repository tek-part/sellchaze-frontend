import { useEffect, useRef, useState } from 'react';
import { HiOutlinePhoto, HiOutlineTrash, HiOutlineXMark } from '../workspace/WorkspaceIcons';
import './landing-card-popover.css';

// Edits stay in the page's undo history; only the page toolbar publishes a save.
export default function LandingCardPopover({ item, media = [], disabled, onChange, onUpload, onRemove, onClose }) {
    const panel = useRef(null); const trigger = useRef(null); const [replace, setReplace] = useState(false);
    const image = item.image; const url = image?.media_id ? media.find(row => row.id === image.media_id)?.url : image?.url;
    const setImage = value => { const next = { ...item }; if (value) next.image = value; else delete next.image; onChange(next); };
    const selectImage = row => setImage({ ...image, media_id: row.id, url: row.url, alt: image?.alt ?? row.alt ?? '' });
    useEffect(() => {
        trigger.current = document.activeElement;
        panel.current?.querySelector('input[type="text"]')?.focus({ preventScroll: true });
        return () => trigger.current?.isConnected && trigger.current.focus({ preventScroll: true });
    }, []);
    function keyDown(event) {
        if (event.key === 'Escape') { event.stopPropagation(); onClose(); }
        if (event.key !== 'Tab') return;
        const fields = Array.from(panel.current.querySelectorAll('button,input,textarea,select,summary')).filter(el => !el.disabled && el.getClientRects().length);
        const first = fields[0]; const last = fields.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    return <div className="pl-card-overlay" onClick={event => { if (event.target === event.currentTarget) onClose(); }} onKeyDown={keyDown}>
        <div ref={panel} className="pl-card-popover" role="dialog" aria-modal="true" aria-label="تحرير البطاقة" dir="rtl">
            <button type="button" className="pl-card-close" aria-label="إغلاق تحرير البطاقة" onClick={onClose}><HiOutlineXMark /></button>
            <fieldset disabled={disabled}>
                <p className="pl-card-image-label">صورة</p>
                <button type="button" className="pl-card-image" aria-label="استبدال الصورة" onClick={() => setReplace(value => !value)}>{url ? <img src={url} alt={image.alt || 'معاينة الصورة'} /> : <HiOutlinePhoto />}<span>استبدال الصورة</span></button>
                <p className="pl-card-image-help">PNG, JPG, GIF حتى 10 ميجابايت</p>
                {replace ? <div className="pl-card-image-options">
                    <label>رفع صورة<input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={async event => { const file = event.target.files?.[0]; event.target.value = ''; if (file && onUpload) { const row = await onUpload(file); if (row) selectImage(row); } }} /></label>
                    <label>صور المنتج<select value={image?.media_id || ''} onChange={event => { const row = media.find(value => value.id === Number(event.target.value)); if (row) selectImage(row); }}><option value="">اختر صورة</option>{media.map(row => <option key={row.id} value={row.id}>{row.alt || `صورة ${row.id}`}</option>)}</select></label>
                    <label>رابط الصورة<input type="url" dir="ltr" value={url || ''} onChange={event => { const next = { ...image, url: event.target.value }; delete next.media_id; setImage(next); }} /></label>
                    <label>النص البديل<input type="text" maxLength={300} value={image?.alt || ''} onChange={event => setImage({ ...image, alt: event.target.value })} /></label>
                    {image ? <button type="button" onClick={() => setImage(undefined)}>إزالة الصورة</button> : null}
                </div> : null}
                <label>النص الاساسي<input type="text" maxLength={300} value={item.title || ''} onChange={event => onChange({ ...item, title: event.target.value })} /></label>
                <label>النص الفرعي<textarea rows={3} maxLength={6000} value={item.text || ''} onChange={event => onChange({ ...item, text: event.target.value })} /></label>
                <button type="button" className="pl-card-remove" aria-label="حذف البطاقة" onClick={onRemove}><HiOutlineTrash /></button>
            </fieldset>
        </div>
    </div>;
}
