import { useEffect, useMemo, useState } from 'react';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import {
    HiOutlineArrowPath,
    HiOutlineCheck,
    HiOutlineCheckBadge,
    HiOutlineChevronDown,
    HiOutlineClipboard,
    HiOutlineEye,
    HiOutlineEyeSlash,
} from 'react-icons/hi2';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import FormField, { INPUT_CLASS } from '../components/ui/FormField';
import { notify } from '../components/ui/notify';
import SaveBar from '../components/ui/SaveBar';
import Toggle from '../components/ui/Toggle';
import useStoreContext from '../hooks/useStoreContext';
import { useDirty } from '../hooks/useStoreSettings';

const MASK = '********';

/**
 * Normalise one gateway from `GET {apiBase}/payments`. Saved credentials come
 * back masked, so the form keeps them as "configured" flags and only sends the
 * values the user actually typed (blank = keep the stored secret).
 */
function normalizeGateway(row) {
    const fields = Array.isArray(row?.credential_fields) ? row.credential_fields : [];
    const masked = row?.credentials && typeof row.credentials === 'object' ? row.credentials : {};
    return {
        slug: row?.slug || row?.gateway || '',
        name: row?.name || row?.slug || '',
        icon_class: row?.icon_class || '',
        credential_fields: fields,
        enabled: Boolean(row?.enabled),
        test_mode: Boolean(row?.test_mode),
        order: Number.isFinite(Number(row?.order)) ? Number(row.order) : 0,
        notes: row?.notes ?? '',
        configured: Boolean(row?.configured),
        webhook_url: row?.webhook_url || null,
        // Which fields already hold a secret server-side (masked in the response).
        stored: Object.fromEntries(fields.map((key) => [key, masked[key] === MASK || (typeof masked[key] === 'string' && masked[key] !== '')])),
        // Values typed in this session; empty means "leave unchanged".
        credentials: Object.fromEntries(fields.map((key) => [key, ''])),
    };
}

function unwrapRows(response) {
    const rows = Array.isArray(response?.data)
        ? response.data
        : (Array.isArray(response?.data?.data) ? response.data.data : []);
    return rows.map(normalizeGateway);
}

function fieldLabel(t, key) {
    return t(`payment_field_${key}`, key.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()));
}

function SecretInput({ id, value, onChange, stored, placeholder }) {
    const { t } = useTranslation();
    const [reveal, setReveal] = useState(false);
    return (
        <div className="relative">
            <input
                id={id}
                type={reveal ? 'text' : 'password'}
                value={value}
                onChange={onChange}
                autoComplete="off"
                spellCheck={false}
                dir="ltr"
                placeholder={stored ? '••••••••••••' : placeholder}
                className={`${INPUT_CLASS} pe-10 font-mono`}
            />
            <button
                type="button"
                onClick={() => setReveal((v) => !v)}
                className="absolute end-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label={reveal ? t('ui_hide', 'Hide') : t('ui_show', 'Show')}
                tabIndex={-1}
            >
                {reveal ? <HiOutlineEyeSlash className="h-4 w-4" aria-hidden /> : <HiOutlineEye className="h-4 w-4" aria-hidden />}
            </button>
        </div>
    );
}

function CopyField({ value }) {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            /* clipboard unavailable */
        }
    };
    return (
        <div className="flex items-stretch gap-2">
            <input value={value} readOnly dir="ltr" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-xs text-slate-700" />
            <button
                type="button"
                onClick={copy}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
                {copied ? <HiOutlineCheck className="h-4 w-4 text-emerald-600" aria-hidden /> : <HiOutlineClipboard className="h-4 w-4" aria-hidden />}
                {copied ? t('action_copied', 'Copied') : t('action_copy', 'Copy')}
            </button>
        </div>
    );
}

function GatewayCard({ gateway, onChange, onCredential }) {
    const { t } = useTranslation();
    const hasFields = gateway.credential_fields.length > 0;
    const monogram = gateway.name.slice(0, 2).toUpperCase();

    return (
        <Disclosure as="section" defaultOpen={gateway.enabled} className={`overflow-hidden rounded-2xl border bg-white shadow-card transition ${gateway.enabled ? 'border-brand/30' : 'border-slate-200/80'}`}>
            {({ open }) => (
                <>
                    <div className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${gateway.enabled ? 'bg-brand text-white' : 'bg-slate-100 text-slate-500'}`} aria-hidden>
                            {monogram}
                        </span>
                        <DisclosureButton className="flex min-w-0 flex-1 items-center gap-3 text-start outline-none">
                            <span className="min-w-0 flex-1">
                                <span className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-semibold text-slate-900">{gateway.name}</span>
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-500">{gateway.slug}</span>
                                    {gateway.configured ? (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                                            <HiOutlineCheckBadge className="h-3.5 w-3.5" aria-hidden />
                                            {t('store_payments_configured', 'Configured')}
                                        </span>
                                    ) : hasFields ? (
                                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
                                            {t('store_payments_needs_setup', 'Needs credentials')}
                                        </span>
                                    ) : null}
                                    {gateway.enabled && gateway.test_mode ? (
                                        <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700 ring-1 ring-violet-200">
                                            {t('store_payments_test_badge', 'Test mode')}
                                        </span>
                                    ) : null}
                                </span>
                                <span className="mt-0.5 block text-xs text-slate-500">
                                    {gateway.enabled ? t('store_payments_enabled_hint', 'Offered at checkout') : t('store_payments_disabled_hint', 'Hidden from checkout')}
                                </span>
                            </span>
                            <HiOutlineChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
                        </DisclosureButton>
                        <Toggle checked={gateway.enabled} onChange={(v) => onChange({ enabled: v })} size="sm" />
                    </div>

                    <DisclosurePanel className="border-t border-slate-100 bg-slate-50/40 px-4 py-4 sm:px-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Toggle
                                checked={gateway.test_mode}
                                onChange={(v) => onChange({ test_mode: v })}
                                label={t('store_payments_test_mode', 'Test mode')}
                                description={t('store_payments_test_mode_hint', 'Use sandbox credentials; no real charges.')}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-3"
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <FormField label={t('store_payments_order', 'Order')} htmlFor={`${gateway.slug}-order`} hint={t('store_payments_order_hint', 'Lower shows first')}>
                                    <input
                                        id={`${gateway.slug}-order`}
                                        type="number"
                                        min="0"
                                        value={gateway.order}
                                        onChange={(e) => onChange({ order: Number(e.target.value) })}
                                        className={INPUT_CLASS}
                                        dir="ltr"
                                    />
                                </FormField>
                                <FormField label={t('store_payments_notes', 'Note')} htmlFor={`${gateway.slug}-notes`} hint={t('store_payments_notes_hint', 'Shown at checkout')}>
                                    <input
                                        id={`${gateway.slug}-notes`}
                                        value={gateway.notes}
                                        onChange={(e) => onChange({ notes: e.target.value })}
                                        placeholder={t('optional', 'Optional')}
                                        className={INPUT_CLASS}
                                        maxLength={2000}
                                    />
                                </FormField>
                            </div>
                        </div>

                        {hasFields ? (
                            <div className="mt-4">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{t('store_payments_credentials', 'Credentials')}</p>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {gateway.credential_fields.map((key) => (
                                        <FormField
                                            key={key}
                                            label={fieldLabel(t, key)}
                                            htmlFor={`${gateway.slug}-${key}`}
                                            hint={gateway.stored[key] ? t('store_payments_keep_hint', 'Saved — leave blank to keep the current value.') : undefined}
                                        >
                                            <SecretInput
                                                id={`${gateway.slug}-${key}`}
                                                value={gateway.credentials[key] ?? ''}
                                                stored={gateway.stored[key]}
                                                placeholder={key}
                                                onChange={(e) => onCredential(key, e.target.value)}
                                            />
                                        </FormField>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {gateway.webhook_url ? (
                            <div className="mt-4">
                                <FormField label={t('store_payments_webhook', 'Webhook URL')} hint={t('store_payments_webhook_hint', 'Paste this into the gateway dashboard so payment events reach your store.')}>
                                    <CopyField value={gateway.webhook_url} />
                                </FormField>
                            </div>
                        ) : null}
                    </DisclosurePanel>
                </>
            )}
        </Disclosure>
    );
}

export default function StorePaymentsPage() {
    const { t } = useTranslation();
    const { apiBase } = useStoreContext();
    const [initial, setInitial] = useState([]);
    const [gateways, setGateways] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancel = false;
        setLoading(true);
        api.get(`${apiBase}/payments`)
            .then(({ data }) => {
                if (cancel) return;
                const rows = unwrapRows(data);
                setInitial(rows);
                setGateways(rows);
                setError('');
            })
            .catch((e) => { if (!cancel) setError(e.response?.data?.message || e.message); })
            .finally(() => { if (!cancel) setLoading(false); });
        return () => { cancel = true; };
    }, [apiBase]);

    const dirty = useDirty(initial, gateways);
    const enabledCount = useMemo(() => gateways.filter((g) => g.enabled).length, [gateways]);

    const updateGateway = (slug, patch) => setGateways((rows) => rows.map((row) => (row.slug === slug ? { ...row, ...patch } : row)));
    const updateCredential = (slug, key, value) => setGateways((rows) => rows.map((row) => (
        row.slug === slug ? { ...row, credentials: { ...row.credentials, [key]: value } } : row
    )));

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const payload = gateways.map((gateway) => ({
                slug: gateway.slug,
                enabled: Boolean(gateway.enabled),
                test_mode: Boolean(gateway.test_mode),
                order: Number(gateway.order || 0),
                notes: gateway.notes || '',
                credentials: Object.fromEntries(
                    Object.entries(gateway.credentials || {}).filter(([, value]) => typeof value === 'string' && value.trim() !== ''),
                ),
            }));
            const { data } = await api.put(`${apiBase}/payments`, { gateways: payload });
            const rows = unwrapRows(data);
            setInitial(rows);
            setGateways(rows);
            notify.success(t('ui_changes_saved', 'Changes saved'));
        } catch (err) {
            const first = err.response?.data?.errors ? Object.values(err.response.data.errors)?.[0]?.[0] : null;
            const msg = first || err.response?.data?.message || err.message;
            setError(msg);
            notify.error(t('ui_save_failed', 'Could not save changes'), msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={submit} className="mx-auto max-w-4xl space-y-5">
            <PageHeader
                title={t('store_payments_title', 'Payment gateways')}
                subtitle={t('store_payments_subtitle', 'Choose how customers pay and connect each provider with its own keys.')}
                badge={!loading ? (
                    <span className="rounded-full bg-brand-light px-2.5 py-1 text-xs font-semibold text-brand">
                        {t('store_payments_enabled_count', '{{count}} enabled', { count: enabledCount })}
                    </span>
                ) : null}
            />

            {error ? <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

            {loading ? (
                <div className="flex items-center justify-center rounded-2xl border border-slate-200/80 bg-white py-16 shadow-card">
                    <HiOutlineArrowPath className="h-7 w-7 animate-spin text-brand" aria-hidden />
                </div>
            ) : gateways.length === 0 ? (
                <p className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center text-sm text-slate-500 shadow-card">{t('store_payments_empty', 'No payment providers are available for this store.')}</p>
            ) : (
                <div className="space-y-3">
                    {gateways.map((gateway) => (
                        <GatewayCard
                            key={gateway.slug}
                            gateway={gateway}
                            onChange={(patch) => updateGateway(gateway.slug, patch)}
                            onCredential={(key, value) => updateCredential(gateway.slug, key, value)}
                        />
                    ))}
                </div>
            )}

            <p className="text-xs text-slate-400">{t('store_payments_secrets_hint', 'Secrets are encrypted at rest and never shown again after saving.')}</p>

            <SaveBar dirty={dirty} saving={saving} onReset={() => setGateways(initial)} />
        </form>
    );
}
