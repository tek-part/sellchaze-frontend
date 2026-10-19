import { useId, useRef } from 'react';
import { HiOutlinePlusCircle } from '../workspace/WorkspaceIcons';

export default function ProductPixelsCard({ rows, onChange, valid, ar, disabled }) {
    const prefix = useId();
    const addButton = useRef(null);
    const text = (a, e) => ar ? a : e;
    const update = (index, key, value) => onChange(rows.map((row, i) => i === index ? { ...row, [key]: value } : row));
    return <section className="pe-card pe-product-pixels">
        <header><h2>Custom Pixel</h2></header>
        <button ref={addButton} type="button" className="pe-soft-button pe-pixel-add" disabled={disabled || rows.length >= 30} onClick={() => onChange([...rows, { provider: '', id: '' }])}><HiOutlinePlusCircle aria-hidden />{text('إضافة Pixel', 'Add Pixel')}</button>
        <div className="pe-pixel-rows">{rows.map((row, index) => <fieldset className="pe-pixel-row" key={index} disabled={disabled}>
            <legend className="sr-only">{text('بيكسل', 'Pixel')} {index + 1}</legend>
            <label htmlFor={`${prefix}-${index}-id`}>{text('الـID الخاص بالبيكسل', 'Pixel ID')} *<input id={`${prefix}-${index}-id`} form="store-product-editor" required maxLength={64} dir="ltr" autoComplete="off" value={row.id} onChange={event => update(index, 'id', event.target.value)} /></label>
            <label htmlFor={`${prefix}-${index}-provider`}>Pixel type *<select id={`${prefix}-${index}-provider`} form="store-product-editor" required value={row.provider} onChange={event => update(index, 'provider', event.target.value)}><option value="">{text('اختر النوع', 'Choose a type')}</option>{['facebook', 'tiktok', 'snapchat'].map(provider => <option key={provider} value={provider}>{provider}</option>)}</select></label>
            <button type="button" className="pe-pixel-remove" aria-label={`${text('إزالة البيكسل', 'Remove pixel')} ${index + 1}`} onClick={() => { onChange(rows.filter((_, i) => i !== index)); requestAnimationFrame(() => addButton.current?.focus()); }}>{text('إزالة', 'Remove')}</button>
        </fieldset>)}</div>
        {!valid ? <p className="pe-pixel-validation" role="status">{text('أكمل النوع ومعرّفًا صحيحًا لكل بيكسل، بحد أقصى 10 لكل شبكة.', 'Complete each pixel type and valid ID, with at most10 per network.')}</p> : null}
    </section>;
}
