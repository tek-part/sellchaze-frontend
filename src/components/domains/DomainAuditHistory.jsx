import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import domainsApi, { domainErrorMessage } from '../../api/domains';
import useModalA11y from './useModalA11y';

const EVENT_TONE = {
    domain_added: 'text-indigo-700',
    domain_removed: 'text-slate-600',
    verification_started: 'text-slate-600',
    verification_passed: 'text-emerald-700',
    verification_failed: 'text-rose-700',
    ownership_rejected: 'text-rose-700',
    ssl_issued: 'text-emerald-700',
    ssl_renewed: 'text-emerald-700',
    ssl_failed: 'text-rose-700',
    ssl_revoked: 'text-slate-600',
    ssl_expiring: 'text-amber-700',
    primary_changed: 'text-indigo-700',
    redirect_changed: 'text-indigo-700',
    disabled: 'text-rose-700',
    enabled: 'text-emerald-700',
};

/**
 * Searchable, paginated audit history.
 *
 * The trail is immutable server-side, so this is purely a reader — there is
 * deliberately no edit or delete affordance anywhere in this component.
 */
export default function DomainAuditHistory({ domainId = null, onClose }) {
    const { t } = useTranslation();
    const dialogRef = useModalA11y(onClose);
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState(null);
    const [q, setQ] = useState('');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        // Debounce so typing in the search box does not fire a request per keystroke.
        const handle = setTimeout(async () => {
            setLoading(true);
            try {
                const params = { page, per_page: 20 };
                if (q.trim() !== '') params.q = q.trim();

                const data = domainId
                    ? await domainsApi.domainEvents(domainId, params)
                    : await domainsApi.events(params);

                if (cancelled) return;
                setRows(data?.data ?? []);
                setMeta(data?.meta ?? null);
                setError('');
            } catch (e) {
                if (!cancelled) setError(domainErrorMessage(e, t));
            } finally {
                if (!cancelled) setLoading(false);
            }
        }, 250);

        return () => {
            cancelled = true;
            clearTimeout(handle);
        };
    }, [domainId, q, page, t]);

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="domain-audit-title"
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4"
        >
            <div
                ref={dialogRef}
                className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
            >
                <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-4 sm:p-5">
                    <div>
                        <h3 id="domain-audit-title" className="text-base font-semibold text-slate-900">
                            {t('domain_audit_title')}
                        </h3>
                        <p className="mt-0.5 text-sm text-slate-500">{t('domain_audit_subtitle')}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t('action_close')}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        ✕
                    </button>
                </div>

                <div className="border-b border-slate-200 p-3 sm:p-4">
                    <label htmlFor="domain-audit-search" className="sr-only">
                        {t('domain_audit_search')}
                    </label>
                    <input
                        id="domain-audit-search"
                        value={q}
                        onChange={(e) => {
                            setPage(1);
                            setQ(e.target.value);
                        }}
                        placeholder={t('domain_audit_search')}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto">
                    {error && (
                        <p role="alert" className="p-4 text-sm text-rose-600">
                            {error}
                        </p>
                    )}

                    {!error && loading && <p className="p-4 text-sm text-slate-500">{t('loading')}</p>}

                    {!error && !loading && rows.length === 0 && (
                        <p className="p-6 text-center text-sm text-slate-500">{t('domain_audit_empty')}</p>
                    )}

                    {!error && !loading && rows.length > 0 && (
                        <ul className="divide-y divide-slate-100">
                            {rows.map((row) => (
                                <li key={row.id} className="p-3 sm:p-4">
                                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                                        <span
                                            className={`text-sm font-semibold ${EVENT_TONE[row.event] ?? 'text-slate-700'}`}
                                        >
                                            {t(`domain_event_${row.event}`, { defaultValue: row.event })}
                                        </span>
                                        <time
                                            dateTime={row.created_at}
                                            className="text-xs tabular-nums text-slate-500"
                                        >
                                            {row.created_at ? new Date(row.created_at).toLocaleString() : ''}
                                        </time>
                                    </div>

                                    <div dir="ltr" className="mt-0.5 font-mono text-xs text-slate-600">
                                        {row.host}
                                    </div>

                                    {row.reason && <p className="mt-1 text-xs text-slate-600">{row.reason}</p>}

                                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-400">
                                        <span>
                                            {row.actor?.type === 'user'
                                                ? row.actor?.name || t('domain_actor_user')
                                                : t('domain_actor_system')}
                                        </span>
                                        {row.ip && <span dir="ltr">{row.ip}</span>}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {meta && meta.last_page > 1 && (
                    <div className="flex items-center justify-between gap-2 border-t border-slate-200 p-3">
                        <button
                            type="button"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-40"
                        >
                            {t('previous')}
                        </button>
                        <span className="text-xs text-slate-500">
                            {t('domain_audit_page', { current: meta.current_page, total: meta.last_page })}
                        </span>
                        <button
                            type="button"
                            disabled={page >= meta.last_page}
                            onClick={() => setPage((p) => p + 1)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-40"
                        >
                            {t('next')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
