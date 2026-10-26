import { useEffect, useId, useMemo, useState } from 'react';
import api from '../../api/client';
import AnalyticsRangeControl from '../../components/analytics/AnalyticsRangeControl';
import { analyticsRange, todayIn } from '../../lib/analytics-range';
import { useServiceCopy } from './ServiceMarketplaceCommon';

const browserZone = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; } };
const CHANNELS = [['whatsapp', 'واتساب', 'WhatsApp'], ['telegram', 'تليجرام', 'Telegram'], ['email', 'البريد الإلكتروني', 'Email'], ['phone', 'الهاتف', 'Phone']];

/** G4 (#50): the freelancer's own service views, profile views and contact clicks for a chosen period. */
export default function ServiceMarketplaceAnalytics() {
    const { ar, text } = useServiceCopy(); const id = useId(); const locale = ar ? 'ar-EG' : 'en-GB';
    const zone = useMemo(browserZone, []);
    const [selection, setSelection] = useState({ preset: 'seven' });
    const [data, setData] = useState(null); const [error, setError] = useState(''); const [loading, setLoading] = useState(true); const [retry, setRetry] = useState(0);
    const range = useMemo(() => analyticsRange(selection.preset, selection, todayIn(zone)), [selection, zone]);
    const rangeKey = range ? `${range.from}|${range.to}` : '';
    useEffect(() => {
        if (!rangeKey) return undefined;
        const [from, to] = rangeKey.split('|');
        const controller = new AbortController(); let active = true; setLoading(true); setError('');
        api.get('/me/service-marketplace/analytics', { params: { from, to, timezone: zone }, signal: controller.signal })
            .then(({ data: body }) => { if (active) setData(body.data); })
            .catch((failure) => { if (active && !controller.signal.aborted) setError(failure.response?.data?.message || failure.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; controller.abort(); };
    }, [rangeKey, zone, retry]);
    const count = (value) => new Intl.NumberFormat(locale).format(value);
    const day = (key) => new Date(`${key}T12:00:00`).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
    const cards = [['service_views', 'مشاهدات الخدمات', 'Service views'], ['profile_views', 'زيارات الملف', 'Profile views'], ['contact_clicks', 'طلبات التواصل', 'Contact clicks'], ['unique_visitors', 'زوار مختلفون', 'Unique visitors']];
    const maximum = Math.max(1, ...(data?.daily || []).map((row) => row.service_views + row.profile_views));

    return (
        <section className="ws-service-owned-list ws-service-analytics" aria-labelledby={`${id}-title`}>
            <h2 id={`${id}-title`}>{text('إحصائيات خدماتي', 'My service analytics')}</h2>
            <p className="ws-service-analytics-note">{text('يُحتسب كل زائر مرة واحدة يوميًا لكل خدمة أو قناة تواصل، ولا تُحتسب زياراتك لخدماتك.', 'Each visitor counts once a day per service or contact channel; your own visits are not counted.')}</p>
            <AnalyticsRangeControl value={selection} onChange={setSelection} invalid={!range} />
            {error ? <div role="alert" className="ws-service-error">{error}<button type="button" onClick={() => setRetry((value) => value + 1)}>{text('إعادة المحاولة', 'Try again')}</button></div> : null}
            {loading && !data ? <p role="status">{text('جارٍ التحميل…', 'Loading…')}</p> : null}
            {data ? <div aria-busy={loading}>
                <dl className="ws-service-analytics-cards">{cards.map(([key, a, e]) => <div key={key}><dt>{text(a, e)}</dt><dd>{count(data.summary[key])}</dd></div>)}</dl>
                <h3>{text('حسب اليوم', 'By day')}</h3>
                <div className="ws-service-analytics-table" role="group" tabIndex={0} aria-label={text('حسب اليوم', 'By day')}>
                    <table>
                        <caption className="sr-only">{text(`الزيارات وطلبات التواصل من ${data.period.from} إلى ${data.period.to}`, `Views and contact clicks from ${data.period.from} to ${data.period.to}`)}</caption>
                        <thead><tr><th scope="col">{text('اليوم', 'Day')}</th><th scope="col">{text('مشاهدات الخدمات', 'Service views')}</th><th scope="col">{text('زيارات الملف', 'Profile views')}</th><th scope="col">{text('طلبات التواصل', 'Contact clicks')}</th><th scope="col"><span className="sr-only">{text('نسبة الزيارات', 'Share of visits')}</span></th></tr></thead>
                        <tbody>{data.daily.map((row) => <tr key={row.date}><th scope="row">{day(row.date)}</th><td>{count(row.service_views)}</td><td>{count(row.profile_views)}</td><td>{count(row.contact_clicks)}</td><td aria-hidden="true"><span className="ws-service-analytics-bar" style={{ width: `${((row.service_views + row.profile_views) / maximum) * 100}%` }} /></td></tr>)}</tbody>
                    </table>
                </div>
                <h3>{text('حسب الخدمة', 'By service')}</h3>
                {data.services.length ? <div className="ws-service-analytics-table" role="group" tabIndex={0} aria-label={text('حسب الخدمة', 'By service')}><table>
                    <caption className="sr-only">{text('المشاهدات وطلبات التواصل لكل خدمة', 'Views and contact clicks for each service')}</caption>
                    <thead><tr><th scope="col">{text('الخدمة', 'Service')}</th><th scope="col">{text('المشاهدات', 'Views')}</th><th scope="col">{text('طلبات التواصل', 'Contact clicks')}</th></tr></thead>
                    <tbody>{data.services.map((row) => <tr key={row.id}><th scope="row">{row.title}</th><td>{count(row.views)}</td><td>{count(row.contact_clicks)}</td></tr>)}</tbody>
                </table></div> : <p>{text('لا توجد مشاهدات للخدمات في هذه الفترة.', 'No service views in this period.')}</p>}
                <h3>{text('قنوات التواصل', 'Contact channels')}</h3>
                <dl className="ws-service-analytics-cards">{CHANNELS.map(([key, a, e]) => <div key={key}><dt>{text(a, e)}</dt><dd>{count(data.contact_channels[key] ?? 0)}</dd></div>)}</dl>
            </div> : null}
        </section>
    );
}
