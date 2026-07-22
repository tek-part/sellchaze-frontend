import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    HiOutlineArchiveBox,
    HiOutlineArrowPath,
    HiOutlineCheckCircle,
    HiOutlineClock,
    HiOutlineComputerDesktop,
    HiOutlineDevicePhoneMobile,
    HiOutlineGlobeAlt,
    HiOutlineXCircle,
} from 'react-icons/hi2';
import api from '../api/client';

const EMPTY_STATS = {
    active_total: 0,
    active_staff: 0,
    active_suppliers: 0,
    active_merchants: 0,
    active_customers: 0,
    by_bucket: {
        admin: 0,
        manager: 0,
        staff: 0,
        supplier: 0,
        merchant: 0,
        customer: 0,
        mixed: 0,
    },
    by_role: {},
};

export default function MonitoringLivePage() {
    const { t } = useTranslation();
    const { isAdmin, permissions } = useOutletContext();
    const canView = isAdmin || permissions.includes('monitoring-live-view');
    const [rows, setRows] = useState([]);
    const [stats, setStats] = useState(EMPTY_STATS);
    const [meta, setMeta] = useState({ available_roles: [], available_buckets: [] });
    const [minutes, setMinutes] = useState(15);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState([]);
    const [bucket, setBucket] = useState('');
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');
    const [nowMs, setNowMs] = useState(Date.now());

    const load = useCallback(async () => {
        if (!canView) return;
        setLoading(true);
        try {
            const params = { active_within_minutes: minutes };
            const q = search.trim();
            if (q) params.search = q;
            if (bucket) params.bucket = bucket;
            if (roleFilter.length > 0) params.roles = roleFilter.join(',');

            const { data } = await api.get('/admin/monitoring/live', { params });
            setRows(data.data ?? []);
            const st = data.stats ?? {};
            setStats({
                ...EMPTY_STATS,
                ...st,
                by_bucket: { ...EMPTY_STATS.by_bucket, ...(st.by_bucket || {}) },
                by_role: { ...(st.by_role || {}) },
            });
            if (data.meta) {
                setMeta((m) => ({
                    available_roles: data.meta.available_roles ?? m.available_roles,
                    available_buckets: data.meta.available_buckets ?? m.available_buckets,
                }));
            }
            setErr('');
        } catch (e) {
            setErr(e.response?.data?.message || e.message);
        } finally {
            setLoading(false);
        }
    }, [canView, minutes, search, bucket, roleFilter]);

    useEffect(() => {
        void load();
    }, [load]);

    useEffect(() => {
        if (!canView) return undefined;
        const id = setInterval(() => {
            void load();
        }, 45000);

        return () => clearInterval(id);
    }, [canView, load]);

    useEffect(() => {
        const id = setInterval(() => setNowMs(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    const sorted = useMemo(() => {
        return [...rows].sort((a, b) => {
            const at = new Date(a.session?.last_used_at || 0).getTime();
            const bt = new Date(b.session?.last_used_at || 0).getTime();
            return bt - at;
        });
    }, [rows]);
    const activeRows = useMemo(() => sorted.filter((row) => Boolean(row?.session?.active_now)), [sorted]);
    const inactiveRows = useMemo(() => sorted.filter((row) => !row?.session?.active_now), [sorted]);

    const byBucket = stats.by_bucket || EMPTY_STATS.by_bucket;
    const bucketOrder = ['admin', 'manager', 'staff', 'supplier', 'merchant', 'customer', 'mixed'];

    if (!canView) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-s-4 border-brand ps-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('monitoring_live_title')}</h1>
                    <p className="mt-1 text-sm text-slate-500">{t('monitoring_live_subtitle', { minutes })}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        to="/admin/monitoring/sessions"
                        className="inline-flex h-10 items-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        <HiOutlineArchiveBox className="h-4 w-4" />
                        {t('monitoring_view_all_sessions')}
                    </Link>
                    <select
                        value={minutes}
                        onChange={(e) => setMinutes(Number(e.target.value) || 15)}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    >
                        <option value={5}>5m</option>
                        <option value={10}>10m</option>
                        <option value={15}>15m</option>
                        <option value={30}>30m</option>
                        <option value={60}>60m</option>
                    </select>
                    <button
                        type="button"
                        onClick={() => void load()}
                        disabled={loading}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        title={t('monitoring_live_refresh')}
                        aria-label={t('monitoring_live_refresh')}
                    >
                        <HiOutlineArrowPath className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{t('monitoring_filters_title')}</p>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <div className="min-w-0 md:col-span-2">
                        <label className="mb-1 block text-[11px] font-semibold text-slate-500">{t('monitoring_filter_search')}</label>
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t('monitoring_filter_search_placeholder')}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-hidden focus:border-brand focus:ring-2 focus:ring-brand/20"
                        />
                    </div>
                    <div className="min-w-0">
                        <label className="mb-1 block text-[11px] font-semibold text-slate-500">{t('monitoring_filter_bucket')}</label>
                        <select
                            value={bucket}
                            onChange={(e) => setBucket(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        >
                            <option value="">{t('monitoring_filter_bucket_all')}</option>
                            {(meta.available_buckets?.length ? meta.available_buckets : bucketOrder).map((b) => (
                                <option key={b} value={b}>
                                    {t(`monitoring_bucket_${b}`)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="min-w-0 md:col-span-2 lg:col-span-4">
                        <label className="mb-1 block text-[11px] font-semibold text-slate-500">{t('monitoring_filter_roles')}</label>
                        <select
                            multiple
                            size={6}
                            value={roleFilter}
                            onChange={(e) => {
                                setRoleFilter([...e.target.selectedOptions].map((o) => o.value));
                            }}
                            className="w-full max-w-full rounded-xl border border-slate-200 px-3 py-2 text-sm md:max-h-32"
                        >
                            {(meta.available_roles?.length ? meta.available_roles : []).map((r) => (
                                <option key={r} value={r}>
                                    {r}
                                </option>
                            ))}
                        </select>
                        <p className="mt-1 text-[11px] text-slate-400">{t('monitoring_filter_roles_hint')}</p>
                    </div>
                </div>
            </div>

            {err ? <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p> : null}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <StatCard title={t('monitoring_stat_total')} value={stats.active_total} />
                <StatCard title={t('monitoring_stat_staff')} value={stats.active_staff} />
                <StatCard title={t('monitoring_stat_suppliers')} value={stats.active_suppliers} />
                <StatCard title={t('monitoring_stat_merchants')} value={stats.active_merchants ?? 0} />
                <StatCard title={t('monitoring_stat_customers')} value={stats.active_customers ?? 0} />
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-card">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{t('monitoring_breakdown_by_bucket')}</p>
                <div className="flex flex-wrap gap-2">
                    {bucketOrder.map((k) =>
                        (byBucket[k] ?? 0) > 0 ? (
                            <span
                                key={k}
                                className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                            >
                                {t(`monitoring_bucket_${k}`)}: {byBucket[k]}
                            </span>
                        ) : null,
                    )}
                    {bucketOrder.every((k) => (byBucket[k] ?? 0) === 0) ? (
                        <span className="text-sm text-slate-400">{t('empty')}</span>
                    ) : null}
                </div>
            </div>

            {sorted.length === 0 && !loading ? (
                <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-card">
                    {t('empty')}
                </div>
            ) : null}

            {activeRows.length > 0 ? (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                        <HiOutlineCheckCircle className="h-5 w-5" />
                        <span>{t('monitoring_status_active')}</span>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {activeRows.map((row) => (
                            <MonitoringUserCard key={row.user_id} row={row} nowMs={nowMs} t={t} />
                        ))}
                    </div>
                </div>
            ) : null}

            {inactiveRows.length > 0 ? (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-red-700">
                        <HiOutlineXCircle className="h-5 w-5" />
                        <span>{t('monitoring_status_inactive')}</span>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {inactiveRows.map((row) => (
                            <MonitoringUserCard key={row.user_id} row={row} nowMs={nowMs} t={t} />
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function formatSessionDuration(sessionStartedAt, nowMs) {
    if (!sessionStartedAt) {
        return '—';
    }
    const started = new Date(sessionStartedAt).getTime();
    if (Number.isNaN(started) || started <= 0) {
        return '—';
    }
    const totalSeconds = Math.max(0, Math.floor((nowMs - started) / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function deviceIconFor(deviceName, userAgent) {
    const text = `${deviceName || ''} ${userAgent || ''}`.toLowerCase();
    if (text.includes('iphone') || text.includes('android') || text.includes('mobile')) {
        return HiOutlineDevicePhoneMobile;
    }

    return HiOutlineComputerDesktop;
}

function MonitoringUserCard({ row, nowMs, t }) {
    const s = row.session || {};
    const location = [s.country, s.region, s.city].filter(Boolean).join(' / ') || '—';
    const isActive = Boolean(s.active_now);
    const duration = formatSessionDuration(s.session_started_at, nowMs);
    const DeviceIcon = deviceIconFor(s.device_name, s.user_agent);
    const bucketKey = row.monitoring_bucket || 'mixed';

    return (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-base font-semibold text-slate-900">{row.name}</p>
                    <p className="text-xs text-slate-500">{row.email}</p>
                    <p className="mt-1 text-xs font-medium text-slate-600">{(row.roles || []).join(', ') || '—'}</p>
                    <span className="mt-1 inline-block rounded-full bg-brand-light/80 px-2 py-0.5 text-[10px] font-semibold text-brand-dark">
                        {t(`monitoring_bucket_${bucketKey}`)}
                    </span>
                </div>
                <span
                    className={[
                        'inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold',
                        isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700',
                    ].join(' ')}
                >
                    {isActive ? <HiOutlineCheckCircle className="h-3.5 w-3.5" /> : <HiOutlineXCircle className="h-3.5 w-3.5" />}
                    {isActive ? t('monitoring_status_active') : t('monitoring_status_inactive')}
                </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <MetaItem icon={DeviceIcon} label={t('monitoring_col_device')} value={s.device_name || '—'} />
                <MetaItem icon={HiOutlineGlobeAlt} label={t('monitoring_col_browser')} value={s.browser || '—'} />
                <MetaItem icon={HiOutlineClock} label={t('monitoring_col_session_timer')} value={duration} mono />
                <MetaItem icon={HiOutlineClock} label={t('monitoring_col_last_seen')} value={s.last_used_at ? new Date(s.last_used_at).toLocaleString() : '—'} />
                <MetaItem icon={HiOutlineGlobeAlt} label="IP" value={s.ip_address || '—'} />
                <MetaItem icon={HiOutlineGlobeAlt} label={t('monitoring_col_location')} value={location} />
            </div>

            <div className="mt-2 border-t border-slate-100 pt-2 text-xs text-slate-500">
                <span className="font-medium">ISP:</span> {s.isp || '—'}
                {s.timezone ? <span className="ms-2"><span className="font-medium">TZ:</span> {s.timezone}</span> : null}
            </div>
            <div className="mt-3">
                <Link
                    to={`/admin/users/${row.user_id}`}
                    className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand hover:bg-slate-50"
                >
                    {t('monitoring_view_user_profile')}
                </Link>
            </div>
        </div>
    );
}

function MetaItem({ icon: Icon, label, value, mono = false }) {
    return (
        <div className="rounded-xl bg-slate-50 px-2.5 py-2">
            <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <Icon className="h-3.5 w-3.5" />
                {label}
            </p>
            <p className={`mt-1 text-slate-800 ${mono ? 'font-mono text-[12px]' : 'text-[12px]'}`}>{value}</p>
        </div>
    );
}

function StatCard({ title, value }) {
    return (
        <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{value ?? 0}</p>
        </div>
    );
}
