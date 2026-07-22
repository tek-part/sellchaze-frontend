import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { HiXMark } from 'react-icons/hi2';
import api from '../../api/client';

/**
 * Merchant-facing modal for creating a new order and fanning it out to one or
 * more suppliers from the merchant's partners network. Submits to
 * POST /v1/orders which requires the `orders-create` permission.
 */
export default function CreateOrderDialog({ open, onClose, onCreated }) {
    const { t } = useTranslation();
    const [products, setProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [productId, setProductId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState('');
    const [refNumber, setRefNumber] = useState('');
    const [shippingAddress, setShippingAddress] = useState('');
    const [shippingType, setShippingType] = useState('customer_direct');
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [selectedSuppliers, setSelectedSuppliers] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!open) return;
        let alive = true;
        setLoading(true);
        Promise.all([
            api.get('/products', { params: { per_page: 100 } }).catch(() => ({ data: { data: [] } })),
            api.get('/partners').catch(() => ({ data: { suppliers: [] } })),
        ])
            .then(([p, pr]) => {
                if (!alive) return;
                setProducts(Array.isArray(p.data?.data) ? p.data.data : []);
                setSuppliers(Array.isArray(pr.data?.suppliers) ? pr.data.suppliers : []);
            })
            .finally(() => {
                if (alive) setLoading(false);
            });
        return () => {
            alive = false;
        };
    }, [open]);

    if (!open) return null;

    function toggleSupplier(id) {
        setSelectedSuppliers((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    async function submit(e) {
        e.preventDefault();
        if (!productId) {
            toast.error(t('create_order_err_product'));
            return;
        }
        if (selectedSuppliers.size === 0) {
            toast.error(t('create_order_err_suppliers'));
            return;
        }
        setSubmitting(true);
        try {
            await api.post('/orders', {
                product_id: Number(productId),
                quantity: Number(quantity) || 1,
                attributes: {},
                notes: notes || null,
                ref_number: refNumber || null,
                shipping_address: shippingAddress || null,
                shipping_type: shippingType,
                customer_name: customerName || null,
                customer_email: customerEmail || null,
                customer_phone: customerPhone || null,
                supplier_ids: Array.from(selectedSuppliers),
            });
            toast.success(t('create_order_success'));
            onCreated?.();
            onClose?.();
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                    <h2 className="text-lg font-semibold text-slate-900">{t('create_order_title')}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                        <HiXMark className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={submit} className="space-y-4 p-5">
                    {loading ? (
                        <p className="text-sm text-slate-400">{t('loading')}</p>
                    ) : null}

                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="block">
                            <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                                {t('create_order_product')}
                            </span>
                            <select
                                value={productId}
                                onChange={(e) => setProductId(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                                required
                            >
                                <option value="">—</option>
                                {products.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name || p.name_en || p.name_ar || `#${p.id}`}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="block">
                            <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                                {t('create_order_quantity')}
                            </span>
                            <input
                                type="number"
                                min={1}
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                                required
                            />
                        </label>
                    </div>

                    <div>
                        <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                            {t('create_order_suppliers')}
                        </span>
                        {suppliers.length === 0 ? (
                            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                {t('create_order_no_suppliers')}
                            </p>
                        ) : (
                            <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-2">
                                {suppliers.map((s) => (
                                    <label
                                        key={s.id}
                                        className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-white"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedSuppliers.has(s.id)}
                                            onChange={() => toggleSupplier(s.id)}
                                        />
                                        <span className="font-medium text-slate-800">{s.name}</span>
                                        <span className="text-xs text-slate-500">{s.email}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="block">
                            <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                                {t('create_order_ref')}
                            </span>
                            <input
                                type="text"
                                value={refNumber}
                                onChange={(e) => setRefNumber(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                            />
                        </label>
                        <label className="block">
                            <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                                {t('create_order_shipping_type')}
                            </span>
                            <select
                                value={shippingType}
                                onChange={(e) => setShippingType(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                            >
                                <option value="customer_direct">{t('create_order_ship_direct')}</option>
                                <option value="warehouse">{t('create_order_ship_warehouse')}</option>
                            </select>
                        </label>
                    </div>

                    <label className="block">
                        <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                            {t('create_order_shipping_address')}
                        </span>
                        <textarea
                            rows={2}
                            value={shippingAddress}
                            onChange={(e) => setShippingAddress(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                        />
                    </label>

                    <div className="grid gap-3 md:grid-cols-3">
                        <label className="block">
                            <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                                {t('create_order_customer_name')}
                            </span>
                            <input
                                type="text"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                            />
                        </label>
                        <label className="block">
                            <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                                {t('create_order_customer_email')}
                            </span>
                            <input
                                type="email"
                                value={customerEmail}
                                onChange={(e) => setCustomerEmail(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                            />
                        </label>
                        <label className="block">
                            <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                                {t('create_order_customer_phone')}
                            </span>
                            <input
                                type="tel"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                            />
                        </label>
                    </div>

                    <label className="block">
                        <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                            {t('create_order_notes')}
                        </span>
                        <textarea
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                        />
                    </label>

                    <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            {t('cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
                        >
                            {submitting ? t('loading') : t('create_order_submit')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
