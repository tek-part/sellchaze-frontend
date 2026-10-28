import ReportingMoney from '../ReportingMoney';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import AnalyticsRangeControl from './AnalyticsRangeControl';
import { analyticsRange, todayIn } from '../../lib/analytics-range';
import './analytics-reports.css';

const FILTERS = [['utm_source', 'g4_filter_source'], ['utm_medium', 'g4_filter_medium'], ['utm_campaign', 'g4_filter_campaign']];
const STEPS = [['views', 'g4_col_views'], ['carts', 'g4_col_carts'], ['checkouts', 'g4_col_checkouts'], ['orders', 'g4_col_orders']];

/** G4 (#49): per-product views → add to cart → checkout started → orders, by date range and UTM campaign. */
export default function ProductFunnelReport({ apiBase }) {
    const { t, i18n } = useTranslation(); const id = useId();
    const locale = i18n.language.startsWith('ar') ? 'ar-EG' : 'en-GB';
    const [selection, setSelection] = useState({ preset: 'seven' });
    const [filters, setFilters] = useState({ utm_source: '', utm_medium: '', utm_campaign: '' });
    const [timezone, setTimezone] = useState(null);
    const [data, setData] = useState(null); const [error, setError] = useState(''); const [loading, setLoading] = useState(true); const [retry, setRetry] = useState(0);
    const loaded = useRef('');
    // Until the store timezone is known the API's default (last 7 days in that timezone) is requested.
    const range = useMemo(() => timezone ? analyticsRange(selection.preset, selection, todayIn(timezone)) : undefined, [timezone, selection]);
    const filterKey = JSON.stringify(filters);
    useEffect(() => {
        if (range === null) return undefined;
        const key = `${range ? `${range.from}|${range.to}` : 'default'}|${filterKey}|${retry}`;
        if (loaded.current === key) return undefined;
        const controller = new AbortController(); let active = true; setLoading(true); setError('');
        const params = { ...(range || {}), ...Object.fromEntries(Object.entries(JSON.parse(filterKey)).filter(([, value]) => value)) };
        api.get(`${apiBase}/analytics/product-funnel`, { params, signal: controller.signal })
            .then(({ data: body }) => {
                if (!active) return;
                const report = body.data; setData(report);
                loaded.current = `${report.period.from}|${report.period.to}|${filterKey}|${retry}`;
                setTimezone(report.period.timezone);
            })
            .catch((failure) => { if (active && !controller.signal.aborted) setError(failure.response?.data?.message || failure.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; controller.abort(); };
    }, [apiBase, range, filterKey, retry]);

    const count = (value) => new Intl.NumberFormat(locale).format(value);
    const rate = (value) => value === null || value === undefined ? '—' : new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 2 }).format(Number(value) / 100);
    const date = (key) => key ? new Date(`${String(key).slice(0, 10)}T12:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    const totals = data?.totals; const maximum = Math.max(1, ...STEPS.map(([key]) => totals?.[key] ?? 0));
    const cell = 'is-number';

    return (
        <section aria-labelledby={`${id}-title`} className="ws-analytics-report">
            <div className="ws-analytics-report-head">
                <div>
                    <h2 id={`${id}-title`}>{t('g4_funnel_title')}</h2>
                    <p className="ws-analytics-sub">{t('g4_funnel_subtitle')}</p>
                </div>
            </div>
            <div className="ws-analytics-controls">
                <AnalyticsRangeControl value={selection} onChange={setSelection} invalid={range === null} />
                {FILTERS.map(([key, label]) => (
                    <div key={key} className="ws-analytics-field">
                        <label htmlFor={`${id}-${key}`}>{t(label)}</label>
                        <select id={`${id}-${key}`} dir="auto" value={filters[key]} onChange={(event) => setFilters((before) => ({ ...before, [key]: event.target.value }))}>
                            <option value="">{t('g4_filter_all')}</option>
                            {[...new Set([...(data?.options?.[key] || []), ...(filters[key] ? [filters[key]] : [])])].map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                    </div>
                ))}
            </div>
            <p className="ws-analytics-note">{t('g4_funnel_privacy')}{' '}{data ? (data.tracking_started_on ? t('g4_funnel_since', { date: date(data.tracking_started_on) }) : t('g4_funnel_not_started')) : null}</p>
            {error ? <div role="alert" className="ws-analytics-alert">{error}<button type="button" onClick={() => { loaded.current = ''; setRetry((value) => value + 1); }}>{t('g4_retry')}</button></div> : null}
            {loading && !data ? <p role="status" className="ws-analytics-muted">{t('g4_loading')}</p> : null}
            {data ? <div aria-busy={loading}>
                <h3 className="sr-only">{t('g4_funnel_steps')}</h3>
                <dl className="ws-analytics-steps">
                    {STEPS.map(([key, label]) => (
                        <div key={key}>
                            <dt>{t(label)}</dt>
                            <dd>{count(totals[key])}</dd>
                            <dd aria-hidden="true"><span style={{ width: `${(totals[key] / maximum) * 100}%` }} /></dd>
                        </div>
                    ))}
                </dl>
                <div className="ws-analytics-table" role="group" tabIndex={0} aria-label={t('g4_funnel_caption', { from: data.period.from, to: data.period.to, timezone: data.period.timezone })}>
                    <table>
                        <caption className="sr-only">{t('g4_funnel_caption', { from: data.period.from, to: data.period.to, timezone: data.period.timezone })}</caption>
                        <thead>
                            <tr>
                                <th scope="col">{t('g4_col_product')}</th>
                                {['views', 'carts', 'checkouts', 'orders', 'units', 'revenue', 'cart_rate', 'checkout_rate', 'conversion'].map((key) => <th key={key} scope="col" className={cell}>{t(`g4_col_${key}`)}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {data.products.length === 0 ? <tr><td colSpan={10} className="ws-analytics-empty">{t('g4_funnel_empty')}</td></tr> : data.products.map((row) => (
                                <tr key={row.product_id}>
                                    <th scope="row">{row.name || t('g4_deleted_product')}</th>
                                    <td className={cell}>{count(row.views)}</td><td className={cell}>{count(row.carts)}</td><td className={cell}>{count(row.checkouts)}</td>
                                    <td className={cell}>{count(row.orders)}</td><td className={cell}>{count(row.units)}</td><td className={cell}><ReportingMoney value={row.revenue} report={row.reporting_money} currency={data.currency} /></td>
                                    <td className={cell}>{rate(row.cart_rate)}</td><td className={cell}>{rate(row.checkout_rate)}</td><td className={cell}>{rate(row.conversion_rate)}</td>
                                </tr>
                            ))}
                        </tbody>
                        {data.products.length ? <tfoot>
                            <tr>
                                <th scope="row">{t('g4_total')}</th>
                                <td className={cell}>{count(totals.views)}</td><td className={cell}>{count(totals.carts)}</td><td className={cell}>{count(totals.checkouts)}</td>
                                <td className={cell}>{count(totals.orders)}</td><td className={cell}>{count(totals.units)}</td><td className={cell}><ReportingMoney value={totals.revenue} report={data.reporting_money} currency={data.currency} /></td>
                                <td className={cell}>{rate(totals.cart_rate)}</td><td className={cell}>{rate(totals.checkout_rate)}</td><td className={cell}>{rate(totals.conversion_rate)}</td>
                            </tr>
                        </tfoot> : null}
                    </table>
                </div>
                {data.truncated ? <p className="ws-analytics-note">{t('g4_funnel_truncated')}</p> : null}
            </div> : null}
        </section>
    );
}
