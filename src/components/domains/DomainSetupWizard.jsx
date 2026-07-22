import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import domainsApi, { domainErrorMessage } from '../../api/domains';
import DnsRecordRow from './DnsRecordRow';
import useModalA11y from './useModalA11y';

/**
 * Six-step onboarding for connecting a custom domain.
 *
 *   1 Enter domain → 2 DNS instructions → 3 Live DNS validation
 *   → 4 Ownership verification → 5 SSL issuance → 6 Make primary
 *
 * Verification and issuance are queued server-side, so steps 3–5 poll in the
 * background with a visible attempt counter rather than blocking on a request.
 * Polling always stops on unmount, on error, and once a terminal state is
 * reached — an abandoned wizard must not keep hitting rate-limited endpoints.
 */

const STEPS = ['enter', 'dns', 'validate', 'verify', 'ssl', 'primary'];
const POLL_MS = 5000;
const MAX_POLLS = 60; // ~5 minutes, then hand back to the user

export default function DomainSetupWizard({ onClose, onCompleted }) {
    const { t } = useTranslation();

    const [step, setStep] = useState(0);
    const [host, setHost] = useState('');
    const [domain, setDomain] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [polls, setPolls] = useState(0);

    const pollRef = useRef(null);
    const mounted = useRef(true);

    useEffect(
        () => () => {
            mounted.current = false;
            clearTimeout(pollRef.current);
        },
        [],
    );

    const stopPolling = useCallback(() => clearTimeout(pollRef.current), []);

    /** Re-read the domain from the list endpoint (single source of truth). */
    const refresh = useCallback(async (id) => {
        const all = await domainsApi.list();
        return all.find((d) => d.id === id) ?? null;
    }, []);

    // ---------------------------------------------------------------- step 1
    const connect = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
            const created = await domainsApi.connect(host.trim());
            if (!mounted.current) return;
            setDomain(created);
            setStep(1);
        } catch (err) {
            setError(domainErrorMessage(err, t));
        } finally {
            if (mounted.current) setBusy(false);
        }
    };

    // ------------------------------------------------------ steps 3 + 4 poll
    const startVerification = async () => {
        setBusy(true);
        setError('');
        setPolls(0);
        try {
            await domainsApi.verify(domain.id); // 202 — queued
            if (!mounted.current) return;
            setStep(3);
            pollVerification(0);
        } catch (err) {
            setError(domainErrorMessage(err, t));
            setBusy(false);
        }
    };

    const pollVerification = useCallback(
        async (attempt) => {
            if (!mounted.current) return;

            if (attempt >= MAX_POLLS) {
                setBusy(false);
                setError(t('domain_wizard_timeout'));
                return;
            }

            try {
                const fresh = await refresh(domain.id);
                if (!mounted.current) return;

                if (fresh) setDomain(fresh);
                setPolls(attempt + 1);

                if (fresh?.status === 'verified') {
                    setBusy(false);
                    setStep(4);
                    // Certificate issuance starts automatically on verification.
                    pollSsl(0);
                    return;
                }

                if (fresh?.status === 'rejected' || fresh?.is_locked) {
                    setBusy(false);
                    setError(fresh?.verification?.last_error || t('domain_wizard_verify_failed'));
                    return;
                }

                pollRef.current = setTimeout(() => pollVerification(attempt + 1), POLL_MS);
            } catch (err) {
                if (!mounted.current) return;
                setBusy(false);
                setError(domainErrorMessage(err, t));
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [domain, refresh, t],
    );

    // ---------------------------------------------------------------- step 5
    const pollSsl = useCallback(
        async (attempt) => {
            if (!mounted.current) return;

            if (attempt >= MAX_POLLS) {
                // Not fatal: the domain is verified and serving, TLS may simply
                // still be provisioning. Let the owner continue.
                setBusy(false);
                setStep(5);
                return;
            }

            try {
                const fresh = await refresh(domain.id);
                if (!mounted.current) return;

                if (fresh) setDomain(fresh);
                setPolls(attempt + 1);

                if (fresh?.ssl?.status === 'active' || fresh?.ssl?.status === 'failed') {
                    setBusy(false);
                    setStep(5);
                    return;
                }

                pollRef.current = setTimeout(() => pollSsl(attempt + 1), POLL_MS);
            } catch {
                if (mounted.current) {
                    setBusy(false);
                    setStep(5);
                }
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [domain, refresh],
    );

    // ---------------------------------------------------------------- step 6
    const makePrimary = async () => {
        setBusy(true);
        setError('');
        try {
            await domainsApi.makePrimary(domain.id);
            if (!mounted.current) return;
            onCompleted?.();
            onClose?.();
        } catch (err) {
            setError(domainErrorMessage(err, t));
        } finally {
            if (mounted.current) setBusy(false);
        }
    };

    const finishWithoutPrimary = () => {
        stopPolling();
        onCompleted?.();
        onClose?.();
    };

    const dns = domain?.dns ?? {};
    const verification = domain?.verification ?? {};

    const close = useCallback(() => {
        stopPolling();
        onClose?.();
    }, [stopPolling, onClose]);

    const dialogRef = useModalA11y(close);

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="domain-wizard-title"
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4"
        >
            <div
                ref={dialogRef}
                className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
            >
                {/* Header + progress */}
                <div className="border-b border-slate-200 p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h3 id="domain-wizard-title" className="text-base font-semibold text-slate-900">
                                {t('domain_wizard_title')}
                            </h3>
                            <p className="mt-0.5 text-sm text-slate-500">
                                {t(`domain_wizard_step_${STEPS[step]}_hint`)}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={close}
                            aria-label={t('action_close')}
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            ✕
                        </button>
                    </div>

                    <ol className="mt-4 flex items-center gap-1.5" aria-label={t('domain_wizard_progress')}>
                        {STEPS.map((name, i) => (
                            <li key={name} className="flex flex-1 items-center gap-1.5">
                                <span
                                    aria-current={i === step ? 'step' : undefined}
                                    className={`h-1.5 w-full rounded-full transition ${
                                        i < step ? 'bg-emerald-500' : i === step ? 'bg-indigo-500' : 'bg-slate-200'
                                    }`}
                                />
                            </li>
                        ))}
                    </ol>
                    <p className="mt-1.5 text-xs text-slate-500">
                        {t('domain_wizard_step_counter', { current: step + 1, total: STEPS.length })}
                    </p>
                </div>

                {/* Body */}
                <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
                    {error && (
                        <div
                            role="alert"
                            className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
                        >
                            {error}
                        </div>
                    )}

                    {step === 0 && (
                        <form onSubmit={connect} className="space-y-3">
                            <label htmlFor="wizard-host" className="block text-sm font-medium text-slate-700">
                                {t('domain_field_host')}
                            </label>
                            <input
                                id="wizard-host"
                                value={host}
                                onChange={(e) => setHost(e.target.value)}
                                dir="ltr"
                                autoFocus
                                required
                                placeholder="shop.example.com"
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                            />
                            <p className="text-xs text-slate-500">{t('domain_field_host_hint')}</p>
                            <button
                                type="submit"
                                disabled={busy || host.trim() === ''}
                                className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 sm:w-auto"
                            >
                                {busy ? t('domain_action_connecting') : t('domain_action_connect')}
                            </button>
                        </form>
                    )}

                    {step === 1 && (
                        <div className="space-y-3">
                            <p className="text-sm text-slate-600">{t('domain_wizard_dns_intro')}</p>
                            <DnsRecordRow
                                type="TXT"
                                name={verification.record_name ?? ''}
                                value={verification.record_value ?? ''}
                                ok={dns.txt_ok}
                            />
                            {dns.expected_cname && (
                                <DnsRecordRow
                                    type="CNAME"
                                    name={domain?.host ?? ''}
                                    value={dns.expected_cname}
                                    ok={dns.target_ok}
                                />
                            )}
                            {dns.expected_a && (
                                <DnsRecordRow
                                    type="A"
                                    name={domain?.host ?? ''}
                                    value={dns.expected_a}
                                    ok={dns.target_ok}
                                />
                            )}
                            <p className="text-xs text-slate-500">{t('domain_wizard_dns_propagation')}</p>
                            <button
                                type="button"
                                onClick={() => setStep(2)}
                                className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 sm:w-auto"
                            >
                                {t('domain_wizard_added_records')}
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-3">
                            <p className="text-sm text-slate-600">{t('domain_wizard_validate_intro')}</p>
                            <button
                                type="button"
                                onClick={startVerification}
                                disabled={busy}
                                className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 sm:w-auto"
                            >
                                {busy ? t('domain_action_verifying') : t('domain_action_verify_now')}
                            </button>
                        </div>
                    )}

                    {(step === 3 || step === 4) && (
                        <div className="space-y-3 py-4 text-center">
                            <div
                                className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600"
                                role="status"
                                aria-label={t('domain_wizard_working')}
                            />
                            <p className="text-sm font-medium text-slate-800">
                                {step === 3 ? t('domain_wizard_verifying') : t('domain_wizard_issuing_ssl')}
                            </p>
                            <p className="text-xs text-slate-500">
                                {t('domain_wizard_attempt', { count: polls })}
                            </p>
                            <button
                                type="button"
                                onClick={finishWithoutPrimary}
                                className="text-xs font-medium text-slate-500 underline hover:text-slate-700"
                            >
                                {t('domain_wizard_continue_background')}
                            </button>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="space-y-3">
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                                <p className="text-sm font-medium text-emerald-900">
                                    {t('domain_wizard_verified', { host: domain?.host })}
                                </p>
                                <p className="mt-0.5 text-xs text-emerald-800">
                                    {domain?.ssl?.status === 'active'
                                        ? t('domain_wizard_ssl_ready')
                                        : t('domain_wizard_ssl_pending')}
                                </p>
                            </div>
                            <p className="text-sm text-slate-600">{t('domain_wizard_primary_intro')}</p>
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={makePrimary}
                                    disabled={busy}
                                    className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {t('domain_action_make_primary')}
                                </button>
                                <button
                                    type="button"
                                    onClick={finishWithoutPrimary}
                                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    {t('domain_wizard_skip_primary')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
