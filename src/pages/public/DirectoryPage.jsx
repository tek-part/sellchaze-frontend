import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    HiOutlineMagnifyingGlass,
    HiOutlineBuildingStorefront,
    HiOutlineCube,
    HiOutlineMapPin,
    HiOutlineCheckBadge,
    HiOutlineArrowRight,
} from 'react-icons/hi2';
import api from '../../api/client';

function initials(name) { return (name || '?').trim().charAt(0).toUpperCase(); }

const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'supplier', label: 'Suppliers' },
    { key: 'merchant', label: 'Merchants' },
    { key: 'verified', label: 'Verified' },
];

export default function DirectoryPage() {
    const { t } = useTranslation();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [q, setQ] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        const params = { per_page: 48 };
        if (filter === 'supplier' || filter === 'merchant') params.role = filter;
        if (filter === 'verified') params.verified = 1;
        if (q) params.q = q;
        try {
            const { data } = await api.get('/public/directory', { params });
            setItems(data.data || []);
        } catch (e) { setItems([]); }
        setLoading(false);
    }, [filter, q]);

    useEffect(() => {
        const id = setTimeout(load, q ? 300 : 0);
        return () => clearTimeout(id);
    }, [load, q]);

    return (
        <div className="mx-auto max-w-6xl px-5 py-10">
            <div className="text-center">
                <span className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-4 py-1.5 text-sm font-medium text-brand">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {t('dir_eyebrow', 'Verified B2B network')}
                </span>
                <h1 className="mx-auto mt-5 max-w-2xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                    {t('dir_title', 'The B2B directory of trusted partners')}
                </h1>
                <p className="mx-auto mt-4 max-w-xl text-lg text-slate-500">
                    {t('dir_subtitle', 'Discover suppliers and merchants on Sellchase. Open any profile to see their catalog, fields of work, and contacts.')}
                </p>
            </div>

            <div className="mx-auto mt-8 flex max-w-2xl items-center gap-2 rounded-full bg-white p-2 ps-5 shadow-xs ring-1 ring-slate-200">
                <HiOutlineMagnifyingGlass className="h-5 w-5 text-slate-400" />
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={t('dir_search', 'Search by name, company, or country…')}
                    className="flex-1 bg-transparent text-base outline-hidden"
                />
            </div>

            <div className="mt-7 flex flex-wrap justify-center gap-2.5">
                {FILTERS.map((f) => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold shadow-xs transition ${filter === f.key ? 'bg-brand text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}
                    >
                        {t(`dir_f_${f.key}`, f.label)}
                    </button>
                ))}
            </div>

            <div className="mt-6 text-center text-sm text-slate-400">
                {loading ? t('loading', 'Loading…') : `${t('dir_showing', 'Showing')} ${items.length} ${t('dir_profiles', 'profiles')}`}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-5 pb-16 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((d) => (
                    <Link key={d.username} to={`/u/${d.username}`} className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-xs ring-1 ring-slate-100 transition hover:-translate-y-1 hover:ring-brand/40">
                        <div className="h-24 bg-linear-to-br from-brand via-blue-500 to-accent" style={d.cover_photo ? { backgroundImage: `url('${d.cover_photo}')`, backgroundSize: 'cover' } : undefined} />
                        <div className="px-5 pb-5">
                            <div className="-mt-8 mb-3 flex items-end justify-between">
                                {d.photo
                                    ? <div className="h-16 w-16 rounded-2xl border-[3px] border-white bg-cover bg-center" style={{ backgroundImage: `url('${d.photo}')` }} />
                                    : <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-[3px] border-white bg-brand/10 text-2xl font-bold text-brand">{initials(d.name)}</div>}
                                <span className={`mb-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${d.role === 'supplier' ? 'bg-emerald-50 text-emerald-700' : 'bg-brand/10 text-brand'}`}>
                                    {d.role === 'supplier' ? <HiOutlineCube className="h-3.5 w-3.5" /> : <HiOutlineBuildingStorefront className="h-3.5 w-3.5" />}
                                    {t(`dir_role_${d.role}`, d.role === 'supplier' ? 'Supplier' : 'Merchant')}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-lg font-semibold text-slate-900">
                                {d.name}
                                {d.is_verified && <HiOutlineCheckBadge className="h-5 w-5 text-brand" />}
                            </div>
                            {d.company && <div className="mt-0.5 text-sm text-slate-500">{d.company}</div>}
                            {(d.country || d.city) && (
                                <div className="mt-2 flex items-center gap-1 text-sm text-slate-400">
                                    <HiOutlineMapPin className="h-4 w-4" /> {[d.city, d.country].filter(Boolean).join(', ')}
                                </div>
                            )}
                            <div className="mt-4 grid grid-cols-3 border-t border-slate-100 pt-3 text-center">
                                <div><div className="text-base font-bold text-slate-900">{d.years_active}</div><div className="text-[11px] text-slate-400">{t('dir_years', 'Years')}</div></div>
                                <div><div className="text-base font-bold text-slate-900">{d.partners_count}</div><div className="text-[11px] text-slate-400">{t('dir_partners', 'Partners')}</div></div>
                                <div><div className="text-base font-bold text-slate-900">{d.role === 'supplier' ? d.products_count : '—'}</div><div className="text-[11px] text-slate-400">{t('dir_products', 'Products')}</div></div>
                            </div>
                            <div className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-slate-50 py-2 text-sm font-semibold text-brand transition group-hover:bg-brand/10">
                                {t('dir_view', 'View profile')} <HiOutlineArrowRight className="h-4 w-4" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
