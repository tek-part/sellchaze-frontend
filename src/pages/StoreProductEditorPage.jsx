import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import useStoreScope from '../hooks/useStoreScope';
import useStoreLocales from '../hooks/useStoreLocales';
import ProductRichText from '../components/store/ProductRichText';
import ProductMediaEditor from '../components/store/ProductMediaEditor';
import StoreProductOptions, { ProductStockControl } from '../components/store/StoreProductOptions';

const field = 'mt-1 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:bg-slate-50';
const panel = 'space-y-4 rounded-xl border border-slate-200 bg-white p-5';
const button = 'rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold disabled:opacity-40';
const blank = { name: '', description: '', short_description: '', slug: '', sku: '', barcode: '', price: '', compare_price: '', cost: '', weight: '', seo_title: '', seo_description: '', category_id: '', position: 0, is_active: false, is_featured: false, translations: {} };
const errorText = (e) => Object.values(e.response?.data?.errors || {}).flat().join(' ') || e.response?.data?.message || e.message;

export default function StoreProductEditorPage() {
    const { productId } = useParams(); const isNew = !productId; const navigate = useNavigate();
    const { apiBase, uiBase } = useStoreScope(); const { store, permissions = [] } = useOutletContext();
    const { locales, defaultLocale } = useStoreLocales(); const { i18n } = useTranslation();
    const ar = i18n.language.startsWith('ar'); const text = (a, e) => ar ? a : e;
    const [locale, setLocale] = useState(defaultLocale);
    const [product, setProduct] = useState(null); const [draft, setDraft] = useState(blank); const [categories, setCategories] = useState([]);
    const [variantCount, setVariantCount] = useState(0); const [loading, setLoading] = useState(!isNew); const [busy, setBusy] = useState(false);
    const [error, setError] = useState(''); const [saved, setSaved] = useState(false); const [loadError, setLoadError] = useState(false); const [nonce, setNonce] = useState(0);
    const [cover, setCover] = useState(null); const [gallery, setGallery] = useState([]); const [removedMedia, setRemovedMedia] = useState([]); const [removeCover, setRemoveCover] = useState(false);
    const [mediaOrder, setMediaOrder] = useState([]);
    const [confirmDelete, setConfirmDelete] = useState(false); const inFlight = useRef(false); const fileVersion = useRef(0);
    const canEdit = permissions.includes(isNew ? 'products-create' : 'products-edit');
    const path = `${apiBase}/catalog/products`;
    useEffect(() => { setLocale(defaultLocale); }, [defaultLocale, productId]);
    useEffect(() => {
        let active = true; setLoading(!isNew); setLoadError(false); setError(''); setSaved(false);
        setCover(null); setGallery([]); setRemovedMedia([]); setRemoveCover(false); setConfirmDelete(false); setMediaOrder([]);
        if (isNew) { setDraft({ ...blank }); setProduct(null); setVariantCount(0); }
        else api.get(`${path}/${productId}`).then(({ data }) => {
            if (!active) return; const value = data.data; setProduct(value); setMediaOrder((value.media || []).map((item) => item.id)); setDraft({ ...blank, ...Object.fromEntries(Object.keys(blank).map((key) => [key, value[key] ?? blank[key]])) }); setVariantCount(value.variants?.length || 0);
        }).catch((e) => { if (active) { setError(errorText(e)); setLoadError(true); } }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [path, productId, isNew, nonce]);
    useEffect(() => {
        let active = true;
        if (permissions.includes('categories-list')) api.get(`${apiBase}/catalog/categories`, { params: { per_page: 100 } }).then(({ data }) => { if (active) setCategories(data.data || []); }).catch((e) => { if (active) setError(errorText(e)); });
        return () => { active = false; };
    }, [apiBase, permissions]);
    const refreshStock = useCallback(async () => { const { data } = await api.get(`${path}/${productId}`); setProduct(data.data); }, [path, productId]);
    const change = (key, value) => { setSaved(false); setDraft((current) => ({ ...current, [key]: value })); };
    const localizedValue = (key) => locale === defaultLocale ? draft[key] : draft.translations?.[key]?.[locale] || '';
    function changeLocalized(key, value) {
        setSaved(false); setDraft((current) => ({ ...current, ...(locale === defaultLocale ? { [key]: value } : {}), translations: { ...current.translations, [key]: { ...current.translations?.[key], [locale]: value } } }));
    }
    async function save(event) {
        event.preventDefault(); if (!canEdit || inFlight.current) return;
        if (!draft.name.trim()) { setLocale(defaultLocale); setError(text('أدخل اسم المنتج باللغة الأساسية.', 'Enter the product name in the default language.')); return; }
        inFlight.current = true; setBusy(true); setError(''); setSaved(false);
        const payload = new FormData();
        Object.entries(draft).forEach(([key, value]) => { if (key !== 'translations') payload.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value ?? '')); });
        payload.set('translations', JSON.stringify({ ...draft.translations, ...Object.fromEntries(['name', 'description', 'short_description'].map((key) => [key, { ...draft.translations?.[key], [defaultLocale]: draft[key] }])) }));
        if (cover) payload.append('image', cover);
        payload.append('remove_image', removeCover ? '1' : '0');
        gallery.forEach((file) => payload.append('gallery[]', file)); removedMedia.forEach((id) => payload.append('remove_media_ids[]', String(id)));
        mediaOrder.filter((id) => !removedMedia.includes(id)).forEach((id) => payload.append('media_order[]', String(id)));
        if (!isNew) payload.append('_method', 'PUT');
        try {
            const { data } = await api.post(isNew ? path : `${path}/${productId}`, payload);
            setCover(null); setGallery([]); setRemovedMedia([]); setRemoveCover(false); fileVersion.current += 1;
            setProduct(data.data); setMediaOrder((data.data.media || []).map((item) => item.id)); setDraft({ ...blank, ...Object.fromEntries(Object.keys(blank).map((key) => [key, data.data[key] ?? blank[key]])) }); setSaved(true);
            if (isNew) navigate(`${uiBase}/products/${data.data.id}/edit`, { replace: true });
        } catch (e) { setError(errorText(e)); } finally { inFlight.current = false; setBusy(false); }
    }
    async function destroy() {
        if (inFlight.current) return; inFlight.current = true; setBusy(true); setError('');
        try { await api.delete(`${path}/${productId}`); navigate(`${uiBase}/products`); }
        catch (e) { setError(errorText(e)); } finally { inFlight.current = false; setBusy(false); }
    }
    const storefrontUrl = store?.storefront_url || store?.public_url;
    return <div className="mx-auto max-w-6xl space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3"><div><Link className="text-sm text-emerald-700 underline" to={`${uiBase}/products`}>{text('منتجات المتجر', 'Store products')}</Link><h1 className="mt-2 text-2xl font-bold">{isNew ? text('إضافة منتج', 'Add product') : product?.name || text('تعديل المنتج', 'Edit product')}</h1></div><div className="flex flex-wrap gap-2">{product?.is_active && storefrontUrl ? <a className={button} href={`${storefrontUrl.replace(/\/$/, '')}/products/${product.slug}`} target="_blank" rel="noreferrer">{text('عرض المنتج', 'View product')}</a> : null}{canEdit ? <button className="rounded-lg bg-emerald-600 px-5 py-2 font-semibold text-white disabled:opacity-40" form="store-product-editor" type="submit" disabled={busy || loading || loadError}>{busy ? text('جارٍ الحفظ…', 'Saving…') : text('حفظ المنتج', 'Save product')}</button> : null}</div></header>
        {error ? <div role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}{loadError ? <button className="ms-3 underline" onClick={() => setNonce(nonce + 1)}>{text('إعادة التحميل', 'Reload')}</button> : null}</div> : null}
        {saved ? <p role="status" className="rounded-lg bg-emerald-50 p-3 text-emerald-700">{text('تم حفظ المنتج.', 'Product saved.')}</p> : null}
        {loading ? <p role="status">{text('جارٍ التحميل…', 'Loading…')}</p> : !loadError ? <>
            <form id="store-product-editor" onSubmit={save}><fieldset disabled={!canEdit || busy} className="grid min-w-0 gap-5 lg:grid-cols-3">
                <div className="min-w-0 space-y-5 lg:col-span-2"><section className={panel}><h2 className="text-lg font-bold">{text('معلومات المنتج', 'Product information')}</h2><div className="flex flex-wrap gap-2" role="group" aria-label={text('لغة المحتوى', 'Content language')}>{locales.map((value) => <button key={value} type="button" aria-pressed={locale === value} className={`${button} ${locale === value ? 'bg-emerald-50 text-emerald-800' : ''}`} onClick={() => setLocale(value)}>{value.toUpperCase()}{value === defaultLocale ? ` · ${text('الأساسية', 'Default')}` : ''}</button>)}</div>
                    {[['name', 'اسم المنتج', 'Product name', 255, 1], ['short_description', 'وصف مختصر', 'Short description', 500, 2]].map(([key, a, e, maxLength, rows]) => <label className="block text-sm font-medium" key={key}>{text(a, e)} ({locale}){rows === 1 ? <input className={field} required={locale === defaultLocale} maxLength={maxLength} value={localizedValue(key)} dir={locale === 'ar' ? 'rtl' : 'ltr'} onChange={(event) => changeLocalized(key, event.target.value)} /> : <textarea className={field} rows={rows} maxLength={maxLength} value={localizedValue(key)} dir={locale === 'ar' ? 'rtl' : 'ltr'} onChange={(event) => changeLocalized(key, event.target.value)} />}</label>)}
                    <ProductRichText key={`${productId || 'new'}-${locale}`} value={localizedValue('description')} onChange={(value) => changeLocalized('description', value)} label={`${text('وصف المنتج', 'Product description')} (${locale})`} locale={locale} ar={ar} disabled={!canEdit || busy} media={(product?.media || []).filter((item) => !removedMedia.includes(item.id))} />
                </section>
                <ProductMediaEditor product={product} cover={cover} setCover={setCover} removeCover={removeCover} setRemoveCover={setRemoveCover} gallery={gallery} setGallery={setGallery} removed={removedMedia} setRemoved={setRemovedMedia} order={mediaOrder} setOrder={setMediaOrder} setError={setError} ar={ar} fileVersion={fileVersion.current} />
                <section className={panel}><h2 className="text-lg font-bold">{text('محركات البحث', 'Search engines')}</h2><label className="block text-sm">{text('رابط المنتج', 'Product slug')}<input className={field} dir="ltr" pattern="[a-z0-9-]+" maxLength={255} value={draft.slug} onChange={(e) => change('slug', e.target.value)} placeholder="canvas-bag" /></label><label className="block text-sm">{text('عنوان محركات البحث', 'SEO title')}<input className={field} maxLength={255} value={draft.seo_title} onChange={(e) => change('seo_title', e.target.value)} /></label><label className="block text-sm">{text('وصف محركات البحث', 'SEO description')}<textarea className={field} rows={3} maxLength={500} value={draft.seo_description} onChange={(e) => change('seo_description', e.target.value)} /></label></section></div>
                <div className="min-w-0 space-y-5"><section className={panel}><h2 className="text-lg font-bold">{text('التسعير', 'Pricing')} · {store?.currency}</h2>{[['price', 'سعر البيع', 'Selling price'], ['compare_price', 'السعر قبل الخصم', 'Compare-at price'], ['cost', 'تكلفة المنتج', 'Product cost']].map(([key, a, e]) => <label className="block text-sm" key={key}>{text(a, e)}<input className={field} type="number" min="0" max="999999999.99" step="0.01" required={key === 'price'} value={draft[key]} onChange={(event) => change(key, event.target.value)} /></label>)}<p className="text-xs text-slate-500">{text('التكلفة داخلية ولا تظهر للعملاء.', 'Cost is internal and never shown to customers.')}</p></section>
                <section className={panel}><h2 className="text-lg font-bold">{text('التنظيم والنشر', 'Organization and publishing')}</h2><label className="block text-sm">{text('التصنيف', 'Category')}<select className={field} value={draft.category_id} onChange={(e) => change('category_id', e.target.value)}><option value="">{text('دون تصنيف', 'No category')}</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>{[['sku', 'رمز المخزون', 'SKU'], ['barcode', 'الباركود', 'Barcode']].map(([key, a, e]) => <label className="block text-sm" key={key}>{text(a, e)}<input className={field} maxLength={120} value={draft[key]} onChange={(event) => change(key, event.target.value)} /></label>)}<label className="block text-sm">{text('الوزن بالكيلوغرام', 'Weight in kg')}<input className={field} type="number" min="0" max="999999.999" step="0.001" value={draft.weight} onChange={(e) => change('weight', e.target.value)} /></label><label className="block text-sm">{text('ترتيب العرض', 'Display order')}<input className={field} type="number" min="0" step="1" value={draft.position} onChange={(e) => change('position', e.target.value)} /></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.is_active} onChange={(e) => change('is_active', e.target.checked)} />{text('نشر المنتج في المتجر', 'Publish product in the store')}</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.is_featured} onChange={(e) => change('is_featured', e.target.checked)} />{text('منتج مميز', 'Featured product')}</label></section></div>
            </fieldset></form>
            {product ? <>{!variantCount ? <section className={panel}><h2 className="text-lg font-bold">{text('مخزون المنتج', 'Product inventory')}</h2><ProductStockControl key={`${product.id}-${product.stock_quantity}-${product.reserved_quantity}-${product.track_inventory}`} productId={product.id} stock={product} onSaved={refreshStock} /></section> : null}<StoreProductOptions key={product.id} productId={product.id} locales={locales} defaultLocale={defaultLocale} onCount={setVariantCount} media={product.media} onProductHidden={() => { setProduct((current) => ({ ...current, is_active: false })); setDraft((current) => ({ ...current, is_active: false })); }} /></> : <p className="rounded-lg bg-emerald-50 p-4 text-sm">{text('احفظ المنتج أولًا لإضافة خياراته وضبط المخزون.', 'Save the product to add its options and configure inventory.')}</p>}
            {product && permissions.includes('products-delete') ? <section className="rounded-xl border border-red-200 p-4">{confirmDelete ? <><p>{text('حذف المنتج نهائيًا؟ الطلبات المحجوزة تمنع الحذف.', 'Permanently delete this product? Reserved orders prevent deletion.')}</p><div className="mt-3 flex gap-2"><button className={button} disabled={busy} onClick={destroy}>{text('تأكيد الحذف', 'Confirm deletion')}</button><button className={button} disabled={busy} onClick={() => setConfirmDelete(false)}>{text('إلغاء', 'Cancel')}</button></div></> : <button className={`${button} text-red-700`} disabled={busy} onClick={() => setConfirmDelete(true)}>{text('حذف المنتج', 'Delete product')}</button>}</section> : null}
        </> : null}
    </div>;
}
