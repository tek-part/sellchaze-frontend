import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import domainsApi, { domainErrorMessage } from '../../api/domains';
import DnsRecordRow from './DnsRecordRow';
import { HealthScore } from './DomainBadges';

const LEVEL_ICON = { ok: '🟢', warning: '🟡', error: '🔴', unknown: '⚪' };

/**
 * Per-domain health dashboard: DNS, TXT, HTTPS, SSL, canonical, score,
 * warnings, errors and recommendations.
 *
 * Polls while anything is still in flight (pending verification or issuance) and
 * stops once the picture is stable — background work is queued, so the answer
 * arrives seconds after the action, not during the request.
 */
export default function DomainHealthPanel({ domainId, onRefreshed }) {
    const { t } = useTranslation();
    const [report, setReport] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        let timer;

        const load = async () => {
            try {
                const data = await domainsApi.health(domainId);
                if (cancelled) return;

                setReport(data);
                setError('');
                onRefreshed?.(data);

                // Keep polling only while something can still change on its own.
                const inFlight =
                    data?.status === 'pending' || data?.ssl?.status === 'pending';
                if (inFlight) {
                    timer = setTimeout(load, 6000);
                }
            } catch (e) {
                if (!cancelled) setError(domainErrorMessage(e, t));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [domainId, t, onRefreshed]);

    if (loading) {
        return <p className="p-4 text-sm text-slate-500">{t('domain_health_loading')}</p>;
    }

    if (error) {
        return (
            <p role="alert" className="p-4 text-sm text-rose-600">
                {error}
            </p>
        );
    }

    if (!report) return null;

    const dns = report.dns ?? {};

    return (
        <div className="space-y-4 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h4 className="text-sm font-semibold text-slate-900">{t('domain_health_title')}</h4>
                <HealthScore score={report.health_score} />
            </div>

            {/* Individual checks */}
            <ul className="grid gap-2 sm:grid-cols-2">
                {(report.checks ?? []).map((check) => (
                    <li
                        key={check.key}
                        className="flex items-start gap-2 rounded-xl border border-slate-200 p-2.5"
                    >
                        <span aria-hidden="true" className="mt-0.5 text-sm leading-none">
                            {LEVEL_ICON[check.level] ?? '⚪'}
                        </span>
                        <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-800">{check.label}</div>
                            <div className="text-xs text-slate-600">{check.message}</div>
                            <span className="sr-only">{t(`domain_level_${check.level}`)}</span>
                        </div>
                    </li>
                ))}
            </ul>

            {/* Recommendations first — they are the actionable part. */}
            {(report.recommendations ?? []).length > 0 && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3">
                    <h5 className="mb-1.5 text-xs font-semibold text-indigo-900">
                        {t('domain_recommendations')}
                    </h5>
                    <ul className="list-inside list-disc space-y-1 text-xs text-indigo-900/90">
                        {report.recommendations.map((rec, i) => (
                            <li key={i}>{rec}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Required DNS records */}
            {dns.expected_txt_name && (
                <div className="space-y-2">
                    <h5 className="text-xs font-semibold text-slate-700">{t('domain_required_records')}</h5>
                    <DnsRecordRow
                        type="TXT"
                        name={dns.expected_txt_name}
                        value={dns.expected_txt_value ?? ''}
                        ok={dns.txt_ok}
                    />
                    {dns.expected_cname && (
                        <DnsRecordRow
                            type="CNAME"
                            name={report.host}
                            value={dns.expected_cname}
                            ok={dns.target_ok}
                        />
                    )}
                    {dns.expected_a && (
                        <DnsRecordRow type="A" name={report.host} value={dns.expected_a} ok={dns.target_ok} />
                    )}
                </div>
            )}

            {/* Certificate detail */}
            <dl className="grid gap-x-6 gap-y-1.5 rounded-xl border border-slate-200 p-3 text-xs sm:grid-cols-2">
                <Row label={t('domain_ssl_issuer')} value={report.ssl?.issuer} />
                <Row label={t('domain_ssl_provider')} value={report.ssl?.provider} />
                <Row
                    label={t('domain_ssl_expires')}
                    value={report.ssl?.expires_at ? new Date(report.ssl.expires_at).toLocaleDateString() : null}
                />
                <Row
                    label={t('domain_last_checked')}
                    value={report.last_checked_at ? new Date(report.last_checked_at).toLocaleString() : null}
                />
                <Row
                    label={t('domain_verified_at')}
                    value={report.verified_at ? new Date(report.verified_at).toLocaleString() : null}
                />
                <Row label={t('domain_canonical_url')} value={report.canonical_url} mono />
            </dl>
        </div>
    );
}

function Row({ label, value, mono = false }) {
    const { t } = useTranslation();

    return (
        <div className="flex items-baseline justify-between gap-3">
            <dt className="shrink-0 text-slate-500">{label}</dt>
            <dd
                dir={mono ? 'ltr' : undefined}
                className={`min-w-0 truncate text-right text-slate-800 ${mono ? 'font-mono' : ''}`}
                title={value ?? ''}
            >
                {value || <span className="text-slate-400">{t('domain_not_available')}</span>}
            </dd>
        </div>
    );
}
