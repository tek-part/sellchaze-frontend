import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    HiOutlineArrowLeft,
    HiOutlineArrowPath,
    HiOutlineBolt,
    HiOutlineCheckCircle,
    HiOutlineClock,
    HiOutlineDocumentArrowUp,
    HiOutlineExclamationTriangle,
    HiOutlineNoSymbol,
    HiOutlinePauseCircle,
    HiOutlinePlayCircle,
    HiOutlineStopCircle,
    HiOutlineTrash,
    HiOutlineUserGroup,
    HiOutlineXCircle,
} from 'react-icons/hi2';
import api from '../../api/client';

const PAGE_SIZE = 20;
const RING_R = 44;
const RING_C = 2 * Math.PI * RING_R;

function fmtDur(sec, empty) {
    if (sec == null || sec <= 0) return empty;
    const s = Math.floor(Number(sec));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${ss}s`;
    return `${ss}s`;
}

function statusColor(s) {
    switch (s) {
        case 'running': return 'bg-emerald-500/15 text-emerald-800 ring-1 ring-emerald-500/30';
        case 'paused': return 'bg-amber-500/15 text-amber-900 ring-1 ring-amber-500/35';
        case 'completed': return 'bg-sky-500/15 text-sky-800 ring-1 ring-sky-500/30';
        case 'cancelled': return 'bg-red-500/15 text-red-800 ring-1 ring-red-500/30';
        default: return 'bg-slate-500/10 text-slate-700 ring-1 ring-slate-500/20';
    }
}

function recipientStatusIcon(s) {
    switch (s) {
        case 'sent': return <HiOutlineCheckCircle className="h-4 w-4 text-emerald-500" />;
        case 'failed': return <HiOutlineXCircle className="h-4 w-4 text-red-500" />;
        case 'skipped': return <HiOutlineNoSymbol className="h-4 w-4 text-slate-400" />;
        case 'queued': return <HiOutlineClock className="h-4 w-4 text-sky-500" />;
        default: return <HiOutlineClock className="h-4 w-4 text-amber-400" />;
    }
}

function recipientStatusBg(s) {
    switch (s) {
        case 'sent': return 'bg-emerald-50 text-emerald-800';
        case 'failed': return 'bg-red-50 text-red-800';
        case 'skipped': return 'bg-slate-100 text-slate-600';
        case 'queued': return 'bg-sky-50 text-sky-800';
        default: return 'bg-amber-50 text-amber-800';
    }
}

export default function WavexCampaignDetailPage() {
    const { id } = useParams();
    const { t, i18n } = useTranslation();
    const { permissions } = useOutletContext();
    const navigate = useNavigate();
    const can = (p) => permissions.includes(p);

    const [campaign, setCampaign] = useState(null);
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [tick, setTick] = useState(0);
    const [qSnap, setQSnap] = useState({ at: Date.now(), seconds: 0, iso: null });
    const [filter, setFilter] = useState('all');

    const fetch_ = useCallback(async () => {
        setErr('');
        try {
            const { data } = await api.get(`/wavex/campaigns/${id}`, { params: { _t: Date.now() }, headers: { 'Cache-Control': 'no-cache' } });
            setCampaign(data?.data ?? data);
        } catch (e) { setErr(e.response?.data?.message || e.message); setCampaign(null); }
        finally { setLoading(false); }
    }, [id]);

    useEffect(() => { setLoading(true); }, [id]);
    useEffect(() => { if (!can('wavex-access') || !id) return; void fetch_(); }, [fetch_, id, permissions]);

    const qp = campaign?.queue_progress;
    useEffect(() => { if (!qp) return; setQSnap({ at: Date.now(), seconds: Math.max(0, Number(qp.seconds_until_next_job) || 0), iso: qp.next_job_available_at || null }); }, [qp?.seconds_until_next_job, qp?.next_job_available_at, qp?.pending_recipients]);
    useEffect(() => { const i = setInterval(() => setTick((x) => x + 1), 1000); return () => clearInterval(i); }, []);
    useEffect(() => { const onVis = () => { if (document.visibilityState === 'visible' && can('wavex-access') && id) void fetch_(); }; document.addEventListener('visibilitychange', onVis); return () => document.removeEventListener('visibilitychange', onVis); }, [fetch_, id, permissions]);
    useEffect(() => { if (!campaign || (campaign.status !== 'running' && campaign.status !== 'paused')) return; void fetch_(); const ms = () => { const h = document.visibilityState === 'hidden'; return campaign.status === 'running' ? (h ? 3000 : 400) : (h ? 5000 : 3000); }; let tid; const run = () => { void fetch_(); tid = setTimeout(run, ms()); }; tid = setTimeout(run, ms()); const onV = () => { clearTimeout(tid); void fetch_(); tid = setTimeout(run, ms()); }; document.addEventListener('visibilitychange', onV); return () => { clearTimeout(tid); document.removeEventListener('visibilitychange', onV); }; }, [campaign?.status, fetch_]);

    const action = async (path) => { setErr(''); try { const { data } = await api.post(`/wavex/campaigns/${id}${path}`); setCampaign(data?.data ?? data); } catch (e) { setErr(e.response?.data?.message || e.message); } };
    const start = () => action('/start');
    const pause = () => action('/pause');
    const resume = () => action('/resume');
    const retryFailed = () => action('/retry-failed');
    const cancelCamp = () => action('/cancel');
    const skip = (rid) => action(`/recipients/${rid}/skip`);
    const deleteCamp = async () => { if (!confirm(t('wavex_campaign_confirm_delete'))) return; setErr(''); try { await api.delete(`/wavex/campaigns/${id}`); navigate('/wavex/campaigns'); } catch (e) { setErr(e.response?.data?.message || e.message); } };
    const onCsv = async (e) => { const f = e.target.files?.[0]; if (!f) return; setErr(''); try { const fd = new FormData(); fd.append('file', f); await api.post(`/wavex/campaigns/${id}/import-csv`, fd); await fetch_(); } catch (e2) { setErr(e2.response?.data?.message || e2.message); } e.target.value = ''; };

    const sorted = useMemo(() => {
        const list = campaign?.recipients || [];
        return [...list].sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0) || (Number(a.id) || 0) - (Number(b.id) || 0));
    }, [campaign?.recipients]);

    const filtered = useMemo(() => filter === 'all' ? sorted : sorted.filter((r) => r.status === filter), [sorted, filter]);
    const { pendingIdx, firstPendingId } = useMemo(() => { const m = new Map(); let fp = null; let i = 0; for (const r of sorted) { if (r.status === 'pending') { if (!fp) fp = r.id; m.set(r.id, i++); } } return { pendingIdx: m, firstPendingId: fp }; }, [sorted]);

    const totalR = filtered.length;
    const lastPage = Math.max(1, Math.ceil(totalR / PAGE_SIZE));
    useEffect(() => { setPage((p) => Math.min(p, lastPage)); }, [lastPage]);
    const paged = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

    const stats = useMemo(() => {
        if (!campaign) return { total: 0, sent: 0, queued: 0, failed: 0, skipped: 0, pending: 0, pct: 0, done: 0 };
        const total = Number(campaign.total_recipients) || 0;
        const sent = Number(campaign.sent_count) || 0;
        const queued = Number(campaign.queued_count) || 0;
        const failed = Number(campaign.failed_count) || 0;
        const skipped = sorted.filter((r) => r.status === 'skipped').length;
        const pending = sorted.filter((r) => r.status === 'pending').length;
        const done = sent + failed + skipped;
        const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
        return { total, sent, queued, failed, skipped, pending, pct, done };
    }, [campaign, sorted]);

    const isRunning = campaign?.status === 'running';
    const isPaused = campaign?.status === 'paused';
    const isActive = isRunning || isPaused;
    const hasQueued = stats.queued > 0;
    const delay = Number(campaign?.delay_seconds) || 500;

    const liveNext = useMemo(() => {
        if (!isRunning || !qp) return null;
        if (qSnap.iso) { const ms = Date.parse(qSnap.iso); if (Number.isFinite(ms)) return Math.max(0, Math.ceil((ms - Date.now()) / 1000)); }
        return Math.max(0, qSnap.seconds - Math.floor((Date.now() - qSnap.at) / 1000));
    }, [isRunning, qp, qSnap, tick]);

    const sendInLabel = (r) => {
        if (r.status === 'queued') return t('wavex_campaign_queued');
        if (r.status === 'sent') return null;
        if (r.status === 'failed') return null;
        if (r.status === 'skipped') return null;
        if (r.status !== 'pending') return null;
        const k = pendingIdx.get(r.id);
        if (k == null) return '—';
        if (isRunning && liveNext != null) return fmtDur(k === 0 ? liveNext : liveNext + k * delay, '0s');
        if (isPaused) return fmtDur((Number(qp?.seconds_until_next_job) || 0) + k * delay, '—');
        const estSec = k * delay;
        if (estSec > 0) return `~${fmtDur(estSec, '—')}`;
        return '—';
    };

    const etaLabel = useMemo(() => { const iso = qp?.estimated_completion_at; if (!iso) return '—'; try { return new Date(iso).toLocaleString(i18n.language?.startsWith('ar') ? 'ar' : undefined, { dateStyle: 'medium', timeStyle: 'short' }); } catch { return '—'; } }, [qp?.estimated_completion_at, i18n.language]);

    if (!can('wavex-access')) return <Navigate to="/dashboard" replace />;
    if (loading && !campaign) return <div className="flex min-h-[40vh] items-center justify-center"><HiOutlineArrowPath className="h-8 w-8 animate-spin text-brand" /></div>;
    if (!campaign) return <div className="mx-auto max-w-lg space-y-4 text-center"><p className="text-red-600">{err || t('empty')}</p><Link to="/wavex/campaigns" className="text-brand underline">{t('wavex_nav_campaigns')}</Link></div>;

    const nextIn = isRunning && liveNext != null ? fmtDur(liveNext, '0s') : fmtDur(qp?.seconds_until_next_job ?? 0, '0s');

    return (
        <div className="mx-auto max-w-5xl space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link to="/wavex/campaigns" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand">
                        <HiOutlineArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-slate-900">{campaign.name}</h1>
                            <span className={['inline-flex rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wide', statusColor(campaign.status)].join(' ')}>
                                {campaign.status}
                            </span>
                        </div>
                        <p className="mt-0.5 text-sm text-slate-500">#{campaign.id} &middot; {t('wavex_campaign_delay')}: {delay}s</p>
                    </div>
                </div>
                {!isActive && (
                    <button type="button" onClick={deleteCamp} className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100">
                        <HiOutlineTrash className="h-4 w-4" /> {t('wavex_cg_delete')}
                    </button>
                )}
            </div>

            {err && <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</p>}

            {/* Progress + Ring */}
            <div className="grid gap-6 lg:grid-cols-[1fr_200px] lg:items-center">
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
                    <div className="flex items-end justify-between">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{t('wavex_campaign_detail_track')}</h2>
                        <span className="text-sm font-bold text-slate-800">{stats.pct}%</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-200/80">
                        <motion.div className="h-full rounded-full bg-linear-to-r from-brand via-emerald-500 to-teal-500" initial={false} animate={{ width: `${stats.pct}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {(isRunning || hasQueued) && (
                            <div className="flex items-center gap-3 rounded-xl border border-brand/20 bg-brand/5 px-4 py-3">
                                <HiOutlineBolt className={`h-5 w-5 text-brand ${isRunning ? 'animate-pulse' : ''}`} />
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-brand/70">
                                        {isRunning ? t('wavex_campaign_next_in') : t('wavex_campaign_queued')}
                                    </p>
                                    <p className="text-xl font-black tabular-nums text-brand-dark">
                                        {isRunning ? nextIn : `${stats.queued} ${t('wavex_campaign_queued')}`}
                                    </p>
                                </div>
                            </div>
                        )}
                        <div className={['flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3', (isRunning || hasQueued) ? '' : 'sm:col-span-2'].join(' ')}>
                            <HiOutlineClock className="h-5 w-5 text-slate-400" />
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{t('wavex_campaign_eta')}</p>
                                <p className="text-lg font-bold tabular-nums text-slate-900">
                                    {fmtDur(qp?.estimated_remaining_seconds, null) || (stats.pending > 0 ? fmtDur(stats.pending * delay, '—') : '—')}
                                </p>
                                <p className="text-[10px] text-slate-500">{etaLabel}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="relative mx-auto flex h-[180px] w-[180px] items-center justify-center">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                        <defs><linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#10b981" /></linearGradient></defs>
                        <circle cx="50" cy="50" r={RING_R} fill="none" stroke="#e2e8f0" strokeWidth="7" />
                        <motion.circle cx="50" cy="50" r={RING_R} fill="none" stroke="url(#rg)" strokeWidth="7" strokeLinecap="round" strokeDasharray={RING_C} initial={false} animate={{ strokeDashoffset: RING_C * (1 - stats.pct / 100) }} transition={{ type: 'spring', stiffness: 100, damping: 22 }} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black tabular-nums text-slate-900">{stats.pct}%</span>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{stats.done}/{stats.total}</span>
                    </div>
                </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {[
                    { label: t('wavex_campaign_total'), value: stats.total, color: 'text-slate-900', icon: <HiOutlineUserGroup className="h-4 w-4" /> },
                    { label: t('wavex_campaign_sent'), value: stats.sent, color: 'text-emerald-600', icon: <HiOutlineCheckCircle className="h-4 w-4" /> },
                    { label: t('wavex_campaign_queued'), value: stats.queued, color: 'text-sky-700', icon: <HiOutlineClock className="h-4 w-4" /> },
                    { label: t('wavex_campaign_failed'), value: stats.failed, color: 'text-red-600', icon: <HiOutlineXCircle className="h-4 w-4" /> },
                    { label: t('wavex_campaign_skipped'), value: stats.skipped, color: 'text-slate-500', icon: <HiOutlineNoSymbol className="h-4 w-4" /> },
                    { label: t('wavex_campaign_pending'), value: stats.pending, color: 'text-amber-600', icon: <HiOutlineExclamationTriangle className="h-4 w-4" /> },
                ].map((s) => (
                    <div key={s.label} className="rounded-xl border border-slate-200/80 bg-white px-3 py-3 text-center shadow-xs">
                        <div className={`mx-auto mb-1 flex h-6 w-6 items-center justify-center ${s.color}`}>{s.icon}</div>
                        <p className={`text-xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
                        <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
                <button type="button" onClick={start} disabled={isRunning || isPaused || stats.pending === 0} className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-brand-dark disabled:opacity-40">
                    <HiOutlinePlayCircle className="h-5 w-5" /> {t('wavex_campaign_start')}
                </button>
                <button type="button" onClick={pause} disabled={!isRunning} className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-40">
                    <HiOutlinePauseCircle className="h-5 w-5" /> {t('wavex_campaign_pause')}
                </button>
                <button type="button" onClick={resume} disabled={!isPaused} className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-40">
                    <HiOutlinePlayCircle className="h-5 w-5" /> {t('wavex_campaign_resume')}
                </button>
                <button type="button" onClick={retryFailed} disabled={isRunning || stats.failed === 0} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-40">
                    <HiOutlineArrowPath className="h-5 w-5" /> {t('wavex_campaign_retry_failed')}
                </button>
                <button type="button" onClick={cancelCamp} disabled={!isActive} className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-40">
                    <HiOutlineStopCircle className="h-5 w-5" /> {t('wavex_campaign_cancel')}
                </button>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-xs hover:bg-slate-50">
                    <HiOutlineDocumentArrowUp className="h-5 w-5" /> {t('wavex_campaign_import_csv')}
                    <input type="file" accept=".csv,.txt" className="hidden" onChange={onCsv} />
                </label>
            </div>

            {campaign.last_error && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
                    <span className="font-semibold">{t('wavex_campaign_last_error')}:</span> {campaign.last_error}
                </div>
            )}

            {/* Recipients table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                    <h2 className="font-semibold text-slate-800">{t('wavex_campaign_recipients_table')}</h2>
                    <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs">
                        {['all', 'pending', 'sent', 'failed', 'skipped'].map((f) => (
                            <button key={f} type="button" onClick={() => { setFilter(f); setPage(1); }}
                                className={['rounded-md px-2.5 py-1 font-medium transition-colors', filter === f ? 'bg-white text-brand shadow-xs' : 'text-slate-500 hover:text-slate-700'].join(' ')}>
                                {f === 'all' ? t('wavex_campaign_total') : t(`wavex_campaign_${f}`)}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="max-h-[min(60vh,36rem)] overflow-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 z-10 bg-slate-50/95 text-xs uppercase tracking-wide text-slate-500 backdrop-blur-sm">
                            <tr>
                                <th className="w-10 px-4 py-3 text-center">#</th>
                                <th className="px-4 py-3">{t('col_name')}</th>
                                <th className="px-4 py-3">{t('order_customer_phone')}</th>
                                <th className="px-4 py-3">{t('wavex_campaign_send_in')}</th>
                                <th className="px-4 py-3">{t('col_status')}</th>
                                <th className="w-20 px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paged.map((r, idx) => {
                                const isCurrent = r.id === firstPendingId && isRunning;
                                const si = sendInLabel(r);
                                return (
                                    <tr key={r.id} className={[
                                        'transition-colors',
                                        isCurrent ? 'bg-brand/6 ring-1 ring-inset ring-brand/20' : 'hover:bg-slate-50/80',
                                    ].join(' ')}>
                                        <td className="px-4 py-2.5 text-center text-xs text-slate-400">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                                        <td className="px-4 py-2.5">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-slate-800">{r.display_name || '—'}</span>
                                                {isCurrent && <span className="animate-pulse rounded-sm bg-brand/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand-dark">{t('wavex_campaign_sending_now')}</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{r.phone}</td>
                                        <td className="px-4 py-2.5">
                                            {si ? <span className="font-mono text-xs font-semibold tabular-nums text-slate-700">{si}</span> : <span className="text-slate-300">—</span>}
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <span className={['inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium', recipientStatusBg(r.status)].join(' ')}>
                                                {recipientStatusIcon(r.status)}
                                                {r.status}
                                            </span>
                                            {r.status === 'sent' && r.sent_at && (
                                                <p className="mt-0.5 text-[10px] tabular-nums text-emerald-600">
                                                    {new Date(r.sent_at).toLocaleString(i18n.language?.startsWith('ar') ? 'ar' : undefined, { timeStyle: 'medium', dateStyle: 'short' })}
                                                </p>
                                            )}
                                            {r.status === 'failed' && r.error_message && (
                                                <p className="mt-0.5 max-w-[200px] truncate text-[10px] text-red-500" title={r.error_message}>{r.error_message}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-2.5 text-end">
                                            {r.status === 'pending' ? (
                                                <button type="button" onClick={() => skip(r.id)} className="text-xs font-medium text-red-600 hover:underline">{t('wavex_campaign_skip_number')}</button>
                                            ) : null}
                                        </td>
                                    </tr>
                                );
                            })}
                            {paged.length === 0 && (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">{t('empty')}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {totalR > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/90 px-4 py-3">
                        <p className="text-xs text-slate-500">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalR)} / {totalR}</p>
                        <div className="flex items-center gap-1.5">
                            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-40">{t('table_prev')}</button>
                            <span className="text-xs text-slate-500">{page}/{lastPage}</span>
                            <button type="button" disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-40">{t('table_next')}</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
