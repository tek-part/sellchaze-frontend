import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import './analytics-reports.css';

/** G4 (#7): products and variants ordered on one store-local day (default today), with a CSV export. */
export default function OrderedProductsPanel({ apiBase }) {
    const { t, i18n } = useTranslation(); const id = useId(); const ar = i18n.language.startsWith('ar');
    const locale = ar ? 'ar-EG' : 'en-GB';
    const [date, setDate] = useState('');
    const [data, setData] = useState(null); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
    const [retry, setRetry] = useState(0); const [exporting, setExporting] = useState(false);
    const loaded = useRef('');
    useEffect(() => {
        if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return undefined;
        // An empty date asks the API for today in the store timezone; the answer then fills the date input.
        if (date && loaded.current === `${date}|${retry}`) return undefined;
        const controller = new AbortController(); let active = true; setLoading(true); setError('');
        api.get(`${apiBase}/analytics/ordered-products`, { params: date ? { date } : {}, signal: controller.signal })
            .then(({ data: body }) => { if (!active) return; loaded.current = `${body.data.date}|${retry}`; setData(body.data); setDate(body.data.date); })
            .catch((failure) => { if (active && !controller.signal.aborted) setError(failure.response?.data?.message || failure.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; controller.abort(); };
    }, [apiBase, date, retry]);
    const shown = data;
    const count = (value) => new Intl.NumberFormat(locale).format(value);
    const download = async () => {
        setExporting(true); setError('');
        try {
            const { data: blob } = await api.get(`${apiBase}/analytics/ordered-products/export`, { params: { date, locale: ar ? 'ar' : 'en' }, responseType: 'blob' });
            const href = URL.createObjectURL(blob); const link = document.createElement('a');
            link.href = href; link.download = `ordered-products-${date}.csv`; link.click(); window.setTimeout(() => URL.revokeObjectURL(href), 1000);
        } catch (failure) { setError(failure.response?.data?.message || failure.message); } finally { setExporting(false); }
    };

    return (
        <section aria-labelledby={`${id}-title`} className="ws-analytics-report">
            <div className="ws-analytics-report-head">
                <div>
                    <h2 id={`${id}-title`}>{t('g4_ordered_title')}</h2>
                    <p className="ws-analytics-sub">{t('g4_ordered_subtitle')}</p>
                </div>
                <div className="ws-analytics-controls" style={{ marginBottom: 0 }}>
                    <div className="ws-analytics-field">
                        <label htmlFor={`${id}-date`}>{t('g4_ordered_date')}</label>
                        <input id={`${id}-date`} type="date" dir="ltr" required value={date} onChange={(event) => { if (event.target.value) setDate(event.target.value); }} />
                    </div>
                    <button type="button" className="ws-analytics-button" onClick={() => { loaded.current = ''; setDate(''); }}>{t('g4_ordered_today')}</button>
                    <button type="button" className="ws-analytics-button ws-analytics-primary" disabled={!date || exporting || !shown?.items.length} onClick={download}>{exporting ? t('g4_ordered_exporting') : t('g4_ordered_export')}</button>
                </div>
            </div>
            {error ? <div role="alert" className="ws-analytics-alert">{error}<button type="button" onClick={() => setRetry((value) => value + 1)}>{t('g4_retry')}</button></div> : null}
            {loading && !shown ? <p role="status" className="ws-analytics-muted">{t('g4_loading')}</p> : null}
            {shown ? <div aria-busy={loading}>
                <p className="ws-analytics-note" role="status">{t('g4_ordered_totals', { quantity: count(shown.totals.quantity), orders: count(shown.totals.orders) })}</p>
                <div className="ws-analytics-table" role="group" tabIndex={0} aria-label={t('g4_ordered_caption', { date: shown.date, timezone: shown.timezone })}>
                    <table>
                        <caption className="sr-only">{t('g4_ordered_caption', { date: shown.date, timezone: shown.timezone })}</caption>
                        <thead>
                            <tr>
                                <th scope="col">{t('g4_col_product')}</th>
                                <th scope="col">{t('g4_col_variant')}</th>
                                <th scope="col">{t('g4_col_sku')}</th>
                                <th scope="col" className="is-number">{t('g4_col_quantity')}</th>
                                <th scope="col" className="is-number">{t('g4_col_orders')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shown.items.length === 0 ? <tr><td colSpan={5} className="ws-analytics-empty">{t('g4_ordered_empty')}</td></tr> : shown.items.map((row) => (
                                <tr key={`${row.product_id}-${row.variant_id}-${row.variant_name}-${row.sku}`}>
                                    <th scope="row">{row.name}</th>
                                    <td>
                                        {row.variant_name || (row.options.length ? null : <span className="ws-analytics-muted">{t('g4_no_variant')}</span>)}
                                        {row.options.length ? <ul className="ws-analytics-chips">{row.options.map((option) => <li key={`${option.name}:${option.value}`}>{option.name ? `${option.name}: ` : ''}{option.value}</li>)}</ul> : null}
                                    </td>
                                    <td className="ws-analytics-muted" dir="ltr">{row.sku || '—'}</td>
                                    <td className="is-number"><strong>{count(row.quantity)}</strong></td>
                                    <td className="is-number">{count(row.orders)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div> : null}
        </section>
    );
}
