import { useEffect, useState } from 'react';
import { Navigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import useStoreScope from '../hooks/useStoreScope';
import api from '../api/client';

const FIELD_DEFINITIONS = {
    paypal: [
        { key: 'client_id', label: 'Client ID', placeholder: 'paypal_client_id' },
        { key: 'client_secret', label: 'Client Secret', placeholder: 'paypal_client_secret' },
        { key: 'webhook_id', label: 'Webhook ID', placeholder: 'paypal_webhook_id' },
    ],
    stripe: [
        { key: 'publishable_key', label: 'Publishable key', placeholder: 'pk_test_xxx' },
        { key: 'secret_key', label: 'Secret key', placeholder: 'sk_live_xxx' },
        { key: 'webhook_secret', label: 'Webhook secret', placeholder: 'whsec_xxx' },
    ],
    cod: [
        { key: 'instructions', label: 'Instructions shown at checkout', placeholder: 'COD instructions' },
    ],
    bank_transfer: [
        { key: 'account_name', label: 'Account name', placeholder: 'Acme Commerce' },
        { key: 'account_number', label: 'Account number', placeholder: 'DE... / IBAN' },
        { key: 'bank_name', label: 'Bank name', placeholder: 'Example Bank' },
    ],
    tabby: [
        { key: 'api_key', label: 'API Key', placeholder: 'tabby_api_key' },
        { key: 'api_secret', label: 'API Secret', placeholder: 'tabby_api_secret' },
        { key: 'merchant_id', label: 'Merchant ID', placeholder: 'merchant_123' },
    ],
    tamara: [
        { key: 'api_key', label: 'API Key', placeholder: 'tamara_api_key' },
        { key: 'merchant_token', label: 'Merchant token', placeholder: 'tamara_merchant_token' },
        { key: 'merchant_id', label: 'Merchant ID', placeholder: 'merchant_123' },
    ],
    paymob: [
        { key: 'api_key', label: 'API Key', placeholder: 'paymob_api_key' },
        { key: 'public_key', label: 'Public Key', placeholder: 'paymob_public_key' },
        { key: 'secret_key', label: 'Secret Key', placeholder: 'paymob_secret_key' },
        { key: 'iframe_id', label: 'iFrame ID', placeholder: '12345' },
    ],
    fawry: [
        { key: 'merchant_code', label: 'Merchant code', placeholder: 'fawry_merchant_code' },
        { key: 'security_key', label: 'Security key', placeholder: 'fawry_security_key' },
        { key: 'merchant_ref', label: 'Merchant ref', placeholder: 'merchant ref' },
    ],
};

const EMPTY_GATEWAY = {
    enabled: false,
    test_mode: false,
    order: 100,
    notes: '',
    credentials: {},
};

function normalizeGateway(row) {
    return {
        ...EMPTY_GATEWAY,
        ...row,
        gateway: row?.slug || row?.gateway || '',
        enabled: Boolean(row?.enabled),
        test_mode: Boolean(row?.test_mode),
        order: Number.isFinite(Number(row?.order)) ? Number(row.order) : 100,
        notes: row?.notes ?? '',
        credentials: row?.credentials && typeof row.credentials === 'object' ? row.credentials : {},
    };
}

function unwrapRows(response) {
    const rows = Array.isArray(response?.data)
        ? response.data
        : (Array.isArray(response?.data?.data) ? response.data.data : []);
    return rows.map(normalizeGateway);
}

export default function StorePaymentsPage() {
    const { apiBase, owner } = useStoreScope();
    const { permissions } = useOutletContext();
    const can = (permission) => permissions.includes(permission);
    const { t } = useTranslation();
    const [gateways, setGateways] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const authorized = owner !== false || can('stores-edit');

    useEffect(() => {
        if (!authorized) return undefined;

        let cancel = false;
        setLoading(true);
        setError('');

        api.get(`${apiBase}/payments`)
            .then(({ data }) => {
                if (!cancel) setGateways(unwrapRows(data));
            })
            .catch((e) => {
                if (!cancel) setError(e.response?.data?.message || e.message);
            })
            .finally(() => {
                if (!cancel) setLoading(false);
            });

        return () => {
            cancel = true;
        };
    }, [apiBase, authorized]);

    if (!authorized) {
        return <Navigate to="/stores" replace />;
    }

    function updateGateway(slug, updates) {
        setGateways((rows) => rows.map((row) => (row.gateway === slug ? { ...row, ...updates } : row)));
    }

    function updateCredential(slug, key, value) {
        setGateways((rows) =>
            rows.map((row) => {
                if (row.gateway !== slug) return row;
                return {
                    ...row,
                    credentials: {
                        ...row.credentials,
                        [key]: value,
                    },
                };
            }),
        );
    }

    async function saveSettings(e) {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const payload = gateways.map((gateway) => ({
                slug: gateway.gateway,
                enabled: !!gateway.enabled,
                test_mode: !!gateway.test_mode,
                order: Number(gateway.order || 0),
                notes: gateway.notes || '',
                credentials: Object.fromEntries(
                    Object.entries(gateway.credentials || {}).filter(([, value]) => typeof value === 'string' && value.trim() !== ''),
                ),
            }));

            const { data } = await api.put(`${apiBase}/payments`, {
                gateways: payload,
            });

            setGateways(unwrapRows(data));
            toast.success(t('changes_saved', 'Changes saved.'));
        } catch (e) {
            const msg = e.response?.data?.message || e.message;
            setError(msg);
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    }

    if (loading && gateways.length === 0 && !error) {
        return <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">... {t('loading', 'Loading...')}</p>;
    }

    if (error && gateways.length === 0) {
        return <p className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</p>;
    }

    return (
        <form onSubmit={saveSettings} className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('store_payment_settings', 'Payment settings')}</h1>
                <p className="mt-1 text-sm text-slate-500">
                    {t('store_payment_subtitle', 'Enable and configure gateways for this store.')}
                </p>
            </div>

            {error ? (
                <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
            ) : null}

            <div className="space-y-4">
                {gateways.map((gateway) => {
                    const slug = String(gateway.gateway || '').toLowerCase();
                    const fieldSet = Array.isArray(gateway.credential_fields) && gateway.credential_fields.length > 0
                        ? gateway.credential_fields.map((key) => ({
                            key,
                            label: key.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
                            placeholder: key,
                        }))
                        : (FIELD_DEFINITIONS[slug] || []);
                    const displayName = gateway.name || slug || t('payment_gateway', 'Payment gateway');

                    return (
                        <section
                            key={gateway.id ?? slug}
                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <h2 className="text-lg font-semibold text-slate-900">{displayName}</h2>
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{slug}</span>
                            </div>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <label className="rounded-xl border border-slate-200 p-3">
                                    <p className="mb-1 text-xs text-slate-500">{t('enabled', 'Enabled')}</p>
                                    <input
                                        type="checkbox"
                                        checked={gateway.enabled}
                                        onChange={(e) => updateGateway(gateway.gateway, { enabled: e.target.checked })}
                                    />
                                </label>
                                <label className="rounded-xl border border-slate-200 p-3">
                                    <p className="mb-1 text-xs text-slate-500">{t('test_mode', 'Test mode')}</p>
                                    <input
                                        type="checkbox"
                                        checked={gateway.test_mode}
                                        onChange={(e) => updateGateway(gateway.gateway, { test_mode: e.target.checked })}
                                    />
                                </label>
                                <label className="rounded-xl border border-slate-200 p-3">
                                    <p className="mb-1 text-xs text-slate-500">{t('store_payment_order', 'Order')}</p>
                                    <input
                                        type="number"
                                        min="0"
                                        value={gateway.order}
                                        onChange={(e) => updateGateway(gateway.gateway, { order: Number(e.target.value) })}
                                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                                    />
                                </label>
                                <label className="rounded-xl border border-slate-200 p-3">
                                    <p className="mb-1 text-xs text-slate-500">{t('store_payment_note', 'Note')}</p>
                                    <input
                                        value={gateway.notes}
                                        placeholder={t('optional', 'Optional')}
                                        onChange={(e) => updateGateway(gateway.gateway, { notes: e.target.value })}
                                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                                    />
                                </label>
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                {fieldSet.map((field) => (
                                    <label key={`${gateway.gateway}-${field.key}`} className="rounded-xl border border-slate-200 p-3">
                                        <p className="mb-1 text-xs text-slate-500">{field.label}</p>
                                        <input
                                            type="text"
                                            value={gateway.credentials?.[field.key] || ''}
                                            placeholder={field.placeholder}
                                            onChange={(e) => updateCredential(gateway.gateway, field.key, e.target.value)}
                                            className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                                        />
                                    </label>
                                ))}
                            </div>
                        </section>
                    );
                })}
            </div>

            <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-slate-500">
                    {t('store_payment_hint', 'Saved data is stored under the store payment gate settings.')}
                </p>
                <button
                    type="submit"
                    disabled={saving || loading}
                    className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                    {saving ? t('saving', 'Saving...') : t('action_save', 'Save changes')}
                </button>
            </div>
        </form>
    );
}
