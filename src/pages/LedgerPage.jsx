import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { HiOutlineBanknotes, HiOutlinePlusCircle, HiOutlineUsers } from 'react-icons/hi2';
import api from '../api/client';

export default function LedgerPage() {
    const { t } = useTranslation();
    const [partners, setPartners] = useState([]);
    const [partnerId, setPartnerId] = useState('');
    const [ledger, setLedger] = useState(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');
    const [payment, setPayment] = useState({ amount: '', transfer_method: '', notes: '' });
    const [saving, setSaving] = useState(false);

    const loadPartners = useCallback(async () => {
        try {
            const { data } = await api.get('/partners');
            const combined = [
                ...(data.suppliers ?? []).map((u) => ({ ...u, kind: 'supplier' })),
                ...(data.merchants ?? []).map((u) => ({ ...u, kind: 'merchant' })),
            ];
            setPartners(combined);
        } catch (e) {
            setErr(e.response?.data?.message || e.message);
        }
    }, []);

    const loadLedger = useCallback(async (id) => {
        if (!id) { setLedger(null); return; }
        setLoading(true);
        try {
            const { data } = await api.get(`/ledger/${id}`);
            setLedger(data);
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadPartners(); }, [loadPartners]);
    useEffect(() => { loadLedger(partnerId); }, [partnerId, loadLedger]);

    const handlePayment = async (e) => {
        e.preventDefault();
        const amount = Number(payment.amount);
        if (!amount || amount <= 0) {
            toast.error(t('ledger_amount_required'));
            return;
        }
        setSaving(true);
        try {
            await api.post(`/ledger/${partnerId}/payments`, {
                amount,
                transfer_method: payment.transfer_method || null,
                notes: payment.notes || null,
            });
            toast.success(t('ledger_payment_added'));
            setPayment({ amount: '', transfer_method: '', notes: '' });
            await loadLedger(partnerId);
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setSaving(false);
        }
    };

    const balanceColor = useMemo(() => {
        if (!ledger) return 'text-slate-700';
        const b = ledger.totals?.balance ?? 0;
        if (b > 0) return 'text-red-600';
        if (b < 0) return 'text-emerald-600';
        return 'text-slate-700';
    }, [ledger]);

    return (
        <div className="space-y-5">
            <div className="border-s-4 border-brand ps-4">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('ledger_title')}</h1>
                <p className="mt-1 text-sm text-slate-500">{t('ledger_subtitle')}</p>
            </div>

            {err ? <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p> : null}

            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
                <div className="flex items-start gap-2 border-b border-slate-100 px-4 py-3">
                    <HiOutlineUsers className="h-5 w-5 text-brand" aria-hidden />
                    <h2 className="font-semibold text-slate-900">{t('ledger_pick_partner')}</h2>
                </div>
                <div className="p-4">
                    <select value={partnerId} onChange={(e) => setPartnerId(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                        <option value="">{t('ledger_select_placeholder')}</option>
                        {partners.map((p) => (
                            <option key={`${p.kind}-${p.id}`} value={p.id}>
                                {p.name} — {p.email} ({t('role_' + p.kind)})
                            </option>
                        ))}
                    </select>
                </div>
            </section>

            {loading ? <p className="text-sm text-slate-400">{t('loading')}</p> : null}

            {ledger ? (
                <>
                    <section className="grid gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card md:grid-cols-3">
                        <div>
                            <p className="text-xs font-semibold uppercase text-slate-500">{t('ledger_charges')}</p>
                            <p className="mt-1 text-xl font-semibold text-slate-900">{ledger.totals.charges}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase text-slate-500">{t('ledger_payments')}</p>
                            <p className="mt-1 text-xl font-semibold text-slate-900">{ledger.totals.payments}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase text-slate-500">{t('ledger_balance')}</p>
                            <p className={`mt-1 text-xl font-semibold ${balanceColor}`}>{ledger.totals.balance}</p>
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
                        <div className="flex items-start gap-2 border-b border-slate-100 px-4 py-3">
                            <HiOutlinePlusCircle className="h-5 w-5 text-brand" aria-hidden />
                            <h2 className="font-semibold text-slate-900">{t('ledger_add_payment')}</h2>
                        </div>
                        <form onSubmit={handlePayment} className="grid gap-3 p-4 md:grid-cols-4">
                            <input type="number" min="1" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder={t('ledger_amount')} value={payment.amount} onChange={(e) => setPayment({ ...payment, amount: e.target.value })} />
                            <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder={t('ledger_transfer_method')} value={payment.transfer_method} onChange={(e) => setPayment({ ...payment, transfer_method: e.target.value })} />
                            <input className="md:col-span-1 rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder={t('ledger_notes')} value={payment.notes} onChange={(e) => setPayment({ ...payment, notes: e.target.value })} />
                            <button type="submit" disabled={saving} className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{t('ledger_pay')}</button>
                        </form>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
                        <div className="flex items-start gap-2 border-b border-slate-100 px-4 py-3">
                            <HiOutlineBanknotes className="h-5 w-5 text-brand" aria-hidden />
                            <h2 className="font-semibold text-slate-900">{t('ledger_entries')}</h2>
                        </div>
                        <div className="p-4">
                            {ledger.entries.length === 0 ? (
                                <p className="text-sm text-slate-400">{t('ledger_empty')}</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-start text-sm">
                                        <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                                            <tr>
                                                <th className="px-3 py-2 text-start">{t('col_date')}</th>
                                                <th className="px-3 py-2 text-start">{t('ledger_type')}</th>
                                                <th className="px-3 py-2 text-start">{t('ledger_amount')}</th>
                                                <th className="px-3 py-2 text-start">{t('ledger_reference')}</th>
                                                <th className="px-3 py-2 text-start">{t('ledger_notes')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ledger.entries.map((e) => (
                                                <tr key={e.id} className="border-t border-slate-100">
                                                    <td className="px-3 py-2 text-slate-500">{e.created_at ? new Date(e.created_at).toLocaleDateString() : '—'}</td>
                                                    <td className="px-3 py-2">
                                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${e.type === 'order_charge' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                                            {t('ledger_type_' + e.type)}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2 text-slate-900">{e.amount}</td>
                                                    <td className="px-3 py-2 text-slate-600">{e.orders ?? (e.quotation_id ? `Q#${e.quotation_id}` : '—')}</td>
                                                    <td className="px-3 py-2 text-slate-500">{e.notes ?? '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </section>
                </>
            ) : null}
        </div>
    );
}
