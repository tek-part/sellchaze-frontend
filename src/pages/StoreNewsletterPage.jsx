import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import useStoreScope from '../hooks/useStoreScope';
import { useDebounced } from '../hooks/useDebounced';
import { fetchAllPages } from '../utils/fetchAllPages';

export default function StoreNewsletterPage() {
    const { apiBase } = useStoreScope();
    return <Subscribers key={apiBase} apiBase={apiBase} />;
}

function Subscribers({ apiBase }) {
    const { i18n } = useTranslation(); const ar = i18n.language.startsWith('ar'); const text = (a, e) => ar ? a : e;
    const [query, setQuery] = useState(''); const search = useDebounced(query, 250);
    const [channel, setChannel] = useState(''); const [page, setPage] = useState(1);
    const [result, setResult] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [reload, setReload] = useState(0); const [exporting, setExporting] = useState(false);
    const path = `${apiBase}/newsletter`;
    useEffect(() => {
        let active = true; setLoading(true); setError('');
        api.get(path, { params: { channel, search, page, per_page: 25 } }).then(({ data }) => { if (active) setResult(data); }).catch((e) => { if (active) setError(e.response?.data?.message || e.message); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [path, channel, search, page, reload]);
    const pending = loading || query !== search;
    async function exportRows() {
        if (exporting || pending) return; setExporting(true); setError('');
        try {
            if (result?.meta?.total > 10000) throw new Error(text('ضيّق البحث لتصدير 10,000 مشترك أو أقل.', 'Narrow the search to export 10,000 subscribers or fewer.'));
            const rows = await fetchAllPages(path, { channel, search, per_page: 100 });
            const href = URL.createObjectURL(new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json;charset=utf-8' }));
            const link = document.createElement('a'); link.href = href; link.download = 'store-newsletter.json'; link.click(); URL.revokeObjectURL(href);
        } catch (e) { setError(e.message); } finally { setExporting(false); }
    }
    return <div className="ws-catalog space-y-5">
        <header className="ws-catalog-heading"><div><h1>NewsLetter</h1><p>{text('المشتركون في نشرة متجرك الإخبارية', 'Your store newsletter subscribers')}</p></div><button className="ws-catalog-button" disabled={pending || exporting || !result?.meta?.total} onClick={exportRows}>{exporting ? text('جارٍ التصدير…', 'Exporting…') : text('تصدير', 'Export')}</button></header>
        {error ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{error}<button className="ms-3 underline" onClick={() => setReload((value) => value + 1)}>{text('إعادة التحميل', 'Reload')}</button></p> : null}
        <section className="ws-catalog-card"><div className="ws-catalog-toolbar"><input className="ws-catalog-filter" aria-label={text('بحث المشتركين', 'Search subscribers')} placeholder={text('الاسم أو الهاتف أو البريد الإلكتروني', 'Name, phone or email')} value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /><label>{text('طريقة الاشتراك', 'Subscription channel')}<select className="ws-catalog-filter ms-3" value={channel} onChange={(event) => { setChannel(event.target.value); setPage(1); }}><option value="">{text('الكل', 'All')}</option><option value="phone">{text('الهاتف', 'Phone')}</option><option value="email">{text('البريد الإلكتروني', 'Email')}</option></select></label></div>
            <div className="ws-catalog-table"><table><thead><tr><th>{text('الاسم', 'Name')}</th><th>{text('الهاتف', 'Phone')}</th><th>{text('البريد الإلكتروني', 'Email')}</th><th>{text('الحالة', 'Status')}</th><th>{text('تاريخ الاشتراك', 'Subscribed at')}</th></tr></thead><tbody>{pending ? <tr><td colSpan={5} role="status">{text('جارٍ التحميل…', 'Loading…')}</td></tr> : result?.data?.length ? result.data.map((row) => <tr key={`${row.channel}-${row.id}`}><td>{row.name || '—'}</td><td dir="ltr">{row.phone || '—'}</td><td>{row.email || '—'}</td><td>{Number(row.is_active) ? text('نشط', 'Active') : text('غير نشط', 'Inactive')}</td><td>{row.created_at ? new Date(row.created_at.replace(' ', 'T') + (/Z|[+-]\d\d:\d\d$/.test(row.created_at) ? '' : 'Z')).toLocaleString(ar ? 'ar-EG' : 'en-GB') : '—'}</td></tr>) : <tr><td colSpan={5}>{text('لا يوجد مشتركون حتى الآن.', 'No subscribers yet.')}</td></tr>}</tbody></table></div>
            <footer className="ws-catalog-pagination"><span>{result?.meta?.total || 0} · {page}/{result?.meta?.last_page || 1}</span><button disabled={pending || page <= 1} onClick={() => setPage(page - 1)}>{text('السابق', 'Previous')}</button><button disabled={pending || page >= (result?.meta?.last_page || 1)} onClick={() => setPage(page + 1)}>{text('التالي', 'Next')}</button></footer>
        </section>
    </div>;
}
