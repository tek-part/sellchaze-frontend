import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Reveal from '../components/Reveal';
import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Filler,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Tooltip,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
    HiOutlineArrowTrendingUp,
    HiOutlineBanknotes,
    HiOutlineClock,
    HiOutlineEnvelope,
    HiOutlineExclamationTriangle,
    HiOutlineShieldCheck,
    HiOutlineShoppingBag,
    HiOutlineSignal,
    HiOutlineUserGroup,
    HiOutlineUsers,
    HiOutlineArrowRight,
    HiOutlineCog6Tooth,
} from 'react-icons/hi2';
import api from '../api/client';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Filler,
    Tooltip,
    Legend
);

function StatCard({ icon: Icon, label, value, accent = 'text-brand', hint, index = 0 }) {
    return (
        <Reveal
            index={1 + index}
            className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_12px_30px_-18px_rgba(11,99,206,0.35)]"
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
                    <p className={`mt-2 text-2xl font-bold ${accent}`}>{value ?? '—'}</p>
                    {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
                </div>
                <div className="rounded-xl bg-brand-light p-2.5 text-brand transition group-hover:bg-brand group-hover:text-white">
                    <Icon className="h-6 w-6" aria-hidden />
                </div>
            </div>
        </Reveal>
    );
}

export default function AdminDashboardPage() {
    const { t, i18n } = useTranslation();
    const [data, setData] = useState(null);
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                const { data } = await api.get('/admin/dashboard/overview');
                if (!cancelled) setData(data);
            } catch (e) {
                if (!cancelled) setErr(e.response?.data?.message || e.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const locale = i18n.language?.startsWith('ar') ? 'ar-EG' : 'en-US';

    const signupChart = useMemo(() => {
        const rows = data?.users_signup_chart ?? [];
        return {
            labels: rows.map((r) => new Date(r.date).toLocaleDateString(locale, { month: 'short', day: 'numeric' })),
            datasets: [
                {
                    label: t('admin_dashboard_new_users', 'New users'),
                    data: rows.map((r) => r.count),
                    borderColor: '#0b63ce',
                    backgroundColor: 'rgba(11,99,206,0.12)',
                    tension: 0.35,
                    fill: true,
                    pointRadius: 2,
                },
            ],
        };
    }, [data, locale, t]);

    const ordersChart = useMemo(() => {
        const rows = data?.orders_chart ?? [];
        return {
            labels: rows.map((r) => new Date(r.date).toLocaleDateString(locale, { month: 'short', day: 'numeric' })),
            datasets: [
                {
                    label: t('admin_dashboard_orders_30d', 'Orders'),
                    data: rows.map((r) => r.count),
                    backgroundColor: '#3184df',
                    borderRadius: 6,
                },
            ],
        };
    }, [data, locale, t]);

    const rolesDoughnut = useMemo(() => {
        const rows = data?.roles_breakdown ?? [];
        return {
            labels: rows.map((r) => r.role),
            datasets: [
                {
                    data: rows.map((r) => r.count),
                    backgroundColor: ['#0b63ce', '#3184df', '#71a9e6', '#8b5cf6', '#f59e0b', '#ef4444', '#38bdf8'],
                    borderWidth: 0,
                },
            ],
        };
    }, [data]);

    const chartOpts = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
    };

    const k = data?.kpis ?? {};

    return (
        <div className="w-full space-y-5 pb-8">
            <Reveal as="header" index={0} className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#0a3d7c] via-[#0b63ce] to-[#2585e7] px-5 py-6 text-white shadow-[0_22px_55px_-32px_rgba(11,99,206,0.65)] md:px-7 md:py-7">
                <div className="absolute -end-16 -top-24 h-64 w-64 rounded-full border-[42px] border-white/8" aria-hidden />
                <div className="absolute bottom-0 end-40 h-28 w-28 rounded-full bg-blue-300/10 blur-2xl" aria-hidden />
                <div className="relative flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
                    <div>
                        <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-50">
                            <HiOutlineSignal className="h-4 w-4" aria-hidden />
                            {t('admin_live_operations', 'Live operations')}
                        </span>
                        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t('admin_dashboard_title', 'Admin Dashboard')}</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
                            {t('admin_dashboard_subtitle', 'Platform-wide KPIs, user growth, and system health.')}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link to="/admin/users?pending=1" className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 text-sm font-semibold text-[#0a3d7c] shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-50">
                            {t('admin_dashboard_pending_regs', 'Pending registrations')}
                            <HiOutlineArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
                        </Link>
                        <Link to="/settings" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15">
                            <HiOutlineCog6Tooth className="h-4 w-4" aria-hidden />
                            {t('settings', 'Settings')}
                        </Link>
                    </div>
                </div>
            </Reveal>

            {err ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>
            ) : null}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    index={0}
                    icon={HiOutlineUsers}
                    label={t('admin_dashboard_users_total', 'Total Users')}
                    value={loading ? '…' : k.users_total}
                    hint={
                        k.users_growth_30d_pct != null
                            ? `${k.users_growth_30d_pct > 0 ? '+' : ''}${k.users_growth_30d_pct}% ${t('admin_dashboard_vs_prev_30d', 'vs prev 30d')}`
                            : null
                    }
                />
                <StatCard
                    index={1}
                    icon={HiOutlineClock}
                    label={t('admin_dashboard_pending_regs', 'Pending Registrations')}
                    value={loading ? '…' : k.pending_registrations}
                    accent="text-amber-600"
                />
                <StatCard
                    index={2}
                    icon={HiOutlineShieldCheck}
                    label={t('admin_dashboard_pending_verifs', 'Pending Verifications')}
                    value={loading ? '…' : k.pending_verifications}
                    accent="text-indigo-600"
                />
                <StatCard
                    index={3}
                    icon={HiOutlineShoppingBag}
                    label={t('admin_dashboard_orders_30d', 'Orders (30d)')}
                    value={loading ? '…' : k.orders_30d}
                />
                <StatCard
                    index={4}
                    icon={HiOutlineBanknotes}
                    label={t('admin_dashboard_deals_usd_30d', 'Deals Accepted USD (30d)')}
                    value={loading ? '…' : `$${Number(k.deals_accepted_usd_30d ?? 0).toLocaleString()}`}
                    accent="text-blue-700"
                />
                <StatCard
                    index={5}
                    icon={HiOutlineSignal}
                    label={t('admin_dashboard_active_sessions', 'Active Sessions')}
                    value={loading ? '…' : k.active_sessions}
                />
                <StatCard
                    index={6}
                    icon={HiOutlineArrowTrendingUp}
                    label={t('admin_dashboard_new_users_30d', 'New Users (30d)')}
                    value={loading ? '…' : k.users_new_30d}
                />
                <StatCard
                    index={7}
                    icon={HiOutlineEnvelope}
                    label={t('admin_dashboard_email_7d', 'Emails Sent (7d)')}
                    value={loading ? '…' : data?.email_stats_7d?.sent ?? 0}
                    hint={
                        data
                            ? `${data.email_stats_7d.failed} ${t('admin_dashboard_failed', 'failed')} / ${data.email_stats_7d.queued} ${t('admin_dashboard_queued', 'queued')}`
                            : null
                    }
                />
            </div>

            {/* Charts */}
            <Reveal index={9} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs lg:col-span-2">
                    <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <HiOutlineArrowTrendingUp className="h-5 w-5 text-brand" aria-hidden />
                        {t('admin_dashboard_users_growth', 'User Growth (30d)')}
                    </h2>
                    <div className="h-64">
                        <Line data={signupChart} options={chartOpts} />
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
                    <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <HiOutlineUserGroup className="h-5 w-5 text-indigo-500" aria-hidden />
                        {t('admin_dashboard_roles_breakdown', 'Roles Breakdown')}
                    </h2>
                    <div className="h-64">
                        <Doughnut data={rolesDoughnut} options={{ ...chartOpts, scales: {} }} />
                    </div>
                </div>
            </Reveal>

            <Reveal index={10} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
                    <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <HiOutlineShoppingBag className="h-5 w-5 text-indigo-500" aria-hidden />
                        {t('admin_dashboard_orders_volume', 'Orders Volume (30d)')}
                    </h2>
                    <div className="h-64">
                        <Bar data={ordersChart} options={chartOpts} />
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
                    <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <HiOutlineExclamationTriangle className="h-5 w-5 text-red-500" aria-hidden />
                        {t('admin_dashboard_recent_errors', 'Recent System Errors')}
                    </h2>
                    <ul className="space-y-2 text-sm">
                        {(data?.recent_errors ?? []).length === 0 ? (
                            <li className="text-slate-500">{t('admin_dashboard_no_errors', 'No recent errors.')}</li>
                        ) : (
                            (data?.recent_errors ?? []).map((e, i) => (
                                <li key={i} className="rounded-sm border border-red-100 bg-red-50 p-2">
                                    <div className="font-medium text-red-800">{e.action}</div>
                                    {e.message ? <div className="text-xs text-red-700">{e.message}</div> : null}
                                    <div className="text-[10px] uppercase tracking-wide text-red-500">
                                        {new Date(e.created_at).toLocaleString(locale)}
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </Reveal>

            {/* Pending queues */}
            <Reveal index={11} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                            <HiOutlineClock className="h-5 w-5 text-amber-500" aria-hidden />
                            {t('admin_dashboard_pending_regs', 'Pending Registrations')}
                        </h2>
                        <Link to="/admin/users?pending=1" className="text-xs font-medium text-brand hover:underline">
                            {t('view_all', 'View all')}
                        </Link>
                    </div>
                    <ul className="divide-y divide-slate-100">
                        {(data?.pending_queue?.registrations ?? []).length === 0 ? (
                            <li className="py-3 text-sm text-slate-500">
                                {t('admin_dashboard_no_pending', 'Nothing pending.')}
                            </li>
                        ) : (
                            (data?.pending_queue?.registrations ?? []).map((u) => (
                                <li key={u.id} className="flex items-center justify-between py-2 text-sm">
                                    <div>
                                        <div className="font-medium text-slate-800">{u.name}</div>
                                        <div className="text-xs text-slate-500">{u.email}</div>
                                    </div>
                                    <Link to={`/admin/users/${u.id}`} className="text-xs font-medium text-brand">
                                        {t('review', 'Review')}
                                    </Link>
                                </li>
                            ))
                        )}
                    </ul>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                            <HiOutlineShieldCheck className="h-5 w-5 text-indigo-500" aria-hidden />
                            {t('admin_dashboard_pending_verifs', 'Pending Verifications')}
                        </h2>
                        <Link to="/admin/verifications" className="text-xs font-medium text-brand hover:underline">
                            {t('view_all', 'View all')}
                        </Link>
                    </div>
                    <ul className="divide-y divide-slate-100">
                        {(data?.pending_queue?.verifications ?? []).length === 0 ? (
                            <li className="py-3 text-sm text-slate-500">
                                {t('admin_dashboard_no_pending', 'Nothing pending.')}
                            </li>
                        ) : (
                            (data?.pending_queue?.verifications ?? []).map((v) => (
                                <li key={v.id} className="flex items-center justify-between py-2 text-sm">
                                    <div>
                                        <div className="font-medium text-slate-800">{v.user_name}</div>
                                        <div className="text-xs text-slate-500">#{v.id}</div>
                                    </div>
                                    <Link to="/admin/verifications" className="text-xs font-medium text-brand">
                                        {t('review', 'Review')}
                                    </Link>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </Reveal>
        </div>
    );
}
