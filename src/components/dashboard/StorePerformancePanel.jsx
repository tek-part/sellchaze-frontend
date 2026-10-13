import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { HiOutlineEye, HiOutlineShoppingBag, HiOutlineReceiptPercent, HiOutlineShoppingCart, HiOutlineCursorArrowRays, HiOutlineClock, HiOutlineChartBar, HiOutlineBanknotes } from '../workspace/WorkspaceIcons';
import api from '../../api/client';
import useWorkspaceAppearance from '../workspace/useWorkspaceAppearance';
import MetricDateRange from './MetricDateRange';
import StoreConversionFlow from './StoreConversionFlow';
import { metricPreset } from './metric-range';
import './merchant-metrics.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);
const cards = [
    ['visits', 'زيارات', 'Visits', HiOutlineEye, '#33aafa', 'visit'],
    ['orders', 'الطلبات', 'Orders', HiOutlineShoppingBag, '#7b71ba', 'order'],
    ['average_order_value', 'متوسط سعر الطلب', 'Average order value', HiOutlineReceiptPercent, '#7f24ff', 'money'],
    ['add_to_cart', 'مرات إضافة للسلة', 'Add to cart', HiOutlineShoppingCart, '#00d15e'],
    ['checkout_started', 'مرات بدء الشراء', 'Checkout starts', HiOutlineCursorArrowRays, '#b2be00'],
    ['cross_sell', 'إضافة كروس سيل', 'Cross-sell additions', HiOutlineShoppingCart, '#2986ff'],
    ['new_orders', 'طلبات جديدة', 'New orders', HiOutlineClock, '#6dd7fd', 'order'],
    ['missed_orders', 'الطلبات المفقودة', 'Missed orders', HiOutlineShoppingBag, '#e57168', 'order'],
    ['conversion_rate', 'معدل التحويل', 'Conversion rate', HiOutlineChartBar, '#56b3c2', 'percent'],
    ['conversion_with_missed_rate', 'المعدل بالمفقودة', 'Completion including missed orders', HiOutlineChartBar, '#128598', 'percent'],
    ['total_sales', 'إجمالي المبيعات', 'Total sales', HiOutlineBanknotes, '#04bfda', 'money'],
    ['net_profit', 'صافي الربح', 'Net profit', HiOutlineBanknotes, '#10ae12', 'money'],
];
function MetricChart({ title, rows, field, money, color, ar, dark }) {
    const values = rows.map((row) => row[field] == null ? null : Number(row[field]));
    const labels = rows.map((row) => new Date(`${row.date}T12:00:00`).toLocaleDateString(ar ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short' }));
    const text = dark ? '#a1b0c3' : '#657184';
    return <section className="ws-metrics-panel"><h2>{title}</h2>{!values.some((value) => value !== null && value !== 0) ? <p className="ws-metrics-empty">{ar ? 'لا توجد بيانات لعرضها' : 'No data to display'}</p> : <><div className="ws-metrics-chart"><Line aria-label={title} role="img" data={{ labels, datasets: [{ label: title, data: values, fill: true, borderColor: color, backgroundColor: `${color}20`, borderWidth: 2, pointRadius: 1, pointHoverRadius: 5, tension: .35 }] }} options={{ responsive: true, maintainAspectRatio: false, locale: ar ? 'ar-EG' : 'en-GB', plugins: { legend: { display: false }, tooltip: { rtl: ar, titleFont: { family: 'IBM Plex Sans Arabic' }, bodyFont: { family: 'IBM Plex Sans Arabic' }, callbacks: { label: (item) => `${title}: ${money ? money(item.parsed.y) : item.parsed.y}` } } }, scales: { x: { grid: { display: false }, ticks: { maxTicksLimit: 8, color: text, font: { family: 'IBM Plex Sans Arabic', size: 11 } } }, y: { beginAtZero: true, grid: { color: dark ? '#2d3b4d' : '#e5e9ef' }, ticks: { color: text, font: { family: 'IBM Plex Sans Arabic', size: 11 }, ...(money ? {} : { precision: 0 }) } } } }} /></div><details className="ws-metrics-data"><summary>{ar ? 'عرض بيانات الرسم' : 'View chart data'}</summary><table><thead><tr><th>{ar ? 'التاريخ' : 'Date'}</th><th>{title}</th></tr></thead><tbody>{rows.map((row) => <tr key={row.date}><td>{row.date}</td><td>{row[field] == null ? '-' : money ? money(row[field]) : row[field]}</td></tr>)}</tbody></table></details></>}</section>;
}

export default function StorePerformancePanel({ canOrders = true, canInventory = true, children }) {
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
    const number = (value) => value == null || Number(value) === 0 ? '-' : new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 }).format(Number(value));
    const currency = metrics?.currency || 'EGP';
    const currencyLabel = ar ? new Intl.NumberFormat('ar-EG', { style: 'currency', currency, currencyDisplay: 'symbol' }).formatToParts(0).find((part) => part.type === 'currency')?.value.replace(/\.$/, '') || currency : currency;
    const money = (value) => `${new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 }).format(Number(value || 0))} ${currencyLabel}`;
    const unit = (kind) => kind === 'money' ? currencyLabel : kind === 'percent' ? '%' : kind === 'visit' ? text('زيارة', 'visit') : kind === 'order' ? text('طلب', 'order') : '';
    const counts = metrics?.funnel; const daily = metrics?.daily || [];
    return <div className="ws-merchant-metrics">
        <div className="ws-metrics-heading"><div><h1>{text('لوحة الاحصائيات', 'Statistics dashboard')}</h1><p>{text('اعرف اكثر عن اداء متجرك ومدي تقدمك', 'Learn more about your store performance and progress')}</p></div><MetricDateRange value={range} onApply={setRange} ar={ar} theme={theme} /></div>
        {children}
        {error ? <section className="ws-metrics-feedback" role="alert"><p>{text('تعذر تحميل الإحصائيات. حاول مرة أخرى.', 'Statistics could not be loaded. Try again.')}</p><button type="button" className="ws-secondary-button" onClick={() => setAttempt((old) => old + 1)}>{text('إعادة المحاولة', 'Retry')}</button></section> : !metrics ? <div role="status" aria-busy="true"><p className="ws-note">{text('جارٍ تحميل الإحصائيات…', 'Loading statistics…')}</p><div className="ws-metrics-grid">{cards.map(([key]) => <div className="ws-metric-skeleton" key={key} aria-hidden="true" />)}</div></div> : <>
            <div className="ws-metrics-grid">{cards.map(([key, a, e, Icon, color, kind]) => {
                const content = <><span className="ws-metric-icon" style={{ '--metric-color': color }}><Icon aria-hidden="true" /></span><span className="ws-metric-text"><span>{text(a, e)}</span><strong>{number(summary[key])} {unit(kind)}</strong></span></>;
                return <article className="ws-metric" key={key}>{canOrders ? <Link to={key === 'missed_orders' ? '/store/missed-orders' : '/store/orders'}>{content}</Link> : <div>{content}</div>}</article>;
            })}</div>
            <div className="ws-metrics-panels"><MetricChart title={text('اجمالي الطلبات', 'Total orders')} rows={daily} field="orders" color="#198754" ar={ar} dark={theme === 'dark'} /><MetricChart title={text('متوسط سعر الطلب', 'Average order value')} rows={daily} field="average" color="#33aafa" money={money} ar={ar} dark={theme === 'dark'} /><MetricChart title={text('اجمالي المبيعات', 'Total sales')} rows={daily} field="sales" color="#198754" money={money} ar={ar} dark={theme === 'dark'} /><MetricChart title={text('اجمالي الزيارات', 'Total visits')} rows={daily} field="visits" color="#ffab00" ar={ar} dark={theme === 'dark'} /><MetricChart title={text('إجمالي بدء الشراء', 'Total checkout starts')} rows={daily} field="checkout_started" color="#9b6cff" ar={ar} dark={theme === 'dark'} />
                <section className="ws-metrics-panel"><div className="ws-metrics-panel-heading"><h2>{text('أوشك على النفاذ', 'Almost out of stock')}</h2>{canInventory ? <Link to="/store/inventory">{text('عرض الكل', 'View all')}</Link> : null}</div><div className="ws-metrics-table"><table><thead><tr><th>{text('المنتج', 'Product')}</th><th>{text('المتاح في المخزون', 'Available stock')}</th></tr></thead><tbody>{metrics.low_stock.map((row) => <tr key={`${row.product_id}:${row.variant_id || 'base'}`}><td>{row.name}</td><td>{row.available}</td></tr>)}</tbody></table></div></section>
                <section className="ws-metrics-panel"><h2>{text('المنتجات الأكثر مبيعا', 'Best selling products')}</h2>{metrics.top_products.length ? <div className="ws-metrics-table"><table><thead><tr><th>{text('المنتج', 'Product')}</th><th>{text('المباع', 'Sold')}</th><th>{text('المبيعات', 'Sales')}</th></tr></thead><tbody>{metrics.top_products.map((row, index) => <tr key={`${row.product_id}:${index}`}><td>{row.name}</td><td>{row.quantity}</td><td>{money(row.revenue)}</td></tr>)}</tbody></table></div> : <p className="ws-metrics-empty">{text('لا توجد بيانات لعرضها', 'No data to display')}</p>}</section>
                <section className="ws-metrics-panel"><h2>{text('معدلات التحويل', 'Conversion rates')}</h2><div className="ws-metrics-rates"><p>{text('معدل التحويل', 'Conversion rate')}: {counts.purchase_rate}%</p><p>{text('معدل الضغط علي الشراء', 'Checkout click rate')}: {counts.start_rate}%</p><p>{text('معدل اضافة كروس سيل', 'Cross-sell addition rate')}: {counts.cross_sell_rate}%</p></div><StoreConversionFlow counts={counts} ar={ar} /></section>
            </div>
            <details className="ws-metrics-definitions"><summary>{text('كيفية حساب الإحصائيات', 'How statistics are calculated')}</summary><p>{text('المبيعات ومتوسط سعر الطلب من الطلبات المسلّمة. الربح من قيمة المنتجات بعد الخصم وتكلفتها المحفوظة، ولا يشمل رسوم الدفع أو التكاليف التشغيلية.', 'Sales and average order value use delivered orders. Profit subtracts saved product costs from discounted merchandise, excluding payment fees and operating expenses.')}</p>{!metrics.profit_complete ? <p>{text('الربح غير متاح للفترة لأن بعض الطلبات لا تحتوي تكلفة محفوظة.', 'Profit is unavailable for this period because some orders have no saved cost.')}</p> : null}<p>{text('الزيارات ومراحل التحويل تعتمد الجلسات المسجلة، وتستثني معاينات التصميم. المعدل بالمفقودة = الطلبات ÷ (الطلبات + الطلبات المفقودة).', 'Visits and conversion stages use recorded sessions and exclude design previews. Completion including missed orders = orders ÷ (orders + missed orders).')}</p><p>{metrics.tracking_started_at ? text('بداية البيانات المسجلة للزيارات ومراحل الشراء: ', 'Visits and checkout stages are recorded from: ') + metrics.tracking_started_at : text('لم تسجل زيارات بعد. لا تتوفر بيانات الزيارات السابقة.', 'No visits have been recorded yet. Earlier traffic is unavailable.')}</p><p>{text('توقيت الفترة', 'Period timezone')}: {metrics.period.timezone}</p></details>
        </>}
    </div>;
}
