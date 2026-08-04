import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineMapPin } from 'react-icons/hi2';
import api from '../../api/client';

/**
 * City links for a sector ("Ready-made Clothing suppliers in Alexandria").
 *
 * These long-tail pages are far easier to rank than the generic sector term, and
 * linking to them from the sector page is what ties the directory together:
 * directory → sector → specialty → city → supplier. Renders nothing until at
 * least one city actually has suppliers, so no empty pages are ever linked.
 */
export default function CityLinks({ sectorSlug, specialtySlug = null, basePath }) {
    const { t, i18n } = useTranslation();
    const [cities, setCities] = useState([]);

    useEffect(() => {
        if (!sectorSlug) return undefined;
        let active = true;
        api.get('/public/cities', {
            params: { sector: specialtySlug || sectorSlug, lang: i18n.resolvedLanguage || i18n.language },
        })
            .then((res) => { if (active) setCities(res.data?.cities ?? []); })
            .catch(() => { if (active) setCities([]); });
        return () => { active = false; };
    }, [sectorSlug, specialtySlug, i18n.resolvedLanguage, i18n.language]);

    if (cities.length === 0) return null;

    return (
        <nav aria-label={t('browse_by_city', 'Browse by city')} className="mt-10 border-t border-slate-200 pt-8">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <HiOutlineMapPin className="h-5 w-5 text-brand" aria-hidden />
                {t('browse_by_city', 'Browse by city')}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
                {t('browse_by_city_hint', 'Find suppliers close to you.')}
            </p>

            <ul className="mt-4 flex flex-wrap gap-2">
                {cities.map((c) => (
                    <li key={c.slug}>
                        <Link
                            to={`${basePath}/city/${c.slug}`}
                            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm text-slate-700 transition hover:border-brand hover:text-brand"
                        >
                            {c.city}
                            <span className="text-xs text-slate-400">({c.suppliers_count})</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
