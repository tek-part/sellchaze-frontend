import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import { langParam } from '../../api/lang';
import SEO from '../../components/SEO';
import SupplierCard from './SupplierCard';
import AddFactoryBanner from './AddFactoryBanner';

const ORIGIN = 'https://sellchaze.com';

/** "Beautify" a slug for display when the API has no canonical label yet. */
const titleize = (slug = '') =>
    slug
        .split('-')
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

/**
 * City landing page — the deepest SEO level: "<sector> suppliers in <city>".
 * These pages exist only for cities that actually have registered suppliers
 * (the sitemap is generated from /public/cities), so they are never empty by
 * construction.
 */
export default function CityPage() {
    const { sector, city } = useParams();
    const { t, i18n } = useTranslation();
    const { lang } = langParam(i18n);

    const [sectorMeta, setSectorMeta] = useState(null);
    const [cityLabel, setCityLabel] = useState('');
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        setLoading(true);

        Promise.all([
            api.get(`/public/sectors/${sector}`, { params: { lang } }).catch(() => null),
            api.get('/public/suppliers', { params: { sector, city, lang, per_page: 48 } }).catch(() => null),
            api.get('/public/cities', { params: { sector, lang } }).catch(() => null),
        ])
            .then(([sectorRes, suppliersRes, citiesRes]) => {
                if (!active) return;
                setSectorMeta(sectorRes?.data?.sector ?? null);
                setSuppliers(Array.isArray(suppliersRes?.data?.data) ? suppliersRes.data.data : []);
                const match = (citiesRes?.data?.cities ?? []).find((c) => c.slug === city);
                setCityLabel(match?.city || titleize(city));
            })
            .finally(() => { if (active) setLoading(false); });

        return () => { active = false; };
    }, [sector, city, lang]);

    const canonical = `${ORIGIN}/suppliers/${sector}/city/${city}`;
    const sectorName = sectorMeta?.name || titleize(sector);

    const title = t('sup_dir_city_seo_title', '{{sector}} Suppliers in {{city}}', {
        sector: sectorName,
        city: cityLabel,
    });

    const description = t(
        'sup_dir_city_seo_description',
        'Browse verified {{sector}} factories and suppliers based in {{city}} on Sellchase — view company profiles, product catalogs and contact details, and reach them directly without intermediaries.',
        { sector: sectorName, city: cityLabel },
    );

    // BreadcrumbList: Home › Directory › {sector} › {city}
    const jsonLd = useMemo(
        () => ({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: t('nav_home', 'Home'), item: ORIGIN },
                { '@type': 'ListItem', position: 2, name: t('sup_dir_breadcrumb_root', 'Directory'), item: `${ORIGIN}/suppliers` },
                { '@type': 'ListItem', position: 3, name: sectorName, item: `${ORIGIN}/suppliers/${sector}` },
                { '@type': 'ListItem', position: 4, name: cityLabel, item: canonical },
            ],
        }),
        [sectorName, cityLabel, sector, canonical, t],
    );

    return (
        <div className="mx-auto max-w-6xl px-5 py-10">
            <SEO title={title} description={description} canonical={canonical} jsonLd={jsonLd} />

            <nav className="text-sm text-slate-400">
                <Link to="/suppliers" className="hover:text-brand">{t('sup_dir_breadcrumb_root', 'Directory')}</Link>
                <span className="mx-2">›</span>
                <Link to={`/suppliers/${sector}`} className="hover:text-brand">{sectorName}</Link>
                <span className="mx-2">›</span>
                <span className="text-slate-600">{cityLabel}</span>
            </nav>

            <div className="mt-4">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
                <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600">{description}</p>
            </div>

            <div className="mt-6 text-sm text-slate-400">
                {loading ? t('loading', 'Loading…') : `${suppliers.length} ${t('sup_dir_results', 'results')}`}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {suppliers.map((card) => <SupplierCard key={card.id} card={card} />)}
            </div>
            {!loading && suppliers.length === 0 ? (
                <p className="mt-6 text-center text-sm text-slate-400">{t('sup_dir_no_results', 'No suppliers found.')}</p>
            ) : null}

            <AddFactoryBanner />
            <div className="pb-10" />
        </div>
    );
}
