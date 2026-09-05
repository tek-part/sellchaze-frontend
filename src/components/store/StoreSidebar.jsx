import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    HiOutlineArrowTopRightOnSquare,
    HiOutlineArrowUturnLeft,
    HiOutlineBuildingStorefront,
    HiOutlineRocketLaunch,
} from 'react-icons/hi2';
import StoreStatusPill from './StoreStatusPill';
import { relativeStorePath } from './storeNav';

function initials(name) {
    const words = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return 'S';
    return words.slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function StoreCard({ store, uiBase, loading, onNavigate }) {
    const { t } = useTranslation();
    const isLive = store?.status === 'active';
    const storefrontUrl = store?.storefront_url || store?.public_url || null;

    return (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card">
            <div className="pointer-events-none absolute -top-16 -end-16 h-40 w-40 rounded-full bg-brand-light blur-2xl" aria-hidden />
            <div className="relative flex items-center gap-3">
                {store?.logo_url ? (
                    <img
                        src={store.logo_url}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-xl border border-slate-200 bg-white object-cover"
                    />
                ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-brand to-accent text-base font-bold text-white">
                        {loading ? <HiOutlineBuildingStorefront className="h-5 w-5" aria-hidden /> : initials(store?.name)}
                    </span>
                )}
                <div className="min-w-0 flex-1">
                    {loading ? (
                        <>
                            <span className="block h-3.5 w-28 animate-pulse rounded bg-slate-200" />
                            <span className="mt-2 block h-3 w-16 animate-pulse rounded bg-slate-100" />
                        </>
                    ) : (
                        <>
                            <p className="truncate text-sm font-bold text-slate-900" title={store?.name}>{store?.name || t('store_nav_untitled', 'My store')}</p>
                            <div className="mt-1 flex items-center gap-2">
                                <StoreStatusPill status={store?.status} size="xs" />
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="relative mt-3">
                {isLive && storefrontUrl ? (
                    <a
                        href={storefrontUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-brand/40 hover:bg-brand-light/60 hover:text-brand-dark"
                    >
                        <HiOutlineArrowTopRightOnSquare className="h-4 w-4" aria-hidden />
                        {t('store_nav_view_storefront', 'View storefront')}
                    </a>
                ) : (
                    <Link
                        to={`${uiBase}/settings/publish`}
                        onClick={onNavigate}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-brand-dark"
                    >
                        <HiOutlineRocketLaunch className="h-4 w-4" aria-hidden />
                        {t('store_nav_publish_cta', 'Publish store')}
                    </Link>
                )}
            </div>
        </div>
    );
}

/**
 * Store admin sidebar — a store header card, grouped links and a footer.
 * Rendered in the desktop rail and inside the mobile drawer (with onNavigate).
 */
export default function StoreSidebar({ store, groups, uiBase, isAdminScope = false, loading = false, onNavigate }) {
    const { t } = useTranslation();
    const { pathname } = useLocation();
    const rel = relativeStorePath(pathname, uiBase);

    return (
        <nav aria-label={t('store_nav_aria', 'Store navigation')} className="flex h-full flex-col gap-4">
            <StoreCard store={store} uiBase={uiBase} loading={loading} onNavigate={onNavigate} />

            <div className="flex-1 space-y-5">
                {groups.map((group) => (
                    <div key={group.key}>
                        <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{group.label}</p>
                        <ul className="space-y-0.5">
                            {group.items.map((item) => {
                                const active = item.isActive(rel);
                                const Icon = item.Icon;
                                return (
                                    <li key={item.key}>
                                        <Link
                                            to={`${uiBase}/${item.to}`}
                                            onClick={onNavigate}
                                            aria-current={active ? 'page' : undefined}
                                            className={[
                                                'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150',
                                                active
                                                    ? 'bg-brand text-white shadow-md shadow-brand/25'
                                                    : 'text-slate-600 hover:bg-brand-light/70 hover:text-brand-dark',
                                            ].join(' ')}
                                        >
                                            <Icon className={`h-5 w-5 shrink-0 ${active ? 'text-white' : 'text-slate-400 group-hover:text-brand'}`} aria-hidden />
                                            <span className="truncate">{item.label}</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </div>

            {isAdminScope ? (
                <div className="border-t border-slate-200/80 pt-3">
                    <Link
                        to="/stores"
                        onClick={onNavigate}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                    >
                        <HiOutlineArrowUturnLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
                        {t('store_nav_back_to_stores', 'All stores')}
                    </Link>
                </div>
            ) : null}
        </nav>
    );
}
