import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';
import SearchableSelect from '../components/ui/SearchableSelect';

/** @typedef {{ key: string, description: string, placeholders: string, subject: string | null, has_custom_body: boolean }} TemplateIndexRow */

export default function EmailSettingsPage() {
    const { t } = useTranslation();
    const { isAdmin } = useOutletContext();
    const [activeTab, setActiveTab] = useState(/** @type {'smtp' | 'templates' | 'logs'} */ ('smtp'));

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [err, setErr] = useState('');
    const [testTo, setTestTo] = useState('');

    const [mailMailer, setMailMailer] = useState('smtp');
    const [mailHost, setMailHost] = useState('');
    const [mailPort, setMailPort] = useState('');
    const [mailUsername, setMailUsername] = useState('');
    const [mailPassword, setMailPassword] = useState('');
    const [mailEncryption, setMailEncryption] = useState('');
    const [mailFromAddress, setMailFromAddress] = useState('');
    const [mailFromName, setMailFromName] = useState('');
    const [passwordConfigured, setPasswordConfigured] = useState(false);

    const [tplList, setTplList] = useState(/** @type {TemplateIndexRow[]} */ ([]));
    const [tplListLoading, setTplListLoading] = useState(false);
    const [tplKey, setTplKey] = useState('');
    const [tplSubject, setTplSubject] = useState('');
    const [tplBody, setTplBody] = useState('');
    const [tplDefaultSubject, setTplDefaultSubject] = useState('');
    const [tplDefaultBody, setTplDefaultBody] = useState('');
    const [tplPlaceholders, setTplPlaceholders] = useState('');
    const [tplDetailLoading, setTplDetailLoading] = useState(false);
    const [tplSaving, setTplSaving] = useState(false);

    const [logsLoading, setLogsLoading] = useState(false);
    const [logsRows, setLogsRows] = useState([]);
    const [logsMeta, setLogsMeta] = useState({ current_page: 1, last_page: 1, per_page: 20, total: 0 });

    const applyPayload = useCallback((data) => {
        if (!data) return;
        setMailMailer(data.mail_mailer || 'smtp');
        setMailHost(data.mail_host ?? '');
        setMailPort(data.mail_port != null ? String(data.mail_port) : '');
        setMailUsername(data.mail_username ?? '');
        setMailPassword('');
        setMailEncryption(data.mail_encryption != null ? String(data.mail_encryption) : '');
        setMailFromAddress(data.mail_from_address ?? '');
        setMailFromName(data.mail_from_name ?? '');
        setPasswordConfigured(!!data.mail_password_configured);
    }, []);

    const load = useCallback(() => {
        if (!isAdmin) {
            return;
        }
        setErr('');
        setLoading(true);
        api.get('/admin/settings/email')
            .then(({ data }) => {
                applyPayload(data);
            })
            .catch((e) => setErr(e.response?.data?.message || e.message))
            .finally(() => setLoading(false));
    }, [isAdmin, applyPayload]);

    useEffect(() => {
        load();
    }, [load]);

    const loadTemplateList = useCallback(() => {
        if (!isAdmin) return;
        setTplListLoading(true);
        api.get('/admin/settings/email-templates')
            .then(({ data }) => {
                const rows = data.data || [];
                setTplList(rows);
                setTplKey((k) => k || rows[0]?.key || '');
            })
            .catch((e) => toast.error(e.response?.data?.message || e.message))
            .finally(() => setTplListLoading(false));
    }, [isAdmin]);

    const loadTemplateDetail = useCallback(
        (key) => {
            if (!key || !isAdmin) return;
            setTplDetailLoading(true);
            api.get(`/admin/settings/email-templates/${encodeURIComponent(key)}`)
                .then(({ data }) => {
                    setTplSubject(data.subject ?? '');
                    setTplBody(data.body_html ?? '');
                    setTplDefaultSubject(data.default_subject ?? '');
                    setTplDefaultBody(data.default_body_html ?? '');
                    setTplPlaceholders(data.placeholders ?? '');
                })
                .catch((e) => toast.error(e.response?.data?.message || e.message))
                .finally(() => setTplDetailLoading(false));
        },
        [isAdmin]
    );

    useEffect(() => {
        if (activeTab === 'templates' && isAdmin) {
            loadTemplateList();
        }
    }, [activeTab, isAdmin, loadTemplateList]);

    useEffect(() => {
        if (activeTab === 'templates' && tplKey) {
            loadTemplateDetail(tplKey);
        }
    }, [activeTab, tplKey, loadTemplateDetail]);

    const loadLogs = useCallback(
        (page = 1) => {
            if (!isAdmin) return;
            setLogsLoading(true);
            api.get('/admin/settings/email-logs', { params: { page, per_page: 20 } })
                .then(({ data }) => {
                    setLogsRows(data.data || []);
                    setLogsMeta(data.meta || { current_page: 1, last_page: 1, per_page: 20, total: 0 });
                })
                .catch((e) => toast.error(e.response?.data?.message || e.message))
                .finally(() => setLogsLoading(false));
        },
        [isAdmin]
    );

    useEffect(() => {
        if (activeTab === 'logs' && isAdmin) {
            loadLogs(1);
        }
    }, [activeTab, isAdmin, loadLogs]);

    async function onSubmit(e) {
        e.preventDefault();
        setSaving(true);
        setErr('');
        try {
            const payload = {
                mail_mailer: mailMailer || 'smtp',
                mail_host: mailHost.trim(),
                mail_port: mailPort.trim(),
                mail_username: mailUsername.trim(),
                mail_encryption: mailEncryption === '' ? null : mailEncryption,
                mail_from_address: mailFromAddress.trim(),
                mail_from_name: mailFromName.trim(),
            };
            if (mailPassword.trim() !== '') {
                payload.mail_password = mailPassword.trim();
            }
            const { data } = await api.put('/admin/settings/email', payload);
            toast.success(data.message || t('settings_email_saved'));
            applyPayload(data);
        } catch (e) {
            const msg = e.response?.data?.message || e.message;
            setErr(msg);
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    }

    async function onSendTest(e) {
        e.preventDefault();
        const to = testTo.trim();
        if (!to) {
            toast.error(t('settings_email_test_to_required'));
            return;
        }
        setTesting(true);
        try {
            const { data } = await api.post('/admin/settings/email/test', { to });
            toast.success(data.message || t('settings_email_test_sent'));
        } catch (e) {
            const msg = e.response?.data?.message || e.message;
            toast.error(msg);
        } finally {
            setTesting(false);
        }
    }

    async function onSaveTemplate(e) {
        e.preventDefault();
        if (!tplKey) return;
        setTplSaving(true);
        try {
            const { data } = await api.put(`/admin/settings/email-templates/${encodeURIComponent(tplKey)}`, {
                subject: tplSubject.trim() === '' ? null : tplSubject,
                body_html: tplBody.trim() === '' ? null : tplBody,
            });
            toast.success(data.message || t('settings_email_templates_saved'));
            loadTemplateList();
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setTplSaving(false);
        }
    }

    if (!isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    const tabBtn = (id, label) => (
        <button
            type="button"
            onClick={() => setActiveTab(id)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === id
                    ? 'bg-brand text-white shadow-xs'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="border-s-4 border-brand ps-4">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('settings_email')}</h1>
                <p className="mt-1 text-sm text-slate-500">{t('settings_email_edit_subtitle')}</p>
            </div>

            {err ? (
                <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>
            ) : null}

            <div className="flex flex-wrap gap-2">
                {tabBtn('smtp', t('settings_email_tab_smtp'))}
                {tabBtn('templates', t('settings_email_tab_templates'))}
                {tabBtn('logs', t('settings_email_tab_logs'))}
            </div>

            {activeTab === 'smtp' ? (
                <>
                    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card sm:p-6">
                        <h2 className="text-lg font-semibold text-slate-900">{t('settings_email_section_smtp')}</h2>
                        <p className="mt-1 text-sm text-slate-500">{t('settings_email_section_smtp_help')}</p>

                        {loading ? (
                            <p className="mt-8 py-4 text-center text-sm text-slate-500">{t('loading')}</p>
                        ) : (
                            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
                                <div>
                                    <label htmlFor="mail-mailer" className="block text-sm font-medium text-slate-700">
                                        {t('settings_mail_mailer')}
                                    </label>
                                    <SearchableSelect
                                        id="mail-mailer"
                                        value={mailMailer}
                                        onChange={(e) => setMailMailer(e.target.value)}
                                        className="mt-1 w-full"
                                    >
                                        <option value="smtp">smtp</option>
                                        <option value="log">log</option>
                                        <option value="array">array</option>
                                    </SearchableSelect>
                                </div>
                                <div>
                                    <label htmlFor="mail-host" className="block text-sm font-medium text-slate-700">
                                        {t('settings_mail_host')}
                                    </label>
                                    <input
                                        id="mail-host"
                                        type="text"
                                        value={mailHost}
                                        onChange={(e) => setMailHost(e.target.value)}
                                        required
                                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-brand focus:outline-hidden focus:ring-2 focus:ring-brand/20"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="mail-port" className="block text-sm font-medium text-slate-700">
                                        {t('settings_mail_port')}
                                    </label>
                                    <input
                                        id="mail-port"
                                        type="text"
                                        value={mailPort}
                                        onChange={(e) => setMailPort(e.target.value)}
                                        required
                                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-brand focus:outline-hidden focus:ring-2 focus:ring-brand/20"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="mail-enc" className="block text-sm font-medium text-slate-700">
                                        {t('settings_mail_encryption')}
                                    </label>
                                    <SearchableSelect
                                        id="mail-enc"
                                        value={mailEncryption}
                                        onChange={(e) => setMailEncryption(e.target.value)}
                                        className="mt-1 w-full"
                                    >
                                        <option value="">{t('settings_email_encryption_none')}</option>
                                        <option value="ssl">ssl</option>
                                        <option value="tls">tls</option>
                                        <option value="none">none</option>
                                    </SearchableSelect>
                                </div>
                                <div>
                                    <label htmlFor="mail-user" className="block text-sm font-medium text-slate-700">
                                        {t('settings_mail_username')}
                                    </label>
                                    <input
                                        id="mail-user"
                                        type="text"
                                        value={mailUsername}
                                        onChange={(e) => setMailUsername(e.target.value)}
                                        autoComplete="off"
                                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-sm text-slate-900 shadow-xs focus:border-brand focus:outline-hidden focus:ring-2 focus:ring-brand/20"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="mail-pass" className="block text-sm font-medium text-slate-700">
                                        {t('settings_mail_password')}
                                    </label>
                                    <input
                                        id="mail-pass"
                                        type="password"
                                        value={mailPassword}
                                        onChange={(e) => setMailPassword(e.target.value)}
                                        autoComplete="new-password"
                                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-sm text-slate-900 shadow-xs focus:border-brand focus:outline-hidden focus:ring-2 focus:ring-brand/20"
                                        placeholder={t('settings_email_password_placeholder')}
                                    />
                                    <p className="mt-1 text-xs text-slate-500">
                                        {passwordConfigured ? t('settings_email_password_keep') : t('settings_email_password_empty')}
                                    </p>
                                </div>
                                <div>
                                    <label htmlFor="mail-from-addr" className="block text-sm font-medium text-slate-700">
                                        {t('settings_mail_from_address')}
                                    </label>
                                    <input
                                        id="mail-from-addr"
                                        type="email"
                                        value={mailFromAddress}
                                        onChange={(e) => setMailFromAddress(e.target.value)}
                                        required
                                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-brand focus:outline-hidden focus:ring-2 focus:ring-brand/20"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="mail-from-name" className="block text-sm font-medium text-slate-700">
                                        {t('settings_mail_from_name')}
                                    </label>
                                    <input
                                        id="mail-from-name"
                                        type="text"
                                        value={mailFromName}
                                        onChange={(e) => setMailFromName(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-brand focus:outline-hidden focus:ring-2 focus:ring-brand/20"
                                    />
                                </div>
                                <div className="flex flex-wrap gap-3 pt-2">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-brand-dark disabled:opacity-50"
                                    >
                                        {saving ? t('loading') : t('settings_email_save')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={load}
                                        disabled={loading || saving}
                                        className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                    >
                                        {t('settings_email_reload')}
                                    </button>
                                </div>
                            </form>
                        )}
                    </section>

                    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card sm:p-6">
                        <h2 className="text-lg font-semibold text-slate-900">{t('settings_email_section_test')}</h2>
                        <p className="mt-1 text-sm text-slate-500">{t('settings_email_section_test_help')}</p>
                        <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={onSendTest}>
                            <div className="min-w-0 flex-1">
                                <label htmlFor="email-test-to" className="block text-sm font-medium text-slate-700">
                                    {t('settings_email_test_to')}
                                </label>
                                <input
                                    id="email-test-to"
                                    type="email"
                                    value={testTo}
                                    onChange={(e) => setTestTo(e.target.value)}
                                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-brand focus:outline-hidden focus:ring-2 focus:ring-brand/20"
                                    placeholder="you@example.com"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={testing || loading}
                                className="rounded-xl border border-brand bg-white px-5 py-2.5 text-sm font-semibold text-brand shadow-xs hover:bg-brand/5 disabled:opacity-50"
                            >
                                {testing ? t('loading') : t('settings_email_test_send')}
                            </button>
                        </form>
                    </section>

                    <p className="text-sm text-slate-600">{t('settings_env_hint')}</p>
                </>
            ) : null}

            {activeTab === 'templates' ? (
                <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card sm:p-6">
                    <h2 className="text-lg font-semibold text-slate-900">{t('settings_email_tab_templates')}</h2>
                    <p className="mt-1 text-sm text-slate-500">{t('settings_email_templates_help')}</p>
                    {tplPlaceholders ? (
                        <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">{tplPlaceholders}</p>
                    ) : null}

                    {tplListLoading ? (
                        <p className="mt-8 py-4 text-center text-sm text-slate-500">{t('loading')}</p>
                    ) : (
                        <form className="mt-6 space-y-4" onSubmit={onSaveTemplate}>
                            <div>
                                <label htmlFor="email-tpl-key" className="block text-sm font-medium text-slate-700">
                                    {t('settings_email_template_select')}
                                </label>
                                <SearchableSelect
                                    id="email-tpl-key"
                                    value={tplKey}
                                    onChange={(e) => setTplKey(e.target.value)}
                                    className="mt-1 w-full"
                                >
                                    {tplList.map((row) => (
                                        <option key={row.key} value={row.key}>
                                            {row.key}
                                            {row.description ? ` — ${row.description}` : ''}
                                        </option>
                                    ))}
                                </SearchableSelect>
                            </div>
                            {tplDetailLoading ? (
                                <p className="py-4 text-center text-sm text-slate-500">{t('loading')}</p>
                            ) : (
                                <>
                                    <div>
                                        <label htmlFor="email-tpl-subj" className="block text-sm font-medium text-slate-700">
                                            {t('settings_email_template_subject')}
                                        </label>
                                        <input
                                            id="email-tpl-subj"
                                            type="text"
                                            value={tplSubject}
                                            onChange={(e) => setTplSubject(e.target.value)}
                                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 shadow-xs focus:border-brand focus:outline-hidden focus:ring-2 focus:ring-brand/20"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="email-tpl-body" className="block text-sm font-medium text-slate-700">
                                            {t('settings_email_template_body')}
                                        </label>
                                        <textarea
                                            id="email-tpl-body"
                                            value={tplBody}
                                            onChange={(e) => setTplBody(e.target.value)}
                                            rows={14}
                                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-sm text-slate-900 shadow-xs focus:border-brand focus:outline-hidden focus:ring-2 focus:ring-brand/20"
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setTplSubject(tplDefaultSubject);
                                                setTplBody(tplDefaultBody);
                                            }}
                                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                        >
                                            {t('settings_email_template_load_defaults')}
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={tplSaving || !tplKey}
                                            className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-brand-dark disabled:opacity-50"
                                        >
                                            {tplSaving ? t('loading') : t('settings_email_save')}
                                        </button>
                                    </div>
                                </>
                            )}
                        </form>
                    )}
                </section>
            ) : null}

            {activeTab === 'logs' ? (
                <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card sm:p-6">
                    <h2 className="text-lg font-semibold text-slate-900">{t('settings_email_tab_logs')}</h2>
                    <p className="mt-1 text-sm text-slate-500">{t('settings_email_logs_help')}</p>

                    {logsLoading ? (
                        <p className="mt-8 py-4 text-center text-sm text-slate-500">{t('loading')}</p>
                    ) : logsRows.length === 0 ? (
                        <p className="mt-6 text-sm text-slate-500">{t('settings_email_logs_empty')}</p>
                    ) : (
                        <>
                            <div className="mt-4 overflow-x-auto">
                                <table className="min-w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-slate-600">
                                            <th className="py-2 pe-4 font-medium">{t('settings_email_logs_date')}</th>
                                            <th className="py-2 pe-4 font-medium">{t('settings_email_logs_to')}</th>
                                            <th className="py-2 pe-4 font-medium">{t('settings_email_logs_subject')}</th>
                                            <th className="py-2 pe-4 font-medium">{t('settings_email_logs_template')}</th>
                                            <th className="py-2 font-medium">{t('settings_email_logs_status')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logsRows.map((row) => (
                                            <tr key={row.id} className="border-b border-slate-100">
                                                <td className="py-2 pe-4 whitespace-nowrap text-slate-700">
                                                    {row.created_at
                                                        ? new Date(row.created_at).toLocaleString()
                                                        : '—'}
                                                </td>
                                                <td className="max-w-[200px] truncate py-2 pe-4 font-mono text-xs text-slate-800">
                                                    {row.to || '—'}
                                                </td>
                                                <td className="max-w-[240px] truncate py-2 pe-4 text-slate-700">{row.subject || '—'}</td>
                                                <td className="py-2 pe-4 font-mono text-xs text-slate-600">{row.template_key || '—'}</td>
                                                <td className="py-2">
                                                    <span
                                                        className={
                                                            row.status === 'failed'
                                                                ? 'rounded-md bg-red-50 px-2 py-0.5 text-red-800'
                                                                : 'rounded-md bg-emerald-50 px-2 py-0.5 text-emerald-800'
                                                        }
                                                    >
                                                        {row.status === 'failed'
                                                            ? t('settings_email_logs_status_failed')
                                                            : t('settings_email_logs_status_sent')}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                <p className="text-sm text-slate-500">
                                    {t('settings_email_logs_page', {
                                        current: logsMeta.current_page,
                                        last: logsMeta.last_page,
                                    })}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        disabled={logsMeta.current_page <= 1 || logsLoading}
                                        onClick={() => loadLogs(logsMeta.current_page - 1)}
                                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                    >
                                        {t('settings_email_logs_prev')}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={logsMeta.current_page >= logsMeta.last_page || logsLoading}
                                        onClick={() => loadLogs(logsMeta.current_page + 1)}
                                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                    >
                                        {t('settings_email_logs_next')}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </section>
            ) : null}
        </div>
    );
}
