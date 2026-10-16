import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import useStoreScope from '../hooks/useStoreScope';
import useStoreLocales from '../hooks/useStoreLocales';
import ProductRichText from '../components/store/ProductRichText';
import ProductMediaEditor from '../components/store/ProductMediaEditor';
import StoreProductOptions, { ProductStockControl } from '../components/store/StoreProductOptions';
import StoreProductPersonalization from '../components/store/StoreProductPersonalization';
import StoreProductDigital, { DigitalProductFields, digitalPayload } from '../components/store/StoreProductDigital';
import StoreProductQuantityOffers from '../components/store/StoreProductQuantityOffers';
import ProductCategoryPicker from '../components/store/ProductCategoryPicker';
import { fetchAllPages } from '../utils/fetchAllPages';
import ProductCreationOptions from '../components/store/ProductCreationOptions';
import ProductPreferencesDialog, { newProductPreferences } from '../components/store/ProductPreferencesDialog';
import { compileProductProperties, creationPayload, regularPrice, setRegularPrice, setDiscountPrice } from '../lib/product-creation-draft';
import { HiOutlineArrowRight, HiOutlineArrowLeft, HiOutlineEye } from '../components/workspace/WorkspaceIcons';
import './store/product-editor.css';

const blank = { name: '', description: '', short_description: '', slug: '', sku: '', barcode: '', price: '', compare_price: '', cost: '', weight: '', seo_title: '', seo_description: '', category_id: '', category_ids: [], position: 0, display_priority: 0, catalog_hidden: false, product_preferences: null, preferences_version: '', is_active: false, is_featured: false, translations: {} };
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
    const [preferencesOpen, setPreferencesOpen] = useState(false);
    const [creation, setCreation] = useState({ axes: [], rows: [], signature: '[]' });
    const [initialStock, setInitialStock] = useState({ track_inventory: false, stock_quantity: '0' });
    const creationKey = useRef(null); const generation = useRef(0);
    const [digital, setDigital] = useState({ type: 'physical', url: '', codes: '' });
    const [confirmDelete, setConfirmDelete] = useState(false); const inFlight = useRef(false); const fileVersion = useRef(0);
    const canEdit = permissions.includes(isNew ? 'products-create' : 'products-edit');
    const path = `${apiBase}/catalog/products`;
    useEffect(() => { setLocale(defaultLocale); }, [defaultLocale, productId]);
    useEffect(() => {
        let active = true; generation.current += 1; inFlight.current = false; setBusy(false); setLoading(!isNew); setLoadError(false); setError(''); setSaved(false);
        setCover(null); setGallery([]); setRemovedMedia([]); setRemoveCover(false); setConfirmDelete(false); setMediaOrder([]);
        setPreferencesOpen(false);
        if (isNew) { setDraft({ ...blank, product_preferences: newProductPreferences() }); setProduct(null); setVariantCount(0); creationKey.current = crypto.randomUUID(); setCreation({ axes: [], rows: [], signature: '[]' }); setInitialStock({ track_inventory: false, stock_quantity: '0' }); }
        if (isNew) setDigital({ type: 'physical', url: '', codes: '' });
        else api.get(`${path}/${productId}`).then(({ data }) => {
            if (!active) return; const value = data.data; setProduct(value); setMediaOrder((value.media || []).map((item) => item.id)); setDraft({ ...blank, ...Object.fromEntries(Object.keys(blank).map((key) => [key, value[key] ?? blank[key]])) }); setVariantCount(value.variants?.length || 0);
        }).catch((e) => { if (active) { setError(errorText(e)); setLoadError(true); } }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; generation.current += 1; };
    }, [path, productId, isNew, nonce]);
    useEffect(() => {
        let active = true;
        if (permissions.includes('categories-list')) fetchAllPages(`${apiBase}/catalog/categories`).then((rows) => { if (active) setCategories(rows); }).catch((e) => { if (active) setError(errorText(e)); });
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
        const properties = compileProductProperties(creation.axes, gallery);
        if (isNew && (!properties.valid || properties.signature !== creation.signature)) { setError(text('أكمل الخواص وحدّث الأصناف قبل الحفظ.', 'Complete properties and update combinations before saving.')); return; }
        const attemptGeneration = generation.current;
        inFlight.current = true; setBusy(true); setError(''); setSaved(false);
        const payload = new FormData();
        if (isNew) {
            payload.append('creation_key', creationKey.current);
            payload.append('creation', JSON.stringify(creationPayload(creation.rows, initialStock, properties.galleryImages)));
            payload.append('option_display', JSON.stringify(properties.display));
            payload.append('personalization_fields', JSON.stringify(properties.fields));
        }
        if (isNew) Object.entries(digitalPayload(digital)).forEach(([key, value]) => { if (Array.isArray(value)) value.forEach((code) => payload.append(`${key}[]`, code)); else payload.append(key, value); });
        Object.entries(draft).forEach(([key, value]) => { if (key !== 'translations' && (key !== 'preferences_version' || !isNew && value)) payload.append(key, key === 'product_preferences' || Array.isArray(value) ? JSON.stringify(value) : typeof value === 'boolean' ? (value ? '1' : '0') : String(value ?? '')); });
        payload.set('translations', JSON.stringify({ ...draft.translations, ...Object.fromEntries(['name', 'description', 'short_description'].map((key) => [key, { ...draft.translations?.[key], [defaultLocale]: draft[key] }])) }));
        if (cover) payload.append('image', cover);
        payload.append('remove_image', removeCover ? '1' : '0');
        gallery.forEach((file) => payload.append('gallery[]', file)); removedMedia.forEach((id) => payload.append('remove_media_ids[]', String(id)));
        mediaOrder.filter((id) => !removedMedia.includes(id)).forEach((id) => payload.append('media_order[]', String(id)));
        if (!isNew) payload.append('_method', 'PUT');
        try {
            const { data } = await api.post(isNew ? path : `${path}/${productId}`, payload);
            if (generation.current !== attemptGeneration) return;
            setCover(null); setGallery([]); setRemovedMedia([]); setRemoveCover(false); fileVersion.current += 1;
            setProduct(data.data); setMediaOrder((data.data.media || []).map((item) => item.id)); setDraft({ ...blank, ...Object.fromEntries(Object.keys(blank).map((key) => [key, data.data[key] ?? blank[key]])) }); setSaved(true);
            if (isNew) navigate(`${uiBase}/products/${data.data.id}/edit`, { replace: true });
        } catch (e) { if (generation.current === attemptGeneration) { setError(errorText(e)); if (Object.keys(e.response?.data?.errors || {}).some((key) => key.startsWith('product_preferences'))) setPreferencesOpen(true); } } finally { if (generation.current === attemptGeneration) { inFlight.current = false; setBusy(false); } }
    }
    async function destroy() {
        if (inFlight.current) return; inFlight.current = true; setBusy(true); setError('');
        try { await api.delete(`${path}/${productId}`); navigate(`${uiBase}/products`); }
        catch (e) { setError(errorText(e)); } finally { inFlight.current = false; setBusy(false); }
    }
    const storefrontUrl = store?.storefront_url || store?.public_url;
    const properties = compileProductProperties(creation.axes, gallery);
    const propertiesPending = !properties.valid || properties.signature !== creation.signature;
    const saveDisabled = busy || loading || loadError || (isNew && (propertiesPending || !draft.name.trim() || draft.price === ''));
    return <div className="ws-product-editor">
        <header className="pe-page-heading"><div><Link className="pe-back" to={`${uiBase}/products`} aria-label={text('العودة للمنتجات', 'Back to products')}>{ar ? <HiOutlineArrowRight aria-hidden /> : <HiOutlineArrowLeft aria-hidden />}</Link><h1>{isNew ? text('إضافة منتج', 'Add product') : text('تعديل المنتج', 'Edit product')}</h1></div><div className="pe-heading-actions">{locales.length > 1 ? <label className="pe-locale">{text('لغة المحتوى', 'Content language')}<select value={locale} onChange={(e) => setLocale(e.target.value)}>{locales.map((value) => <option key={value} value={value}>{value.toUpperCase()}{value === defaultLocale ? ` · ${text('الأساسية', 'Default')}` : ''}</option>)}</select></label> : null}{product?.is_active && storefrontUrl ? <a className="pe-soft-button" href={`${storefrontUrl.replace(/\/$/, '')}/products/${product.slug}`} target="_blank" rel="noreferrer"><HiOutlineEye aria-hidden />{text('عرض المنتج', 'View product')}</a> : null}</div></header>
        {error ? <div role="alert" className="pe-error">{error}{loadError ? <button className="ms-3 underline" onClick={() => setNonce(nonce + 1)}>{text('إعادة التحميل', 'Reload')}</button> : null}</div> : null}
        {saved ? <p role="status" className="pe-success">{text('تم حفظ المنتج.', 'Product saved.')}</p> : null}
        {loading ? <p role="status">{text('جارٍ التحميل…', 'Loading…')}</p> : !loadError ? <>
            <form id="store-product-editor" onSubmit={save} />
            <div className="pe-grid">
                <fieldset disabled={!canEdit || busy} className="pe-main pe-stack">
                    <section className="pe-card pe-basic"><header><h2>{text('بيانات المنتج الأساسية', 'Basic product information')}</h2></header><label className="pe-name">{text('اسم المنتج', 'Product name')} *<input form="store-product-editor" required={locale === defaultLocale} maxLength={255} value={localizedValue('name')} dir={locale === 'ar' ? 'rtl' : 'ltr'} onChange={(e) => changeLocalized('name', e.target.value)} /></label>
                        <ProductRichText compact allowMedia key={`${productId || 'new'}-${locale}`} value={localizedValue('description')} onChange={(value) => changeLocalized('description', value)} label={text('وصف المنتج', 'Product description')} locale={locale} ar={ar} disabled={!canEdit || busy} media={(product?.media || []).filter((item) => !removedMedia.includes(item.id))} />
                        <details className="pe-extra-copy"><summary>{text('وصف مختصر للمنتج', 'Short product description')}</summary><label>{text('وصف مختصر', 'Short description')}<textarea form="store-product-editor" rows={2} maxLength={500} value={localizedValue('short_description')} dir={locale === 'ar' ? 'rtl' : 'ltr'} onChange={(e) => changeLocalized('short_description', e.target.value)} /></label></details>
                    </section>
                    <div className="pe-media"><ProductMediaEditor compact disabled={!canEdit || busy} product={product} cover={cover} setCover={setCover} removeCover={removeCover} setRemoveCover={setRemoveCover} gallery={gallery} setGallery={setGallery} removed={removedMedia} setRemoved={setRemovedMedia} order={mediaOrder} setOrder={setMediaOrder} setError={setError} ar={ar} fileVersion={fileVersion.current} /></div>
                    <section className="pe-card"><header><h2>{text('التسعير', 'Pricing')}</h2><span className="pe-hint">{store?.currency}</span></header><div className="pe-fields pe-fields-three"><label>{text('سعر المنتج', 'Product price')} *<input form="store-product-editor" type="number" min="0" max="999999999.99" step="0.01" required value={regularPrice(draft)} onChange={(e) => { setSaved(false); setDraft((current) => setRegularPrice(current, e.target.value)); }} /></label><label>{text('سعر التخفيض', 'Sale price')}<input form="store-product-editor" type="number" min="0" max="999999999.99" step="0.01" value={draft.compare_price === '' || draft.compare_price == null ? '' : draft.price} onChange={(e) => { setSaved(false); setDraft((current) => setDiscountPrice(current, e.target.value)); }} /></label><label>{text('تكلفة المنتج', 'Product cost')}<input form="store-product-editor" type="number" min="0" max="999999999.99" step="0.01" value={draft.cost} onChange={(e) => change('cost', e.target.value)} /><small>{text('داخلية لاحتساب صافي الربح', 'Internal, used to calculate profit')}</small></label></div></section>
                    <section className="pe-card"><header><h2>{text('الظهور في محركات البحث', 'Search engine listing')}</h2></header><div className="pe-fields pe-fields-two"><label>{text('رابط المنتج', 'Product slug')}<input form="store-product-editor" dir="ltr" pattern="[a-z0-9-]+" maxLength={255} value={draft.slug} onChange={(e) => change('slug', e.target.value)} placeholder={text('يُنشأ تلقائيًا عند تركه فارغًا', 'Generated automatically if empty')} /></label><label>{text('معرف الـSKU', 'SKU')}<input form="store-product-editor" dir="ltr" maxLength={120} value={draft.sku} onChange={(e) => change('sku', e.target.value)} /></label></div><label>Meta Description<textarea form="store-product-editor" rows={3} maxLength={500} value={draft.seo_description} onChange={(e) => change('seo_description', e.target.value)} /></label><details className="pe-extra-copy"><summary>{text('عنوان محركات البحث', 'SEO title')}</summary><label>{text('عنوان محركات البحث', 'SEO title')}<input form="store-product-editor" maxLength={255} value={draft.seo_title} onChange={(e) => change('seo_title', e.target.value)} /></label></details></section>
                    {isNew ? <ProductCreationOptions gallery={gallery} value={creation} onChange={(value) => { setSaved(false); setCreation(value); }} ar={ar} disabled={!canEdit || busy} /> : product ? <StoreProductOptions key={`options-${product.id}`} productId={product.id} locales={locales} defaultLocale={defaultLocale} onCount={setVariantCount} media={product.media} onProductHidden={() => { setProduct((current) => ({ ...current, is_active: false })); setDraft((current) => ({ ...current, is_active: false })); }} /> : null}
                    {product ? <StoreProductPersonalization key={`personalization-${product.id}`} path={`${path}/${product.id}`} stored={product.personalization_fields || []} ar={ar} canEdit={canEdit} onSaved={(fields) => setProduct((current) => ({ ...current, personalization_fields: fields }))} /> : null}
                    {product ? <StoreProductQuantityOffers path={`${path}/${product.id}`} productPrice={product.price} currency={store?.currency} ar={ar} canEdit={canEdit} /> : null}
                </fieldset>
                <fieldset disabled={!canEdit || busy} className="pe-side pe-stack">
                    <section className="pe-card"><header><h2>{text('التنظيم', 'Organization')}</h2></header><ProductCategoryPicker categories={categories} value={draft.category_ids} disabled={!canEdit || busy} onChange={(ids) => { setSaved(false); setDraft((current) => ({ ...current, category_ids: ids, category_id: ids[0] ?? '' })); }} /><label>{text('الأولوية في الظهور', 'Display priority')}<input form="store-product-editor" type="number" min="0" max="2147483647" step="1" value={draft.display_priority} onChange={(e) => change('display_priority', e.target.value)} /><small>{text('تظهر المنتجات ذات الأولوية الأعلى أولًا.', 'Products with a higher priority appear first.')}</small></label></section>
                    <section className="pe-card"><header><h2>{text('تصميم صفحة المنتج', 'Product page design')}</h2></header><p className="pe-hint">{text('خصص أقسام صفحة المنتج وتنسيقها من محرر الثيم.', 'Customize product page sections and layout in the theme editor.')}</p><Link className="pe-soft-button" to={`${uiBase}/themes`}>{text('فتح تصميم المتجر', 'Open store design')}</Link></section>
                    <section className="pe-card"><header><h2>{text('إعدادات متقدمة', 'Advanced settings')}</h2></header><p className="pe-hint">{text('الشراء والشحن والمراجعات وعناصر صفحة المنتج.', 'Purchasing, shipping, reviews and product page elements.')}</p><button type="button" className="pe-soft-button" onClick={() => setPreferencesOpen(true)}>{text('إعدادات متقدمة', 'Advanced settings')}</button></section>
                    <details className="pe-card pe-fold" open><summary>{text('إعدادات المخزون', 'Inventory settings')}</summary>{isNew ? <div className="pe-inventory-draft">{creation.rows.length ? <p className="pe-hint">{text('اضبط كمية كل صنف في جدول الأصناف.', 'Set quantities for each combination in the combinations table.')}</p> : <><label>{text('كمية المخزون', 'Stock quantity')}<input form="store-product-editor" type="number" required min="0" max="100000000" step="1" value={initialStock.stock_quantity} onChange={(e) => setInitialStock((current) => ({ ...current, stock_quantity: e.target.value }))} /></label><label className="pe-check"><input type="checkbox" checked={initialStock.track_inventory} onChange={(e) => setInitialStock((current) => ({ ...current, track_inventory: e.target.checked }))} />{text('تتبع المخزون ومنع البيع عند نفاده', 'Track stock and prevent overselling')}</label></>}</div> : product && !variantCount ? <ProductStockControl key={`${product.id}-${product.stock_quantity}-${product.reserved_quantity}-${product.track_inventory}`} productId={product.id} stock={product} onSaved={refreshStock} /> : <p className="pe-hint">{text('يُدار المخزون لكل صنف من جدول الخيارات.', 'Inventory is managed for each individual combination.')}</p>}</details>
                    <details className="pe-card pe-fold"><summary>{text('بيانات إضافية', 'Additional details')}</summary><label>{text('الباركود', 'Barcode')}<input form="store-product-editor" maxLength={120} value={draft.barcode} onChange={(e) => change('barcode', e.target.value)} /></label><label>{text('الوزن بالكيلوغرام', 'Weight in kg')}<input form="store-product-editor" type="number" min="0" max="999999.999" step="0.001" value={draft.weight} onChange={(e) => change('weight', e.target.value)} /></label><label>{text('الترتيب السابق عند تساوي الأولوية', 'Legacy order for equal priorities')}<input form="store-product-editor" type="number" min="0" step="1" value={draft.position} onChange={(e) => change('position', e.target.value)} /><small>{text('الأرقام الأصغر أولًا عند تساوي الأولوية.', 'Lower values come first when priorities are equal.')}</small></label><label className="pe-check"><input type="checkbox" checked={draft.is_featured} onChange={(e) => change('is_featured', e.target.checked)} />{text('منتج مميز', 'Featured product')}</label></details>
                    {isNew ? <details className="pe-card pe-fold"><summary>{text('المنتجات الرقمية', 'Digital products')}</summary><DigitalProductFields value={digital} onChange={setDigital} ar={ar} formId="store-product-editor" /></details> : product ? <StoreProductDigital key={product.id} product={product} path={`${path}/${product.id}`} ar={ar} canEdit={canEdit} onSaved={(value) => setProduct((current) => ({ ...current, digital_url: value.digital_url, digital_codes_available: value.digital_codes_available, digital_sales: value.digital_sales }))} /> : null}
                    {product && permissions.includes('products-delete') ? <section className="pe-card pe-danger">{confirmDelete ? <><p>{text('حذف المنتج نهائيًا؟ الطلبات المحجوزة تمنع الحذف.', 'Permanently delete this product? Reserved orders prevent deletion.')}</p><div className="pe-actions"><button type="button" disabled={busy} onClick={destroy}>{text('تأكيد الحذف', 'Confirm deletion')}</button><button type="button" disabled={busy} onClick={() => setConfirmDelete(false)}>{text('إلغاء', 'Cancel')}</button></div></> : <button type="button" disabled={busy} onClick={() => setConfirmDelete(true)}>{text('حذف المنتج', 'Delete product')}</button>}</section> : null}
                </fieldset>
            </div>
            <footer className="pe-savebar"><div>{canEdit ? <button className="pe-save-button" form="store-product-editor" type="submit" disabled={saveDisabled}>{busy ? text('جارٍ الحفظ…', 'Saving…') : text('حفظ', 'Save')}</button> : null}<label className="pe-check"><input type="checkbox" disabled={!canEdit || busy} checked={draft.is_active} onChange={(e) => change('is_active', e.target.checked)} />{text('نشر المنتج في المتجر', 'Publish in store')}</label></div>{isNew && propertiesPending ? <p role="status">{text('أكمل الخواص وحدّث الأصناف قبل الحفظ.', 'Complete properties and update combinations before saving.')}</p> : null}</footer>
        </> : null}
        {preferencesOpen ? <ProductPreferencesDialog value={draft.product_preferences} hidden={draft.catalog_hidden} onChange={(value) => change('product_preferences', value)} onHiddenChange={(value) => change('catalog_hidden', value)} onClose={() => setPreferencesOpen(false)} ar={ar} disabled={!canEdit || busy} isNew={isNew} error={error} /> : null}
    </div>;
}
