import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useStoreScope from '../hooks/useStoreScope';
import { useTranslation } from 'react-i18next';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import api from '../api/client';
import StatCard from '../components/StatCard';

ChartJS.register(ArcElement, Tooltip, Legend);

const STATUS_KEYS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const STATUS_COLORS = ['#f59e0b', '#0ea5e9', '#6366f1', '#8b5cf6', '#10b981', '#ef4444'];

export default function StoreAnalyticsPage() {
    const { id, apiBase } = useStoreScope();
    const { t } = useTranslation();
    const [ov, setOv] = useState(null);
    const [categories, setCategories] = useState([]);
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        setLoading(true);
        Promise.all([
            api.get(`${apiBase}/analytics/overview`),
            api.get(`${apiBase}/analytics/categories`, { params: { limit: 5 } }),
        ])
            .then(([o, c]) => { if (!active) return; setOv(o.data.data); setCategories(c.data.data ?? []); })
            .catch((e) => active && setErr(e.response?.data?.message || e.message))
            .finally(() => active && setLoading(false));
        return () => { active = false; };
    }, [id, apiBase]);

    const doughnut = useMemo(() => {
        if (!ov) return null;
        return {
            labels: STATUS_KEYS.map((s) => t(`order_status_${s}`, s)),
            datasets: [{ data: STATUS_KEYS.map((s) => ov.orders[`${s}_orders`] ?? 0), backgroundColor: STATUS_COLORS, borderWidth: 0 }],
        };
    }, [ov, t]);

    if (err) return <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>;
    if (loading || !ov) return <div className="flex min-h-48 items-center justify-center text-sm text-slate-500">{t('loading', 'Loading…')}</div>;

    const cur = '';
    const rev = ov.revenue; const sales = ov.sales; const cust = ov.customers; const cp = ov.coupons; const rv = ov.reviews;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="border-s-4 border-brand ps-4">
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('analytics_title', 'Analytics')}</h1>
                    <p className="mt-1 text-sm text-slate-500">{t('analytics_subtitle', 'Store performance at a glance.')}</p>
                </div>
                {id ? <Link to="/stores" className="text-sm text-brand hover:underline">← {t('stores_title', 'Stores')}</Link> : null}
            </div>

            {/* Revenue */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label={t('rev_today', 'Revenue · Today')} value={`${cur}${rev.today_revenue}`} />
                <StatCard label={t('rev_week', 'Revenue · This week')} value={`${cur}${rev.week_revenue}`} />
                <StatCard label={t('rev_month', 'Revenue · This month')} value={`${cur}${rev.month_revenue}`} />
                <StatCard label={t('rev_total', 'Revenue · Total')} value={`${cur}${rev.total_revenue}`} sub={t('rev_delivered_only', 'Delivered orders')} />
            </div>

            {/* Sales + customers + coupons + reviews */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label={t('sales_total_orders', 'Total orders')} value={sales.total_orders} />
                <StatCard label={t('sales_aov', 'Avg. order value')} value={sales.average_order_value} />
                <StatCard label={t('sales_items_sold', 'Items sold')} value={sales.total_items_sold} />
                <StatCard label={t('rev_reviews_avg', 'Avg. rating')} value={rv.average_rating ?? '—'} sub={`${rv.total_reviews} ${t('reviews_label', 'reviews')}`} />
                <StatCard label={t('cust_total', 'Customers')} value={cust.total_customers} />
                <StatCard label={t('cust_returning', 'Returning')} value={cust.returning_customers} />
                <StatCard label={t('cust_new', 'New this month')} value={cust.new_customers_this_month} />
                <StatCard label={t('coupon_redemptions', 'Coupon redemptions')} value={cp.coupon_redemptions} sub={`${cp.total_coupon_usage} ${t('coupon_discounted', 'discounted')}`} />
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
                {/* Orders doughnut */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
                    <h2 className="mb-4 text-base font-semibold text-slate-900">{t('orders_by_status', 'Orders by status')}</h2>
                    <div className="mx-auto max-w-[16rem]">
                        {doughnut ? <Doughnut data={doughnut} options={{ plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } } }} /> : null}
                    </div>
                </div>

                {/* Top products */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
                    <h2 className="mb-4 text-base font-semibold text-slate-900">{t('top_products', 'Top products')}</h2>
                    {(ov.top_products || []).length === 0 ? <p className="text-sm text-slate-500">{t('empty', 'Nothing here yet.')}</p> : (
                        <ul className="space-y-2">
                            {ov.top_products.map((p) => (
                                <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                                    <span className="truncate text-slate-700">{p.name}</span>
                                    <span className="shrink-0 text-slate-500">{p.quantity_sold}× · <span className="font-medium text-slate-900">{p.revenue_generated}</span></span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Top categories */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
                    <h2 className="mb-4 text-base font-semibold text-slate-900">{t('top_categories', 'Top categories')}</h2>
                    {categories.length === 0 ? <p className="text-sm text-slate-500">{t('empty', 'Nothing here yet.')}</p> : (
                        <ul className="space-y-2">
                            {categories.map((c) => (
                                <li key={c.category_id} className="flex items-center justify-between gap-2 text-sm">
                                    <span className="truncate text-slate-700">{c.category}</span>
                                    <span className="shrink-0 text-slate-500">{c.quantity_sold}× · <span className="font-medium text-slate-900">{c.revenue_generated}</span></span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Review distribution */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
                <h2 className="mb-4 text-base font-semibold text-slate-900">{t('review_distribution', 'Review distribution')}</h2>
                <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((star) => {
                        const count = rv.review_distribution?.[star] ?? 0;
                        const pct = rv.total_reviews > 0 ? Math.round((count / rv.total_reviews) * 100) : 0;
                        return (
                            <div key={star} className="flex items-center gap-3 text-sm">
                                <span className="w-10 shrink-0 text-slate-500">{star}★</span>
                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="w-8 shrink-0 text-right text-slate-500">{count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
