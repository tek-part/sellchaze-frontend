import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function LandingDestinationField({ value, url, endpoint, onChange }) {
    const kind = value?.type || (url ? 'url' : 'none');
    const [search, setSearch] = useState(''); const [page, setPage] = useState(1); const [retry, setRetry] = useState(0);
    const [result, setResult] = useState({ data: [], selected: null, meta: {} }); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
    useEffect(() => {
        if (!endpoint || !['product', 'category', 'page'].includes(kind)) return;
        let active = true; const controller = new AbortController(); setLoading(true); setError(''); setResult({ data: [], selected: null, meta: {} });
        const timer = setTimeout(() => api.get(endpoint, { params: { type: kind, search, page, ...(value?.id > 0 ? { selected: value.id } : {}) }, signal: controller.signal }).then(({ data }) => { if (active) setResult(data); }).catch(e => { if (active && !controller.signal.aborted) setError(e.response?.data?.message || 'تعذّر تحميل الوجهات.'); }).finally(() => { if (active) setLoading(false); }), 200);
        return () => { active = false; clearTimeout(timer); controller.abort(); };
    }, [endpoint, kind, search, page, retry, value?.id]);
    const rows = result.selected && !result.data.some(item => item.id === result.selected.id) ? [result.selected, ...result.data] : result.data;
    return <fieldset className="pl-destination-controls"><legend>وجهة الصورة</legend><label>نوع الوجهة<select value={kind} onChange={event => { setSearch(''); setPage(1); setResult({ data: [], selected: null, meta: {} }); onChange(event.target.value === 'none' ? undefined : { type: event.target.value, id: 0 }, undefined); }}><option value="none">بدون وجهة</option><option value="product">المنتجات</option><option value="category">الفئات</option><option value="page">الصفحات</option>{kind === 'url' ? <option value="url">رابط محفوظ في الصفحة</option> : null}</select></label>
        {kind === 'url' ? <label>الرابط المحفوظ<input type="url" dir="ltr" value={url} onChange={event => onChange(undefined, event.target.value)} /></label> : kind !== 'none' ? <><label>ابحث عن وجهة<input maxLength={150} value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} /></label><label>الوجهة<select value={value?.id || ''} disabled={loading || !!error} onChange={event => { const row = rows.find(item => item.id === Number(event.target.value)); if (row) onChange({ type: kind, id: row.id }, row.url); }}><option value="">اختر الوجهة</option>{value?.id > 0 && !rows.some(item => item.id === value.id) ? <option value={value.id}>الوجهة المحددة غير متاحة</option> : null}{rows.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>{loading ? <small role="status">جارٍ تحميل الوجهات…</small> : null}{error ? <div role="alert"><p>{error}</p><button type="button" onClick={() => setRetry(n => n + 1)}>إعادة المحاولة</button></div> : null}{!loading && !error && !result.data.length ? <small>لا توجد نتائج متاحة.</small> : null}{page > 1 || result.meta.has_more ? <div className="pl-destination-pagination"><button type="button" disabled={loading || page === 1} onClick={() => setPage(n => n - 1)}>السابق</button><span>{page}</span><button type="button" disabled={loading || !result.meta.has_more} onClick={() => setPage(n => n + 1)}>التالي</button></div> : null}{value?.id === 0 ? <small>اختر الوجهة قبل حفظ الصفحة.</small> : null}</> : null}
    </fieldset>;
}
