import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineBanknotes, HiOutlineShoppingBag, HiOutlineCheckCircle, HiOutlineUsers, HiOutlineCube, HiOutlineArrowPath, HiOutlineReceiptPercent, HiOutlineClock } from '../workspace/WorkspaceIcons';
import api from '../../api/client';
import useWorkspaceCopy from '../workspace/workspaceCopy';

const periods = { today: 'today_revenue', week: 'week_revenue', month: 'month_revenue', allTime: 'total_revenue' };
const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const colors = ['#d49a25', '#368ecc', '#7470cf', '#a470c7', '#198754', '#d05c67'];

export default function StorePerformancePanel() {
    const ws = useWorkspaceCopy();
    const { t, i18n } = useTranslation();
    const [overview, setOverview] = useState(null);
    const [store, setStore] = useState(null);
    const [error, setError] = useState(false);
    const [missingStore, setMissingStore] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const [period, setPeriod] = useState('month');
    useEffect(() => {
        let active = true;
        setError(false);
        setOverview(null);
        Promise.all([api.get('/my-store/analytics/overview'), api.get('/my-store')])
            .then(([result, shop]) => {
                if (!active) return;
                setOverview(result.data.data);
                setStore(shop.data.data ?? shop.data);
            })
            .catch((failure) => {
                if (!active) return;
                setError(true);
                setMissingStore(failure.response?.status === 404);
            });
        return () => { active = false; };
    }, [attempt]);
    if (error) return <section className="ws-panel"><p role="alert" className="ws-note">{ws('storeUnavailable')}</p><div className="mt-4 flex gap-2"><button type="button" className="ws-secondary-button" onClick={() => setAttempt((value) => value + 1)}>{ws('retry')}</button>{missingStore && <Link className="ws-primary-button" to="/store/settings/general">{ws('setupStore')}</Link>}</div></section>;
    if (!overview) return <section aria-busy="true" aria-label={ws('loading')}><p role="status" className="ws-note mb-3">{ws('loading')}</p><div className="ws-kpi-grid">{Array.from({ length: 8 }, (_, index) => <div key={index} className="ws-skeleton" aria-hidden="true" />)}</div></section>;
    const number = (value) => value == null ? '—' : new Intl.NumberFormat(i18n.language).format(Number(value));
    const money = (value) => {
        if (value == null) return '—';
        const currency = store?.currency;
        const options = currency && /^[A-Z]{3}$/.test(currency) ? { style: 'currency', currency } : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
        return new Intl.NumberFormat(i18n.language, options).format(Number(value));
    };
    const cards = [
        ['storeRevenue', money(overview.revenue?.[periods[period]]), HiOutlineBanknotes, ws(period)],
        ['totalOrders', number(overview.sales?.total_orders), HiOutlineShoppingBag],
        ['newOrders', number(overview.orders?.pending_orders), HiOutlineClock],
        ['delivered', number(overview.orders?.delivered_orders), HiOutlineCheckCircle],
        ['average', money(overview.sales?.average_order_value), HiOutlineReceiptPercent],
        ['items', number(overview.sales?.total_items_sold), HiOutlineCube],
        ['customers', number(overview.customers?.total_customers), HiOutlineUsers],
        ['returning', number(overview.customers?.returning_customers), HiOutlineArrowPath],
    ];
    const products = overview.top_products ?? [];
    const maxStatus = Math.max(1, ...statuses.map((key) => overview.orders?.[`${key}_orders`] ?? 0));
    return <div className="ws-commerce-content">
        <div className="ws-commerce-heading"><div><h2>{ws('commerce')}</h2><p>{store?.name}</p></div><div className="ws-commerce-tools"><select aria-label={ws('storeRevenue')} value={period} onChange={(event) => setPeriod(event.target.value)}>{Object.keys(periods).map((key) => <option key={key} value={key}>{ws(key)}</option>)}</select></div></div>
        <div className="ws-kpi-grid">{cards.map(([key, value, Icon, hint]) => <article className="ws-kpi" key={key}><div className="ws-kpi-top"><span>{ws(key)}</span><div className="ws-kpi-icon"><Icon aria-hidden="true" /></div></div><strong className="ws-kpi-value">{value}</strong><span className="ws-kpi-hint">{hint || ws('allTime')}</span></article>)}</div>
        <p className="ws-note">{ws('salesHint')}</p>
        <div className="ws-commerce-grid">
            <section className="ws-panel"><div className="ws-panel-title"><h3>{ws('orderStatus')}</h3></div><div className="ws-status-list">{statuses.map((key, index) => <div className="ws-status-row" key={key}><div><span>{t(`order_status_${key}`, key)}</span><strong>{number(overview.orders?.[`${key}_orders`])}</strong></div><div className="ws-status-track" aria-hidden="true"><span style={{ width: `${(overview.orders?.[`${key}_orders`] ?? 0) / maxStatus * 100}%`, backgroundColor: colors[index] }} /></div></div>)}</div></section>
            <section className="ws-panel"><div className="ws-panel-title"><h3>{ws('topProducts')}</h3></div>{products.length === 0 ? <p className="ws-empty">{ws('emptyProducts')}</p> : <div className="overflow-x-auto"><table className="w-full"><thead><tr><th>{ws('product')}</th><th>{ws('sold')}</th><th>{ws('revenue')}</th></tr></thead><tbody>{products.map((product) => <tr key={product.id}><td>{product.name}</td><td>{number(product.quantity_sold)}</td><td>{money(product.revenue_generated)}</td></tr>)}</tbody></table></div>}</section>
        </div>
    </div>;
}
