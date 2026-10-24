import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import useStoreScope from '../hooks/useStoreScope';
import { fetchAllPages } from '../utils/fetchAllPages';
import { IndexFilters, IndexTable, downloadCsv, useIndexTable } from '../components/data-table';
import { HiOutlineArrowDownTray, HiOutlineEnvelope } from '../components/workspace/WorkspaceIcons';

// The newsletter endpoint supports a channel filter, a name/phone/email search and pagination (newest first).
const DEFAULTS = { sort: null, perPage: 25 };

export default function StoreNewsletterPage() {
    const { apiBase } = useStoreScope();
    return <Subscribers key={apiBase} apiBase={apiBase} />;
}

function Subscribers({ apiBase }) {
    const { i18n } = useTranslation(); const ar = i18n.language.startsWith('ar'); const text = (a, e) => ar ? a : e;
    const { store } = useOutletContext() ?? {};
    const [result, setResult] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [reload, setReload] = useState(0);
    const [exporting, setExporting] = useState(false); const [exportError, setExportError] = useState('');
    const path = `${apiBase}/newsletter`;
    const date = (value) => (value ? new Date(value.replace(' ', 'T') + (/Z|[+-]\d\d:\d\d$/.test(value) ? '' : 'Z')).toLocaleString(ar ? 'ar-EG' : 'en-GB') : '—');

    const channels = useMemo(() => [{ value: 'email', label: text('البريد الإلكتروني', 'Email') }, { value: 'phone', label: text('الهاتف', 'Phone') }], [ar]); // eslint-disable-line react-hooks/exhaustive-deps
    const filters = useMemo(() => [{ key: 'channel', label: text('طريقة الاشتراك', 'Subscription channel'), type: 'select', options: channels }], [ar, channels]); // eslint-disable-line react-hooks/exhaustive-deps
    const views = useMemo(() => [
        { id: 'all', label: text('الكل', 'All'), state: { filters: {} } },
        { id: 'email', label: text('البريد الإلكتروني', 'Email'), state: { filters: { channel: 'email' } } },
        { id: 'phone', label: text('الهاتف', 'Phone'), state: { filters: { channel: 'phone' } } },
    ], [ar]); // eslint-disable-line react-hooks/exhaustive-deps
    const columns = useMemo(() => [
        { key: 'subscriber', header: text('المشترك', 'Subscriber'), hideable: false, primary: true, csv: (row) => row.name || row.email || row.phone || '',
            render: (row) => <div><span className="ws-dt-title" dir={row.name ? undefined : 'ltr'}>{row.name || row.email || row.phone || '—'}</span>{row.name && (row.email || row.phone) ? <span className="ws-dt-sub" dir="ltr">{row.email || row.phone}</span> : null}</div> },
        { key: 'name', header: text('الاسم', 'Name'), defaultHidden: true, csv: (row) => row.name ?? '', render: (row) => row.name || '—' },
        { key: 'phone', header: text('الهاتف', 'Phone'), csv: (row) => row.phone ?? '', render: (row) => <span dir="ltr">{row.phone || '—'}</span> },
        { key: 'email', header: text('البريد الإلكتروني', 'Email'), csv: (row) => row.email ?? '', render: (row) => row.email || '—' },
        { key: 'channel', header: text('طريقة الاشتراك', 'Channel'), csv: (row) => row.channel, render: (row) => channels.find((item) => item.value === row.channel)?.label ?? row.channel },
        { key: 'status', header: text('الحالة', 'Status'), csv: (row) => (Number(row.is_active) ? 'active' : 'inactive'),
            render: (row) => <span className={`ws-dt-badge ${Number(row.is_active) ? 'is-success' : ''}`}>{Number(row.is_active) ? text('نشط', 'Active') : text('غير نشط', 'Inactive')}</span> },
        { key: 'created', header: text('تاريخ الاشتراك', 'Subscribed at'), csv: (row) => row.created_at ?? '', render: (row) => <span className="ws-dt-num">{date(row.created_at)}</span> },
    ], [ar, channels]); // eslint-disable-line react-hooks/exhaustive-deps

    const table = useIndexTable({ scope: `store:${store?.id ?? apiBase}:newsletter`, filters, columns, views, defaults: DEFAULTS });
    const paramsKey = JSON.stringify(table.apiParams);
    useEffect(() => {
        let active = true; setLoading(true); setError('');
        api.get(path, { params: table.apiParams }).then(({ data }) => { if (active) setResult(data); }).catch((e) => { if (active) setError(e.response?.data?.message || e.message); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [path, paramsKey, reload]); // eslint-disable-line react-hooks/exhaustive-deps
    const pending = loading || table.searching;
    const rows = result?.data ?? [];

    async function exportRows() {
        if (exporting || pending) return; setExporting(true); setExportError('');
        try {
            if (result?.meta?.total > 10000) throw new Error(text('ضيّق البحث لتصدير 10,000 مشترك أو أقل.', 'Narrow the search to export 10,000 subscribers or fewer.'));
            const { page: _page, per_page: _perPage, ...filtersParams } = table.apiParams;
            const all = await fetchAllPages(path, filtersParams);
            const href = URL.createObjectURL(new Blob([JSON.stringify(all, null, 2)], { type: 'application/json;charset=utf-8' }));
            const link = document.createElement('a'); link.href = href; link.download = 'store-newsletter.json'; link.click(); URL.revokeObjectURL(href);
        } catch (e) { setExportError(e.message); } finally { setExporting(false); }
    }
    return <section className="ws-catalog-page">
        <header className="ws-catalog-heading"><div><h1>NewsLetter</h1><p>{text('المشتركون في نشرة متجرك الإخبارية', 'Your store newsletter subscribers')}</p></div><div className="ws-catalog-actions"><button type="button" className="ws-dt-button" disabled={pending || exporting || !result?.meta?.total} onClick={exportRows}><HiOutlineArrowDownTray aria-hidden />{exporting ? text('جارٍ التصدير…', 'Exporting…') : text('تصدير JSON', 'Export JSON')}</button></div></header>
        {exportError ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{exportError}</p> : null}
        <div className="ws-dt-card">
            <IndexFilters table={table} searchPlaceholder={text('الاسم أو الهاتف أو البريد الإلكتروني', 'Name, phone or email')} exportDisabled={!rows.length}
                onExport={() => downloadCsv(`newsletter-${new Date().toISOString().slice(0, 10)}.csv`, table.visibleColumns, rows)} />
            <IndexTable table={table} rows={rows} rowKey={(row) => `${row.channel}-${row.id}`} loading={loading} error={error} onRetry={() => setReload((value) => value + 1)} meta={result?.meta}
                label={text('المشتركون', 'Subscribers')} emptyState={{ icon: HiOutlineEnvelope, title: text('لا يوجد مشتركون حتى الآن.', 'No subscribers yet.'), description: text('يظهر هنا من يشترك في نشرتك عبر البريد الإلكتروني أو الهاتف.', 'People who subscribe to your newsletter by email or phone appear here.') }} />
        </div>
    </section>;
}
