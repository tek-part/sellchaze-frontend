import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import api from '../../api/client';
import { langParam } from '../../api/lang';
import SEO from '../../components/SEO';
import SupplierCard from './SupplierCard';
import AddFactoryBanner from './AddFactoryBanner';

const ORIGIN = 'https://sellchase.com';

export default function SectorPage() {
    const { sector } = useParams();
    const { t, i18n } = useTranslation();
    const { lang } = langParam(i18n);

    const [meta, setMeta] = useState(null);
    const [specialties, setSpecialties] = useState([]);
    const [notFound, setNotFound] = useState(false);

    const [suppliers, setSuppliers] = useState([]);
    const [listLoading, setListLoading] = useState(true);
    const [q, setQ] = useState('');
    const [verified, setVerified] = useState(false);

    // Sector header / specialties / SEO copy.
    useEffect(() => {
        let active = true;
        setNotFound(false);
        api.get(`/public/sectors/${sector}`, { params: { lang } })
            .then(({ data }) => {
                if (!active) return;
                setMeta(data.sector ?? null);
                setSpecialties(Array.isArray(data.specialties) ? data.specialties : []);
            })
            .catch((e) => {
                if (!active) return;
                if (e.response?.status === 404) setNotFound(true);
                setMeta(null);
                setSpecialties([]);
            });
        return () => { active = false; };
    }, [sector, lang]);

    // Supplier list — debounced search + verified toggle.
    const loadSuppliers = useCallback(async () => {
        setListLoading(true);
        const params = { sector, lang };
        if (q) params.q = q;
        if (verified) params.verified = 1;
        try {
            const { data } = await api.get('/public/suppliers', { params });
            setSuppliers(data.data || []);
        } catch { setSuppliers([]); }
        setListLoading(false);
    }, [sector, q, verified, lang]);

    useEffect(() => {
        if (notFound) return;
        const id = setTimeout(loadSuppliers, q ? 300 : 0);
        return () => clearTimeout(id);
    }, [loadSuppliers, q, notFound]);

    if (notFound) {
        return (
            <div className="mx-auto max-w-3xl px-5 py-24 text-center">
                <SEO title={t('sup_dir_404_title', 'Sector not found')} noIndex />
                <h1 className="text-3xl font-bold text-slate-900">{t('sup_dir_404_title', 'Sector not found')}</h1>
                <p className="mt-3 text-slate-500">{t('sup_dir_404_body', "The sector you're looking for doesn't exist.")}</p>
                <Link to="/suppliers" className="mt-6 inline-block rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white">
                    {t('sup_dir_back_to_directory', 'Back to directory')}
                </Link>
            </div>
        );
    }

    const canonical = `${ORIGIN}/suppliers/${sector}`;
    const description =
        meta?.seo_description ||
        meta?.intro ||
        t('sup_dir_sector_seo_fallback', 'Browse verified {{sector}} factories and suppliers in Egypt on Sellchase — view profiles, product catalogs and contact details.', { sector: meta?.name || sector });

    // BreadcrumbList (Home › Suppliers › {sector}) + a CollectionPage listing the
    // suppliers currently rendered. Emitted only once the sector meta has loaded.
    const jsonLd = meta
        ? [
              {
                  '@context': 'https://schema.org',
                  '@type': 'BreadcrumbList',
                  itemListElement: [
                      { '@type': 'ListItem', position: 1, name: t('nav_home', 'Home'), item: ORIGIN },
                      { '@type': 'ListItem', position: 2, name: t('sup_dir_breadcrumb_root', 'Directory'), item: `${ORIGIN}/suppliers` },
                      { '@type': 'ListItem', position: 3, name: meta.name, item: canonical },
                  ],
              },
              {
                  '@context': 'https://schema.org',
                  '@type': 'CollectionPage',
                  name: meta.seo_title || meta.name,
                  description,
                  url: canonical,
                  mainEntity: {
                      '@type': 'ItemList',
                      numberOfItems: suppliers.length,
                      itemListElement: suppliers.map((s, i) => ({
                          '@type': 'ListItem',
                          position: i + 1,
                          name: s.name,
                          ...(s.username ? { url: `${ORIGIN}/u/${s.username}` } : {}),
                      })),
                  },
              },
          ]
        : null;

    return (
        <div className="mx-auto max-w-6xl px-5 py-10">
            <SEO title={meta?.seo_title} description={description} canonical={canonical} jsonLd={jsonLd} />

            <nav className="text-sm text-slate-400">
                <Link to="/suppliers" className="hover:text-brand">{t('sup_dir_breadcrumb_root', 'Directory')}</Link>
                <span className="mx-2">›</span>
                <span className="text-slate-600">{meta?.name}</span>
            </nav>

            <div className="mt-4">
                <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                    {meta?.icon ? <span className="text-4xl">{meta.icon}</span> : null}
                    {meta?.name}
                </h1>
                {meta?.intro ? (
                    <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600">{meta.intro}</p>
                ) : null}
            </div>

            {specialties.length ? (
                <div className="mt-6">
                    <h2 className="sr-only">{t('sup_dir_specialties_heading', 'Specialties')}</h2>
                    <div className="flex flex-wrap gap-2.5">
                        {specialties.map((sp) => (
                            <Link
                                key={sp.slug}
                                to={`/suppliers/${sector}/${sp.slug}`}
                                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-xs ring-1 ring-slate-200 transition hover:bg-slate-50 hover:text-brand"
                            >
                                {sp.name}
                                {typeof sp.suppliers_count === 'number' ? <span className="ms-1.5 text-slate-400">({sp.suppliers_count})</span> : null}
                            </Link>
                        ))}
                    </div>
                </div>
            ) : null}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-2 rounded-full bg-white p-2 ps-5 shadow-xs ring-1 ring-slate-200">
                    <HiOutlineMagnifyingGlass className="h-5 w-5 text-slate-400" />
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder={t('sup_dir_search', 'Search by name, company, or city…')}
                        className="flex-1 bg-transparent text-base outline-hidden"
                    />
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-xs ring-1 ring-slate-200">
                    <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} className="accent-brand" />
                    {t('sup_dir_verified_only', 'Verified only')}
                </label>
            </div>

            <div className="mt-4 text-sm text-slate-400">
                {listLoading ? t('loading', 'Loading…') : `${suppliers.length} ${t('sup_dir_results', 'results')}`}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {suppliers.map((card) => <SupplierCard key={card.id} card={card} />)}
            </div>
            {!listLoading && suppliers.length === 0 ? (
                <p className="mt-6 text-center text-sm text-slate-400">{t('sup_dir_no_results', 'No suppliers found.')}</p>
            ) : null}

            <AddFactoryBanner />
            <div className="pb-10" />
        </div>
    );
}
