import { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useStoreScope from '../hooks/useStoreScope';
import api from '../api/client';
import { IndexFilters, IndexTable, downloadCsv, useIndexTable } from '../components/data-table';
import { HiOutlineGift, HiOutlinePlus } from '../components/workspace/WorkspaceIcons';
import IssueGiftCardDialog from '../components/store/IssueGiftCardDialog';
import { GIFT_CARD_STATES, giftCardStateLabel, giftCardStateTone, maskGiftCardCode } from '../features/store/giftCards';

// Products > Gift cards. Search matches the last 4 characters or the customer; status filters and
// sorting are server-side (newest first). Codes are never listed: only their last 4 characters.
const DEFAULTS = { sort: null, perPage: 25 };

export default function StoreGiftCardsPage() {
    const { id, apiBase, uiBase } = useStoreScope();
    const { store } = useOutletContext() ?? {};
    const { i18n } = useTranslation();
    const ar = i18n.language?.startsWith('ar'); const text = (a, e) => (ar ? a : e);
    const [result, setResult] = useState(null);
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(true);
    const [reload, setReload] = useState(0);
    const [issuing, setIssuing] = useState(false);

    const money = (value, currency) => new Intl.NumberFormat(ar ? 'ar-EG' : 'en', { style: 'currency', currency: currency || store?.currency || 'EGP', maximumFractionDigits: 2 }).format(Number(value));
    const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(ar ? 'ar-EG' : 'en') : '—');
    const href = (row) => `${uiBase}/gift-cards/${row.id}`;

    const columns = useMemo(() => [
        { key: 'code', header: text('البطاقة', 'Gift card'), hideable: false, primary: true, csv: (row) => maskGiftCardCode(row.last4),
            render: (row) => <div>
                <Link className="ws-dt-title font-mono" dir="ltr" to={href(row)}>{maskGiftCardCode(row.last4)}</Link>
                {row.note ? <span className="ws-dt-sub">{row.note}</span> : null}
            </div> },
        { key: 'state', header: text('الحالة', 'Status'), csv: (row) => row.state,
            render: (row) => <span className={`ws-dt-badge ${giftCardStateTone(row.state)}`}>{giftCardStateLabel(row.state, ar)}</span> },
        { key: 'balance', header: text('الرصيد', 'Balance'), align: 'end', sortKey: 'balance', csv: (row) => row.balance,
            render: (row) => <span className="ws-dt-num">{money(row.balance, row.currency)}<span className="ws-dt-sub">{text('من', 'of')} {money(row.initial_value, row.currency)}</span></span> },
        { key: 'customer', header: text('العميل', 'Customer'), csv: (row) => row.customer_name || row.customer_email || '',
            render: (row) => <span className="block min-w-32 max-w-xs whitespace-normal">{row.customer_name || row.customer_email || row.customer_phone || '—'}</span> },
        { key: 'initial', header: text('القيمة الأصلية', 'Initial value'), align: 'end', defaultHidden: true, sortKey: 'initial_value', csv: (row) => row.initial_value,
            render: (row) => <span className="ws-dt-num">{money(row.initial_value, row.currency)}</span> },
        { key: 'expires', header: text('تنتهي', 'Expires'), sortKey: 'expires_at', csv: (row) => row.expires_at ?? '', render: (row) => <span className="ws-dt-num">{fmtDate(row.expires_at)}</span> },
        { key: 'created', header: text('تاريخ الإصدار', 'Issued'), sortKey: 'created_at', csv: (row) => row.created_at ?? '', render: (row) => <span className="ws-dt-num">{fmtDate(row.created_at)}</span> },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [ar, uiBase, store?.currency]);

    const filters = useMemo(() => [
        { key: 'status', label: text('الحالة', 'Status'), type: 'select', options: GIFT_CARD_STATES.map((state) => ({ value: state, label: giftCardStateLabel(state, ar) })) },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [ar]);
    const views = useMemo(() => [
        { id: 'all', label: text('الكل', 'All'), state: { filters: {} } },
        ...GIFT_CARD_STATES.map((state) => ({ id: state, label: giftCardStateLabel(state, ar), state: { filters: { status: state } } })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [ar]);
    const table = useIndexTable({ scope: `store:${store?.id ?? apiBase}:gift-cards`, filters, columns, views, defaults: DEFAULTS });
    const paramsKey = JSON.stringify(table.apiParams);
    useEffect(() => {
        let active = true; setLoading(true); setErr('');
        api.get(`${apiBase}/gift-cards`, { params: table.apiParams })
            .then(({ data }) => { if (active) setResult(data); })
            .catch((e) => { if (active) setErr(e.response?.data?.message || e.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiBase, paramsKey, reload]);
    useEffect(() => { setResult(null); setIssuing(false); }, [apiBase]);

    const rows = result?.data ?? [];
    const issueButton = <button type="button" className="ws-dt-button ws-dt-button-primary" onClick={() => setIssuing(true)}><HiOutlinePlus aria-hidden />{text('إصدار بطاقة هدية', 'Issue gift card')}</button>;

    return (
        <section className="ws-catalog-page">
            <header className="ws-catalog-heading">
                <div>
                    <h1>{text('بطاقات الهدايا', 'Gift cards')}</h1>
                    <p>{text('أصدر بطاقات هدايا برصيد يستخدمه العميل كوسيلة دفع عند إتمام الطلب.', 'Issue gift cards with a balance customers spend as a payment at checkout.')}</p>
                </div>
                <div className="ws-catalog-actions">
                    {id ? <Link to="/stores" className="ws-dt-button">← {text('المتاجر', 'Stores')}</Link> : null}
                    {issueButton}
                </div>
            </header>

            <div className="ws-dt-card">
                <IndexFilters table={table} searchPlaceholder={text('ابحث بآخر 4 أحرف أو العميل', 'Search by last 4 characters or customer')} exportDisabled={!rows.length}
                    onExport={() => downloadCsv(`gift-cards-${new Date().toISOString().slice(0, 10)}.csv`, table.visibleColumns, rows)} />
                <IndexTable table={table} rows={rows} loading={loading} error={err} onRetry={() => setReload((value) => value + 1)} meta={result?.meta}
                    label={text('بطاقات الهدايا', 'Gift cards')} rowHref={href}
                    emptyState={{ icon: HiOutlineGift, title: text('لا توجد بطاقات هدايا بعد', 'No gift cards yet'),
                        description: text('أصدر بطاقة هدية وسلّم الكود للعميل بنفسك.', 'Issue a gift card and hand its code to the customer yourself.'), action: issueButton }} />
            </div>

            <IssueGiftCardDialog open={issuing} onClose={() => setIssuing(false)} onIssued={() => setReload((value) => value + 1)}
                apiBase={apiBase} currency={store?.currency || 'EGP'} ar={ar} />
        </section>
    );
}
