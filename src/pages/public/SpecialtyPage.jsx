import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import { langParam } from '../../api/lang';
import SEO from '../../components/SEO';
import SupplierCard from './SupplierCard';
import AddFactoryBanner from './AddFactoryBanner';
import CityLinks from './CityLinks';

const ORIGIN = 'https://sellchaze.com';

export default function SpecialtyPage() {
    const { sector, specialty } = useParams();
    const { t, i18n } = useTranslation();
    const { lang } = langParam(i18n);

    const [sectorMeta, setSectorMeta] = useState(null);
    const [specialtyMeta, setSpecialtyMeta] = useState(null);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setNotFound(false);
        api.get(`/public/sectors/${sector}/${specialty}`, { params: { lang } })
            .then(({ data }) => {
                if (!active) return;
                setSectorMeta(data.sector ?? null);
                setSpecialtyMeta(data.specialty ?? null);
                setSuppliers(Array.isArray(data.suppliers?.data) ? data.suppliers.data : []);
            })
            .catch((e) => {
                if (!active) return;
                if (e.response?.status === 404) setNotFound(true);
                setSectorMeta(null);
                setSpecialtyMeta(null);
                setSuppliers([]);
            })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [sector, specialty, lang]);

    if (notFound) {
        return (
            <div className="mx-auto max-w-3xl px-5 py-24 text-center">
                <SEO title={t('sup_dir_404_title', 'Not found')} noIndex />
                <h1 className="text-3xl font-bold text-slate-900">{t('sup_dir_404_specialty_title', 'Specialty not found')}</h1>
                <p className="mt-3 text-slate-500">{t('sup_dir_404_body', "The page you're looking for doesn't exist.")}</p>
                <Link to="/suppliers" className="mt-6 inline-block rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white">
                    {t('sup_dir_back_to_directory', 'Back to directory')}
                </Link>
            </div>
        );
    }

    const canonical = `${ORIGIN}/suppliers/${sector}/${specialty}`;
    const description =
        specialtyMeta?.seo_description ||
        specialtyMeta?.intro ||
        t('sup_dir_specialty_seo_fallback', 'Browse verified {{specialty}} suppliers in Egypt on Sellchaze — view profiles, product catalogs and contact details.', { specialty: specialtyMeta?.name || specialty });

    // BreadcrumbList: Home › Directory › {sector} › {specialty}. Built once the
    // specialty meta has loaded so URLs/names reflect real data.
    const jsonLd = specialtyMeta
        ? {
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                  { '@type': 'ListItem', position: 1, name: t('nav_home', 'Home'), item: ORIGIN },
                  { '@type': 'ListItem', position: 2, name: t('sup_dir_breadcrumb_root', 'Directory'), item: `${ORIGIN}/suppliers` },
                  ...(sectorMeta ? [{ '@type': 'ListItem', position: 3, name: sectorMeta.name, item: `${ORIGIN}/suppliers/${sector}` }] : []),
                  { '@type': 'ListItem', position: sectorMeta ? 4 : 3, name: specialtyMeta.name, item: canonical },
              ],
          }
        : null;

    return (
        <div className="mx-auto max-w-6xl px-5 py-10">
            <SEO title={specialtyMeta?.seo_title} description={description} canonical={canonical} jsonLd={jsonLd} />

            <nav className="text-sm text-slate-400">
                <Link to="/suppliers" className="hover:text-brand">{t('sup_dir_breadcrumb_root', 'Directory')}</Link>
                <span className="mx-2">›</span>
                {sectorMeta ? (
                    <>
                        <Link to={`/suppliers/${sector}`} className="hover:text-brand">{sectorMeta.name}</Link>
                        <span className="mx-2">›</span>
                    </>
                ) : null}
                <span className="text-slate-600">{specialtyMeta?.name}</span>
            </nav>

            <div className="mt-4">
                <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                    {specialtyMeta?.icon ? <span className="text-4xl">{specialtyMeta.icon}</span> : null}
                    {specialtyMeta?.name}
                </h1>
                {specialtyMeta?.intro ? (
                    <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600">{specialtyMeta.intro}</p>
                ) : null}
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

            {/* Deepest long-tail: this specialty, city by city. */}
            <CityLinks
                sectorSlug={sector}
                specialtySlug={specialty}
                basePath={`/suppliers/${sector}/${specialty}`}
            />

            <AddFactoryBanner />
            <div className="pb-10" />
        </div>
    );
}
