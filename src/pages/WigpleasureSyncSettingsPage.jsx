import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';

function toggleInSet(set, value) {
    const next = new Set(set);
    if (next.has(value)) {
        next.delete(value);
    } else {
        next.add(value);
    }
    return next;
}

export default function WigpleasureSyncSettingsPage() {
    const { t } = useTranslation();
    const { isAdmin } = useOutletContext();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [busy, setBusy] = useState('');
    const [err, setErr] = useState('');
    const [baseUrl, setBaseUrl] = useState('');
    const [storefrontUrl, setStorefrontUrl] = useState('');
    const [validStatuses, setValidStatuses] = useState([]);
    const [selectedStatuses, setSelectedStatuses] = useState(() => new Set());

    const load = useCallback(() => {
        if (!isAdmin) {
            return;
        }
        setErr('');
        setLoading(true);
        api.get('/admin/settings/wigpleasure-sync')
            .then(({ data }) => {
                setBaseUrl(data.wigpleasure_pull_base_url ?? '');
                setStorefrontUrl(data.wigpleasure_storefront_url ?? '');
                setValidStatuses(Array.isArray(data.valid_order_statuses) ? data.valid_order_statuses : []);
                const sel = data.order_sync_statuses ?? [];
                setSelectedStatuses(new Set(Array.isArray(sel) ? sel : []));
            })
            .catch((e) => setErr(e.response?.data?.message || e.message))
            .finally(() => setLoading(false));
    }, [isAdmin]);

    useEffect(() => {
        load();
    }, [load]);

    /** Current form base URL (no need to save before Test connection / sync). */
    const wigpleasureActionBody = useMemo(() => {
        const payload = {};
        if (baseUrl.trim() !== '') {
            payload.wigpleasure_pull_base_url = baseUrl.trim();
        }
        return payload;
    }, [baseUrl]);

    async function onSave(e) {
        e.preventDefault();
        if (selectedStatuses.size === 0) {
            toast.error(t('wigpleasure_sync_statuses_required'));
            return;
        }
        setSaving(true);
        setErr('');
        try {
            const { data } = await api.put('/admin/settings/wigpleasure-sync', {
                wigpleasure_pull_base_url: baseUrl.trim(),
                wigpleasure_storefront_url: storefrontUrl.trim(),
                order_sync_statuses: [...selectedStatuses],
            });
            toast.success(data.message || t('wigpleasure_sync_saved'));
            const sel = data.order_sync_statuses ?? [];
            setSelectedStatuses(new Set(Array.isArray(sel) ? sel : []));
        } catch (e) {
            const msg = e.response?.data?.message || e.message;
            setErr(msg);
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    }

    async function runPing() {
        setBusy('ping');
        setErr('');
        try {
            const { data } = await api.post('/admin/wigpleasure-sync/ping', wigpleasureActionBody);
            toast.success(data.message || (data.ok ? t('wigpleasure_sync_ping_ok') : t('wigpleasure_sync_ping_fail')));
        } catch (e) {
            const msg = e.response?.data?.message || e.message;
            setErr(msg);
            toast.error(msg);
        } finally {
            setBusy('');
        }
    }

    async function runCatalog() {
        setBusy('catalog');
        setErr('');
        try {
            const { data } = await api.post('/admin/wigpleasure-sync/catalog', wigpleasureActionBody);
            const r = data.result ?? {};
            toast.success(
                t('wigpleasure_sync_catalog_done', {
                    c: r.categories ?? 0,
                    p: r.products ?? 0,
                    a: r.attributes ?? 0,
                    v: r.attribute_values ?? 0,
                })
            );
        } catch (e) {
            const msg = e.response?.data?.message || e.message;
            setErr(msg);
            toast.error(msg);
        } finally {
            setBusy('');
        }
    }

    async function runOrders() {
        setBusy('orders');
        setErr('');
        try {
            const { data } = await api.post('/admin/wigpleasure-sync/orders', wigpleasureActionBody);
            const r = data.result ?? {};
            toast.success(
                t('wigpleasure_sync_orders_done', {
                    created: r.created ?? 0,
                    updated: r.updated ?? 0,
                    err: (r.errors ?? []).length,
                })
            );
        } catch (e) {
            const msg = e.response?.data?.message || e.message;
            setErr(msg);
            toast.error(msg);
        } finally {
            setBusy('');
        }
    }

    if (!isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="space-y-6">
            <div className="border-s-4 border-brand ps-4">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('wigpleasure_sync_title')}</h1>
                <p className="mt-1 text-sm text-slate-500">{t('wigpleasure_sync_subtitle')}</p>
            </div>

            {err ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</div>
            ) : null}

            {loading ? (
                <p className="text-sm text-slate-500">{t('table_loading')}</p>
            ) : (
                <form onSubmit={onSave} className="space-y-6">
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
                        <h2 className="text-lg font-semibold text-slate-900">{t('wigpleasure_sync_connection')}</h2>
                        <p className="mt-1 text-sm text-slate-600">{t('wigpleasure_sync_connection_hint')}</p>
                        <label className="mt-4 block text-sm font-medium text-slate-700">
                            {t('wigpleasure_sync_base_url')}
                            <input
                                type="url"
                                value={baseUrl}
                                onChange={(e) => setBaseUrl(e.target.value)}
                                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900"
                                placeholder="http://127.0.0.1:8001/ar"
                                required
                            />
                        </label>
                        <label className="mt-4 block text-sm font-medium text-slate-700">
                            {t('wigpleasure_sync_storefront_url')}
                            <input
                                type="url"
                                value={storefrontUrl}
                                onChange={(e) => setStorefrontUrl(e.target.value)}
                                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900"
                                placeholder="https://wigpleasure.com"
                            />
                            <span className="mt-1 block text-xs font-normal text-slate-500">
                                {t('wigpleasure_sync_storefront_hint')}
                            </span>
                        </label>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <button
                                type="button"
                                disabled={busy !== ''}
                                onClick={() => void runPing()}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                            >
                                {busy === 'ping' ? '…' : t('wigpleasure_sync_ping')}
                            </button>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
                        <h2 className="text-lg font-semibold text-slate-900">{t('wigpleasure_sync_order_statuses')}</h2>
                        <p className="mt-1 text-sm text-slate-600">{t('wigpleasure_sync_order_statuses_hint')}</p>
                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            {validStatuses.map((s) => (
                                <label key={s} className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
                                    <input
                                        type="checkbox"
                                        checked={selectedStatuses.has(s)}
                                        onChange={() => setSelectedStatuses((prev) => toggleInSet(prev, s))}
                                        className="h-4 w-4 rounded-sm border-slate-300 text-brand"
                                    />
                                    <span className="font-mono text-xs">{s}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
                        <h2 className="text-lg font-semibold text-slate-900">{t('wigpleasure_sync_actions')}</h2>
                        <p className="mt-1 text-sm text-slate-600">{t('wigpleasure_sync_actions_hint')}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <button
                                type="button"
                                disabled={busy !== ''}
                                onClick={() => void runCatalog()}
                                className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
                            >
                                {busy === 'catalog' ? '…' : t('wigpleasure_sync_run_catalog')}
                            </button>
                            <button
                                type="button"
                                disabled={busy !== ''}
                                onClick={() => void runOrders()}
                                className="rounded-xl border border-brand bg-brand-light/50 px-4 py-2 text-sm font-semibold text-brand-dark hover:bg-brand-light disabled:opacity-50"
                            >
                                {busy === 'orders' ? '…' : t('wigpleasure_sync_run_orders')}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                        {saving ? '…' : t('wigpleasure_sync_save')}
                    </button>
                </form>
            )}
        </div>
    );
}
