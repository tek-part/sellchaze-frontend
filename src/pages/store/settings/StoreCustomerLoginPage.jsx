import { useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../../api/client';
import PageHeader from '../../../components/PageHeader';
import useStoreContext from '../../../hooks/useStoreContext';
import { useDirty } from '../../../hooks/useStoreSettings';

const errorText = (error) => Object.values(error.response?.data?.errors || {}).flat().join(' ') || error.response?.data?.message || error.message;

/** G2: which sign-in methods the storefront offers customers. E-mail is always on. */
export default function StoreCustomerLoginPage() {
    const context = useStoreContext();
    return <CustomerLoginEditor key={context.apiBase} context={context} />;
}

function CustomerLoginEditor({ context: { apiBase, uiBase, access } }) {
    const { t } = useTranslation();
    const [settings, setSettings] = useState(null);
    const [phone, setPhone] = useState(false);
    const [google, setGoogle] = useState(false);
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);
    const [busy, setBusy] = useState(false);
    const [reload, setReload] = useState(0);
    const working = useRef(false);
    useDirty(settings ? { phone: settings.phone_otp, google: settings.google } : null, settings ? { phone, google } : null);
    const apply = (data) => { setSettings(data); setPhone(data.phone_otp); setGoogle(data.google); };
    useEffect(() => {
        let active = true;
        if (!access.canStoreSettings) return undefined;
        api.get(`${apiBase}/customer-login`).then(({ data }) => { if (active) apply(data.data); }).catch((failure) => { if (active) setError(errorText(failure)); });
        return () => { active = false; };
    }, [apiBase, access.canStoreSettings, reload]);
    if (!access.canStoreSettings) return <Navigate to={`${uiBase}/overview`} replace />;

    async function save(event) {
        event.preventDefault();
        if (working.current || !settings) return;
        working.current = true; setBusy(true); setError(''); setSaved(false);
        try {
            const { data } = await api.put(`${apiBase}/customer-login`, { phone_otp: phone, google, version: settings.version });
            apply(data.data); setSaved(true);
        } catch (failure) { setError(errorText(failure)); }
        finally { working.current = false; setBusy(false); }
    }

    const state = (active, ready) => active ? t('customer_login_state_active') : ready ? t('customer_login_state_off') : t('customer_login_state_unavailable');
    return <div className="ws-customer-login mx-auto max-w-3xl space-y-5">
        <PageHeader title={t('customer_login_title')} subtitle={t('customer_login_subtitle')} />
        {error ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error}<button type="button" className="mx-2 underline" onClick={() => { setError(''); setReload((n) => n + 1); }}>{t('customer_login_reload')}</button></p> : null}
        {saved ? <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-800">{t('customer_login_saved')}</p> : null}
        {!settings && !error ? <p role="status">{t('loading')}</p> : null}
        {settings ? <form className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800" onSubmit={(event) => void save(event)}>
            <fieldset disabled={busy} className="space-y-6">
                <legend className="sr-only">{t('customer_login_title')}</legend>
                <div className="space-y-1">
                    <p className="font-semibold">{t('customer_login_email')}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('customer_login_email_hint')}</p>
                </div>
                <div className="space-y-2" data-testid="customer-login-phone">
                    <label className="flex gap-3 font-semibold">
                        <input type="checkbox" checked={phone} disabled={!settings.whatsapp_ready && !settings.phone_otp} onChange={(event) => setPhone(event.target.checked)} />
                        <span>{t('customer_login_phone')}</span>
                    </label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('customer_login_phone_hint')}</p>
                    <p className="text-sm">{t('customer_login_status')}: {state(settings.phone_otp_active, settings.whatsapp_ready)}</p>
                    {!settings.whatsapp_ready ? <Link className="text-sm underline" to={`${uiBase}/settings/phone-verification`}>{t('customer_login_connect_whatsapp')}</Link> : null}
                </div>
                <div className="space-y-2" data-testid="customer-login-google">
                    <label className="flex gap-3 font-semibold">
                        <input type="checkbox" checked={google} disabled={!settings.google_ready && !settings.google} onChange={(event) => setGoogle(event.target.checked)} />
                        <span>{t('customer_login_google')}</span>
                    </label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('customer_login_google_hint')}</p>
                    <p className="text-sm">{t('customer_login_status')}: {state(settings.google_active, settings.google_ready)}</p>
                    {!settings.google_ready ? <p className="text-sm text-amber-700 dark:text-amber-400">{t('customer_login_google_unavailable')}</p> : null}
                </div>
                <div className="space-y-1">
                    <p className="font-semibold">{t('customer_login_tracking')}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('customer_login_tracking_hint')}</p>
                </div>
            </fieldset>
            <button className="rounded-lg bg-emerald-700 px-5 py-2 font-semibold text-white hover:bg-emerald-800 disabled:opacity-40" disabled={busy}>{t('customer_login_save')}</button>
        </form> : null}
    </div>;
}
