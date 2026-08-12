import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import useStoreScope from '../hooks/useStoreScope';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';
import StatusBadge from '../components/StatusBadge';

// Mirrors StoreOrderService::TRANSITIONS — only valid next actions are shown.
const TRANSITIONS = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: [],
};

export default function StoreOrderDetailPage() {
    const { orderId } = useParams();
    const { apiBase, uiBase } = useStoreScope();
    const { t } = useTranslation();

    const [order, setOrder] = useState(null);
    const [err, setErr] = useState('');
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);

    const load = useCallback(() => {
        setErr('');
        api.get(`${apiBase}/orders/${orderId}`)
            .then(({ data }) => setOrder(data.data))
            .catch((e) => setErr(e.response?.data?.message || e.message));
    }, [apiBase, orderId]);

    useEffect(() => { load(); }, [load]);

    const changeStatus = async (status) => {
        setSaving(true);
        try {
            const { data } = await api.patch(`${apiBase}/orders/${orderId}/status`, { status, note: note || null });
            setOrder(data.data);
            setNote('');
            toast.success(t(`order_status_${status}`, status));
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setSaving(false);
        }
    };

    if (err) return <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>;
    if (!order) return <div className="flex min-h-48 items-center justify-center text-sm text-slate-500">{t('loading', 'Loading…')}</div>;

    const nextStatuses = TRANSITIONS[order.status] || [];
    const money = (v) => `${order.currency} ${v}`;

    return (
        <div className="mx-auto max-w-6xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="border-s-4 border-brand ps-4">
                    <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-slate-900">
                        <span className="font-mono">{order.order_number}</span>
                        <StatusBadge status={order.status} label={t(`order_status_${order.status}`, order.status)} />
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">{order.placed_at ? new Date(order.placed_at).toLocaleString() : ''}</p>
                </div>
                <Link to={`${uiBase}/orders`} className="text-sm text-brand hover:underline">← {t('orders_title', 'Orders')}</Link>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
                <div className="space-y-5 lg:col-span-2">
                    {/* Items */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
                        <div className="border-b border-slate-100 px-5 py-3">
                            <h2 className="text-base font-semibold text-slate-900">{t('order_items', 'Items')}</h2>
                        </div>
                        <div className="overflow-auto">
                            <table className="min-w-full text-start text-sm">
                                <thead className="bg-surface-muted/90 text-xs font-semibold uppercase tracking-wide text-slate-600">
                                    <tr>
                                        <th className="px-5 py-3">{t('col_name', 'Product')}</th>
                                        <th className="px-5 py-3">{t('order_unit_price', 'Unit')}</th>
                                        <th className="px-5 py-3">{t('order_qty', 'Qty')}</th>
                                        <th className="px-5 py-3">{t('order_line_total', 'Total')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(order.items || []).map((it) => (
                                        <tr key={it.id} className="border-t border-slate-100">
                                            <td className="px-5 py-3 font-medium text-slate-900">{it.name}</td>
                                            <td className="px-5 py-3 text-slate-600">{money(it.unit_price)}</td>
                                            <td className="px-5 py-3 text-slate-600">{it.quantity}</td>
                                            <td className="px-5 py-3 font-medium text-slate-900">{money(it.line_total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="space-y-1 border-t border-slate-100 px-5 py-4 text-sm">
                            <div className="flex justify-between text-slate-600"><span>{t('order_subtotal', 'Subtotal')}</span><span>{money(order.subtotal)}</span></div>
                            <div className="flex justify-between text-slate-600"><span>{t('order_discount', 'Discount')}</span><span>−{money(order.discount_total)}</span></div>
                            <div className="flex justify-between text-slate-600"><span>{t('order_shipping', 'Shipping')}</span><span>{money(order.shipping_total)}</span></div>
                            <div className="flex justify-between pt-1 text-base font-semibold text-slate-900"><span>{t('order_grand_total', 'Grand total')}</span><span>{money(order.grand_total)}</span></div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
                        <h2 className="mb-4 text-base font-semibold text-slate-900">{t('order_timeline', 'Timeline')}</h2>
                        {(order.timeline || []).length === 0 ? (
                            <p className="text-sm text-slate-500">{t('order_no_history', 'No status changes yet.')}</p>
                        ) : (
                            <ol className="space-y-3">
                                {order.timeline.map((ev, i) => (
                                    <li key={i} className="flex gap-3 border-s-2 border-slate-100 ps-4">
                                        <div className="min-w-0">
                                            <p className="text-sm text-slate-800">
                                                <StatusBadge status={ev.to_status} label={t(`order_status_${ev.to_status}`, ev.to_status)} />
                                                {ev.actor ? <span className="ms-2 text-xs text-slate-500">· {ev.actor}</span> : <span className="ms-2 text-xs text-slate-400">· {t('order_by_customer', 'customer')}</span>}
                                            </p>
                                            {ev.notes ? <p className="mt-0.5 text-xs text-slate-600">{ev.notes}</p> : null}
                                            <p className="mt-0.5 text-xs text-slate-400">{ev.created_at ? new Date(ev.created_at).toLocaleString() : ''}</p>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </div>
                </div>

                {/* Sidebar: customer + status actions */}
                <div className="space-y-5">
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
                        <h2 className="mb-3 text-base font-semibold text-slate-900">{t('order_customer', 'Customer')}</h2>
                        <p className="text-sm font-medium text-slate-900">{order.customer?.name}</p>
                        <p className="text-sm text-slate-600">{order.customer?.email}</p>
                        {order.customer?.phone ? <p className="text-sm text-slate-600">{order.customer.phone}</p> : null}
                        {order.shipping_address ? (
                            <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                                <p>{order.shipping_address.name}</p>
                                <p>{order.shipping_address.line1}{order.shipping_address.line2 ? `, ${order.shipping_address.line2}` : ''}</p>
                                <p>{[order.shipping_address.city, order.shipping_address.state, order.shipping_address.country].filter(Boolean).join(', ')}</p>
                            </div>
                        ) : null}
                        {order.customer_notes ? (
                            <div className="mt-3">
                                <p className="text-[11px] font-semibold uppercase text-slate-500">{t('order_customer_note', 'Customer note')}</p>
                                <p className="mt-1 text-sm text-slate-700">{order.customer_notes}</p>
                            </div>
                        ) : null}
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
                        <h2 className="mb-3 text-base font-semibold text-slate-900">{t('order_update_status', 'Update status')}</h2>
                        {nextStatuses.length === 0 ? (
                            <p className="text-sm text-slate-500">{t('order_status_final', 'This order is in a final state.')}</p>
                        ) : (
                            <>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    rows={2}
                                    placeholder={t('order_internal_note', 'Internal note (optional)')}
                                    className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                                <div className="flex flex-wrap gap-2">
                                    {nextStatuses.map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            disabled={saving}
                                            onClick={() => changeStatus(s)}
                                            className={`rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50 ${s === 'cancelled' ? 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100' : 'bg-brand text-white hover:bg-brand-dark'}`}
                                        >
                                            {t(`order_action_${s}`, t(`order_status_${s}`, s))}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
