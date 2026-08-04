import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';

/**
 * "Similar suppliers" block shown on every supplier profile. Besides being
 * useful to visitors, it is the internal-linking layer the SEO plan calls for:
 * it wires supplier pages to one another and back up to their sector, spreading
 * link equity across the directory.
 */
export default function SimilarSuppliers({ username }) {
    const { t } = useTranslation();
    const [suppliers, setSuppliers] = useState([]);

    useEffect(() => {
        if (!username) return undefined;
        let active = true;
        api.get(`/public/suppliers/${encodeURIComponent(username)}/similar`, { params: { limit: 6 } })
            .then((res) => { if (active) setSuppliers(res.data?.suppliers ?? []); })
            .catch(() => { if (active) setSuppliers([]); });
        return () => { active = false; };
    }, [username]);

    if (suppliers.length === 0) return null;

    return (
        <section className="mt-10 border-t border-slate-200 pt-8">
            <h2 className="text-xl font-bold text-slate-900">{t('similar_suppliers', 'Similar suppliers')}</h2>
            <p className="mt-1 text-sm text-slate-500">
                {t('similar_suppliers_hint', 'Other verified suppliers working in the same sector.')}
            </p>

            <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {suppliers.map((s) => (
                    <li key={s.id}>
                        <Link
                            to={`/u/${s.username}`}
                            className="flex h-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-brand hover:shadow-sm"
                        >
                            {s.photo ? (
                                <img
                                    src={s.photo}
                                    alt={t('supplier_logo_alt', '{{name}} logo', { name: s.company || s.name })}
                                    loading="lazy"
                                    width="48"
                                    height="48"
                                    className="h-12 w-12 shrink-0 rounded-xl object-cover"
                                />
                            ) : (
                                <span
                                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-base font-bold text-brand"
                                    aria-hidden
                                >
                                    {(s.company || s.name || '?').charAt(0)}
                                </span>
                            )}
                            <span className="min-w-0">
                                <span className="block truncate text-sm font-semibold text-slate-900">
                                    {s.company || s.name}
                                </span>
                                {s.city ? <span className="block truncate text-xs text-slate-500">{s.city}</span> : null}
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}
