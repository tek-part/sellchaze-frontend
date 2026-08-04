import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { domainErrorMessage, makeDomainsApi } from '../../api/domains';
import DomainAuditHistory from './DomainAuditHistory';
import { DnsBadge, HealthScore, PrimaryBadge, SslBadge, VerificationBadge } from './DomainBadges';
import DomainHealthPanel from './DomainHealthPanel';
import DomainSetupWizard from './DomainSetupWizard';
import { confirmDialog } from '../ui/confirmDialog';

/**
 * Custom Domains — the owner-facing management surface.
 *
 * Every mutating action is optimistic-free on purpose: verification and SSL are
 * queued server-side, so the panel re-fetches rather than guessing at the new
 * state. A background refresh runs while anything is mid-flight and stops once
 * the list is stable, so an idle tab costs nothing.
 */
export default function CustomDomainsPanel({ apiBase = '/my-store' }) {
    const { t } = useTranslation();
    const domainsApi = useMemo(() => makeDomainsApi(apiBase), [apiBase]);

    const [domains, setDomains] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [busyId, setBusyId] = useState(null);
    const [expanded, setExpanded] = useState(null);
    const [wizardOpen, setWizardOpen] = useState(false);
    const [auditFor, setAuditFor] = useState(undefined); // undefined = closed, null = store-wide

    const load = useCallback(async () => {
        try {
            const [list, sum] = await Promise.all([domainsApi.list(), domainsApi.summary()]);
            setDomains(list);
            setSummary(sum);
            setError('');
        } catch (e) {
            setError(domainErrorMessage(e, t));
        } finally {
            setLoading(false);
        }
    }, [domainsApi, t]);

    useEffect(() => {
        load();
    }, [load]);

    // Poll only while something can still change by itself.
    useEffect(() => {
        const inFlight = domains.some(
            (d) => d.status === 'pending' || d.ssl?.status === 'pending',
        );
        if (!inFlight) return undefined;

        const id = setTimeout(load, 8000);
        return () => clearTimeout(id);
    }, [domains, load]);

    const run = async (id, action, successKey) => {
        setBusyId(id);
        setError('');
        setNotice('');
        try {
            await action();
            if (successKey) setNotice(t(successKey));
            await load();
        } catch (e) {
            setError(domainErrorMessage(e, t));
        } finally {
            setBusyId(null);
        }
    };

    const remove = async (domain) => {
        // Deleting a domain takes a live storefront host offline — confirm first.
        const ok = await confirmDialog({
            title: t('domain_confirm_remove_title', 'Remove domain?'),
            text: t('domain_confirm_remove', { host: domain.host }),
            confirmText: t('action_remove', 'Remove'),
            icon: 'warning',
        });
        if (!ok) return;
        run(domain.id, () => domainsApi.remove(domain.id), 'domain_notice_removed');
    };

    const custom = domains.filter((d) => d.type === 'custom');
    const subdomain = domains.find((d) => d.type === 'subdomain');

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6" aria-labelledby="domains-heading">
            <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 id="domains-heading" className="text-lg font-semibold text-slate-900">
                        {t('domain_panel_title')}
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-500">{t('domain_panel_subtitle')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setAuditFor(null)}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        {t('domain_action_history')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setWizardOpen(true)}
                        className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        {t('domain_action_add')}
                    </button>
                </div>
            </header>

            {summary && (
                <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Stat label={t('domain_stat_verified')} value={summary.verified} />
                    <Stat label={t('domain_stat_pending')} value={summary.pending} />
                    <Stat label={t('domain_stat_ssl_active')} value={summary.ssl_active} />
                    <Stat label={t('domain_stat_issues')} value={summary.errors} tone={summary.errors > 0 ? 'red' : 'ok'} />
                </dl>
            )}

            {error && (
                <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                    {error}
                </p>
            )}
            {notice && (
                <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                    {notice}
                </p>
            )}

            {loading ? (
                <p className="mt-6 text-sm text-slate-500">{t('loading')}</p>
            ) : (
                <div className="mt-4 space-y-3">
                    {/* Platform subdomain — always present, never removable. */}
                    {subdomain && (
                        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="min-w-0">
                                    <div dir="ltr" className="truncate font-mono text-sm text-slate-700">
                                        {subdomain.host}
                                    </div>
                                    <p className="mt-0.5 text-xs text-slate-500">{t('domain_subdomain_hint')}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                    {subdomain.is_primary && <PrimaryBadge />}
                                    <VerificationBadge status={subdomain.status} />
                                </div>
                            </div>
                        </div>
                    )}

                    {custom.length === 0 && (
                        <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
                            <p className="text-sm font-medium text-slate-700">{t('domain_empty_title')}</p>
                            <p className="mt-1 text-xs text-slate-500">{t('domain_empty_hint')}</p>
                            <button
                                type="button"
                                onClick={() => setWizardOpen(true)}
                                className="mt-3 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                            >
                                {t('domain_action_add')}
                            </button>
                        </div>
                    )}

                    {custom.map((domain) => {
                        const isBusy = busyId === domain.id;
                        const isOpen = expanded === domain.id;

                        return (
                            <article key={domain.id} className="overflow-hidden rounded-xl border border-slate-200">
                                <div className="flex flex-wrap items-start justify-between gap-3 p-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <a
                                                href={`https://${domain.host}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                dir="ltr"
                                                className="truncate font-mono text-sm font-medium text-slate-900 hover:text-indigo-600 hover:underline"
                                            >
                                                {domain.host}
                                            </a>
                                            {domain.is_primary && <PrimaryBadge />}
                                        </div>

                                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                            <VerificationBadge status={domain.status} isLocked={domain.is_locked} />
                                            <SslBadge ssl={domain.ssl} />
                                            <DnsBadge dns={domain.dns} />
                                            {typeof domain.health_score === 'number' && (
                                                <HealthScore score={domain.health_score} />
                                            )}
                                        </div>

                                        {domain.verification?.last_error && (
                                            <p className="mt-1.5 text-xs text-rose-600">
                                                {domain.verification.last_error}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <Action
                                            onClick={() =>
                                                run(domain.id, () => domainsApi.verify(domain.id), 'domain_notice_queued')
                                            }
                                            disabled={isBusy || domain.is_locked}
                                        >
                                            {t('domain_action_verify')}
                                        </Action>
                                        <Action
                                            onClick={() =>
                                                run(domain.id, () => domainsApi.refreshDns(domain.id), 'domain_notice_queued')
                                            }
                                            disabled={isBusy}
                                        >
                                            {t('domain_action_refresh_dns')}
                                        </Action>
                                        <Action
                                            onClick={() =>
                                                run(domain.id, () => domainsApi.retrySsl(domain.id), 'domain_notice_queued')
                                            }
                                            disabled={isBusy}
                                        >
                                            {t('domain_action_retry_ssl')}
                                        </Action>
                                        {!domain.is_primary && domain.status === 'verified' && (
                                            <Action
                                                onClick={() =>
                                                    run(domain.id, () => domainsApi.makePrimary(domain.id), 'domain_notice_primary')
                                                }
                                                disabled={isBusy}
                                                tone="primary"
                                            >
                                                {t('domain_action_make_primary')}
                                            </Action>
                                        )}
                                        {domain.status === 'disabled' ? (
                                            <Action
                                                onClick={() =>
                                                    run(domain.id, () => domainsApi.enable(domain.id), 'domain_notice_enabled')
                                                }
                                                disabled={isBusy}
                                            >
                                                {t('domain_action_enable')}
                                            </Action>
                                        ) : (
                                            <Action
                                                onClick={() =>
                                                    run(domain.id, () => domainsApi.disable(domain.id), 'domain_notice_disabled')
                                                }
                                                disabled={isBusy}
                                            >
                                                {t('domain_action_disable')}
                                            </Action>
                                        )}
                                        <Action onClick={() => setAuditFor(domain.id)} disabled={isBusy}>
                                            {t('domain_action_history')}
                                        </Action>
                                        <Action onClick={() => remove(domain)} disabled={isBusy} tone="danger">
                                            {t('domain_action_remove')}
                                        </Action>
                                        <button
                                            type="button"
                                            onClick={() => setExpanded(isOpen ? null : domain.id)}
                                            aria-expanded={isOpen}
                                            aria-controls={`domain-health-${domain.id}`}
                                            className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            {isOpen ? t('domain_action_hide_health') : t('domain_action_show_health')}
                                        </button>
                                    </div>
                                </div>

                                {isOpen && (
                                    <div id={`domain-health-${domain.id}`} className="border-t border-slate-200 bg-slate-50/50">
                                        <DomainHealthPanel domainId={domain.id} />
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </div>
            )}

            {wizardOpen && (
                <DomainSetupWizard apiBase={apiBase} onClose={() => setWizardOpen(false)} onCompleted={load} />
            )}

            {auditFor !== undefined && (
                <DomainAuditHistory domainId={auditFor} onClose={() => setAuditFor(undefined)} />
            )}
        </section>
    );
}

function Stat({ label, value, tone = 'ok' }) {
    return (
        <div className="rounded-xl border border-slate-200 p-2.5">
            <dt className="text-xs text-slate-500">{label}</dt>
            <dd
                className={`mt-0.5 text-lg font-semibold tabular-nums ${
                    tone === 'red' ? 'text-rose-600' : 'text-slate-900'
                }`}
            >
                {value ?? 0}
            </dd>
        </div>
    );
}

function Action({ children, onClick, disabled, tone = 'default' }) {
    const tones = {
        default: 'border-slate-200 text-slate-700 hover:bg-slate-50',
        primary: 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
        danger: 'border-rose-200 text-rose-700 hover:bg-rose-50',
    };

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`rounded-lg border px-2 py-1 text-xs font-medium transition disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${tones[tone]}`}
        >
            {children}
        </button>
    );
}
