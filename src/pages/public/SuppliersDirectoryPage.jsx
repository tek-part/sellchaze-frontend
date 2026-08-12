import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineArrowRight } from 'react-icons/hi2';
import api from '../../api/client';
import { langParam } from '../../api/lang';
import SEO from '../../components/SEO';
import SupplierCard from './SupplierCard';

const ORIGIN = 'https://sellchaze.com';

export default function SuppliersDirectoryPage() {
    const { t, i18n } = useTranslation();
    const { lang } = langParam(i18n);
    const [sectors, setSectors] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        setLoading(true);
        api.get('/public/sectors', { params: { lang } })
            .then(({ data }) => {
                if (!active) return;
                setSectors(Array.isArray(data.sectors) ? data.sectors : []);
                setStats(data.stats ?? null);
            })
            .catch(() => { if (active) { setSectors([]); setStats(null); } })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [lang]);

    const statItems = [
        { key: 'suppliers', value: stats?.suppliers, label: t('sup_dir_stat_suppliers', 'Suppliers') },
        { key: 'products', value: stats?.products, label: t('sup_dir_stat_products', 'Products') },
        { key: 'sectors', value: stats?.sectors, label: t('sup_dir_stat_sectors', 'Sectors') },
    ];

    const description = t(
        'sup_dir_seo_desc',
        'Browse verified factories and suppliers across Egypt by sector and specialty. Explore manufacturer profiles, product catalogs and contact details on Sellchaze.',
    );

    // Structured data (only once the sectors have loaded): an ItemList of the
    // sector landing pages plus the directory's WebSite/Organization identity.
    const jsonLd = sectors.length
        ? [
              {
                  '@context': 'https://schema.org',
                  '@type': 'WebSite',
                  name: 'Sellchaze Factory & Supplier Directory',
                  url: `${ORIGIN}/suppliers`,
                  description,
                  publisher: { '@type': 'Organization', name: 'Sellchaze', url: ORIGIN, logo: `${ORIGIN}/logo.png` },
              },
              {
                  '@context': 'https://schema.org',
                  '@type': 'ItemList',
                  name: t('sup_dir_sectors_heading', 'Browse by sector'),
                  numberOfItems: sectors.length,
                  itemListElement: sectors.map((sec, i) => ({
                      '@type': 'ListItem',
                      position: i + 1,
                      name: sec.name,
                      url: `${ORIGIN}/suppliers/${sec.slug}`,
                  })),
              },
          ]
        : null;

    return (
        <div className="mx-auto max-w-6xl px-5 py-10">
            <SEO
                title={t('sup_dir_seo_title', 'Factory & Supplier Directory in Egypt | Sellchaze')}
                description={description}
                canonical={`${ORIGIN}/suppliers`}
                jsonLd={jsonLd}
            />

            <div className="text-center">
                <span className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-4 py-1.5 text-sm font-medium text-brand">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {t('sup_dir_eyebrow', 'Verified factories & suppliers')}
                </span>
                <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                    {t('sup_dir_title', 'Factory & Supplier Directory in Egypt')}
                </h1>
                <p className="mx-auto mt-4 max-w-xl text-lg text-slate-500">
                    {t('sup_dir_subtitle', 'Discover manufacturers and suppliers by sector. Open any profile to see their catalog and contact details.')}
                </p>
            </div>

            {stats ? (
                <div className="mx-auto mt-8 grid max-w-2xl grid-cols-3 gap-4">
                    {statItems.map((s) => (
                        <div key={s.key} className="rounded-2xl bg-white p-5 text-center shadow-xs ring-1 ring-slate-100">
                            <div className="text-2xl font-bold text-slate-900 sm:text-3xl">{s.value ?? 0}</div>
                            <div className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">{s.label}</div>
                        </div>
                    ))}
                </div>
            ) : null}

            <div className="mt-12">
                <h2 className="text-xl font-bold text-slate-900">{t('sup_dir_sectors_heading', 'Browse by sector')}</h2>
                <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {loading && sectors.length === 0
                        ? <div className="col-span-full text-center text-sm text-slate-400">{t('loading', 'Loading…')}</div>
                        : sectors.map((sec) => (
                            <Link
                                key={sec.slug}
                                to={`/suppliers/${sec.slug}`}
                                className="group flex flex-col items-start rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-100 transition hover:-translate-y-1 hover:ring-brand/40"
                            >
                                <span className="text-3xl">{sec.icon}</span>
                                <span className="mt-3 text-base font-semibold text-slate-900">{sec.name}</span>
                                <span className="mt-1 text-sm text-slate-400">
                                    {t('sup_dir_factory_count', '{{count}} factories', { count: sec.suppliers_count ?? 0 })}
                                </span>
                            </Link>
                        ))}
                </div>
            </div>

            {stats?.latest?.length ? (
                <div className="mt-14 pb-10">
                    <h2 className="text-xl font-bold text-slate-900">{t('sup_dir_latest_heading', 'Recently joined')}</h2>
                    <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {stats.latest.map((card) => (
                            <SupplierCard key={card.id} card={card} />
                        ))}
                    </div>
                </div>
            ) : null}

            <div className="mt-10 pb-16 text-center">
                <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-xs transition hover:brightness-110">
                    {t('sup_dir_add_factory_cta', 'Add your factory')} <HiOutlineArrowRight className="h-4 w-4" />
                </Link>
            </div>
        </div>
    );
}
