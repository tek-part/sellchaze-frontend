import { useEffect, useState } from 'react';
import { Navigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import api from '../../api/client';

function unwrap(o) {
    return o?.data ?? o;
}

/** Fixed Wawp API origin (not shown in UI). Override via VITE_WAWP_API_BASE_URL for local/dev only. */
function wawpApiBaseUrl() {
    const fromEnv = import.meta.env.VITE_WAWP_API_BASE_URL;
    if (fromEnv && String(fromEnv).trim() !== '') {
        return String(fromEnv).trim().replace(/\/$/, '');
    }
    return 'https://api.wawp.net';
}

export default function WavexSettingsPage() {
    const { t } = useTranslation();
    const { permissions } = useOutletContext();
    const can = (p) => permissions.includes(p);
    const [row, setRow] = useState(null);
    const [instanceId, setInstanceId] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const [defaultCampaignDelay, setDefaultCampaignDelay] = useState(500);
    const [err, setErr] = useState('');
    const [saved, setSaved] = useState(false);

    // Build webhook URL from the API base
    const apiBase = (api.defaults.baseURL || '/api/v1').replace(/\/api\/v1$/, '').replace(/\/$/, '');
    const webhookUrl = apiBase ? `${apiBase}/api/v1/wavex/webhook` : `${window.location.origin}/api/v1/wavex/webhook`;

    useEffect(() => {
        api
            .get('/wavex/settings')
            .then(({ data }) => {
                const d = data?.data ?? unwrap(data);
                setRow(d);
                setInstanceId(d.instance_id || '');
                if (d.default_campaign_delay_seconds != null && Number.isFinite(Number(d.default_campaign_delay_seconds))) {
                    setDefaultCampaignDelay(Number(d.default_campaign_delay_seconds));
                }
            })
            .catch((e) => setErr(e.response?.data?.message || e.message));
    }, []);

    if (!can('wavex-access')) {
        return <Navigate to="/dashboard" replace />;
    }

    async function save(e) {
        e.preventDefault();
        setErr('');
        setSaved(false);
        try {
            const payload = {
                base_url: wawpApiBaseUrl(),
                instance_id: instanceId || null,
                default_campaign_delay_seconds: Number(defaultCampaignDelay) >= 1 ? Number(defaultCampaignDelay) : 500,
            };
            if (accessToken.trim()) {
                payload.access_token = accessToken.trim();
            }
            const { data } = await api.put('/wavex/settings', payload);
            setRow(data?.data ?? unwrap(data));
            setAccessToken('');
            setSaved(true);
        } catch (e) {
            setErr(e.response?.data?.message || e.message);
        }
    }

    return (
        <div className="grid w-full min-w-0 grid-cols-12 gap-6">
            <div className="col-span-12 min-w-0 space-y-6">
                <div className="border-s-4 border-brand ps-4">
                    <h1 className="text-2xl font-bold text-slate-900">{t('wavex_settings_title')}</h1>
                    <p className="mt-1 text-sm text-slate-500">{t('wavex_settings_subtitle')}</p>
                </div>
                {err && (
                    <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>
                )}
                {saved && (
                    <p className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                        {t('wavex_saved')}
                    </p>
                )}
                <motion.form
                    onSubmit={save}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card"
                >
                    <div>
                        <label className="block text-sm font-medium text-slate-700">{t('wavex_instance_id')}</label>
                        <input
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm"
                            value={instanceId}
                            onChange={(e) => setInstanceId(e.target.value)}
                            placeholder="12-character instance id"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">{t('wavex_access_token')}</label>
                        <input
                            type="password"
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                            value={accessToken}
                            onChange={(e) => setAccessToken(e.target.value)}
                            placeholder={row?.access_token_masked ? `(${row.access_token_masked})` : '••••••••'}
                            autoComplete="off"
                        />
                        {row?.access_token_masked ? (
                            <p className="mt-1 text-xs text-slate-500">
                                {t('wavex_token_masked')}: {row.access_token_masked}
                            </p>
                        ) : null}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">{t('wavex_settings_default_delay')}</label>
                        <input
                            type="number"
                            min={1}
                            max={86400}
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                            value={defaultCampaignDelay}
                            onChange={(e) => setDefaultCampaignDelay(Number(e.target.value))}
                        />
                        <p className="mt-1 text-xs text-slate-500">{t('wavex_settings_default_delay_hint')}</p>
                    </div>
                    <button
                        type="submit"
                        className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-brand-dark"
                    >
                        {t('wavex_save')}
                    </button>
                </motion.form>

                <motion.section
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-6 shadow-card"
                >
                    <h2 className="text-lg font-semibold text-slate-900">{t('wavex_settings_webhook_title')}</h2>
                    <p className="text-sm text-slate-600">{t('wavex_settings_webhook_desc')}</p>
                    <div className="flex items-center gap-2">
                        <input
                            readOnly
                            value={webhookUrl}
                            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm text-slate-800"
                            onClick={(e) => e.target.select()}
                        />
                        <button
                            type="button"
                            onClick={() => {
                                navigator.clipboard.writeText(webhookUrl);
                                setSaved(true);
                                setTimeout(() => setSaved(false), 2000);
                            }}
                            className="shrink-0 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
                        >
                            {t('wavex_settings_webhook_copy')}
                        </button>
                    </div>
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                        <p className="text-xs text-amber-800">
                            {t('wavex_settings_webhook_events')}
                        </p>
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-6 shadow-card"
                >
                    <h2 className="text-lg font-semibold text-slate-900">{t('wavex_settings_queue_title')}</h2>
                    <p className="text-sm leading-relaxed text-slate-600">{t('wavex_settings_queue_intro')}</p>

                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-slate-800">{t('wavex_settings_queue_env_title')}</h3>
                        <p className="text-sm text-slate-600">{t('wavex_settings_queue_env_body')}</p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-slate-800">{t('wavex_settings_queue_worker_title')}</h3>
                        <pre className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-900 p-4 text-xs text-slate-100">
                            {t('wavex_settings_queue_worker_cmd')}
                        </pre>
                        <p className="text-xs text-slate-500">{t('wavex_settings_queue_worker_hint')}</p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-slate-800">{t('wavex_settings_queue_supervisor_title')}</h3>
                        <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-white p-4 font-mono text-[11px] leading-relaxed text-slate-800">
                            {t('wavex_settings_queue_supervisor_body')}
                        </pre>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-slate-800">{t('wavex_settings_queue_cron_title')}</h3>
                        <p className="text-sm text-slate-600">{t('wavex_settings_queue_cron_body')}</p>
                    </div>
                </motion.section>
            </div>
        </div>
    );
}
