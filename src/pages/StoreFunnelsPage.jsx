import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineArrowPath, HiOutlinePlus, HiOutlineSparkles } from 'react-icons/hi2';
import api from '../api/client';
import useStoreScope from '../hooks/useStoreScope';

const copy = {
    ar: { title: 'مسارات البيع', subtitle: 'حوّل منتجك إلى صفحة بيع قابلة للتخصيص والمعاينة والنشر.', create: 'إنشاء مسار بيع', templates: 'اختر قالب البداية', details: 'بيانات مسار البيع', name: 'اسم المسار', slug: 'الرابط', product: 'المنتج', productSearch: 'ابحث عن منتج المتجر', locale: 'لغة الصفحة', submit: 'إنشاء وفتح المحرر', cancel: 'إلغاء', back: 'السابق', next: 'التالي', search: 'البحث في المسارات', all: 'كل الحالات', draft: 'مسودة', published: 'منشور', scheduled: 'مجدول', empty: 'لا توجد مسارات مطابقة', hint: 'أنشئ مسارًا جديدًا أو غيّر البحث لعرض المسارات.', edit: 'تحرير', duplicate: 'نسخ كمسودة', previous: 'الصفحة السابقة', nextPage: 'الصفحة التالية', choose: 'اختر المنتج', loading: 'جارٍ التحميل…', missing: 'المنتج غير متاح', selected: 'محدد', retry: 'إعادة المحاولة', note: 'يبدأ المسار كمسودة. راجع المحتوى والمنتج في المحرر قبل النشر.', noProducts: 'لا توجد منتجات مطابقة. أضف منتجًا إلى كتالوج المتجر أو غيّر البحث.' },
    en: { title: 'Sales funnels', subtitle: 'Turn a product into an editable sales page with preview and publishing.', create: 'Create funnel', templates: 'Choose a starting template', details: 'Funnel details', name: 'Funnel name', slug: 'URL slug', product: 'Product', productSearch: 'Search store products', locale: 'Page language', submit: 'Create and open editor', cancel: 'Cancel', back: 'Back', next: 'Next', search: 'Search funnels', all: 'All statuses', draft: 'Draft', published: 'Published', scheduled: 'Scheduled', empty: 'No matching funnels', hint: 'Create a funnel or change your search to find one.', edit: 'Edit', duplicate: 'Duplicate as draft', previous: 'Previous page', nextPage: 'Next page', choose: 'Choose product', loading: 'Loading…', missing: 'Product unavailable', selected: 'Selected', retry: 'Retry', note: 'Funnels start as drafts. Review the content and linked product in the editor before publishing.', noProducts: 'No matching products. Add a product to the store catalog or change your search.' },
};
const field = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';
const button = 'rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50';
function errorText(error) {
    const fields = error.response?.data?.errors;
    return fields ? Object.values(fields).flat().join(' ') : error.response?.data?.message || error.message;
}

function CreateFunnel({ c, lang, apiBase, uiBase, locales, onClose }) {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    const [template, setTemplate] = useState('');
    const [step, setStep] = useState(1);
    const [query, setQuery] = useState('');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({ title: '', slug: '', product_id: '', locale: locales?.default || 'en' });
    useEffect(() => {
        let active = true;
        api.get(`${apiBase}/funnels/templates`).then(({ data }) => { if (active) setTemplates(data.data || []); }).catch((e) => { if (active) setError(errorText(e)); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [apiBase]);
    useEffect(() => {
        if (step !== 2) return undefined;
        let active = true;
        setLoading(true);
        const timer = setTimeout(() => {
            api.get(`${apiBase}/catalog/products`, { params: { search: query, per_page: 50 } })
                .then(({ data }) => { if (active) setProducts(data.data || []); })
                .catch((e) => { if (active) { setProducts([]); setError(errorText(e)); } })
                .finally(() => { if (active) setLoading(false); });
        }, 250);
        return () => { active = false; clearTimeout(timer); };
    }, [apiBase, query, step]);
    async function submit(event) {
        event.preventDefault();
        setError(''); setSaving(true);
        try {
            const { data } = await api.post(`${apiBase}/funnels`, { ...form, product_id: Number(form.product_id), template_key: template });
            navigate(`${uiBase}/pages/${data.data.page_id}/builder`);
        } catch (e) { setError(errorText(e)); } finally { setSaving(false); }
    }
    return <section aria-label={c.create} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">{step === 1 ? c.templates : c.details}</h2><button type="button" disabled={saving} onClick={onClose} className={button}>{c.cancel}</button></div>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {step === 1 ? <>
            {loading ? <p role="status">{c.loading}</p> : <div className="grid gap-3 md:grid-cols-3" role="radiogroup" aria-label={c.templates}>
                {templates.map((item) => <label key={item.key} className={`cursor-pointer rounded-xl border p-4 ${template === item.key ? 'border-brand bg-brand-light' : 'border-slate-200'}`}>
                    <div className="mb-4 flex h-24 items-center justify-center rounded-lg" style={{ backgroundColor: item.color }}><HiOutlineSparkles className="h-9 w-9 text-white" aria-hidden /></div>
                    <span className="flex items-center gap-2"><input type="radio" name="funnel-template" value={item.key} checked={template === item.key} onChange={() => setTemplate(item.key)} /><strong>{item.name?.[lang] || item.name?.en}</strong></span>
                    <p className="mt-2 text-sm text-slate-500">{item.description?.[lang] || item.description?.en}</p>
                </label>)}
            </div>}
            <button type="button" disabled={!template} onClick={() => setStep(2)} className={`${button} bg-brand text-white hover:bg-brand-dark`}>{c.next}</button>
        </> : <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
            <label className="space-y-1 text-sm">{c.name}<input required maxLength={255} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={field} /></label>
            <label className="space-y-1 text-sm">{c.slug}<input required dir="ltr" maxLength={180} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={field} /></label>
            <label className="space-y-1 text-sm">{c.productSearch}<input type="search" value={query} onChange={(e) => { setQuery(e.target.value); setForm({ ...form, product_id: '' }); }} className={field} /></label>
            <label className="space-y-1 text-sm">{c.product}<select required disabled={loading} value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })} className={field}><option value="">{loading ? c.loading : c.choose}</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
            {!loading && products.length === 0 && <p className="text-sm text-slate-500 sm:col-span-2">{c.noProducts}</p>}
            <label className="space-y-1 text-sm">{c.locale}<select value={form.locale} onChange={(e) => setForm({ ...form, locale: e.target.value })} className={field}>{(locales?.supported || ['en']).map((locale) => <option key={locale} value={locale}>{locale.toUpperCase()}</option>)}</select></label>
            <p className="text-sm text-slate-500 sm:col-span-2">{c.note}</p>
            <div className="flex gap-2 sm:col-span-2"><button type="button" disabled={saving} onClick={() => setStep(1)} className={button}>{c.back}</button><button disabled={saving || loading || !form.product_id} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50">{saving ? c.loading : c.submit}</button></div>
        </form>}
    </section>;
}

export default function StoreFunnelsPage() {
    const { i18n } = useTranslation();
    const lang = i18n.language?.startsWith('ar') ? 'ar' : 'en';
    const c = copy[lang];
    const { apiBase, uiBase } = useStoreScope();
    const { access, locales } = useOutletContext();
    const navigate = useNavigate();
    const [creating, setCreating] = useState(false);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const [data, setData] = useState({ data: [], meta: {} });
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(null);
    const [error, setError] = useState('');
    const [reload, setReload] = useState(0);
    const allowed = access?.canStorePages;
    useEffect(() => {
        if (!allowed) return undefined;
        let active = true;
        setLoading(true);
        const timer = setTimeout(() => {
            api.get(`${apiBase}/funnels`, { params: { search, status: status || undefined, page } })
                .then(({ data: result }) => { if (active) { setData(result); setError(''); } })
                .catch((e) => { if (active) setError(errorText(e)); })
                .finally(() => { if (active) setLoading(false); });
        }, 200);
        return () => { active = false; clearTimeout(timer); };
    }, [allowed, apiBase, search, status, page, reload]);
    async function duplicate(funnel) {
        setBusy(funnel.id); setError('');
        try {
            const { data: result } = await api.post(`${apiBase}/funnels/${funnel.id}/duplicate`);
            navigate(`${uiBase}/pages/${result.data.page_id}/builder`);
        } catch (e) { setError(errorText(e)); } finally { setBusy(null); }
    }
    if (!allowed) return <Navigate to={`${uiBase}/overview`} replace />;
    return <div className="space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-semibold text-slate-900">{c.title}</h1><p className="mt-2 text-sm text-slate-500">{c.subtitle}</p></div><button type="button" onClick={() => setCreating(true)} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"><HiOutlinePlus className="h-4 w-4" aria-hidden />{c.create}</button></header>
        {creating && <CreateFunnel c={c} lang={lang} apiBase={apiBase} uiBase={uiBase} locales={locales} onClose={() => setCreating(false)} />}
        <div className="flex flex-wrap gap-3"><input type="search" aria-label={c.search} placeholder={c.search} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className={`${field} sm:max-w-xs`} /><select aria-label={c.all} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={`${field} sm:max-w-48`}><option value="">{c.all}</option>{['draft', 'published', 'scheduled'].map((value) => <option key={value} value={value}>{c[value]}</option>)}</select></div>
        {error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error} <button className="underline" onClick={() => setReload((value) => value + 1)}>{c.retry}</button></div>}
        {loading ? <p role="status" className="flex items-center gap-2 py-8 text-slate-500"><HiOutlineArrowPath className="h-5 w-5 animate-spin" aria-hidden />{c.loading}</p> : !error && data.data.length === 0 ? <div className="rounded-xl border border-dashed border-slate-200 px-6 py-16 text-center"><h2 className="font-semibold">{c.empty}</h2><p className="mt-2 text-sm text-slate-500">{c.hint}</p></div> : <div className="grid gap-4 xl:grid-cols-2">{data.data.map((funnel) => <article key={funnel.id} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between gap-2"><h2 className="font-semibold">{funnel.title}</h2><span className="rounded-full bg-brand-light px-2 py-1 text-xs text-brand-dark">{c[funnel.status] || funnel.status}</span></div><p className="text-sm text-slate-500">{funnel.product?.name || c.missing}</p><p dir="ltr" className="break-all text-start text-xs text-slate-400">{funnel.public_path}</p><div className="flex flex-wrap gap-2"><Link to={`${uiBase}/pages/${funnel.page_id}/builder`} className={button}>{c.edit}</Link><button disabled={busy !== null} onClick={() => void duplicate(funnel)} className={button}>{busy === funnel.id ? c.loading : c.duplicate}</button></div></article>)}</div>}
        {data.meta.last_page > 1 && <nav className="flex items-center gap-3" aria-label={c.title}><button disabled={page <= 1 || loading} onClick={() => setPage(page - 1)} className={button}>{c.previous}</button><span className="text-sm">{page} / {data.meta.last_page}</span><button disabled={page >= data.meta.last_page || loading} onClick={() => setPage(page + 1)} className={button}>{c.nextPage}</button></nav>}
    </div>;
}
