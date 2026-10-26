import { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useStoreScope from '../hooks/useStoreScope';
import api from '../api/client';
import { IndexFilters, IndexTable, downloadCsv, useIndexTable } from '../components/data-table';
import { HiOutlineEnvelope, HiOutlinePlus } from '../components/workspace/WorkspaceIcons';
import { CAMPAIGN_STATUSES, campaignStatusLabel, campaignStatusTone, percent } from '../features/store/emailCampaigns';

// Marketing > Email campaigns. Status views and sorting are server-side; metrics come with each row.
const DEFAULTS = { sort: null, perPage: 25 };

export default function StoreEmailCampaignsPage() {
    const { id, apiBase, uiBase } = useStoreScope();
    const { store } = useOutletContext() ?? {};
    const { i18n } = useTranslation();
    const ar = i18n.language?.startsWith('ar'); const text = (a, e) => (ar ? a : e);
    const [result, setResult] = useState(null);
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(true);
    const [reload, setReload] = useState(0);

    const number = (value) => new Intl.NumberFormat(ar ? 'ar-EG' : 'en').format(Number(value ?? 0));
    const fmtDate = (d) => (d ? new Date(d).toLocaleString(ar ? 'ar-EG' : 'en', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
    const href = (row) => (['draft'].includes(row.status) ? `${uiBase}/email-campaigns/${row.id}` : `${uiBase}/email-campaigns/${row.id}/report`);
    const when = (row) => row.completed_at || row.started_at || row.scheduled_at;

    const columns = useMemo(() => [
        { key: 'name', header: text('الحملة', 'Campaign'), hideable: false, primary: true, csv: (row) => row.name,
            render: (row) => <div className="min-w-40 max-w-xs whitespace-normal">
                <Link className="ws-dt-title" to={href(row)}>{row.name}</Link>
                {row.subject ? <span className="ws-dt-sub">{row.subject}</span> : null}
            </div> },
        { key: 'status', header: text('الحالة', 'Status'), csv: (row) => row.status,
            render: (row) => <span className={`ws-dt-badge ${campaignStatusTone(row.status)}`}>{campaignStatusLabel(row.status, ar)}</span> },
        { key: 'recipients', header: text('المستلمون', 'Recipients'), align: 'end', sortKey: 'sent_count', csv: (row) => row.sent_count,
            render: (row) => <span className="ws-dt-num">{number(row.sent_count)}{row.recipients_count && row.recipients_count !== row.sent_count ? <span className="ws-dt-sub">{text('من', 'of')} {number(row.recipients_count)}</span> : null}</span> },
        { key: 'opens', header: text('معدل الفتح', 'Open rate'), align: 'end', csv: (row) => row.open_rate ?? '',
            render: (row) => <span className="ws-dt-num">{percent(row.open_rate, ar)}</span> },
        { key: 'clicks', header: text('معدل النقر', 'Click rate'), align: 'end', csv: (row) => row.click_rate ?? '',
            render: (row) => <span className="ws-dt-num">{percent(row.click_rate, ar)}</span> },
        { key: 'when', header: text('التاريخ', 'Date'), sortKey: 'scheduled_at', csv: (row) => when(row) ?? '', render: (row) => <span className="ws-dt-num">{fmtDate(when(row))}</span> },
        { key: 'updated', header: text('آخر تعديل', 'Last edited'), defaultHidden: true, sortKey: 'updated_at', csv: (row) => row.updated_at ?? '', render: (row) => <span className="ws-dt-num">{fmtDate(row.updated_at)}</span> },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [ar, uiBase]);

    const filters = useMemo(() => [
        { key: 'status', label: text('الحالة', 'Status'), type: 'select', options: CAMPAIGN_STATUSES.map((status) => ({ value: status, label: campaignStatusLabel(status, ar) })) },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [ar]);
    const views = useMemo(() => [
        { id: 'all', label: text('الكل', 'All'), state: { filters: {} } },
        ...['draft', 'scheduled', 'sent'].map((status) => ({ id: status, label: campaignStatusLabel(status, ar), state: { filters: { status } } })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [ar]);
    const table = useIndexTable({ scope: `store:${store?.id ?? apiBase}:email-campaigns`, filters, columns, views, defaults: DEFAULTS });
    const paramsKey = JSON.stringify(table.apiParams);
    useEffect(() => {
        let active = true; setLoading(true); setErr('');
        api.get(`${apiBase}/email-campaigns`, { params: table.apiParams })
            .then(({ data }) => { if (active) setResult(data); })
            .catch((e) => { if (active) setErr(e.response?.data?.message || e.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiBase, paramsKey, reload]);

    const rows = result?.data ?? [];
    const createButton = <Link to={`${uiBase}/email-campaigns/new`} className="ws-dt-button ws-dt-button-primary"><HiOutlinePlus aria-hidden />{text('إنشاء حملة', 'Create campaign')}</Link>;

    return (
        <section className="ws-catalog-page">
            <header className="ws-catalog-heading">
                <div>
                    <h1>{text('حملات البريد', 'Email campaigns')}</h1>
                    <p>{text('أرسل رسائل بريدية بهوية متجرك إلى العملاء المشتركين في نشرتك البريدية فقط.', 'Send store-branded emails to customers who subscribed to your newsletter — and only to them.')}</p>
                </div>
                <div className="ws-catalog-actions">
                    {id ? <Link to="/stores" className="ws-dt-button">← {text('المتاجر', 'Stores')}</Link> : null}
                    {createButton}
                </div>
            </header>

            <div className="ws-dt-card">
                <IndexFilters table={table} searchPlaceholder={text('ابحث بالاسم أو الموضوع', 'Search by name or subject')} exportDisabled={!rows.length}
                    onExport={() => downloadCsv(`email-campaigns-${new Date().toISOString().slice(0, 10)}.csv`, table.visibleColumns, rows)} />
                <IndexTable table={table} rows={rows} loading={loading} error={err} onRetry={() => setReload((value) => value + 1)} meta={result?.meta}
                    label={text('حملات البريد', 'Email campaigns')} rowHref={href}
                    emptyState={{ icon: HiOutlineEnvelope, title: text('لا توجد حملات بعد', 'No campaigns yet'),
                        description: text('صمم رسالة من عناوين ونصوص وصور ومنتجات وأكواد خصم، ثم أرسلها أو جدولها.', 'Build an email from headings, text, images, products and discount codes, then send or schedule it.'), action: createButton }} />
            </div>
        </section>
    );
}
