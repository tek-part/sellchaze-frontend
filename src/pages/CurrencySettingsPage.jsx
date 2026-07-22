import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';

export default function CurrencySettingsPage() {
    const { t } = useTranslation();
    const { isAdmin } = useOutletContext();
    const [rows, setRows] = useState([]);
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(false);
    const [newCode, setNewCode] = useState('');
    const [newRate, setNewRate] = useState('');
    const [draftRates, setDraftRates] = useState({});

    const load = () => {
        if (!isAdmin) {
            return;
        }
        setLoading(true);
        setErr('');
        api.get('/admin/settings/currencies')
            .then(({ data }) => {
                const list = Array.isArray(data.data) ? data.data : [];
                setRows(list);
                setDraftRates(
                    list.reduce((acc, row) => {
                        acc[row.currency_code] = row.rate_to_usd ?? '';
                        return acc;
                    }, {}),
                );
            })
            .catch((e) => setErr(e.response?.data?.message || e.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, [isAdmin]);

    if (!isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    const saveRate = async (code) => {
        try {
            await api.put(`/admin/settings/currencies/${code}`, {
                rate_to_usd: Number(draftRates[code]),
            });
            toast.success(t('currency_rate_saved'));
            load();
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        }
    };

    const addCurrency = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/settings/currencies', {
                currency_code: newCode,
                ...(newRate !== '' ? { rate_to_usd: Number(newRate) } : {}),
            });
            setNewCode('');
            setNewRate('');
            toast.success(t('currency_added'));
            load();
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        }
    };

    const refreshFromApi = async () => {
        try {
            const { data } = await api.post('/admin/settings/currencies/refresh');
            toast.success(
                t('currency_refresh_done', {
                    updated: data.updated ?? 0,
                    skipped: data.skipped_manual ?? 0,
                }),
            );
            load();
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        }
    };

    return (
        <div className="space-y-5">
            <div className="border-s-4 border-brand ps-4">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('settings_currencies')}</h1>
                <p className="mt-1 text-sm text-slate-500">{t('settings_currencies_subtitle')}</p>
            </div>
            {err && (
                <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>
            )}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card sm:p-6">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={refreshFromApi}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
                    >
                        {t('currency_refresh_api')}
                    </button>
                </div>
                <form onSubmit={addCurrency} className="mb-4 grid gap-2 sm:grid-cols-3">
                    <input
                        value={newCode}
                        onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                        placeholder={t('col_currency')}
                        maxLength={3}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                    <input
                        type="number"
                        step="0.000001"
                        min="0"
                        value={newRate}
                        onChange={(e) => setNewRate(e.target.value)}
                        placeholder={t('currency_rate_to_usd')}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                    <button
                        type="submit"
                        className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white"
                    >
                        {t('currency_add')}
                    </button>
                </form>
                <div className="overflow-auto">
                    <table className="min-w-full text-start text-sm">
                        <thead className="bg-surface-muted/90 text-xs font-semibold uppercase tracking-wide text-slate-600">
                            <tr>
                                <th className="px-3 py-2">{t('col_currency')}</th>
                                <th className="px-3 py-2">{t('currency_rate_to_usd')}</th>
                                <th className="px-3 py-2">{t('col_source')}</th>
                                <th className="px-3 py-2">{t('col_updated')}</th>
                                <th className="px-3 py-2">{t('col_actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loading && rows.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-3 py-8 text-center text-slate-500">{t('empty')}</td>
                                </tr>
                            ) : null}
                            {rows.map((row) => (
                                <tr key={row.id} className="border-t border-slate-100">
                                    <td className="px-3 py-2 font-medium text-slate-900">{row.currency_code}</td>
                                    <td className="px-3 py-2">
                                        <input
                                            type="number"
                                            step="0.000001"
                                            min="0"
                                            value={draftRates[row.currency_code] ?? ''}
                                            onChange={(e) => setDraftRates((prev) => ({ ...prev, [row.currency_code]: e.target.value }))}
                                            className="w-40 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                                        />
                                    </td>
                                    <td className="px-3 py-2 text-slate-700">{row.source ?? '—'}</td>
                                    <td className="px-3 py-2 text-slate-700">{row.updated_at ? new Date(row.updated_at).toLocaleString() : '—'}</td>
                                    <td className="px-3 py-2">
                                        <button
                                            type="button"
                                            onClick={() => saveRate(row.currency_code)}
                                            className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-700"
                                        >
                                            {t('product_form_save')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
