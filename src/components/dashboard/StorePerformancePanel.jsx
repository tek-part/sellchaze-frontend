import ReportingMoney from '../ReportingMoney';
import { formatReportingMoney, reportingCurrencyLabel } from '../../lib/reporting-money';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useReducedMotion } from 'framer-motion';
import DashboardMetricIcon from './DashboardMetricIcon';
import api from '../../api/client';
import useWorkspaceAppearance from '../workspace/useWorkspaceAppearance';
import MetricDateRange from './MetricDateRange';
import StoreConversionFlow from './StoreConversionFlow';
import OrderedProductsPanel from '../analytics/OrderedProductsPanel';
import ProductFunnelReport from '../analytics/ProductFunnelReport';
import { metricPreset } from './metric-range';
import './merchant-metrics.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);
const primaryCards = [
    ['total_sales', 'إجمالي المبيعات', 'Total sales', '#0ea44f', 'money'],
    ['orders', 'الطلبات', 'Orders', '#7b71ba', 'order'],
    ['visits', 'زيارات', 'Visits', '#2563eb', 'visit'],
    ['conversion_rate', 'معدل التحويل', 'Conversion rate', '#0891b2', 'percent'],
];
const additionalCards = [
    ['net_profit', 'صافي الربح', 'Net profit', '#15803d', 'money'],
    ['average_order_value', 'متوسط سعر الطلب', 'Average order value', '#9333ea', 'money'],
    ['add_to_cart', 'مرات إضافة للسلة', 'Add to cart', '#059669'],
    ['checkout_started', 'مرات بدء الشراء', 'Checkout starts', '#ca8a04'],
    ['cross_sell', 'إضافة كروس سيل', 'Cross-sell additions', '#0284c7'],
    ['new_orders', 'طلبات جديدة', 'New orders', '#0ea5e9', 'order'],
    ['missed_orders', 'الطلبات المفقودة', 'Missed orders', '#e11d48', 'order'],
    ['conversion_with_missed_rate', 'المعدل بالمفقودة', 'Completion including missed orders', '#0f766e', 'percent'],
];

function MetricSparkline({ rows, color }) {
    const values = rows.map(row => row.visits == null ? null : Number(row.visits));
    if (!values.some(value => value !== null && value !== 0)) return <span className="ws-metric-sparkline" aria-hidden="true" />;
    const maximum = Math.max(1, ...values.filter(value => value !== null));
    const points = values.map((value, index) => value === null ? null : [index * 100 / Math.max(1, values.length - 1), 48 - value / maximum * 42]);
    // Missing days break the line instead of inventing recorded zero visits.
    const paths = points.reduce((groups, point) => {
        if (point === null) groups.push([]);
        else groups[groups.length - 1].push(point);
        return groups;
    }, [[]]).filter(group => group.length);
    return <svg className="ws-metric-sparkline" viewBox="0 0 100 52" preserveAspectRatio="none" aria-hidden="true">{paths.map((group, index) => {
        const line = group.map(([x, y]) => `${x},${y}`).join(' ');
        return <g key={index}><polygon points={`${group[0][0]},52 ${line} ${group[group.length - 1][0]},52`} fill={color} fillOpacity=".09" /><polyline points={line} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" /></g>;
    })}</svg>;
}

function MetricChart({ title, rows, field, money, color, ar, dark, wide = false }) {
    const reducedMotion = useReducedMotion();
    const values = rows.map((row) => row[field] == null ? null : Number(row[field]));
    const labels = rows.map((row) => new Date(`${row.date}T12:00:00`).toLocaleDateString(ar ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short' }));
    const text = dark ? '#a1b0c3' : '#657184';
    return <section className={`ws-metrics-panel${wide ? " ws-metrics-panel-wide" : ""}`}><h2>{title}</h2>{!values.some((value) => value !== null && value !== 0) ? <p className="ws-metrics-empty">{ar ? 'لا توجد بيانات لعرضها' : 'No data to display'}</p> : <><div className="ws-metrics-chart"><Line aria-label={title} role="img" data={{ labels, datasets: [{ label: title, data: values, fill: true, borderColor: color, backgroundColor: `${color}20`, borderWidth: 2, pointRadius: 1, pointHoverRadius: 5, tension: .35 }] }} options={{ responsive: true, maintainAspectRatio: false, animation: reducedMotion ? false : undefined, locale: ar ? 'ar-EG' : 'en-GB', plugins: { legend: { display: false }, tooltip: { rtl: ar, titleFont: { family: 'IBM Plex Sans Arabic' }, bodyFont: { family: 'IBM Plex Sans Arabic' }, callbacks: { label: (item) => `${title}: ${money ? money(item.parsed.y) : item.parsed.y}` } } }, scales: { x: { grid: { display: false }, ticks: { maxTicksLimit: 8, color: text, font: { family: 'IBM Plex Sans Arabic', size: 11 } } }, y: { beginAtZero: true, grid: { color: dark ? '#2d3b4d' : '#e5e9ef' }, ticks: { color: text, font: { family: 'IBM Plex Sans Arabic', size: 11 }, ...(money ? {} : { precision: 0 }) } } } }} /></div><details className="ws-metrics-data"><summary>{ar ? 'عرض بيانات الرسم' : 'View chart data'}</summary><table><thead><tr><th>{ar ? 'التاريخ' : 'Date'}</th><th>{title}</th></tr></thead><tbody>{rows.map((row) => <tr key={row.date}><td>{row.date}</td><td>{money ? <ReportingMoney value={row[field]} report={row.reporting_money} average={field === 'average'} /> : row[field] == null ? '-' : row[field]}</td></tr>)}</tbody></table></details></>}</section>;
}

export default function StorePerformancePanel({ canOrders = true, canInventory = true, beforeMetrics, children }) {
    const { i18n } = useTranslation(); const ar = i18n.language.startsWith('ar'); const text = (a, e) => ar ? a : e;
    const { theme } = useWorkspaceAppearance();
    const [range, setRange] = useState(() => metricPreset('seven')); const [attempt, setAttempt] = useState(0);
    const [metrics, setMetrics] = useState(null); const [error, setError] = useState(false);
    useEffect(() => {
        let active = true; setMetrics(null); setError(false);
        api.get('/my-store/analytics/dashboard', { params: range }).then(({ data }) => { if (active) setMetrics(data.data); })
            .catch(() => { if (active) setError(true); });
        return () => { active = false; };
    }, [range, attempt]);
    const summary = metrics?.summary;
    const number = (value) => value == null || Number(value) === 0 ? '—' : new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 }).format(Number(value));
    const currency = metrics?.currency || 'EGP';
    const currencyLabel = reportingCurrencyLabel(metrics?.reporting_money, currency, ar);
    const money = (value) => formatReportingMoney(value, metrics?.reporting_money, currency, ar);
    const unit = (kind) => kind === 'money' ? currencyLabel : kind === 'percent' ? '%' : kind === 'visit' ? text('زيارة', 'visit') : kind === 'order' ? text('طلب', 'order') : '';
    const counts = metrics?.funnel; const daily = metrics?.daily || [];
    const renderCard = ([key, a, e, color, kind], primary = false) => {
        const value = summary?.[key];
        const hasValue = value != null && Number(value) !== 0;
        const content = <><div className="ws-metric-content"><span className="ws-metric-label"><span className="ws-metric-icon" style={{ '--metric-color': color }}><DashboardMetricIcon metric={key} /></span><span>{text(a, e)}</span></span><span className="ws-metric-value"><strong>{number(value)}</strong>{hasValue && unit(kind) ? <span>{unit(kind)}</span> : null}</span>{['total_sales', 'average_order_value'].includes(key) ? <ReportingMoney report={metrics?.reporting_money} currency={currency} average={key === 'average_order_value'} breakdownOnly /> : null}</div>{primary && key === 'visits' ? <MetricSparkline rows={daily} color={color} /> : null}</>;
        return <article className={`ws-metric${primary ? ' ws-metric-primary' : ''}`} key={key} data-metric={key}>{canOrders ? <Link to={key === 'missed_orders' ? '/store/missed-orders' : '/store/orders'}>{content}</Link> : <div>{content}</div>}</article>;
    };
    return <div className="ws-merchant-metrics">
        <div className="ws-metrics-heading"><div><h1>{text('لوحة الاحصائيات', 'Statistics dashboard')}</h1><p>{text('اعرف اكثر عن اداء متجرك ومدي تقدمك', 'Learn more about your store performance and progress')}</p></div><MetricDateRange value={range} onApply={setRange} ar={ar} theme={theme} /></div>
        {beforeMetrics}
        {error ? <section className="ws-metrics-feedback" role="alert"><p>{text('تعذر تحميل الإحصائيات. حاول مرة أخرى.', 'Statistics could not be loaded. Try again.')}</p><button type="button" className="ws-secondary-button" onClick={() => setAttempt((old) => old + 1)}>{text('إعادة المحاولة', 'Retry')}</button></section> : !metrics ? <div role="status" aria-busy="true"><p className="ws-note">{text('جارٍ تحميل الإحصائيات…', 'Loading statistics…')}</p><div className="ws-metrics-grid ws-metrics-primary">{primaryCards.map(([key]) => <div className="ws-metric-skeleton" key={key} aria-hidden="true" />)}</div></div> : <>
            <section className="ws-metrics-summary" aria-label={text('ملخص أداء المتجر', 'Store performance summary')}>
                <div className="ws-metrics-grid ws-metrics-primary">{primaryCards.map(card => renderCard(card, true))}</div>
                <h2 className="ws-metrics-additional-heading">{text('مؤشرات إضافية', 'Additional metrics')}</h2>
                <div className="ws-metrics-grid ws-metrics-additional">{additionalCards.map(card => renderCard(card))}</div>
            </section>
            <div className="ws-metrics-charts">
                <div className="ws-metrics-panels ws-metrics-overview">
                    <MetricChart title={text('اجمالي المبيعات', 'Total sales')} rows={daily} field="sales" color="#0ea44f" money={money} ar={ar} dark={theme === 'dark'} wide />
                    <section className="ws-metrics-panel"><h2>{text('معدلات التحويل', 'Conversion rates')}</h2><div className="ws-metrics-conversion"><div className="ws-metrics-rates"><p><span>{text('معدل التحويل', 'Conversion rate')}</span><strong>{counts.purchase_rate}%</strong></p><p><span>{text('معدل الضغط علي الشراء', 'Checkout click rate')}</span><strong>{counts.start_rate}%</strong></p><p><span>{text('معدل اضافة كروس سيل', 'Cross-sell addition rate')}</span><strong>{counts.cross_sell_rate}%</strong></p></div><StoreConversionFlow counts={counts} ar={ar} /></div></section>
                </div>
                <div className="ws-metrics-panels ws-metrics-trends">
                    <MetricChart title={text('اجمالي الطلبات', 'Total orders')} rows={daily} field="orders" color="#0ea44f" ar={ar} dark={theme === 'dark'} />
                    <MetricChart title={text('متوسط سعر الطلب', 'Average order value')} rows={daily} field="average" color="#2563eb" money={money} ar={ar} dark={theme === 'dark'} />
                    <MetricChart title={text('اجمالي الزيارات', 'Total visits')} rows={daily} field="visits" color="#ffab00" ar={ar} dark={theme === 'dark'} />
                    <MetricChart title={text('إجمالي بدء الشراء', 'Total checkout starts')} rows={daily} field="checkout_started" color="#9b6cff" ar={ar} dark={theme === 'dark'} />
                </div>
                <div className="ws-metrics-panels ws-metrics-products">
                    <section className="ws-metrics-panel ws-metrics-panel-wide"><h2>{text('المنتجات الأكثر مبيعا', 'Best selling products')}</h2>{metrics.top_products.length ? <div className="ws-metrics-table"><table><thead><tr><th>{text('المنتج', 'Product')}</th><th>{text('المباع', 'Sold')}</th><th>{text('المبيعات', 'Sales')}</th></tr></thead><tbody>{metrics.top_products.map((row, index) => <tr key={`${row.product_id}:${index}`}><td>{row.name}</td><td>{row.quantity}</td><td><ReportingMoney value={row.revenue} report={row.reporting_money} currency={currency} /></td></tr>)}</tbody></table></div> : <p className="ws-metrics-empty">{text('لا توجد بيانات لعرضها', 'No data to display')}</p>}</section>
                    <section className="ws-metrics-panel"><div className="ws-metrics-panel-heading"><h2>{text('أوشك على النفاذ', 'Almost out of stock')}</h2>{canInventory ? <Link to="/store/inventory">{text('عرض الكل', 'View all')}</Link> : null}</div>{metrics.low_stock.length ? <div className="ws-metrics-table"><table><thead><tr><th>{text('المنتج', 'Product')}</th><th>{text('المتاح في المخزون', 'Available stock')}</th></tr></thead><tbody>{metrics.low_stock.map((row) => <tr key={`${row.product_id}:${row.variant_id || 'base'}`}><td>{row.name}</td><td>{row.available}</td></tr>)}</tbody></table></div> : <p className="ws-metrics-empty">{text('لا توجد بيانات لعرضها', 'No data to display')}</p>}</section>
                </div>
            </div>
            <details className="ws-metrics-definitions"><summary>{text('كيفية حساب الإحصائيات', 'How statistics are calculated')}</summary><p>{text('المبيعات ومتوسط سعر الطلب من الطلبات المسلّمة. الربح من قيمة المنتجات بعد الخصم وتكلفتها المحفوظة، ولا يشمل رسوم الدفع أو التكاليف التشغيلية.', 'Sales and average order value use delivered orders. Profit subtracts saved product costs from discounted merchandise, excluding payment fees and operating expenses.')}</p>{!metrics.profit_complete ? <p>{text('الربح غير متاح للفترة لأن بعض الطلبات لا تحتوي تكلفة محفوظة.', 'Profit is unavailable for this period because some orders have no saved cost.')}</p> : null}<p>{text('الزيارات ومراحل التحويل تعتمد الجلسات المسجلة، وتستثني معاينات التصميم. المعدل بالمفقودة = الطلبات ÷ (الطلبات + الطلبات المفقودة).', 'Visits and conversion stages use recorded sessions and exclude design previews. Completion including missed orders = orders ÷ (orders + missed orders).')}</p><p>{metrics.tracking_started_at ? text('بداية البيانات المسجلة للزيارات ومراحل الشراء: ', 'Visits and checkout stages are recorded from: ') + metrics.tracking_started_at : text('لم تسجل زيارات بعد. لا تتوفر بيانات الزيارات السابقة.', 'No visits have been recorded yet. Earlier traffic is unavailable.')}</p><p>{text('توقيت الفترة', 'Period timezone')}: {metrics.period.timezone}</p></details>
        </>}
        {/* G4: products ordered on a day (#7) and the per-product funnel (#49) keep their own periods. */}
        <OrderedProductsPanel apiBase="/my-store" />
        <ProductFunnelReport apiBase="/my-store" />
        {children}
    </div>;
}
