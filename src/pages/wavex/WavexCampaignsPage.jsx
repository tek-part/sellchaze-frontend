import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    HiOutlineArrowPath,
    HiOutlineCheckCircle,
    HiOutlineClock,
    HiOutlineExclamationTriangle,
    HiOutlineEye,
    HiOutlineMegaphone,
    HiOutlinePaperAirplane,
    HiOutlinePlus,
    HiOutlineServerStack,
    HiOutlineSignal,
    HiOutlineTrash,
    HiOutlineXCircle,
} from '../../components/workspace/WorkspaceIcons';
import { IndexTable, useIndexTable } from '../../components/data-table';
import api from '../../api/client';
import { getPaginatedRows } from '../../utils/apiPagination';

/* ────────── helpers ────────── */
const STATUS_TONES = { running: 'is-success', paused: 'is-warning', completed: 'is-info', cancelled: 'is-critical' };
// The campaigns endpoint pages by 20 and has no search, filter or sort parameters.
const LIST_DEFAULTS = { perPage: 20, perPageOptions: [20] };
const NO_FILTERS = [];
const NO_VIEWS = [];

/* ═══════════════════════════════════════════════════════════════
   Queue Status Dashboard Component
   ═══════════════════════════════════════════════════════════════ */
function QueueStatusDashboard({ t }) {
    const [qs, setQs] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');

    const fetch = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        setErr('');
        try {
            const { data } = await api.get('/wavex/campaigns/queue-status');
            setQs(data.data ?? data);
        } catch (e) {
            setErr(e.response?.data?.message || e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetch();
        const iv = setInterval(() => void fetch(true), 15000); // refresh every 15s silently
        return () => clearInterval(iv);
    }, [fetch]);

    if (loading && !qs) {
        return (
            <div className="mb-6 animate-pulse rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
                <div className="h-5 w-48 rounded-sm bg-slate-200" />
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-20 rounded-xl bg-slate-100" />
                    ))}
                </div>
            </div>
        );
    }

    if (err && !qs) {
        return (
            <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                {t('wavex_queue_load_error')}: {err}
            </div>
        );
    }

    if (!qs) return null;

    const workerOk = Boolean(qs.worker_active);
    const stats = qs.stats && typeof qs.stats === 'object' ? qs.stats : {};
    const sentN = Number(stats.sent) || 0;
    const failedN = Number(stats.failed) || 0;
    const totalProcessed = sentN + failedN;
    const successRate = totalProcessed > 0 ? Math.round((sentN / totalProcessed) * 100) : 100;

    const cards = [
        {
            key: 'worker',
            label: t('wavex_queue_worker'),
            value: workerOk ? t('wavex_queue_worker_active') : t('wavex_queue_worker_down'),
            icon: workerOk ? HiOutlineSignal : HiOutlineExclamationTriangle,
            color: workerOk
                ? 'from-emerald-500 to-green-600 text-white'
                : 'from-red-500 to-rose-600 text-white',
            ring: workerOk ? 'ring-emerald-200' : 'ring-red-200',
            sub: workerOk
                ? `${qs.running_campaigns || 0} ${t('wavex_queue_running')}`
                : t('wavex_queue_worker_check'),
            pulse: !workerOk,
        },
        {
            key: 'sent',
            label: t('wavex_queue_total_sent'),
            value: sentN.toLocaleString(),
            icon: HiOutlinePaperAirplane,
            color: 'from-emerald-50 to-green-50 text-emerald-700',
            ring: 'ring-emerald-100',
            sub: `${successRate}% ${t('wavex_queue_success_rate')}`,
        },
        {
            key: 'failed',
            label: t('wavex_queue_total_failed'),
            value: failedN.toLocaleString(),
            icon: HiOutlineXCircle,
            color: stats.failed > 0 ? 'from-red-50 to-rose-50 text-red-700' : 'from-slate-50 to-gray-50 text-slate-600',
            ring: stats.failed > 0 ? 'ring-red-100' : 'ring-slate-100',
            sub: qs.failed_jobs > 0 ? `${qs.failed_jobs} ${t('wavex_queue_failed_jobs')}` : t('wavex_queue_no_failures'),
            pulse: stats.failed > 0,
        },
        {
            key: 'pending',
            label: t('wavex_queue_total_pending'),
            value: stats.pending?.toLocaleString() ?? 0,
            icon: HiOutlineClock,
            color: stats.pending > 0 ? 'from-amber-50 to-yellow-50 text-amber-700' : 'from-slate-50 to-gray-50 text-slate-600',
            ring: stats.pending > 0 ? 'ring-amber-100' : 'ring-slate-100',
            sub: `${stats.queued ?? 0} ${t('wavex_queue_in_queue')}`,
            tooltip: t('wavex_queue_tooltip_pending'),
        },
        {
            key: 'queued_jobs',
            label: t('wavex_queue_jobs_in_queue'),
            value: qs.pending_jobs?.toLocaleString() ?? 0,
            icon: HiOutlineServerStack,
            color: qs.pending_jobs > 0 ? 'from-indigo-50 to-blue-50 text-indigo-700' : 'from-slate-50 to-gray-50 text-slate-600',
            ring: qs.pending_jobs > 0 ? 'ring-indigo-100' : 'ring-slate-100',
            sub: `${qs.active_campaigns ?? 0} ${t('wavex_queue_active_campaigns')}`,
            tooltip: t('wavex_queue_tooltip_jobs'),
        },
        {
            key: 'total',
            label: t('wavex_queue_grand_total'),
            value: stats.total?.toLocaleString() ?? 0,
            icon: HiOutlineCheckCircle,
            color: 'from-sky-50 to-blue-50 text-sky-700',
            ring: 'ring-sky-100',
            sub: `${stats.skipped ?? 0} ${t('wavex_queue_skipped')}`,
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-2xl border border-slate-200/80 bg-white shadow-card overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-linear-to-r from-slate-50 to-white px-5 py-3">
                <div className="flex items-center gap-2.5">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${workerOk ? 'bg-emerald-100' : 'bg-red-100'}`}>
                        <HiOutlineServerStack className={`h-4.5 w-4.5 ${workerOk ? 'text-emerald-600' : 'text-red-600'}`} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800">{t('wavex_queue_dashboard_title')}</h3>
                        <p className="text-[11px] text-slate-400">{t('wavex_queue_dashboard_subtitle')}</p>
                        <p className="mt-1 max-w-xl text-[10px] leading-snug text-slate-500">{t('wavex_queue_laravel_note')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Live indicator */}
                    <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-500">
                        <span className={`h-1.5 w-1.5 rounded-full ${workerOk ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                        {workerOk ? t('wavex_queue_live') : t('wavex_queue_offline')}
                    </span>
                    <button
                        type="button"
                        onClick={() => void fetch()}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                        title={t('wavex_groups_reload')}
                    >
                        <HiOutlineArrowPath className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {qs.queue_connection === 'sync' && (
                <div className="border-b border-amber-100 bg-amber-50 px-5 py-2.5 text-[11px] leading-snug text-amber-900">
                    {t('wavex_queue_sync_warning')}
                </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-slate-100 bg-slate-50/50 px-5 py-2 text-[11px] text-slate-600">
                <span>
                    <span className="font-semibold text-slate-700">{t('wavex_queue_last_sent')}:</span>{' '}
                    {qs.last_sent_at
                        ? new Date(qs.last_sent_at).toLocaleString(undefined, {
                              dateStyle: 'short',
                              timeStyle: 'medium',
                          })
                        : t('wavex_queue_last_sent_never')}
                </span>
                {qs.queue_connection != null && qs.queue_connection !== '' && (
                    <span className="tabular-nums text-slate-500">
                        QUEUE_CONNECTION=<span className="font-mono text-slate-700">{qs.queue_connection}</span>
                    </span>
                )}
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-6">
                {cards.map((c) => {
                    const Icon = c.icon;
                    return (
                        <div
                            key={c.key}
                            title={c.tooltip || undefined}
                            className={`relative cursor-default overflow-hidden rounded-xl bg-linear-to-br ${c.color} ring-1 ${c.ring} p-3.5 transition-all hover:shadow-md`}
                        >
                            {c.pulse && (
                                <span className="absolute top-2 inset-e-2 h-2 w-2 rounded-full bg-current opacity-60 animate-ping" />
                            )}
                            <div className="flex items-start justify-between">
                                <Icon className="h-5 w-5 opacity-70" />
                                <span className="text-xl font-extrabold leading-none tabular-nums">{c.value}</span>
                            </div>
                            <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider opacity-80">{c.label}</p>
                            <p className="mt-0.5 text-[10px] opacity-60">{c.sub}</p>
                        </div>
                    );
                })}
            </div>

            {/* Progress bar */}
            {Number(stats.total) > 0 && (
                <div className="border-t border-slate-100 px-5 py-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                        <span>{t('wavex_queue_overall_progress')}</span>
                        <span className="font-semibold tabular-nums">
                            {totalProcessed} / {stats.total} ({Number(stats.total) > 0 ? Math.round((totalProcessed / Number(stats.total)) * 100) : 0}%)
                        </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="flex h-full">
                            {/* Sent (green) */}
                            <div
                                className="h-full bg-linear-to-r from-emerald-400 to-emerald-500 transition-all duration-700"
                                style={{ width: `${Number(stats.total) > 0 ? (sentN / Number(stats.total)) * 100 : 0}%` }}
                            />
                            {/* Failed (red) */}
                            <div
                                className="h-full bg-linear-to-r from-red-400 to-red-500 transition-all duration-700"
                                style={{ width: `${Number(stats.total) > 0 ? (failedN / Number(stats.total)) * 100 : 0}%` }}
                            />
                            {/* Skipped (gray) */}
                            <div
                                className="h-full bg-linear-to-r from-slate-300 to-slate-400 transition-all duration-700"
                                style={{ width: `${Number(stats.total) > 0 ? ((Number(stats.skipped) || 0) / Number(stats.total)) * 100 : 0}%` }}
                            />
                        </div>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> {t('wavex_campaign_sent')}</span>
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> {t('wavex_campaign_failed')}</span>
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" /> {t('wavex_campaign_pending')}</span>
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-indigo-400" /> {t('wavex_campaign_queued')}</span>
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-400" /> {t('wavex_queue_skipped')}</span>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   Main Campaigns Page
   ═══════════════════════════════════════════════════════════════ */
export default function WavexCampaignsPage() {
    const { t } = useTranslation();
    const outlet = useOutletContext();
    const permissions = Array.isArray(outlet?.permissions) ? outlet.permissions : [];

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadErr, setLoadErr] = useState('');
    const [err, setErr] = useState('');
    const [busy, setBusy] = useState(false);
    const latest = useRef(0);
    // Row actions call the latest handler (it depends on the current page).
    const removeOne = useRef(null);

    const canAccessWavex = permissions.includes('wavex-access');

    const columns = useMemo(() => [
        { key: 'name', header: t('wavex_campaign_name'), primary: true, hideable: false,
            render: (row) => {
                const pct = row.total_recipients > 0 ? Math.round(((row.sent_count || 0) / row.total_recipients) * 100) : 0;
                return <div>
                    <Link to={`/wavex/campaigns/${row.id}`} className="ws-dt-title">{row.name}</Link>
                    <div className="mt-1 flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={t('wavex_campaign_sent')}>
                            <div className="h-full rounded-full bg-linear-to-r from-brand to-emerald-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] font-medium text-slate-500">{pct}%</span>
                    </div>
                </div>;
            } },
        { key: 'status', header: t('wavex_campaign_status'), render: (row) => <span className={`ws-dt-badge capitalize ${STATUS_TONES[row.status] ?? ''}`}>{row.status}</span> },
        { key: 'total', header: t('wavex_campaign_total'), align: 'end', render: (row) => <span className="ws-dt-num">{row.total_recipients ?? 0}</span> },
        { key: 'sent', header: t('wavex_campaign_sent'), align: 'end', render: (row) => <span className="ws-dt-num text-emerald-700">{row.sent_count ?? 0}</span> },
        { key: 'failed', header: t('wavex_campaign_failed'), align: 'end', render: (row) => <span className="ws-dt-num text-red-600">{row.failed_count ?? 0}</span> },
        { key: 'pending', header: t('wavex_campaign_pending'), align: 'end',
            render: (row) => <span className="ws-dt-num text-amber-600">{(row.total_recipients || 0) - (row.sent_count || 0) - (row.failed_count || 0) - (row.queued_count || 0)}</span> },
        { key: 'actions', header: t('wavex_cg_actions'), hideable: false, align: 'end',
            render: (row) => <div className="ws-dt-row-actions">
                <Link className="ws-dt-icon" to={`/wavex/campaigns/${row.id}`} title={t('wavex_campaign_open')} aria-label={`${t('wavex_campaign_open')} ${row.name}`}><HiOutlineEye aria-hidden /></Link>
                <button type="button" className="ws-dt-icon" onClick={() => void removeOne.current?.(row.id)} disabled={busy || row.status === 'running'} title={t('wavex_cg_delete')} aria-label={`${t('wavex_cg_delete')} ${row.name}`}><HiOutlineTrash aria-hidden /></button>
            </div> },
    ], [t, busy]);
    const table = useIndexTable({ scope: 'wavex:campaigns', filters: NO_FILTERS, columns, views: NO_VIEWS, defaults: LIST_DEFAULTS, savedViews: false });
    const page = table.state.page;

    const load = useCallback(async () => {
        const request = ++latest.current;
        setLoadErr('');
        setLoading(true);
        try {
            const { data } = await api.get('/wavex/campaigns', { params: { page } });
            if (request === latest.current) setResult(data);
        } catch (e) {
            if (request === latest.current) { setLoadErr(e.response?.data?.message || e.message); setResult(null); }
        } finally {
            if (request === latest.current) setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        if (!canAccessWavex) return;
        void load();
    }, [load, canAccessWavex]);

    const reload = async () => {
        table.clearSelection();
        await load();
    };

    useEffect(() => { removeOne.current = deleteCampaign; });

    async function deleteCampaign(id) {
        if (!confirm(t('wavex_campaign_confirm_delete'))) return;
        setBusy(true);
        setErr('');
        try {
            await api.delete(`/wavex/campaigns/${id}`);
            await reload();
        } catch (e) {
            setErr(e.response?.data?.message || e.message);
        } finally {
            setBusy(false);
        }
    }

    async function bulkDelete(ids) {
        if (ids.length === 0) return;
        if (!confirm(t('wavex_campaign_confirm_bulk_delete', { count: ids.length }))) return;
        setBusy(true);
        setErr('');
        try {
            await api.post('/wavex/campaigns/bulk-destroy', { ids });
            await reload();
        } catch (e) {
            setErr(e.response?.data?.message || e.message);
        } finally {
            setBusy(false);
        }
    }

    if (!canAccessWavex) return <Navigate to="/dashboard" replace />;

    const rows = getPaginatedRows(result);
    const createLink = (
        <Link
            to="/wavex/campaigns/new"
            className="inline-flex items-center gap-1 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
            <HiOutlinePlus className="h-4 w-4" />
            {t('wavex_campaigns_new_cta')}
        </Link>
    );

    return (
        <div className="w-full max-w-none space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="border-s-4 border-brand ps-4">
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                        <HiOutlineMegaphone className="h-8 w-8 text-brand" aria-hidden />
                        {t('wavex_campaigns_title')}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">{t('wavex_campaigns_subtitle_delay')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => void reload()}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                        <HiOutlineArrowPath className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                        {t('wavex_groups_reload')}
                    </button>
                    {createLink}
                </div>
            </div>

            {/* ── Queue Status Dashboard ── */}
            <QueueStatusDashboard t={t} />

            {err && (
                <p role="alert" className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>
            )}

            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="ws-dt-card">
                <IndexTable
                    table={table}
                    rows={rows}
                    loading={loading}
                    error={loadErr}
                    onRetry={() => void reload()}
                    meta={result ? { total: result.total ?? rows.length, last_page: result.last_page ?? 1 } : undefined}
                    label={t('wavex_campaigns_title')}
                    rowHref={(row) => `/wavex/campaigns/${row.id}`}
                    bulkActions={[{ key: 'delete', label: t('wavex_cg_delete_selected'), icon: HiOutlineTrash, tone: 'danger', disabled: () => busy, onAction: (selected) => void bulkDelete(selected.map((row) => row.id)) }]}
                    emptyState={{ icon: HiOutlineMegaphone, title: t('empty'), action: createLink }}
                />
            </motion.div>
        </div>
    );
}
