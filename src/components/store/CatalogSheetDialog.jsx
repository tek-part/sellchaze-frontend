import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { HiOutlineArrowDownTray, HiOutlineArrowUpTray, HiOutlineXMark } from '../workspace/WorkspaceIcons';
import api from '../../api/client';
import { saveCatalogFile } from './CatalogImportDialog';
import { sheetErrorText } from './catalog-tools';

const errorText = (e) => Object.values(e.response?.data?.errors || {}).flat().join('\n') || e.response?.data?.message || e.message;
async function blobError(e) {
    if (e.response?.data instanceof Blob) {
        try { const body = JSON.parse(await e.response.data.text()); return Object.values(body.errors || {}).flat().join('\n') || body.message || e.message; } catch { return e.message; }
    }
    return errorText(e);
}

/** Export products with one row per option to Excel/CSV, then re-import to update existing products or create new ones. */
export default function CatalogSheetDialog({ apiBase, categories, selected = [], permissions, onClose, onImported }) {
    const { i18n } = useTranslation();
    const ar = i18n.language.startsWith('ar');
    const text = (a, e) => ar ? a : e;
    const canUpdate = permissions.includes('products-edit');
    const canCreate = permissions.includes('products-create');
    const [exportScope, setExportScope] = useState(selected.length ? 'selected' : 'all');
    const [exportCategory, setExportCategory] = useState('');
    const [mode, setMode] = useState(canUpdate ? 'update' : 'create');
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [busy, setBusy] = useState('');
    const [error, setError] = useState('');
    const [onlyErrors, setOnlyErrors] = useState(false);
    const input = useRef(null); const key = useRef(null); const active = useRef(true); const inFlight = useRef(false);
    useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
    const path = `${apiBase}/catalog/products`;
    const run = async (name, work) => {
        if (inFlight.current) return; inFlight.current = true; setBusy(name); setError('');
        try { await work(); } catch (e) { const message = await blobError(e); if (active.current) setError(message); }
        finally { inFlight.current = false; if (active.current) setBusy(''); }
    };
    const download = (format) => run(`export-${format}`, async () => {
        const body = { format, ...(exportScope === 'selected' ? { product_ids: selected.map((product) => product.id) } : {}), ...(exportScope === 'category' ? { category_id: Number(exportCategory) } : {}) };
        const { data } = await api.post(`${path}/sheet-export`, body, { responseType: 'blob' });
        if (active.current) saveCatalogFile(data, `sellchaze-products-${new Date().toISOString().slice(0, 10)}.${format}`);
    });
    const choose = (value) => {
        if (inFlight.current) return;
        setPreview(null); setError(''); key.current = null;
        if (!value) { setFile(null); return; }
        if (!/\.(csv|xlsx)$/i.test(value.name) || value.size > 8 * 1024 * 1024 || !value.size) { setFile(null); setError(text('اختر ملف CSV أو XLSX لا يتجاوز 8 ميجابايت.', 'Choose a CSV or XLSX file up to 8 MiB.')); return; }
        setFile(value);
    };
    const check = () => run('preview', async () => {
        const body = new FormData(); body.append('file', file);
        const { data } = await api.post(`${path}/sheet-import/${mode}/preview`, body);
        if (!active.current) return;
        key.current = crypto.randomUUID(); setPreview(data.data); setOnlyErrors(data.data.summary.errors > 0);
    });
    const apply = () => run('apply', async () => {
        const body = new FormData(); body.append('file', file); body.append('idempotency_key', key.current);
        const { data } = await api.post(`${path}/sheet-import/${mode}`, body);
        if (active.current) onImported(data.meta);
    });
    const summary = preview?.summary;
    const rows = preview ? preview.rows.filter((row) => !onlyErrors || row.action === 'error') : [];
    const actionLabel = { create: text('إنشاء', 'Create'), update: text('تحديث', 'Update'), unchanged: text('بدون تغيير', 'Unchanged'), error: text('خطأ', 'Error') };
    const fieldLabel = (field) => ({ price: text('السعر', 'Price'), compare_price: text('السعر قبل الخصم', 'Compare-at'), name: text('الاسم', 'Name'), status: text('الحالة', 'Status'), sku: 'SKU', categories: text('الأقسام', 'Categories'), stock: text('المخزون', 'Stock'), track_inventory: text('تتبع المخزون', 'Track inventory'), variant_price: text('سعر الخيار', 'Option price'), variant_compare_price: text('سعر الخيار قبل الخصم', 'Option compare-at'), variant_sku: text('SKU الخيار', 'Option SKU'), variant_status: text('حالة الخيار', 'Option status') }[field] || field);
    const show = (value) => value === null || value === undefined || value === '' ? '—' : typeof value === 'boolean' ? (value ? text('نعم', 'Yes') : text('لا', 'No')) : String(value);
    return <Dialog open onClose={() => { if (!inFlight.current) onClose(); }} className="ws-dialog-layer">
        <DialogBackdrop transition className="ws-backdrop" />
        <div className="ws-confirm-position"><DialogPanel transition className="ws-confirm-dialog ws-catalog-import ws-catalog-sheet">
            <div className="ws-catalog-import-heading"><DialogTitle>{text('ملف Excel / CSV للمنتجات والخيارات', 'Products and options Excel / CSV sheet')}</DialogTitle><button type="button" disabled={!!busy} onClick={onClose} className="ws-icon-button" aria-label={text('إغلاق', 'Close')}><HiOutlineXMark aria-hidden /></button></div>
            <div className="ws-import-step"><span>1.</span><div><h3>{text('تصدير المنتجات', 'Export products')}</h3>
                <p>{text('صف لكل خيار يحتوي قيم الخيارات وSKU والسعر والسعر قبل الخصم والمخزون. عدّل الملف ثم أعد رفعه.', 'One row per option with its option values, SKU, price, compare-at price and stock. Edit the file, then upload it again.')}</p>
                <div className="ws-catalog-bulk-fields"><fieldset className="ws-catalog-choice"><legend>{text('المنتجات المصدّرة', 'Products to export')}</legend>
                    {selected.length ? <label><input type="radio" name="sheet-export" checked={exportScope === 'selected'} onChange={() => setExportScope('selected')} />{text(`المحددة (${selected.length})`, `Selected (${selected.length})`)}</label> : null}
                    <label><input type="radio" name="sheet-export" checked={exportScope === 'all'} onChange={() => setExportScope('all')} />{text('كل المنتجات', 'All products')}</label>
                    {categories.length ? <label><input type="radio" name="sheet-export" checked={exportScope === 'category'} onChange={() => setExportScope('category')} />{text('منتجات قسم', 'One category')}</label> : null}
                </fieldset>
                {exportScope === 'category' ? <label>{text('القسم', 'Category')}<select value={exportCategory} onChange={(e) => setExportCategory(e.target.value)}><option value="">{text('اختر القسم', 'Choose a category')}</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label> : null}</div>
                <div className="ws-catalog-inline-actions">{['xlsx', 'csv'].map((format) => <button key={format} type="button" className="ws-secondary-button" disabled={!!busy || (exportScope === 'category' && !exportCategory)} onClick={() => void download(format)}><HiOutlineArrowDownTray aria-hidden />{busy === `export-${format}` ? text('جارٍ التصدير…', 'Exporting…') : format === 'xlsx' ? text('تصدير Excel', 'Export Excel') : text('تصدير CSV', 'Export CSV')}</button>)}</div>
            </div></div>
            {canUpdate || canCreate ? <div className="ws-import-step"><span>2.</span><div><h3>{text('استيراد الملف بعد التعديل', 'Import the edited sheet')}</h3>
                <fieldset className="ws-catalog-choice ws-catalog-bulk-fields" disabled={!!busy}><legend>{text('طريقة الاستيراد', 'Import mode')}</legend>
                    {canUpdate ? <label><input type="radio" name="sheet-mode" checked={mode === 'update'} onChange={() => { setMode('update'); setPreview(null); }} />{text('تحديث المنتجات الموجودة (مطابقة بالمعرّف أو SKU)', 'Update existing products (match by ID or SKU)')}</label> : null}
                    {canCreate ? <label><input type="radio" name="sheet-mode" checked={mode === 'create'} onChange={() => { setMode('create'); setPreview(null); }} />{text('إنشاء منتجات جديدة', 'Create new products')}</label> : null}
                </fieldset>
                <p>{mode === 'update' ? text('تُطابق الصفوف بـ product_id أو variant_id أو SKU. الخانة الفارغة في السعر قبل الخصم أو SKU أو سعر الخيار تمسح القيمة، والفارغة في المخزون أو الأقسام تتركها كما هي. لا تُنشأ خيارات جديدة في هذا الوضع.', 'Rows match by product_id, variant_id or SKU. An empty compare-at price, SKU or option price clears it; an empty stock or categories cell leaves it unchanged. New options are not created in this mode.') : text('كل مجموعة صفوف بنفس الاسم (أو نفس product_id) تصبح منتجًا جديدًا، وكل صف بقيم خيارات يصبح خيارًا بسعره ومخزونه.', 'Each group of rows with the same name (or product_id) becomes a new product, and each row with option values becomes an option with its own price and stock.')}</p>
                <button type="button" disabled={!!busy} className="ws-catalog-dropzone" onClick={() => { if (input.current) { input.current.value = ''; input.current.click(); } }} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length === 1) choose(e.dataTransfer.files[0]); }}><HiOutlineArrowUpTray aria-hidden /><strong>{file?.name || text('اسحب ملف XLSX أو CSV هنا أو اضغط للاختيار', 'Drop an XLSX or CSV file here or click to choose')}</strong><small>{text('حتى 2000 صف و8 ميجابايت', 'Up to 2000 rows and 8 MiB')}</small></button>
                <input ref={input} type="file" accept=".xlsx,.csv,text/csv" hidden aria-label={text('ملف المنتجات', 'Products file')} onChange={(e) => choose(e.target.files?.[0])} />
            </div></div> : null}
            {preview ? <section className="ws-catalog-import-preview" aria-label={text('نتيجة الفحص', 'Dry-run result')}>
                <h3>{text('نتيجة الفحص قبل التطبيق', 'Dry run before applying')}</h3>
                <p>{mode === 'update' ? text(`${summary.update_products} منتج و${summary.update_variants} خيار سيُحدَّث · ${summary.unchanged} صف بدون تغيير · ${summary.errors} صف به أخطاء`, `${summary.update_products} products and ${summary.update_variants} options will be updated · ${summary.unchanged} unchanged rows · ${summary.errors} rows with errors`) : text(`${summary.create_products} منتج و${summary.create_variants} خيار سيُنشأ · ${summary.errors} صف به أخطاء`, `${summary.create_products} products and ${summary.create_variants} options will be created · ${summary.errors} rows with errors`)}</p>
                {summary.errors ? <label className="ws-catalog-check"><input type="checkbox" checked={onlyErrors} onChange={(e) => setOnlyErrors(e.target.checked)} />{text('عرض الصفوف التي بها أخطاء فقط', 'Show only rows with errors')}</label> : null}
                <div className="ws-catalog-table-scroll"><table className="ws-catalog-tools-table"><caption className="sr-only">{text('نتيجة كل صف', 'Result for each row')}</caption><thead><tr><th scope="col">{text('الصف', 'Row')}</th><th scope="col">{text('المنتج', 'Product')}</th><th scope="col">{text('الإجراء', 'Action')}</th><th scope="col">{text('التفاصيل', 'Details')}</th></tr></thead>
                    <tbody>{rows.slice(0, 500).map((row) => <tr key={row.row} className={row.action === 'error' ? 'is-error' : undefined}><td>{row.row}</td><th scope="row">{row.product || '—'}{row.variant ? <small> · {row.variant}</small> : null}</th><td>{actionLabel[row.action] || row.action}</td>
                        <td>{row.errors.length ? <ul>{row.errors.map((item, index) => <li key={index}>{fieldLabel(item.field)}: {sheetErrorText(item, ar)}</li>)}</ul> : row.changes.length ? <ul>{row.changes.map((change, index) => <li key={index}>{fieldLabel(change.field)}: <bdi>{show(change.from)}</bdi> → <bdi>{show(change.to)}</bdi></li>)}</ul> : '—'}</td></tr>)}</tbody></table></div>
                {rows.length > 500 ? <p>{text('تُعرض أول 500 صف.', 'Showing the first 500 rows.')}</p> : null}
                {summary.errors ? <p role="alert" className="ws-catalog-error">{text('صحّح الأخطاء في الملف ثم أعد فحصه. لن يُطبّق أي تغيير حتى تختفي كل الأخطاء.', 'Fix the errors in the file and check it again. Nothing is applied until every error is resolved.')}</p> : <p>{text('سيُطبّق كل التغييرات دفعة واحدة. تُسجَّل تغييرات المخزون في سجل المخزون.', 'All changes apply in one step. Stock changes are recorded in the inventory history.')}</p>}
            </section> : null}
            {error ? <p role="alert" className="ws-catalog-error ws-import-errors">{error}</p> : null}
            <div className="ws-confirm-actions"><button type="button" disabled={!!busy} className="ws-secondary-button" onClick={onClose}>{text('إغلاق', 'Close')}</button>
                {canUpdate || canCreate ? <button type="button" className="ws-primary-button" disabled={!!busy || !file || (preview && summary.errors > 0)} onClick={() => void (preview ? apply() : check())}>{busy === 'preview' || busy === 'apply' ? text('جارٍ المعالجة…', 'Processing…') : preview ? (mode === 'update' ? text('تطبيق التحديثات', 'Apply updates') : text('إنشاء المنتجات', 'Create products')) : text('فحص الملف', 'Check file')}</button> : null}</div>
        </DialogPanel></div>
    </Dialog>;
}
