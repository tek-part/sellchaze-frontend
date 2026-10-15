import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { HiOutlineArrowDownTray, HiOutlineArrowUpTray, HiOutlineXMark } from '../workspace/WorkspaceIcons';
import api from '../../api/client';

const errors = (error) => Object.values(error.response?.data?.errors || {}).flat().join('\n') || error.response?.data?.message || error.message;
export function saveCatalogFile(blob, name) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = name; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function CatalogImportDialog({ apiBase, format, onClose, onImported }) {
    const { i18n } = useTranslation();
    const text = (a, e) => i18n.language.startsWith('ar') ? a : e;
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState('');
    const [dragging, setDragging] = useState(false);
    const input = useRef(null);
    const key = useRef(null);
    const active = useRef(true);
    const inFlight = useRef(false);
    useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
    const path = `${apiBase}/catalog/products`;
    const warningText = (code) => ({
        review_product_layout: text('راجع تنسيق الوصف وإعدادات الربط بعد الاستيراد؛ لا تُفعّل التنسيقات والتطبيقات الخارجية تلقائيًا.', 'Review description styling and integrations; external styling and applications are not enabled automatically.'),
        review_backorders: text('يمنع المتجر الطلب عند نفاد المخزون المتتبع. راجع هذا الاختلاف عن إعداد المنتج المستورد.', 'The store blocks orders when tracked stock runs out. Review this difference from the imported product setting.'),
        option_stock_per_combination: text('تُطبّق كمية الملف على كل تركيبة خيارات مولّدة. راجع مخزون كل خيار أدناه.', 'The file quantity applies to each generated option combination. Review each option’s stock below.'),
        merged_duplicate_options: text('احتوى الملف على خيار غير متتبع مكرر بنفس البيانات؛ دُمجت النسخ المتطابقة. راجع الخيارات المعروضة قبل التأكيد.', 'An untracked option was repeated with identical data; exact duplicates were merged. Review the displayed options before confirming.'),
    }[code] || code);
    const selectFile = (value) => {
        if (inFlight.current) return;
        setPreview(null); setError(''); key.current = null;
        if (!value) { setFile(null); return; }
        if (!value.name.toLowerCase().endsWith(`.${format}`) || value.size > 8 * 1024 * 1024 || !value.size) {
            setFile(null); setError(text(`اختر ملف ${format.toUpperCase()} لا يتجاوز 8 ميجابايت.`, `Choose a ${format.toUpperCase()} file up to 8 MiB.`)); return;
        }
        key.current = crypto.randomUUID(); setFile(value);
    };
    const run = async (mode) => {
        if (inFlight.current || (mode !== 'template' && !file)) return;
        inFlight.current = true; setBusy(mode); setError('');
        try {
            if (mode === 'template') {
                const { data } = await api.get(`${path}/import-template`, { responseType: 'blob' });
                if (active.current) saveCatalogFile(data, 'sellchaze-products-template.xlsx');
            } else {
                const data = new FormData(); data.append('file', file);
                if (mode === 'apply') data.append('idempotency_key', key.current);
                const result = await api.post(`${path}/import${mode === 'preview' ? '/preview' : ''}`, data);
                if (!active.current) return;
                if (mode === 'preview') setPreview(result.data.data);
                else onImported(result.data.meta.created);
            }
        } catch (e) { if (active.current) setError(errors(e)); }
        finally { inFlight.current = false; if (active.current) setBusy(''); }
    };
    return <Dialog open onClose={() => { if (!inFlight.current) onClose(); }} className="ws-dialog-layer">
        <DialogBackdrop transition className="ws-backdrop" />
        <div className="ws-confirm-position"><DialogPanel transition className="ws-confirm-dialog ws-catalog-import">
            <div className="ws-catalog-import-heading"><DialogTitle>{format === 'xlsx' ? text('استيراد المنتجات من ملف Excel', 'Import products from Excel') : text('استيراد المنتجات من ملف JSON', 'Import products from JSON')}</DialogTitle><button type="button" disabled={!!busy} onClick={onClose} className="ws-icon-button" aria-label={text('إغلاق', 'Close')}><HiOutlineXMark aria-hidden /></button></div>
            {format === 'xlsx' ? <div className="ws-import-step"><span>1.</span><div><h3>{text('تحميل نموذج المنتجات', 'Download the product template')}</h3><p>{text('املأ بيانات منتجاتك واحذف الصف التجريبي. يدعم النموذج المقاسات والألوان وصور الخيارات وحقول تخصيص العميل.', 'Fill in your products and remove the sample row. The template supports sizes, colors, option images and customer personalization.')}</p><button className="ws-secondary-button" type="button" disabled={!!busy} onClick={() => void run('template')}><HiOutlineArrowDownTray aria-hidden />{text('تحميل النموذج', 'Download template')}</button></div></div> : null}
            <div className="ws-import-step"><span>{format === 'xlsx' ? '2.' : '1.'}</span><div><h3>{format === 'xlsx' ? text('ارفع ملف XLSX بعد تعبئته', 'Upload your completed XLSX file') : text('اختر ملف المنتجات', 'Choose the product file')}</h3>
                <button type="button" disabled={!!busy} className={`ws-catalog-dropzone ${dragging ? 'is-dragging' : ''}`} onClick={() => { if (input.current) { input.current.value = ''; input.current.click(); } }} onDragOver={(e) => { e.preventDefault(); if (!busy) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length === 1) selectFile(e.dataTransfer.files[0]); else setError(text('اختر ملفًا واحدًا في كل مرة.', 'Choose one file at a time.')); }}><HiOutlineArrowUpTray aria-hidden /><strong>{file?.name || text(`اسحب ملف ${format.toUpperCase()} هنا أو اضغط للاختيار`, `Drop a ${format.toUpperCase()} file here or click to choose`)}</strong><small>{text('حتى 200 منتج و8 ميجابايت في الملف الواحد', 'Up to 200 products and 8 MiB per file')}</small></button>
                <input ref={input} type="file" accept={format === 'xlsx' ? '.xlsx' : '.json,application/json'} hidden aria-label={text('ملف المنتجات', 'Products file')} onChange={(e) => selectFile(e.target.files?.[0])} />
            </div></div>
            {preview ? <div className="ws-catalog-import-preview"><h3>{text(`معاينة ${preview.count} منتج`, `Preview ${preview.count} products`)} · {preview.currency}</h3><ul>{preview.products.map((row, index) => <li key={index}>
                <strong>{row.name}</strong><span>{row.price} {preview.currency} · {row.variants} {text('خيار', 'options')} · {row.is_active ? text('نشط', 'Active') : text('مسودة', 'Draft')}</span>
                {row.categories.length ? <small>{row.categories.join('، ')}</small> : null}
                {!row.variants ? <small>{text('المخزون:', 'Stock:')} {row.track_inventory ? row.stock_quantity : text('غير متتبع', 'Untracked')}</small> : null}
                {row.options?.length ? <details><summary>{text('الخيارات والأسعار والمخزون', 'Options, prices and inventory')}</summary><ul>{row.options.map((option, optionIndex) => <li key={optionIndex}><strong>{option.name}</strong><span>{option.price} {preview.currency} · {text('المخزون:', 'Stock:')} {option.track_inventory ? option.stock_quantity : text('غير متتبع', 'Untracked')}</span></li>)}</ul></details> : null}
                {row.warnings.map((warning, i) => <p key={i}>{warningText(warning)}</p>)}
            </li>)}</ul><p>{text('سيتم إنشاء منتجات جديدة بالحالات المعروضة. راجع الأسعار والمخزون قبل التأكيد. لا يغيّر الاستيراد المنتجات الموجودة.', 'New products will be created with the displayed statuses. Review prices and inventory before confirming. Existing products are unchanged.')}</p></div> : null}
            {error ? <p role="alert" className="ws-catalog-error ws-import-errors">{error}</p> : null}
            <div className="ws-confirm-actions"><button type="button" disabled={!!busy} className="ws-secondary-button" onClick={onClose}>{text('إلغاء', 'Cancel')}</button><button type="button" className="ws-primary-button" disabled={!!busy || !file} onClick={() => void run(preview ? 'apply' : 'preview')}>{busy ? text('جارٍ المعالجة…', 'Processing…') : preview ? text('تأكيد الاستيراد', 'Confirm import') : text('معاينة المنتجات', 'Preview products')}</button></div>
        </DialogPanel></div>
    </Dialog>;
}
