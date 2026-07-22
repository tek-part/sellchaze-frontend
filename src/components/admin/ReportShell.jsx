import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import api from '../../api/client';

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

/**
 * Shared shell for admin report pages. Fetches {endpoint}?range=N and renders
 * totals + a line/bar timeseries + a doughnut breakdown.
 */
export default function ReportShell({
    title,
    subtitle,
    endpoint,
    valueKey = 'count', // 'count' | 'amount'
    chartType = 'bar', // 'bar' | 'line'
    formatValue,
}) {
    const { t, i18n } = useTranslation();
    const [range, setRange] = useState(30);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                const { data } = await api.get(endpoint, { params: { range } });
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
    }, [endpoint, range]);

    const locale = i18n.language?.startsWith('ar') ? 'ar-EG' : 'en-US';

    const chartData = useMemo(() => {
        const rows = data?.timeseries ?? [];
        return {
            labels: rows.map((r) => new Date(r.date).toLocaleDateString(locale, { month: 'short', day: 'numeric' })),
            datasets: [
                {
                    label: title,
                    data: rows.map((r) => r[valueKey] ?? 0),
                    backgroundColor: chartType === 'line' ? 'rgba(255,106,0,0.15)' : '#6366f1',
                    borderColor: '#ff6a00',
                    fill: chartType === 'line',
                    tension: 0.35,
                    borderRadius: 6,
                    pointRadius: 2,
                },
            ],
        };
    }, [data, locale, title, valueKey, chartType]);

    const breakdownData = useMemo(() => {
        const rows = data?.breakdown ?? [];
        return {
            labels: rows.map((r) => r.label),
            datasets: [
                {
                    data: rows.map((r) => r.count),
                    backgroundColor: ['#ff6a00', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9', '#14b8a6'],
                    borderWidth: 0,
                },
            ],
        };
    }, [data]);

    const totals = data?.totals ?? {};

    return (
        <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
                    {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1 text-xs">
                    {[7, 30, 90, 180].map((r) => (
                        <button
                            key={r}
                            type="button"
                            onClick={() => setRange(r)}
                            className={[
                                'rounded-lg px-3 py-1.5 font-medium transition',
                                range === r ? 'bg-brand text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100',
                            ].join(' ')}
                        >
                            {r}d
                        </button>
                    ))}
                </div>
            </header>

            {err ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>
            ) : null}

            {/* Totals */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {Object.entries(totals).map(([k, v]) => (
                    <div key={k} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            {t(`admin_report_total_${k}`, k.replace(/_/g, ' '))}
                        </p>
                        <p className="mt-2 text-2xl font-bold text-brand">
                            {loading ? '…' : formatValue ? formatValue(k, v) : v ?? '—'}
                        </p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs lg:col-span-2">
                    <h2 className="mb-2 text-sm font-semibold text-slate-800">
                        {t('admin_report_timeseries', 'Trend')}
                    </h2>
                    <div className="h-72">
                        {chartType === 'line' ? (
                            <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
                        ) : (
                            <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
                        )}
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
                    <h2 className="mb-2 text-sm font-semibold text-slate-800">
                        {t('admin_report_breakdown', 'Breakdown')}
                    </h2>
                    <div className="h-72">
                        {(data?.breakdown ?? []).length === 0 ? (
                            <div className="flex h-full items-center justify-center text-sm text-slate-500">
                                {t('admin_report_no_breakdown', 'No data')}
                            </div>
                        ) : (
                            <Doughnut
                                data={breakdownData}
                                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
