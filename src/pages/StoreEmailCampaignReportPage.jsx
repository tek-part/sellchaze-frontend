import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import useStoreScope from '../hooks/useStoreScope';
import api from '../api/client';
import '../components/data-table/data-table.css';
import { campaignStatusLabel, campaignStatusTone, percent } from '../features/store/emailCampaigns';

const CARD = 'min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card sm:p-5';

/** Delivery and engagement of one campaign: sent, opens, clicks, unsubscribes and failures. */
export default function StoreEmailCampaignReportPage() {
    const { campaignId } = useParams();
    const { apiBase, uiBase } = useStoreScope();
    const { i18n } = useTranslation();
    const ar = i18n.language?.startsWith('ar'); const text = (a, e) => (ar ? a : e);
    const [report, setReport] = useState(null);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const number = (value) => new Intl.NumberFormat(ar ? 'ar-EG' : 'en').format(Number(value ?? 0));
    const fmtDate = (d) => (d ? new Date(d).toLocaleString(ar ? 'ar-EG' : 'en', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

    const load = useCallback(() => api.get(`${apiBase}/email-campaigns/${campaignId}/report`)
        .then(({ data }) => { setReport(data.data); setError(''); })
        .catch((e) => setError(e.response?.data?.message || e.message)), [apiBase, campaignId]);
    useEffect(() => { void load(); }, [load]);
    // While sending, refresh the numbers every 15 seconds.
    useEffect(() => {
        if (!['sending', 'scheduled'].includes(report?.campaign?.status)) return undefined;
        const timer = setInterval(() => { void load(); }, 15000);
        return () => clearInterval(timer);
    }, [report?.campaign?.status, load]);

    const cancel = async () => {
        setBusy(true);
        try { await api.post(`${apiBase}/email-campaigns/${campaignId}/cancel`); toast.success(text('تم إلغاء الحملة', 'Campaign cancelled')); await load(); } catch (e) { toast.error(e.response?.data?.message || e.message); } finally { setBusy(false); }
    };

    if (error) return <section className="ws-catalog-page"><p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p></section>;
    if (!report) return <section className="ws-catalog-page" aria-busy="true"><p className="text-sm text-slate-500">{text('جارٍ التحميل…', 'Loading…')}</p></section>;
    const { campaign, metrics } = report;
    const tiles = [
        ['sent', text('تم الإرسال', 'Sent'), number(metrics.sent), metrics.recipients ? text(`من ${number(metrics.recipients)} مستلم`, `of ${number(metrics.recipients)} recipients`) : null],
        ['opened', text('الفتح', 'Opens'), number(metrics.opened), percent(metrics.open_rate, ar)],
        ['clicked', text('النقرات', 'Clicks'), number(metrics.clicked), percent(metrics.click_rate, ar)],
        ['unsubscribed', text('إلغاء الاشتراك', 'Unsubscribes'), number(metrics.unsubscribed), percent(metrics.unsubscribe_rate, ar)],
        ['failed', text('فشل الإرسال', 'Failed'), number(metrics.failed + metrics.bounced), metrics.bounced ? text(`${number(metrics.bounced)} مرتد`, `${number(metrics.bounced)} bounced`) : null],
        ['queued', text('في الانتظار', 'Waiting'), number(metrics.queued), metrics.skipped ? text(`${number(metrics.skipped)} تم تخطيه`, `${number(metrics.skipped)} skipped`) : null],
    ];

    return (
        <section className="ws-catalog-page">
            <header className="ws-catalog-heading">
                <div className="min-w-0">
                    <p><Link to={`${uiBase}/email-campaigns`} className="text-sm text-slate-600 hover:underline">← {text('حملات البريد', 'Email campaigns')}</Link></p>
                    <h1 className="break-words">{campaign.name}</h1>
                    <p className="flex flex-wrap items-center gap-2"><span className={`ws-dt-badge ${campaignStatusTone(campaign.status)}`}>{campaignStatusLabel(campaign.status, ar)}</span>
                        <span className="text-sm text-slate-600">{campaign.subject}</span></p>
                </div>
                <div className="ws-catalog-actions flex-wrap">
                    {['scheduled', 'sending'].includes(campaign.status) ? <button type="button" className="ws-dt-button" disabled={busy} onClick={() => void cancel()}>{text('إلغاء الحملة', 'Cancel campaign')}</button> : null}
                    {campaign.status === 'draft' ? <Link className="ws-dt-button ws-dt-button-primary" to={`${uiBase}/email-campaigns/${campaign.id}`}>{text('تعديل', 'Edit')}</Link> : null}
                </div>
            </header>

            <dl className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-3">
                {tiles.map(([key, label, value, sub]) => <div key={key} className={CARD} data-metric={key}>
                    <dt className="text-sm text-slate-600">{label}</dt>
                    <dd className="mt-1 text-2xl font-bold text-slate-900">{value}</dd>
                    {sub ? <dd className="text-xs text-slate-500">{sub}</dd> : null}
                </div>)}
            </dl>

            <section className={`${CARD} mt-4`} aria-labelledby="campaign-timeline">
                <h2 id="campaign-timeline" className="mb-3 text-base font-semibold text-slate-900">{text('التفاصيل', 'Details')}</h2>
                <dl className="grid gap-2 text-sm sm:grid-cols-2">
                    <div><dt className="text-slate-500">{text('موعد الإرسال', 'Scheduled for')}</dt><dd>{fmtDate(campaign.scheduled_at)}</dd></div>
                    <div><dt className="text-slate-500">{text('بدأ الإرسال', 'Started')}</dt><dd>{fmtDate(campaign.started_at)}</dd></div>
                    <div><dt className="text-slate-500">{text('اكتمل', 'Completed')}</dt><dd>{fmtDate(campaign.completed_at)}</dd></div>
                    {campaign.cancelled_at ? <div><dt className="text-slate-500">{text('أُلغيت', 'Cancelled')}</dt><dd>{fmtDate(campaign.cancelled_at)}</dd></div> : null}
                    {campaign.failure_reason === 'no_recipients' ? <div className="sm:col-span-2"><dt className="text-slate-500">{text('سبب الفشل', 'Why it failed')}</dt><dd>{text('لم يكن هناك مشتركون مؤهلون وقت الإرسال.', 'There were no eligible subscribers when sending started.')}</dd></div> : null}
                </dl>
                <p className="mt-3 text-xs text-slate-500">{text('تُحسب مرات الفتح من تحميل الصور، وقد تمنعها بعض برامج البريد؛ النقرات أدق.', 'Opens are counted from image loads, which some mail apps block; clicks are more reliable.')}</p>
            </section>
        </section>
    );
}
