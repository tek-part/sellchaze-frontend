import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import useStoreScope from '../hooks/useStoreScope';
import { fetchAllPages } from '../utils/fetchAllPages';
import ProductRichText from '../components/store/ProductRichText';

const blank = { name: '', slug: '', description: '', parent_id: '', position: 0, show_in_header: true, is_hidden: false, is_active: true, seo_title: '', seo_description: '' };
const field = 'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm';
const failure = (e) => Object.values(e.response?.data?.errors || {}).flat().join(' ') || e.response?.data?.message || e.message;
export default function StoreCategoryEditorPage() {
    const { categoryId } = useParams(); const isNew = !categoryId; const navigate = useNavigate(); const location = useLocation(); const { apiBase, uiBase } = useStoreScope();
    const { permissions = [] } = useOutletContext(); const { i18n } = useTranslation(); const ar = i18n.language.startsWith('ar'); const text = (a, e) => ar ? a : e;
    const path = `${apiBase}/catalog/categories`; const canEdit = permissions.includes(isNew ? 'categories-create' : 'categories-edit');
    const [draft, setDraft] = useState(blank); const [category, setCategory] = useState(null); const [parents, setParents] = useState([]); const [loading, setLoading] = useState(true); const [loadError, setLoadError] = useState(false);
    const [image, setImage] = useState(null); const [preview, setPreview] = useState(''); const [removeImage, setRemoveImage] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [saved, setSaved] = useState(false);
    // Store pages remount per path: a just-created record arrives here with the confirmation, shown once.
    const savedOnArrival = useRef(location.state?.editorSaved === true); const [reload, setReload] = useState(0); const saving = useRef(false); const fileInput = useRef(null);
    useEffect(() => {
        let active = true; setLoading(true); setError(''); setSaved(savedOnArrival.current); savedOnArrival.current = false; setLoadError(false); setImage(null); setRemoveImage(false);
        const read = isNew ? Promise.resolve(null) : api.get(`${path}/${categoryId}`).then(({ data }) => data.data);
        Promise.all([read, fetchAllPages(path)]).then(([row, list]) => { if (!active) return; setCategory(row); setDraft(row ? Object.fromEntries(Object.keys(blank).map((key) => [key, row[key] ?? blank[key]])) : { ...blank }); setParents(list); }).catch((e) => { if (active) { setError(failure(e)); setLoadError(true); } }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [path, categoryId, isNew, reload]);
    useEffect(() => { if (!image) { setPreview(''); return; } const url = URL.createObjectURL(image); setPreview(url); return () => URL.revokeObjectURL(url); }, [image]);
    const change = (key, value) => { setSaved(false); setDraft((current) => ({ ...current, [key]: value })); };
    async function save(event) {
        event.preventDefault(); if (saving.current || !canEdit) return; saving.current = true; setBusy(true); setError(''); setSaved(false);
        const payload = new FormData(); Object.entries(draft).forEach(([key, value]) => payload.append(key, typeof value === 'boolean' ? value ? '1' : '0' : String(value ?? '')));
        if (image) payload.append('image', image); payload.append('remove_image', removeImage ? '1' : '0');
        if (!isNew) { payload.append('_method', 'PUT'); payload.append('edit_version', category.edit_version); }
        try {
            const { data } = await api.post(isNew ? path : `${path}/${categoryId}`, payload); const row = data.data;
            setCategory(row); setDraft(Object.fromEntries(Object.keys(blank).map((key) => [key, row[key] ?? blank[key]]))); setImage(null); setRemoveImage(false); if (fileInput.current) fileInput.current.value = ''; setSaved(true);
            if (isNew) navigate(`${uiBase}/categories/${row.id}/edit`, { replace: true, state: { editorSaved: true } });
        } catch (e) { setError(failure(e)); } finally { saving.current = false; setBusy(false); }
    }
    const blockedParents = new Set([Number(categoryId)]); let changed = true;
    while (changed) { changed = false; for (const row of parents) if (blockedParents.has(Number(row.parent_id)) && !blockedParents.has(row.id)) { blockedParents.add(row.id); changed = true; } }
    const imageUrl = preview || (!removeImage ? category?.image_url : null);
    return <div className="space-y-5"><header className="flex flex-wrap items-center justify-between gap-3"><div><Link className="text-sm text-primary underline" to={`${uiBase}/categories`}>{text('الأقسام', 'Categories')}</Link><h1 className="mt-2 text-2xl font-semibold">{isNew ? text('إنشاء قسم', 'Create category') : text('تعديل القسم', 'Edit category')}</h1></div><button className="ws-catalog-button ws-catalog-button--primary" form="store-category-editor" disabled={!canEdit || loading || loadError || busy}>{busy ? text('جارٍ الحفظ…', 'Saving…') : text('حفظ', 'Save')}</button></header>
        {error ? <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{error}<button className="ms-3 underline" onClick={() => setReload((v) => v + 1)}>{text('إعادة التحميل', 'Reload')}</button></p> : null}{saved ? <p role="status" className="rounded-lg bg-emerald-50 p-3 text-emerald-700">{text('تم حفظ القسم.', 'Category saved.')}</p> : null}
        {loading ? <p role="status">{text('جارٍ التحميل…', 'Loading…')}</p> : !loadError ? <form id="store-category-editor" onSubmit={save}><fieldset disabled={!canEdit || busy} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
            <section><label className="block font-semibold" htmlFor="category-image">{text('صورة القسم', 'Category image')}</label><div className="mt-3 flex flex-wrap items-center gap-4">{imageUrl ? <img className="h-32 w-32 rounded-lg border object-cover" src={imageUrl} alt={text('معاينة صورة القسم', 'Category image preview')} /> : null}<input ref={fileInput} id="category-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => { const file = e.target.files?.[0]; if (file && (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2097152)) { setError(text('اختر صورة JPG أو PNG أو WebP بحجم 2 ميجابايت أو أقل.', 'Choose a JPG, PNG or WebP image up to 2 MB.')); e.target.value = ''; return; } setImage(file || null); setRemoveImage(false); setSaved(false); }} />{imageUrl ? <button type="button" className="ws-catalog-button" onClick={() => { setImage(null); setRemoveImage(true); setSaved(false); if (fileInput.current) fileInput.current.value = ''; }}>{text('إزالة الصورة', 'Remove image')}</button> : null}</div></section>
            <div className="grid gap-5 md:grid-cols-2"><label>{text('اسم القسم', 'Category name')} *<input className={field} required maxLength={255} value={draft.name} onChange={(e) => change('name', e.target.value)} /></label><label>{text('الرابط', 'Slug')} *<input className={field} required dir="ltr" pattern="[a-z0-9-]+" maxLength={255} value={draft.slug} onChange={(e) => change('slug', e.target.value)} /></label><label>{text('أولوية العرض', 'Display priority')}<input className={field} type="number" min="0" step="1" value={draft.position} onChange={(e) => change('position', e.target.value)} /></label><label>{text('القسم الأب', 'Parent category')}<select className={field} value={draft.parent_id} onChange={(e) => change('parent_id', e.target.value)}><option value="">{text('دون قسم أب', 'No parent category')}</option>{parents.filter((row) => !blockedParents.has(row.id)).map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label></div>
            <div className="flex flex-wrap gap-6">{[['show_in_header', text('إظهار في الهيدر', 'Show in header')], ['is_hidden', text('إخفاء من قائمة الأقسام', 'Hide from category listing')], ['is_active', text('منشور', 'Published')]].map(([key, label]) => <label className="flex items-center gap-2" key={key}><input type="checkbox" checked={draft[key]} onChange={(e) => change(key, e.target.checked)} />{label}</label>)}</div>
            <p className="text-sm text-slate-500">{text('القسم المخفي يظل متاحًا عبر رابطه المباشر. إلغاء النشر يوقف صفحة القسم العامة.', 'A hidden category remains available at its direct link. Unpublishing disables its public page.')}</p>
            <ProductRichText categoryContent ar={ar} locale={ar ? 'ar' : 'en'} disabled={!canEdit || busy} label={text('محتوى يظهر أعلى منتجات القسم', 'Content above category products')} value={draft.description} onChange={(value) => change('description', value)} />
            <details><summary className="cursor-pointer font-semibold">{text('تحسين محركات البحث', 'Search engine optimization')}</summary><div className="mt-4 grid gap-4"><label>{text('عنوان الصفحة', 'Page title')}<input className={field} maxLength={255} value={draft.seo_title} onChange={(e) => change('seo_title', e.target.value)} /></label><label>{text('وصف الصفحة', 'Page description')}<textarea className={field} maxLength={500} value={draft.seo_description} onChange={(e) => change('seo_description', e.target.value)} /></label></div></details>
        </fieldset></form> : null}
    </div>;
}
