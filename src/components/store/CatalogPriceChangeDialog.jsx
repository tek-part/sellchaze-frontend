import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { HiOutlineXMark } from '../workspace/WorkspaceIcons';
import api from '../../api/client';
import { priceChangePayload, validPriceValue } from './catalog-tools';

const errorText = (e) => Object.values(e.response?.data?.errors || {}).flat().join(' ') || e.response?.data?.message || e.message;
const INITIAL = { direction: 'increase', kind: 'percent', value: '', rounding: 'none', applyCompare: true, applyVariants: true };

/** Bulk price change for one category or the selected products: preview, apply in one step, revert in one step. */
export default function CatalogPriceChangeDialog({ apiBase, categories, selected = [], currency, onClose, onApplied }) {
    const { i18n } = useTranslation();
    const ar = i18n.language.startsWith('ar');
    const text = (a, e) => ar ? a : e;
    const [scopeType, setScopeType] = useState(selected.length ? 'products' : 'category');
    const [categoryId, setCategoryId] = useState('');
    const [form, setForm] = useState(INITIAL);
    const [preview, setPreview] = useState(null);
    const [history, setHistory] = useState(null);
    const [busy, setBusy] = useState('');
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [confirmZero, setConfirmZero] = useState(false);
    const active = useRef(true); const inFlight = useRef(false); const key = useRef(null);
    const path = `${apiBase}/catalog/products/price-changes`;
    useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
    useEffect(() => {
        let live = true;
        api.get(path).then(({ data }) => { if (live) setHistory(data.data); }).catch(() => { if (live) setHistory([]); });
        return () => { live = false; };
    }, [path]);
    const money = (value) => value === null || value === undefined ? '—' : new Intl.NumberFormat(ar ? 'ar-EG' : 'en', { style: 'currency', currency: currency || 'EGP', maximumFractionDigits: 2 }).format(Number(value));
    const scope = scopeType === 'products' ? { type: 'products', product_ids: selected.map((product) => product.id) } : { type: 'category', category_id: Number(categoryId) };
    const ready = validPriceValue(form) && (scopeType === 'products' ? selected.length > 0 : categoryId !== '');
    const update = (patch) => { setForm((current) => ({ ...current, ...patch })); setPreview(null); setConfirmZero(false); setNotice(''); };
    const run = async (mode, work) => {
        if (inFlight.current) return; inFlight.current = true; setBusy(mode); setError('');
        try { await work(); } catch (e) { if (active.current) setError(e.response?.status === 409 ? text('تغيّرت الأسعار أو المنتجات منذ المعاينة. اعرض المعاينة مرة أخرى.', 'Prices or products changed since the preview. Preview the change again.') : errorText(e)); }
        finally { inFlight.current = false; if (active.current) setBusy(''); }
    };
    const runPreview = () => run('preview', async () => {
        const { data } = await api.post(`${path}/preview`, priceChangePayload(form, scope));
        if (!active.current) return;
        key.current = crypto.randomUUID(); setConfirmZero(false); setPreview(data.data);
    });
    const apply = () => run('apply', async () => {
        const { data } = await api.post(path, { ...priceChangePayload(form, scope), fingerprint: preview.fingerprint, idempotency_key: key.current, ...(preview.zero_prices ? { confirm_zero: confirmZero } : {}) });
        if (!active.current) return;
        setHistory((rows) => [data.data, ...(rows || []).filter((row) => row.id !== data.data.id)]);
        setPreview(null); setForm(INITIAL);
        setNotice(text(`تم تعديل أسعار ${data.data.product_count} منتج و${data.data.variant_count} خيار. يمكنك التراجع من السجل أدناه.`, `Prices updated for ${data.data.product_count} products and ${data.data.variant_count} options. You can undo it from the history below.`));
        onApplied?.(data.data);
    });
    const revert = (change) => run(`revert-${change.id}`, async () => {
        const { data } = await api.post(`${path}/${change.id}/revert`);
        if (!active.current) return;
        setHistory((rows) => rows.map((row) => row.id === change.id ? data.data : row));
        const result = data.data.revert_result || {};
        setNotice(text(`تمت استعادة ${result.restored ?? 0} سعر.${result.skipped ? ` لم تُستعد ${result.skipped} أسعار تغيّرت بعد التعديل.` : ''}`, `${result.restored ?? 0} prices restored.${result.skipped ? ` ${result.skipped} prices edited after the change were left as they are.` : ''}`));
        onApplied?.(data.data);
    });
    const describe = (change) => {
        const op = change.operation || {};
        const amount = op.kind === 'percent' ? `${Number(op.value)}%` : money(op.value);
        const target = change.scope?.type === 'category' ? text(`القسم ${change.scope.category_name}`, `category ${change.scope.category_name}`) : text(`${change.scope?.product_ids?.length ?? 0} منتج محدد`, `${change.scope?.product_ids?.length ?? 0} selected products`);
        return `${op.direction === 'increase' ? text('زيادة', 'Increase') : text('خفض', 'Decrease')} ${amount} · ${target}`;
    };
    return <Dialog open onClose={() => { if (!inFlight.current) onClose(); }} className="ws-dialog-layer">
        <DialogBackdrop transition className="ws-backdrop" />
        <div className="ws-confirm-position"><DialogPanel transition className="ws-confirm-dialog ws-catalog-import">
            <div className="ws-catalog-import-heading"><DialogTitle>{text('تعديل الأسعار بالجملة', 'Bulk price change')}</DialogTitle><button type="button" disabled={!!busy} onClick={onClose} className="ws-icon-button" aria-label={text('إغلاق', 'Close')}><HiOutlineXMark aria-hidden /></button></div>
            <form onSubmit={(event) => { event.preventDefault(); if (ready && !busy) void runPreview(); }}>
                <fieldset disabled={!!busy} className="ws-catalog-bulk-fields">
                    <fieldset className="ws-catalog-choice"><legend>{text('المنتجات المشمولة', 'Products included')}</legend>
                        {selected.length ? <label><input type="radio" name="price-scope" checked={scopeType === 'products'} onChange={() => { setScopeType('products'); setPreview(null); }} />{text(`المنتجات المحددة (${selected.length})`, `Selected products (${selected.length})`)}</label> : null}
                        <label><input type="radio" name="price-scope" checked={scopeType === 'category'} onChange={() => { setScopeType('category'); setPreview(null); }} />{text('كل منتجات قسم واحد', 'Every product in one category')}</label>
                    </fieldset>
                    {scopeType === 'category' ? <label>{text('القسم', 'Category')}<select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPreview(null); }} required><option value="">{text('اختر القسم', 'Choose a category')}</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label> : null}
                    <div className="ws-catalog-grid">
                        <label>{text('نوع التعديل', 'Change')}<select value={form.direction} onChange={(e) => update({ direction: e.target.value })}><option value="increase">{text('زيادة', 'Increase')}</option><option value="decrease">{text('خفض', 'Decrease')}</option></select></label>
                        <label>{text('بطريقة', 'By')}<select value={form.kind} onChange={(e) => update({ kind: e.target.value })}><option value="percent">{text('نسبة مئوية %', 'Percentage %')}</option><option value="amount">{text(`مبلغ ثابت (${currency || 'EGP'})`, `Fixed amount (${currency || 'EGP'})`)}</option></select></label>
                        <label>{text('القيمة', 'Value')}<input type="number" inputMode="decimal" min="0" step="any" dir="ltr" required value={form.value} onChange={(e) => update({ value: e.target.value })} /></label>
                        <label>{text('التقريب', 'Rounding')}<select value={form.rounding} onChange={(e) => update({ rounding: e.target.value })}><option value="none">{text('بدون (لأقرب قرشين)', 'None (2 decimals)')}</option><option value="round">{text('لأقرب رقم صحيح', 'Nearest whole number')}</option><option value="ceil">{text('للأعلى لرقم صحيح', 'Up to a whole number')}</option><option value="floor">{text('للأسفل لرقم صحيح', 'Down to a whole number')}</option></select></label>
                    </div>
                    <label className="ws-catalog-check"><input type="checkbox" checked={form.applyCompare} onChange={(e) => update({ applyCompare: e.target.checked })} />{text('تطبيق التعديل على السعر قبل الخصم أيضًا', 'Also apply to compare-at prices')}</label>
                    <label className="ws-catalog-check"><input type="checkbox" checked={form.applyVariants} onChange={(e) => update({ applyVariants: e.target.checked })} />{text('تطبيق التعديل على أسعار الخيارات المخصصة (الخيارات بدون سعر خاص تتبع سعر المنتج تلقائيًا)', 'Also apply to custom option prices (options without their own price follow the product price)')}</label>
                </fieldset>
                {!preview ? <div className="ws-confirm-actions"><button type="button" className="ws-secondary-button" disabled={!!busy} onClick={onClose}>{text('إلغاء', 'Cancel')}</button><button type="submit" className="ws-primary-button" disabled={!!busy || !ready}>{busy === 'preview' ? text('جارٍ الحساب…', 'Calculating…') : text('معاينة التعديل', 'Preview change')}</button></div> : null}
            </form>
            {preview ? <section className="ws-catalog-import-preview" aria-label={text('معاينة تعديل الأسعار', 'Price change preview')}>
                <h3>{text(`سيتغير سعر ${preview.product_count} منتج و${preview.variant_count} خيار`, `${preview.product_count} products and ${preview.variant_count} options will change`)}</h3>
                {preview.out_of_range ? <p role="alert" className="ws-catalog-error">{text(`${preview.out_of_range} سعر سيصبح أقل من صفر أو أكبر من الحد الأقصى، أو سيصبح السعر قبل الخصم لخيار أقل من سعره. عدّل القيمة قبل التطبيق.`, `${preview.out_of_range} prices would fall below zero, exceed the maximum, or leave an option's compare-at price below its price. Adjust the value before applying.`)}{preview.option_compare_below_price ? ` ${text(`(${preview.option_compare_below_price} خيار يتبع سعر المنتج — فعّل تعديل أسعار الخيارات والسعر قبل الخصم)`, `(${preview.option_compare_below_price} options follow the product price — also apply to option and compare-at prices)`)}` : ''}</p> : null}
                {preview.zero_prices ? <div role="alert" className="ws-catalog-error"><p>{text(`${preview.zero_prices} سعر سيصبح 0.00، أي أن المنتج سيُباع مجانًا.`, `${preview.zero_prices} prices would become 0.00, so those products would be sold for free.`)}</p><label className="ws-catalog-check"><input type="checkbox" checked={confirmZero} onChange={(e) => setConfirmZero(e.target.checked)} />{text('أؤكد أن هذه المنتجات ستصبح مجانية', 'I confirm these products become free')}</label></div> : null}
                {preview.compare_below_price ? <p>{text(`${preview.compare_below_price} منتج سيفقد عرض الخصم لأن السعر قبل الخصم لن يكون أعلى من السعر.`, `${preview.compare_below_price} products will stop showing a sale because the compare-at price will no longer be above the price.`)}</p> : null}
                {preview.product_count ? <div className="ws-catalog-table-scroll"><table className="ws-catalog-tools-table"><caption className="sr-only">{text('أمثلة على الأسعار الجديدة', 'Sample new prices')}</caption><thead><tr><th scope="col">{text('المنتج', 'Product')}</th><th scope="col">{text('السعر الحالي', 'Current price')}</th><th scope="col">{text('السعر الجديد', 'New price')}</th><th scope="col">{text('قبل الخصم', 'Compare-at')}</th></tr></thead>
                    <tbody>{preview.samples.map((row) => <tr key={row.id}><th scope="row">{row.name}{row.variants ? <small> · {text(`${row.variants} خيار`, `${row.variants} options`)}</small> : null}</th><td dir="ltr">{money(row.price)}</td><td dir="ltr">{row.new_price === null ? '—' : money(row.new_price)}</td><td dir="ltr">{row.compare_price === null ? '—' : `${money(row.compare_price)} → ${money(row.new_compare_price)}`}</td></tr>)}</tbody></table></div> : <p>{text('لا توجد منتجات مطابقة.', 'No matching products.')}</p>}
                {preview.product_count > preview.samples.length ? <p>{text(`تُعرض أول ${preview.samples.length} منتجات فقط.`, `Showing the first ${preview.samples.length} products.`)}</p> : null}
                <p>{text('يُطبّق التعديل على كل المنتجات دفعة واحدة، وتُحفظ الأسعار السابقة لتتمكن من التراجع بخطوة واحدة.', 'The change applies to every product at once, and previous prices are kept so you can undo it in one step.')}</p>
                <div className="ws-confirm-actions"><button type="button" className="ws-secondary-button" disabled={!!busy} onClick={() => setPreview(null)}>{text('تعديل الإعدادات', 'Edit settings')}</button><button type="button" className="ws-primary-button" disabled={!!busy || !preview.product_count || preview.out_of_range > 0 || (preview.zero_prices > 0 && !confirmZero)} onClick={() => void apply()}>{busy === 'apply' ? text('جارٍ التطبيق…', 'Applying…') : text('تطبيق التعديل', 'Apply change')}</button></div>
            </section> : null}
            {error ? <p role="alert" className="ws-catalog-error ws-import-errors">{error}</p> : null}
            {notice ? <p role="status" className="ws-catalog-notice">{notice}</p> : null}
            <section className="ws-catalog-import-preview" aria-label={text('سجل تعديلات الأسعار', 'Price change history')}>
                <h3>{text('سجل تعديلات الأسعار', 'Price change history')}</h3>
                {history === null ? <p role="status">{text('جارٍ التحميل…', 'Loading…')}</p> : history.length ? <ul>{history.map((change) => <li key={change.id}>
                    <strong>{describe(change)}</strong>
                    <span>{text(`${change.product_count} منتج · ${change.variant_count} خيار`, `${change.product_count} products · ${change.variant_count} options`)}{change.actor ? ` · ${change.actor}` : ''} · {new Date(change.created_at).toLocaleString(ar ? 'ar-EG' : 'en')}</span>
                    {change.status === 'reverted' ? <small>{text(`تم التراجع (${change.revert_result?.restored ?? 0} سعر استُعيد${change.revert_result?.skipped ? `، ${change.revert_result.skipped} لم يُستعد لأنه تغيّر لاحقًا` : ''})`, `Reverted (${change.revert_result?.restored ?? 0} restored${change.revert_result?.skipped ? `, ${change.revert_result.skipped} skipped because they changed later` : ''})`)}</small>
                        : <div><button type="button" className="ws-secondary-button" disabled={!!busy} onClick={() => void revert(change)}>{busy === `revert-${change.id}` ? text('جارٍ التراجع…', 'Reverting…') : text('تراجع عن هذا التعديل', 'Undo this change')}</button></div>}
                </li>)}</ul> : <p>{text('لا توجد تعديلات سابقة.', 'No previous changes.')}</p>}
            </section>
        </DialogPanel></div>
    </Dialog>;
}
