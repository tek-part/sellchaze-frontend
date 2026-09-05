import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineCheckCircle, HiOutlineArrowRight } from 'react-icons/hi2';
import api from '../../api/client';

/**
 * Publishing checks in display order. `fix` is the page that resolves the check
 * — relative to uiBase, or absolute when it starts with '/'.
 */
export const READINESS_CHECKS = [
    { key: 'profile', fix: 'settings/general' },
    { key: 'verified_primary_domain', fix: 'settings/domains' },
    { key: 'active_theme', fix: 'themes' },
    { key: 'active_product', fix: '/products' },
];

export function readinessLabels(t) {
    return {
        profile: {
            title: t('store_publish_check_profile', 'Store profile'),
            hint: t('store_publish_check_profile_hint', 'A store name and currency are set.'),
        },
        verified_primary_domain: {
            title: t('store_publish_check_domain', 'Primary domain'),
            hint: t('store_publish_check_domain_hint', 'The subdomain or a verified custom domain serves the store.'),
        },
        active_theme: {
            title: t('store_publish_check_theme', 'Active theme'),
            hint: t('store_publish_check_theme_hint', 'A theme is installed and activated.'),
        },
        active_product: {
            title: t('store_publish_check_product', 'At least one active product'),
            hint: t('store_publish_check_product_hint', 'Shoppers need something to buy.'),
        },
    };
}

/**
 * Loads `GET {apiBase}/readiness` → `{ ready, checks }`. `reload()` re-fetches.
 */
export function useStoreReadiness(apiBase) {
    const [readiness, setReadiness] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const reload = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`${apiBase}/readiness`);
            setReadiness(data?.data ?? data ?? null);
            setError('');
        } catch (e) {
            setError(e.response?.data?.message || e.message);
        } finally {
            setLoading(false);
        }
    }, [apiBase]);

    useEffect(() => { void reload(); }, [reload]);

    const checks = readiness?.checks ?? {};
    const total = READINESS_CHECKS.length;
    const done = READINESS_CHECKS.filter((c) => Boolean(checks[c.key])).length;

    return { readiness, checks, loading, error, reload, done, total, ready: Boolean(readiness?.ready) };
}

function resolveFix(fix, uiBase) {
    return fix.startsWith('/') ? fix : `${uiBase}/${fix}`;
}

/** The four checks as a list with a "Fix" link on each failing row. */
export default function ReadinessChecklist({ checks = {}, uiBase, loading = false, compact = false }) {
    const { t } = useTranslation();
    const labels = readinessLabels(t);

    return (
        <ul className={compact ? 'space-y-1.5' : 'divide-y divide-slate-100'}>
            {READINESS_CHECKS.map(({ key, fix }) => {
                const passed = Boolean(checks[key]);
                const meta = labels[key];
                return (
                    <li key={key} className={`flex items-center gap-3 ${compact ? 'rounded-xl px-2 py-1.5' : 'py-3'}`}>
                        {loading ? (
                            <span className="h-5 w-5 shrink-0 animate-pulse rounded-full bg-slate-200" aria-hidden />
                        ) : passed ? (
                            <HiOutlineCheckCircle className="h-5 w-5 shrink-0 text-emerald-500" aria-hidden />
                        ) : (
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-amber-300 bg-amber-50" aria-hidden />
                        )}
                        <div className="min-w-0 flex-1">
                            <p className={`text-sm font-medium ${passed ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-800'}`}>{meta.title}</p>
                            {!compact ? <p className="text-xs text-slate-400">{meta.hint}</p> : null}
                        </div>
                        {!passed && !loading ? (
                            <Link
                                to={resolveFix(fix, uiBase)}
                                className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-brand transition hover:bg-brand-light"
                            >
                                {t('store_publish_fix', 'Fix')}
                                <HiOutlineArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden />
                            </Link>
                        ) : null}
                    </li>
                );
            })}
        </ul>
    );
}
