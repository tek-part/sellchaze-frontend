import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import useStoreScope from '../hooks/useStoreScope';
import ProductRichText from '../components/store/ProductRichText';
import { HiOutlineArrowDown, HiOutlineArrowUp, HiOutlinePlus, HiOutlineTrash, HiOutlineCube } from '../components/workspace/WorkspaceIcons';

const field = 'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm';
const card = 'space-y-4 rounded-xl border border-slate-200 bg-white p-5';
const failure = (e) => Object.values(e.response?.data?.errors || {}).flat().join(' ') || e.response?.data?.message || e.message;
const blank = { title: '', handle: '', description: '', type: 'manual', match: 'all', rules: [], sort_order: 'manual', published: true, seo_title: '', seo_description: '' };
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const RULE_OPERATORS = {
    title: ['contains', 'not_contains', 'equals', 'starts_with'],
    price: ['gt', 'lt', 'eq'],
    category: ['is', 'is_not'],
    brand: ['is', 'is_not'],
    tag: ['is', 'is_not'],
    inventory: ['is'],
    created_at: ['within_days'],
};
const newRule = (fieldName = 'title') => ({ field: fieldName, operator: RULE_OPERATORS[fieldName][0], value: fieldName === 'inventory' ? 'in_stock' : '' });
/** A rule row is sent only when it has a value; the server validates the rest. */
const completeRules = (rules) => rules.filter((rule) => String(rule.value ?? '').trim() !== '');
const fromRow = (row) => ({
    title: row.title || '', handle: row.handle || '', description: row.description || '', type: row.type || 'manual', match: row.match || 'all',
    rules: (row.rules || []).map((rule) => ({ ...rule, value: rule.value ?? '' })), sort_order: row.sort_order || 'manual', published: Boolean(row.published),
    seo_title: row.seo_title || '', seo_description: row.seo_description || '',
});
const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function Thumb({ url }) {
    return <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded border border-slate-200 bg-slate-50">{url ? <img className="h-full w-full object-cover" src={url} alt="" loading="lazy" /> : <HiOutlineCube aria-hidden />}</span>;
}

export default function StoreCollectionEditorPage() {
    const { collectionId } = useParams(); const isNew = !collectionId; const navigate = useNavigate(); const location = useLocation(); const { apiBase, uiBase } = useStoreScope();
    const { permissions = [] } = useOutletContext(); const { i18n } = useTranslation(); const ar = i18n.language.startsWith('ar'); const text = (a, e) => ar ? a : e;
    const path = `${apiBase}/catalog/collections`; const canEdit = permissions.includes(isNew ? 'categories-create' : 'categories-edit');
    const [draft, setDraft] = useState(blank); const [products, setProducts] = useState([]); const [record, setRecord] = useState(null);
    const [options, setOptions] = useState({ categories: [], brands: [], tags: [] });
    const [loading, setLoading] = useState(true); const [loadError, setLoadError] = useState(false); const [reload, setReload] = useState(0);
    const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [saved, setSaved] = useState(false);
    // Store pages remount per path: a just-created collection arrives here with the confirmation, shown once.
    const savedOnArrival = useRef(location.state?.collectionSaved === true);
    const [image, setImage] = useState(null); const [imagePreview, setImagePreview] = useState(''); const [removeImage, setRemoveImage] = useState(false);
    const [handleTouched, setHandleTouched] = useState(false);
    const [search, setSearch] = useState(''); const [results, setResults] = useState([]); const [searching, setSearching] = useState(false);
    const [preview, setPreview] = useState({ loading: false, total: null, data: [], error: '' });
    const [snapshot, setSnapshot] = useState(JSON.stringify({ draft: blank, ids: [] }));
    const saving = useRef(false); const fileInput = useRef(null);

    const labels = {
        fields: { title: text('عنوان المنتج', 'Product title'), price: text('السعر', 'Price'), category: text('القسم', 'Category'), brand: text('العلامة التجارية', 'Brand'), tag: text('الوسم', 'Tag'), inventory: text('المخزون', 'Inventory'), created_at: text('تاريخ الإضافة', 'Date added') },
        operators: { contains: text('يحتوي على', 'contains'), not_contains: text('لا يحتوي على', 'does not contain'), equals: text('يساوي', 'is equal to'), starts_with: text('يبدأ بـ', 'starts with'), gt: text('أكبر من', 'is greater than'), lt: text('أقل من', 'is less than'), eq: text('يساوي', 'is equal to'), is: text('هو', 'is'), is_not: text('ليس', 'is not'), within_days: text('خلال آخر (أيام)', 'within the last (days)') },
        sorts: { manual: text('يدوي', 'Manually'), best_selling: text('الأكثر مبيعًا', 'Best selling'), price_asc: text('السعر: من الأقل للأعلى', 'Price: low to high'), price_desc: text('السعر: من الأعلى للأقل', 'Price: high to low'), newest: text('الأحدث أولًا', 'Newest'), title_asc: text('الاسم: أ-ي', 'Title: A-Z'), title_desc: text('الاسم: ي-أ', 'Title: Z-A') },
    };

    useEffect(() => {
        let active = true; setLoading(true); setError(''); setSaved(savedOnArrival.current); savedOnArrival.current = false; setLoadError(false); setImage(null); setRemoveImage(false);
        const read = isNew ? Promise.resolve(null) : api.get(`${path}/${collectionId}`).then(({ data }) => data.data);
        const ruleOptions = api.get(`${path}/rule-options`).then(({ data }) => data.data).catch(() => ({ categories: [], brands: [], tags: [] }));
        Promise.all([read, ruleOptions]).then(([row, opts]) => {
            if (!active) return;
            const next = row ? fromRow(row) : { ...blank }; const list = row?.products || [];
            setRecord(row); setDraft(next); setProducts(list); setOptions(opts); setHandleTouched(!isNew);
            setSnapshot(JSON.stringify({ draft: next, ids: list.map((p) => p.id) }));
        }).catch((e) => { if (active) { setError(failure(e)); setLoadError(true); } }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [path, collectionId, isNew, reload]);
    useEffect(() => { if (!image) { setImagePreview(''); return undefined; } const url = URL.createObjectURL(image); setImagePreview(url); return () => URL.revokeObjectURL(url); }, [image]);

    const dirty = !loading && !loadError && (Boolean(image) || removeImage || JSON.stringify({ draft, ids: products.map((p) => p.id) }) !== snapshot);
    useEffect(() => {
        const warn = (event) => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
        window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
    }, [dirty]);

    const change = (key, value) => { setSaved(false); setDraft((current) => ({ ...current, [key]: value })); };
    const changeTitle = (value) => { setSaved(false); setDraft((current) => ({ ...current, title: value, ...(handleTouched ? {} : { handle: slugify(value) }) })); };
    const setRules = (update) => { setSaved(false); setDraft((current) => ({ ...current, rules: update(current.rules) })); };
    const switchType = (type) => { setSaved(false); setDraft((current) => ({ ...current, type, rules: type === 'automated' && !current.rules.length ? [newRule()] : current.rules, sort_order: type === 'automated' && current.sort_order === 'manual' ? 'best_selling' : current.sort_order })); };

    // Manual product picker: debounced search over the store's catalog.
    useEffect(() => {
        if (draft.type !== 'manual' || !search.trim()) { setResults([]); setSearching(false); return undefined; }
        let active = true; setSearching(true);
        const timer = setTimeout(() => {
            api.get(`${apiBase}/catalog/products`, { params: { search: search.trim(), per_page: 8 } })
                .then(({ data }) => { if (active) setResults(data.data || []); }).catch(() => { if (active) setResults([]); }).finally(() => { if (active) setSearching(false); });
        }, 300);
        return () => { active = false; clearTimeout(timer); };
    }, [apiBase, search, draft.type]);

    // Automated live preview: debounced, only complete conditions are sent.
    const previewKey = JSON.stringify({ type: draft.type, rules: completeRules(draft.rules), match: draft.match, sort: draft.sort_order });
    useEffect(() => {
        const rules = completeRules(draft.rules);
        if (draft.type !== 'automated' || !rules.length) { setPreview({ loading: false, total: null, data: [], error: '' }); return undefined; }
        let active = true; setPreview((current) => ({ ...current, loading: true, error: '' }));
        const timer = setTimeout(() => {
            api.post(`${path}/preview`, { rules, match: draft.match, sort_order: draft.sort_order })
                .then(({ data }) => { if (active) setPreview({ loading: false, total: data.meta?.total ?? 0, data: data.data || [], error: '' }); })
                .catch((e) => { if (active) setPreview({ loading: false, total: null, data: [], error: failure(e) }); });
        }, 400);
        return () => { active = false; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [path, previewKey]);

    const selectedIds = new Set(products.map((p) => p.id));
    const addProduct = (product) => { if (selectedIds.has(product.id)) return; setSaved(false); setProducts((list) => [...list, { id: product.id, name: product.name, sku: product.sku, price: product.price, image_url: product.image_url }]); };
    const moveProduct = (index, delta) => { setSaved(false); setProducts((list) => { const next = [...list]; const [row] = next.splice(index, 1); next.splice(index + delta, 0, row); return next; }); };
    const removeProduct = (id) => { setSaved(false); setProducts((list) => list.filter((p) => p.id !== id)); };

    async function save(event) {
        event.preventDefault(); if (saving.current || !canEdit) return; saving.current = true; setBusy(true); setError(''); setSaved(false);
        const payload = {
            title: draft.title.trim(), description: draft.description, type: draft.type, published: draft.published, sort_order: draft.sort_order,
            seo_title: draft.seo_title || null, seo_description: draft.seo_description || null,
            ...(draft.handle.trim() ? { handle: draft.handle.trim() } : {}),
            ...(draft.type === 'automated' ? { match: draft.match, rules: completeRules(draft.rules) } : { product_ids: products.map((p) => p.id) }),
        };
        try {
            let { data } = isNew ? await api.post(path, payload) : await api.put(`${path}/${collectionId}`, payload);
            if (image || removeImage) {
                const form = new FormData(); form.append('_method', 'PUT');
                if (image) form.append('image', image); else form.append('remove_image', '1');
                ({ data } = await api.post(`${path}/${data.data.id}`, form));
            }
            const row = data.data; const next = fromRow(row); const list = row.products || [];
            setRecord(row); setDraft(next); setProducts(list); setImage(null); setRemoveImage(false); setHandleTouched(true); if (fileInput.current) fileInput.current.value = '';
            setSnapshot(JSON.stringify({ draft: next, ids: list.map((p) => p.id) })); setSaved(true);
            if (isNew) navigate(`${uiBase}/collections/${row.id}`, { replace: true, state: { collectionSaved: true } }); // the new page shows the confirmation
        } catch (e) { setError(failure(e)); } finally { saving.current = false; setBusy(false); }
    }

    const availableFields = useMemo(() => Object.keys(RULE_OPERATORS).filter((key) => ((key !== 'brand' || options.brands?.length) && (key !== 'tag' || options.tags?.length)) || draft.rules.some((rule) => rule.field === key)), [options, draft.rules]);
    const imageUrl = imagePreview || (!removeImage ? record?.image_url : null);
    const ruleValue = (rule, index) => {
        const label = `${text('قيمة الشرط', 'Condition value')} ${index + 1}`;
        const update = (value) => setRules((rules) => rules.map((row, i) => i === index ? { ...row, value } : row));
        const select = (choices) => <select className={field} aria-label={label} value={String(rule.value)} onChange={(e) => update(e.target.value)}><option value="">{text('اختر…', 'Choose…')}</option>{choices.map(([value, name]) => <option key={value} value={value}>{name}</option>)}</select>;
        if (rule.field === 'category') return select((options.categories || []).map((c) => [String(c.id), c.name]));
        if (rule.field === 'brand') return select((options.brands || []).map((b) => [String(b.id), b.name]));
        if (rule.field === 'inventory') return select([['in_stock', text('متوفر', 'In stock')], ['out_of_stock', text('نفد من المخزون', 'Out of stock')]]);
        if (rule.field === 'tag') return <><input className={field} aria-label={label} list="collection-tag-options" value={rule.value} onChange={(e) => update(e.target.value)} /><datalist id="collection-tag-options">{(options.tags || []).map((tag) => <option key={tag} value={tag} />)}</datalist></>;
        const numeric = rule.field === 'price' || rule.field === 'created_at';
        return <input className={field} aria-label={label} type={numeric ? 'number' : 'text'} min={numeric ? (rule.field === 'price' ? 0 : 1) : undefined} step={rule.field === 'price' ? '0.01' : '1'} dir={numeric ? 'ltr' : undefined} maxLength={numeric ? undefined : 255} value={rule.value} onChange={(e) => update(e.target.value)} />;
    };

    return <div className="space-y-5 ws-collection-editor">
        <header className="flex flex-wrap items-center justify-between gap-3"><div className="min-w-0"><Link className="text-sm text-primary underline" to={`${uiBase}/collections`}>{text('المجموعات', 'Collections')}</Link><h1 className="mt-2 break-words text-2xl font-semibold">{isNew ? text('إنشاء مجموعة', 'Create collection') : (record?.title || text('تعديل المجموعة', 'Edit collection'))}</h1></div>
            <div className="flex items-center gap-3">{dirty ? <span className="text-sm text-slate-500" role="status">{text('تغييرات غير محفوظة', 'Unsaved changes')}</span> : null}<button className="ws-dt-button ws-dt-button-primary" form="store-collection-editor" disabled={!canEdit || loading || loadError || busy}>{busy ? text('جارٍ الحفظ…', 'Saving…') : text('حفظ', 'Save')}</button></div></header>
        {error ? <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{error}{loadError ? <button type="button" className="ms-3 underline" onClick={() => setReload((v) => v + 1)}>{text('إعادة التحميل', 'Reload')}</button> : null}</p> : null}
        {saved ? <p role="status" className="rounded-lg bg-emerald-50 p-3 text-emerald-700">{text('تم حفظ المجموعة.', 'Collection saved.')}</p> : null}
        {loading ? <p role="status">{text('جارٍ التحميل…', 'Loading…')}</p> : !loadError ? <form id="store-collection-editor" onSubmit={save}><fieldset disabled={!canEdit || busy} className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="min-w-0 space-y-5">
                <section className={card}>
                    <label className="block">{text('العنوان', 'Title')} *<input className={field} required maxLength={255} value={draft.title} onChange={(e) => changeTitle(e.target.value)} placeholder={text('مثال: عروض الصيف', 'e.g. Summer deals')} /></label>
                    <ProductRichText categoryContent ar={ar} locale={ar ? 'ar' : 'en'} disabled={!canEdit || busy} label={text('الوصف', 'Description')} value={draft.description} onChange={(value) => change('description', value)} />
                </section>

                <section className={card} aria-labelledby="collection-type-heading">
                    <h2 id="collection-type-heading" className="font-semibold">{text('نوع المجموعة', 'Collection type')}</h2>
                    <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-labelledby="collection-type-heading">
                        {[['manual', text('يدوية', 'Manual'), text('اختر المنتجات بنفسك ورتبها.', 'Pick products one by one and order them.')], ['automated', text('تلقائية', 'Automated'), text('تُضاف المنتجات التي تطابق الشروط تلقائيًا.', 'Products matching your conditions are added automatically.')]].map(([value, name, hint]) =>
                            <label key={value} className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${draft.type === value ? 'border-emerald-600' : 'border-slate-200'}`}><input type="radio" name="collection-type" value={value} checked={draft.type === value} disabled={!isNew} onChange={() => switchType(value)} /><span><span className="block font-medium">{name}</span><span className="block text-sm text-slate-500">{hint}</span></span></label>)}
                    </div>
                    {!isNew ? <p className="text-sm text-slate-500">{text('لا يمكن تغيير نوع المجموعة بعد إنشائها.', 'The collection type cannot be changed after it is created.')}</p> : null}
                </section>

                {draft.type === 'automated' ? <section className={card} aria-labelledby="collection-rules-heading">
                    <h2 id="collection-rules-heading" className="font-semibold">{text('الشروط', 'Conditions')}</h2>
                    <fieldset className="flex flex-wrap items-center gap-4"><legend className="sr-only">{text('مطابقة الشروط', 'Condition matching')}</legend><span>{text('يجب أن تطابق المنتجات:', 'Products must match:')}</span>
                        {[['all', text('كل الشروط', 'all conditions')], ['any', text('أي شرط', 'any condition')]].map(([value, name]) => <label key={value} className="flex items-center gap-2"><input type="radio" name="collection-match" value={value} checked={draft.match === value} onChange={() => change('match', value)} />{name}</label>)}
                    </fieldset>
                    <ol className="space-y-3">{draft.rules.map((rule, index) => <li key={index} className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end" data-rule-row>
                        <select className={field} aria-label={`${text('حقل الشرط', 'Condition field')} ${index + 1}`} value={rule.field} onChange={(e) => setRules((rules) => rules.map((row, i) => i === index ? newRule(e.target.value) : row))}>{availableFields.map((key) => <option key={key} value={key}>{labels.fields[key]}</option>)}</select>
                        <select className={field} aria-label={`${text('عامل الشرط', 'Condition operator')} ${index + 1}`} value={rule.operator} onChange={(e) => setRules((rules) => rules.map((row, i) => i === index ? { ...row, operator: e.target.value } : row))}>{(RULE_OPERATORS[rule.field] || []).map((op) => <option key={op} value={op}>{labels.operators[op]}</option>)}</select>
                        <div className="min-w-0">{ruleValue(rule, index)}</div>
                        <button type="button" className="ws-catalog-button" disabled={draft.rules.length <= 1} onClick={() => setRules((rules) => rules.filter((_, i) => i !== index))} aria-label={`${text('حذف الشرط', 'Remove condition')} ${index + 1}`}><HiOutlineTrash aria-hidden /></button>
                    </li>)}</ol>
                    <button type="button" className="ws-catalog-button" disabled={draft.rules.length >= 20} onClick={() => setRules((rules) => [...rules, newRule()])}><HiOutlinePlus aria-hidden />{text('إضافة شرط', 'Add condition')}</button>
                    <div className="rounded-lg border border-slate-200 p-3" aria-live="polite" data-collection-preview>
                        <h3 className="font-medium">{text('معاينة المنتجات المطابقة', 'Matching products preview')}</h3>
                        {preview.loading ? <p className="text-sm text-slate-500">{text('جارٍ التحديث…', 'Updating…')}</p>
                            : preview.error ? <p className="text-sm text-red-700">{preview.error}</p>
                            : preview.total === null ? <p className="text-sm text-slate-500">{text('أكمل شرطًا واحدًا على الأقل لعرض المنتجات.', 'Complete at least one condition to see products.')}</p>
                            : <><p className="text-sm">{text(`${preview.total} منتج مطابق`, `${preview.total} matching products`)}</p><ul className="mt-2 space-y-2">{preview.data.slice(0, 10).map((p) => <li key={p.id} className="flex min-w-0 items-center gap-3"><Thumb url={p.image_url} /><span className="min-w-0 truncate">{p.name}</span><span className="ms-auto shrink-0 text-sm text-slate-500" dir="ltr">{p.price}</span></li>)}</ul></>}
                    </div>
                </section> : <section className={card} aria-labelledby="collection-products-heading">
                    <h2 id="collection-products-heading" className="font-semibold">{text('المنتجات', 'Products')} <span className="text-sm font-normal text-slate-500">({products.length})</span></h2>
                    <label className="block">{text('ابحث عن منتجات لإضافتها', 'Search products to add')}<input className={field} type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={text('الاسم أو SKU', 'Name or SKU')} /></label>
                    {searching ? <p className="text-sm text-slate-500" role="status">{text('جارٍ البحث…', 'Searching…')}</p> : null}
                    {results.length ? <ul className="divide-y rounded-lg border border-slate-200" aria-label={text('نتائج البحث', 'Search results')}>{results.map((p) => <li key={p.id} className="flex min-w-0 items-center gap-3 p-2"><Thumb url={p.image_url} /><span className="min-w-0 flex-1 truncate">{p.name}</span><button type="button" className="ws-catalog-button" disabled={selectedIds.has(p.id)} onClick={() => addProduct(p)}>{selectedIds.has(p.id) ? text('مضاف', 'Added') : text('إضافة', 'Add')}<span className="sr-only"> {p.name}</span></button></li>)}</ul> : null}
                    {products.length ? <ol className="divide-y rounded-lg border border-slate-200" aria-label={text('منتجات المجموعة', 'Collection products')} data-collection-products>{products.map((p, index) => <li key={p.id} className="flex min-w-0 items-center gap-2 p-2">
                        <span className="w-6 shrink-0 text-center text-sm text-slate-500">{index + 1}</span><Thumb url={p.image_url} /><span className="min-w-0 flex-1 truncate">{p.name}</span>
                        <button type="button" className="ws-catalog-button" disabled={index === 0} onClick={() => moveProduct(index, -1)} aria-label={`${text('تحريك لأعلى', 'Move up')}: ${p.name}`}><HiOutlineArrowUp aria-hidden /></button>
                        <button type="button" className="ws-catalog-button" disabled={index === products.length - 1} onClick={() => moveProduct(index, 1)} aria-label={`${text('تحريك لأسفل', 'Move down')}: ${p.name}`}><HiOutlineArrowDown aria-hidden /></button>
                        <button type="button" className="ws-catalog-button" onClick={() => removeProduct(p.id)} aria-label={`${text('إزالة', 'Remove')}: ${p.name}`}><HiOutlineTrash aria-hidden /></button>
                    </li>)}</ol> : <p className="text-sm text-slate-500">{text('لم تُضف منتجات بعد.', 'No products added yet.')}</p>}
                </section>}

                <details className={card}><summary className="cursor-pointer font-semibold">{text('تحسين محركات البحث', 'Search engine optimization')}</summary><div className="mt-4 grid gap-4">
                    <label>{text('الرابط', 'Handle')}<span className="mt-1 flex min-w-0 items-center gap-1" dir="ltr"><span className="shrink-0 text-sm text-slate-500">/collections/</span><input className={field} dir="ltr" pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={255} value={draft.handle} onChange={(e) => { setHandleTouched(true); change('handle', e.target.value.toLowerCase()); }} aria-describedby="collection-handle-hint" /></span></label>
                    <p id="collection-handle-hint" className="text-sm text-slate-500">{text('أحرف إنجليزية صغيرة وأرقام وشرطات. يُنشأ تلقائيًا إذا تُرك فارغًا.', 'Lowercase letters, numbers and hyphens. Generated from the title when empty.')}</p>
                    <label>{text('عنوان الصفحة', 'Page title')}<input className={field} maxLength={255} value={draft.seo_title} onChange={(e) => change('seo_title', e.target.value)} /></label>
                    <label>{text('وصف الصفحة', 'Page description')}<textarea className={field} maxLength={500} value={draft.seo_description} onChange={(e) => change('seo_description', e.target.value)} /></label>
                </div></details>
            </div>

            <aside className="min-w-0 space-y-5">
                <section className={card}><h2 className="font-semibold">{text('الحالة', 'Status')}</h2><label className="flex items-center gap-2"><input type="checkbox" checked={draft.published} onChange={(e) => change('published', e.target.checked)} />{text('منشورة في المتجر', 'Published in the store')}</label></section>
                <section className={card}><label className="block font-semibold">{text('ترتيب المنتجات', 'Product order')}<select className={field} value={draft.sort_order} onChange={(e) => change('sort_order', e.target.value)}>{Object.keys(labels.sorts).filter((key) => key !== 'manual' || draft.type === 'manual').map((key) => <option key={key} value={key}>{labels.sorts[key]}</option>)}</select></label></section>
                <section className={card}><label className="block font-semibold" htmlFor="collection-image">{text('صورة المجموعة', 'Collection image')}</label>
                    {imageUrl ? <img className="h-32 w-32 rounded-lg border object-cover" src={imageUrl} alt={text('معاينة صورة المجموعة', 'Collection image preview')} /> : null}
                    <input ref={fileInput} id="collection-image" className="max-w-full" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => { const file = e.target.files?.[0]; if (file && (!IMAGE_TYPES.includes(file.type) || file.size > 2097152)) { setError(text('اختر صورة JPG أو PNG أو WebP بحجم 2 ميجابايت أو أقل.', 'Choose a JPG, PNG or WebP image up to 2 MB.')); e.target.value = ''; return; } setImage(file || null); setRemoveImage(false); setSaved(false); }} />
                    {imageUrl ? <button type="button" className="ws-catalog-button" onClick={() => { setImage(null); setRemoveImage(Boolean(record?.image_url)); setSaved(false); if (fileInput.current) fileInput.current.value = ''; }}>{text('إزالة الصورة', 'Remove image')}</button> : null}
                </section>
            </aside>
        </fieldset></form> : null}
    </div>;
}
