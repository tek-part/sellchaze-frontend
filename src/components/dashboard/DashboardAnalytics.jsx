import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { usePermissions } from '../../hooks/usePermissions';
import {
    PIPELINE_LABEL_KEYS,
    SUPPLIER_PIPELINE_LABEL_KEYS,
    canViewOrderAggregates,
    filterPipelineKeysForUser,
} from '../../utils/dashboardPermissions';
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
import { HiOutlineArrowTrendingUp, HiOutlineChartPie, HiOutlineQueueList } from 'react-icons/hi2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Tooltip,
    Legend,
    Filler,
);

const BRAND = '#004BB4';
const STATUS_COLORS = ['#004BB4', '#00C0A9', '#f59e0b', '#6366f1', '#ec4899', '#0ea5e9', '#64748b'];

/**
 * @param {object} props
 * @param {object} [props.stats] — full /dashboard JSON
 * @param {Record<string, number | null | undefined>} [props.counts]
 */
export default function DashboardAnalytics({ stats, counts }) {
    const { t, i18n } = useTranslation();
    const { can } = usePermissions();
    const locale = i18n.language;
    const isRtl = i18n.dir() === 'rtl';
    const isSupplierMode = stats?.dashboard_mode === 'supplier';
    const canOrders = canViewOrderAggregates(can);
    const allowedPipelineKeys = useMemo(
        () => filterPipelineKeysForUser(isSupplierMode, can),
        [isSupplierMode, can],
    );

    const ordersChart = Array.isArray(stats?.orders_chart) ? stats.orders_chart : [];
    const byStatus = Array.isArray(stats?.orders_by_status) ? stats.orders_by_status : [];
    const recentRaw = Array.isArray(stats?.recent_orders) ? stats.recent_orders : [];

    const lineData = useMemo(() => {
        const labels = ordersChart.map((row) =>
            new Date(`${row.date}T12:00:00`).toLocaleDateString(locale === 'ar' ? 'ar' : 'en', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
            }),
        );
        return {
            labels,
            datasets: [
                {
                    label: t('dashboard_chart_orders_7d'),
                    data: ordersChart.map((r) => r.orders),
                    borderColor: BRAND,
                    backgroundColor: 'rgba(0, 75, 180, 0.12)',
                    fill: true,
                    tension: 0.35,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: BRAND,
                    pointBorderWidth: 2,
                },
            ],
        };
    }, [ordersChart, locale, t]);

    const doughnutData = useMemo(() => {
        const labels = byStatus.map((s) => String(s.status ?? '—'));
        const data = byStatus.map((s) => s.count);
        return {
            labels,
            datasets: [
                {
                    data,
                    backgroundColor: labels.map((_, i) => STATUS_COLORS[i % STATUS_COLORS.length]),
                    borderWidth: 2,
                    borderColor: '#fff',
                },
            ],
        };
    }, [byStatus]);

    const barData = useMemo(() => {
        const c = counts ?? stats?.counts ?? {};
        const labels = [];
        const values = [];
        const labelMap = isSupplierMode ? SUPPLIER_PIPELINE_LABEL_KEYS : PIPELINE_LABEL_KEYS;
        for (const k of allowedPipelineKeys) {
            const v = c[k];
            if (v === undefined || v === null) {
                continue;
            }
            labels.push(t(labelMap[k]));
            values.push(v);
        }
        return {
            labels,
            datasets: [
                {
                    label: t('dashboard_chart_pipeline'),
                    data: values,
                    backgroundColor: labels.map((_, i) =>
                        i % 2 === 0 ? 'rgba(0, 75, 180, 0.88)' : 'rgba(0, 192, 169, 0.88)',
                    ),
                    borderRadius: 8,
                    borderSkipped: false,
                },
            ],
        };
    }, [counts, isSupplierMode, stats?.counts, t, allowedPipelineKeys]);

    const lineOpts = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    rtl: isRtl,
                    labels: { boxWidth: 12, padding: 14, usePointStyle: true },
                },
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { maxRotation: 0, autoSkip: true },
                },
                y: {
                    beginAtZero: true,
                    ticks: { precision: 0 },
                    grid: { color: 'rgba(148, 163, 184, 0.12)' },
                },
            },
        }),
        [isRtl],
    );

    const doughnutOpts = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    rtl: isRtl,
                    labels: { boxWidth: 10, padding: 8, usePointStyle: true },
                },
            },
        }),
        [isRtl],
    );

    const barOpts = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: { display: false },
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { precision: 0 },
                    grid: { color: 'rgba(148, 163, 184, 0.12)' },
                },
                y: {
                    grid: { display: false },
                    ticks: { font: { size: 11 } },
                },
            },
        }),
        [],
    );

    const hasLineData = ordersChart.length > 0 && ordersChart.some((r) => r.orders > 0);
    const hasStatusData = byStatus.length > 0 && byStatus.some((s) => s.count > 0);

    const showOrderCharts = canOrders;
    const showPipelineBar = allowedPipelineKeys.length > 0;
    const showRecentOrders = canOrders;
    const hasAnyBlock = showOrderCharts || showPipelineBar || showRecentOrders;

    if (!stats || !hasAnyBlock) {
        return null;
    }

    return (
        <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.06 }}
            className="space-y-8"
        >
            <div>
                <h2 className="text-lg font-semibold text-slate-900 md:text-xl">{t('dashboard_analytics')}</h2>
                <p className="mt-1 text-sm text-slate-500">{t('dashboard_analytics_subtitle')}</p>
            </div>

            {showOrderCharts ? (
                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card md:p-6">
                        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
                            <HiOutlineArrowTrendingUp className="h-5 w-5 shrink-0 text-brand" aria-hidden />
                            {t('dashboard_chart_orders_7d')}
                        </h3>
                        <div className="relative h-64 w-full min-h-64">
                            {hasLineData ? (
                                <Line data={lineData} options={lineOpts} />
                            ) : (
                                <p className="flex h-full items-center justify-center text-sm text-slate-500">
                                    {t('dashboard_no_chart_data')}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card md:p-6">
                        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
                            <HiOutlineChartPie className="h-5 w-5 shrink-0 text-accent-dark" aria-hidden />
                            {t('dashboard_chart_by_status')}
                        </h3>
                        <div className="relative mx-auto h-64 w-full max-w-sm min-h-64">
                            {hasStatusData ? (
                                <Doughnut data={doughnutData} options={doughnutOpts} />
                            ) : (
                                <p className="flex h-full items-center justify-center text-sm text-slate-500">
                                    {t('dashboard_no_chart_data')}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}

            {showPipelineBar ? (
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card md:p-6">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <HiOutlineQueueList className="h-5 w-5 shrink-0 text-brand-dark" aria-hidden />
                        {isSupplierMode ? t('dashboard_chart_supplier_pipeline') : t('dashboard_chart_pipeline')}
                    </h3>
                    <div className="relative h-72 w-full min-h-56 max-w-4xl">
                        {barData.labels.length > 0 ? (
                            <Bar data={barData} options={barOpts} />
                        ) : (
                            <p className="text-sm text-slate-500">{t('dashboard_no_chart_data')}</p>
                        )}
                    </div>
                </div>
            ) : null}

            {showRecentOrders ? (
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card md:p-6">
                    <h3 className="mb-4 text-sm font-semibold text-slate-800">{t('dashboard_recent_orders')}</h3>
                    <div className="overflow-x-auto rounded-xl ring-1 ring-slate-100">
                        <table className="min-w-full text-start text-sm">
                            <thead className="bg-slate-50/95 text-slate-600">
                                <tr>
                                    <th className="px-4 py-3 text-start font-semibold">{t('col_code')}</th>
                                    <th className="px-4 py-3 text-start font-semibold">{t('col_product')}</th>
                                    <th className="px-4 py-3 text-start font-semibold">{t('col_status')}</th>
                                    <th className="px-4 py-3 text-start font-semibold">{t('col_created')}</th>
                                    <th className="px-4 py-3 text-start font-semibold">{t('col_actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {recentRaw.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                                            {t('empty')}
                                        </td>
                                    </tr>
                                ) : (
                                    recentRaw.map((raw) => {
                                        const o = raw?.data ?? raw;
                                        return (
                                            <tr key={o.code} className="transition hover:bg-surface-muted/50">
                                                <td className="px-4 py-2.5 font-mono text-xs font-medium text-slate-900">
                                                    {o.code}
                                                </td>
                                                <td className="px-4 py-2.5 text-slate-700">{o.product?.name ?? '—'}</td>
                                                <td className="px-4 py-2.5">
                                                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-700">
                                                        {o.status ?? '—'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-slate-600">
                                                    {o.created_at
                                                        ? new Date(o.created_at).toLocaleString(
                                                              locale === 'ar' ? 'ar' : undefined,
                                                          )
                                                        : '—'}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <Link
                                                        to={`/orders/${encodeURIComponent(o.code)}`}
                                                        className="text-sm font-medium text-brand hover:underline"
                                                    >
                                                        {t('dashboard_view_order')}
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : null}
        </motion.section>
    );
}
