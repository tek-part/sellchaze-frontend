import { useCallback, useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import useStoreScope from '../../hooks/useStoreScope';
import StoreVariantGenerator from './StoreVariantGenerator';
import StoreOptionDisplay from './StoreOptionDisplay';
import StoreVariantBulkEditor from './StoreVariantBulkEditor';
import StoreVariantStockActions from './StoreVariantStockActions';

const field = 'mt-1 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm';
const button = 'rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold disabled:opacity-40';
const errorText = (e) => Object.values(e.response?.data?.errors || {}).flat().join(' ') || e.response?.data?.message || e.message;

export function ProductStockControl({ productId, stock, variantId, onSaved }) {
    const { apiBase } = useStoreScope();
    const { permissions = [] } = useOutletContext();
    const { i18n } = useTranslation(); const ar = i18n.language.startsWith('ar'); const text = (a, e) => ar ? a : e;
    const [edit, setEdit] = useState(null); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const inFlight = useRef(false);
    async function save(event) {
        event.preventDefault(); if (inFlight.current) return; inFlight.current = true; setBusy(true); setError('');
        try {
            await api.put(`${apiBase}/catalog/inventory/${productId}`, { variant_id: variantId || null, track_inventory: edit.tracking, stock_quantity: Number(edit.quantity), expected_stock: stock.stock_quantity, expected_reserved: stock.reserved_quantity, expected_tracking: stock.track_inventory, note: edit.note });
            setEdit(null); await onSaved();
        } catch (e) { setError(errorText(e)); } finally { inFlight.current = false; setBusy(false); }
    }
    return <div className="space-y-3 rounded-lg bg-slate-50 p-4 text-sm">
        <p>{text('الفعلية', 'On hand')}: <b>{stock.stock_quantity}</b> · {text('المحجوزة', 'Reserved')}: <b>{stock.reserved_quantity}</b> · {text('المتاحة', 'Available')}: <b>{stock.track_inventory ? Math.max(0, stock.stock_quantity - stock.reserved_quantity) : text('دون تتبع', 'Untracked')}</b></p>
        {error ? <p role="alert" className="text-red-700">{error}</p> : null}
        {edit ? <form onSubmit={save} className="space-y-3"><fieldset disabled={busy} className="min-w-0 space-y-3"><label className="flex items-center gap-2"><input type="checkbox" checked={edit.tracking} onChange={(e) => setEdit({ ...edit, tracking: e.target.checked })} />{text('تتبع المخزون ومنع البيع عند نفاده', 'Track inventory and prevent overselling')}</label><label className="block">{text('الكمية الفعلية الجديدة', 'New on-hand quantity')}<input className={field} type="number" min={stock.reserved_quantity} max={100000000} step="1" required value={edit.quantity} onChange={(e) => setEdit({ ...edit, quantity: e.target.value })} /></label><label className="block">{text('سبب التعديل', 'Adjustment note')}<input className={field} maxLength={500} value={edit.note} onChange={(e) => setEdit({ ...edit, note: e.target.value })} /></label><div className="flex gap-2"><button className={button} type="submit">{text('حفظ المخزون', 'Save inventory')}</button><button className={button} type="button" onClick={() => setEdit(null)}>{text('إلغاء', 'Cancel')}</button></div></fieldset></form> : permissions.includes('products-edit') ? <button className={button} type="button" onClick={() => { setError(''); setEdit({ tracking: stock.track_inventory, quantity: stock.stock_quantity, note: '' }); }}>{text('تعديل المخزون', 'Adjust inventory')}</button> : null}
    </div>;
}

export default function StoreProductOptions({ productId, locales, defaultLocale, onCount, media, onProductHidden }) {
    const { apiBase } = useStoreScope(); const { permissions = [] } = useOutletContext(); const { i18n } = useTranslation(); const ar = i18n.language.startsWith('ar'); const text = (a, e) => ar ? a : e;
    const [rows, setRows] = useState([]); const [edit, setEdit] = useState(null); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [loading, setLoading] = useState(true); const inFlight = useRef(false); const [remove, setRemove] = useState(null);
    const path = `${apiBase}/catalog/products/${productId}/variants`;
    const images = (media || []).filter((item) => item.type === 'image');
    const mediaVersion = (media || []).map((item) => item.id).join(',');
    const load = useCallback(async () => {
        const { data } = await api.get(path); setRows(data.data); onCount(data.data.length);
    }, [path, onCount]);
    useEffect(() => { let active = true; setLoading(true); api.get(path).then(({ data }) => { if (active) { setRows(data.data); onCount(data.data.length); } }).catch((e) => { if (active) setError(errorText(e)); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [path, onCount, mediaVersion]);
    function start(row) {
        setError(''); setEdit({ id: row?.id, edit_version: row?.edit_version, image_media_id: row?.image_media_id ?? (row?.image ? 'legacy' : ''), name: row?.name || '', sku: row?.sku || '', barcode: row?.barcode || '', price_override: row?.price_override ?? '', compare_price: row?.compare_price ?? '', cost: row?.cost ?? '', weight: row?.weight ?? '', is_active: row?.is_active ?? true, position: row?.position ?? rows.length, translations: row?.translations?.name || {}, options: Object.entries(row?.options || {}).map(([name, value]) => ({ name, value })) });
    }
    async function save(event) {
        event.preventDefault(); if (inFlight.current) return;
        const names = edit.options.map((option) => option.name.trim());
        if (new Set(names).size !== names.length) { setError(text('أسماء الخصائص يجب أن تكون مختلفة.', 'Option names must be unique.')); return; }
        inFlight.current = true; setBusy(true); setError('');
        const payload = { ...edit, sku: edit.sku || null, barcode: edit.barcode || null, price_override: edit.price_override === '' ? null : edit.price_override, compare_price: edit.compare_price === '' ? null : edit.compare_price, cost: edit.cost === '' ? null : edit.cost, weight: edit.weight === '' ? null : edit.weight, translations: { name: { ...edit.translations, [defaultLocale]: edit.name } }, options: Object.fromEntries(edit.options.map((option) => [option.name.trim(), option.value.trim()])) };
        delete payload.id;
        if (payload.image_media_id === 'legacy') delete payload.image_media_id;
        else payload.image_media_id = payload.image_media_id ? Number(payload.image_media_id) : null;
        try { if (edit.id) await api.put(`${path}/${edit.id}`, payload); else await api.post(path, payload); setEdit(null); await load(); }
        catch (e) { setError(errorText(e)); } finally { inFlight.current = false; setBusy(false); }
    }
    async function destroy() {
        if (inFlight.current) return; inFlight.current = true; setBusy(true); setError('');
        try { const { data } = await api.delete(`${path}/${remove.id}`); if (data.meta?.product_active === false) onProductHidden?.(); setRemove(null); await load(); }
        catch (e) { setError(errorText(e)); } finally { inFlight.current = false; setBusy(false); }
    }
    return <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <header className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">{text('خيارات المنتج', 'Product options')}</h2><p className="text-sm text-slate-500">{text('سعر ومخزون مستقل لكل لون أو مقاس. السعر الفارغ يستخدم سعر المنتج.', 'Independent price and inventory per color or size. An empty price inherits the product price.')}</p></div>{permissions.includes('products-edit') ? <button className={button} disabled={busy} onClick={() => start(null)}>{text('إضافة خيار', 'Add option')}</button> : null}</header>
        {error ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        {loading ? <p role="status">{text('جارٍ التحميل…', 'Loading…')}</p> : null}
        {permissions.includes('products-edit') && !loading && !edit && !remove ? <StoreOptionDisplay path={`${apiBase}/catalog/products/${productId}`} rows={rows} locales={locales} media={media} /> : null}
        {permissions.includes('products-edit') && rows.length > 0 && !edit && !remove ? <StoreVariantBulkEditor path={path} rows={rows} media={media} onSaved={load} /> : null}
        {(permissions.includes('products-edit') || permissions.includes('products-delete')) && !loading && !edit && !remove ? <StoreVariantStockActions path={path} rows={rows} canEdit={permissions.includes('products-edit')} canDelete={permissions.includes('products-delete')} onSaved={load} onProductHidden={onProductHidden} /> : null}
        {permissions.includes('products-edit') && !edit && !remove ? <StoreVariantGenerator path={path} onSaved={load} /> : null}
        {remove ? <div className="rounded-lg border border-red-200 p-4" role="alert"><p>{text('حذف الخيار', 'Delete option')}: {remove.name}?</p>{rows.length === 1 ? <p className="mt-2 text-sm">{text('حذف آخر صنف يحوّل المنتج إلى مسودة. اضبط مخزون المنتج وأعد نشره لبيعه دون خيارات.', 'Deleting the final variant makes the product a draft. Configure base-product stock and republish to sell without options.')}</p> : null}<div className="mt-3 flex gap-2"><button className={button} disabled={busy} onClick={destroy}>{text('تأكيد الحذف', 'Confirm deletion')}</button><button className={button} disabled={busy} onClick={() => setRemove(null)}>{text('إلغاء', 'Cancel')}</button></div></div> : null}
        {edit ? <form onSubmit={save} className="rounded-lg border border-emerald-200 p-4"><fieldset disabled={busy} className="min-w-0 space-y-4"><h3 className="font-bold">{edit.id ? text('تعديل الخيار', 'Edit option') : text('خيار جديد', 'New option')}</h3><div className="grid gap-4 sm:grid-cols-2"><label>{text('اسم الخيار', 'Option name')}<input className={field} required maxLength={255} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></label>{locales.filter((locale) => locale !== defaultLocale).map((locale) => <label key={locale}>{text('ترجمة الاسم', 'Name translation')} ({locale})<input className={field} dir={locale === 'ar' ? 'rtl' : 'ltr'} maxLength={255} value={edit.translations[locale] || ''} onChange={(e) => setEdit({ ...edit, translations: { ...edit.translations, [locale]: e.target.value } })} /></label>)}{[['sku', 'رمز المخزون', 'SKU'], ['barcode', 'الباركود', 'Barcode'], ['price_override', 'سعر الخيار', 'Option price'], ['compare_price', 'السعر قبل الخصم', 'Compare-at price'], ['cost', 'التكلفة', 'Cost'], ['weight', 'الوزن بالكيلوغرام', 'Weight in kg'], ['position', 'الترتيب', 'Position']].map(([key, a, e]) => <label key={key}>{text(a, e)}<input className={field} type={['sku', 'barcode'].includes(key) ? 'text' : 'number'} min="0" max={key === 'weight' ? '999999.999' : '999999999.99'} step={key === 'position' ? '1' : key === 'weight' ? '0.001' : '0.01'} value={edit[key]} onChange={(event) => setEdit({ ...edit, [key]: event.target.value })} /></label>)}</div>
            <label className="block">{text('صورة الصنف', 'Variant image')}<select className={field} value={edit.image_media_id} onChange={(e) => setEdit({ ...edit, image_media_id: e.target.value })}><option value="">{text('بدون صورة مخصصة', 'No custom image')}</option>{edit.image_media_id === 'legacy' ? <option value="legacy">{text('الاحتفاظ بالصورة الحالية', 'Keep current image')}</option> : null}{images.map((image) => <option key={image.id} value={image.id}>#{image.id} {image.alt}</option>)}</select>{images.find((image) => image.id === Number(edit.image_media_id)) ? <img className="mt-2 h-20 w-20 rounded object-cover" src={images.find((image) => image.id === Number(edit.image_media_id)).url} alt={edit.name} /> : null}</label>
            <div className="space-y-2"><h4 className="font-semibold">{text('خصائص الخيار', 'Option attributes')}</h4>{edit.options.map((option, index) => <div className="flex gap-2" key={index}><input className={field} required maxLength={80} aria-label={text('اسم الخاصية', 'Attribute name')} placeholder={text('اللون', 'Color')} value={option.name} onChange={(e) => setEdit({ ...edit, options: edit.options.map((item, i) => i === index ? { ...item, name: e.target.value } : item) })} /><input className={field} required maxLength={120} aria-label={text('قيمة الخاصية', 'Attribute value')} placeholder={text('أزرق', 'Blue')} value={option.value} onChange={(e) => setEdit({ ...edit, options: edit.options.map((item, i) => i === index ? { ...item, value: e.target.value } : item) })} /><button className={button} type="button" aria-label={text('إزالة الخاصية', 'Remove attribute')} onClick={() => setEdit({ ...edit, options: edit.options.filter((_, i) => i !== index) })}>×</button></div>)}<button type="button" className={button} disabled={edit.options.length >= 10} onClick={() => setEdit({ ...edit, options: [...edit.options, { name: '', value: '' }] })}>{text('إضافة خاصية', 'Add attribute')}</button></div>
            <label className="flex items-center gap-2"><input type="checkbox" checked={edit.is_active} onChange={(e) => setEdit({ ...edit, is_active: e.target.checked })} />{text('إتاحة هذا الخيار للبيع', 'Make this option available')}</label><div className="flex gap-2"><button className="rounded-lg bg-emerald-600 px-4 py-2 text-white" type="submit">{text('حفظ الخيار', 'Save option')}</button><button className={button} type="button" onClick={() => setEdit(null)}>{text('إلغاء', 'Cancel')}</button></div></fieldset></form> : null}
        <div className="space-y-4">{rows.map((row) => <div key={row.id} className="space-y-3 rounded-lg border border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div>{row.image_url ? <img className="mb-2 h-16 w-16 rounded object-cover" src={row.image_url} alt={row.name} /> : null}<b>{row.name}</b><p className="text-sm text-slate-500">{Object.entries(row.options || {}).map(([key, value]) => `${key}: ${value}`).join(' · ')} · {row.is_active ? text('متاح', 'Active') : text('مخفي', 'Hidden')} · {row.price_override ?? text('سعر المنتج', 'Product price')}</p></div><div className="flex gap-2">{permissions.includes('products-edit') ? <button className={button} disabled={busy} onClick={() => start(row)}>{text('تعديل الخيار', 'Edit option')}</button> : null}{permissions.includes('products-delete') ? <button className={button} disabled={busy || row.reserved_quantity > 0} onClick={() => setRemove(row)}>{text('حذف', 'Delete')}</button> : null}</div></div><ProductStockControl key={`${row.id}-${row.stock_quantity}-${row.reserved_quantity}-${row.track_inventory}`} productId={productId} variantId={row.id} stock={row} onSaved={load} /></div>)}</div>
        {!loading && !rows.length ? <p className="text-sm text-slate-500">{text('يُباع المنتج حاليًا دون خيارات.', 'This product currently sells without options.')}</p> : null}
    </section>;
}
