import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    HiOutlineGlobeAlt,
    HiOutlineBuildingOffice2,
    HiOutlineMapPin,
    HiCheckBadge,
    HiOutlineShare,
    HiOutlineChatBubbleLeftRight,
    HiOutlineCalendarDays,
    HiOutlineUsers,
    HiOutlineShoppingBag,
    HiOutlineEnvelope,
} from 'react-icons/hi2';
import {
    FaFacebookF,
    FaInstagram,
    FaTwitter,
    FaLinkedinIn,
    FaYoutube,
    FaTiktok,
    FaWhatsapp,
    FaTelegram,
    FaGlobe,
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../../api/client';
import { CHAT_ENABLED } from '../../lib/features';
import SEO from '../../components/SEO';
import SimilarSuppliers from './SimilarSuppliers';

const SOCIAL_META = {
    facebook: { Icon: FaFacebookF, color: 'from-[#1877F2] to-[#1877F2]' },
    instagram: { Icon: FaInstagram, color: 'from-[#F58529] via-[#DD2A7B] to-[#8134AF]' },
    twitter: { Icon: FaTwitter, color: 'from-sky-400 to-sky-600' },
    x: { Icon: FaTwitter, color: 'from-slate-700 to-slate-900' },
    linkedin: { Icon: FaLinkedinIn, color: 'from-[#0A66C2] to-[#0A66C2]' },
    youtube: { Icon: FaYoutube, color: 'from-red-500 to-red-700' },
    tiktok: { Icon: FaTiktok, color: 'from-slate-800 to-black' },
    whatsapp: { Icon: FaWhatsapp, color: 'from-[#25D366] to-[#128C7E]' },
    telegram: { Icon: FaTelegram, color: 'from-[#229ED9] to-[#0b6ea1]' },
};

function parseSocial(raw) {
    if (!raw) return [];
    let obj = raw;
    if (typeof raw === 'string') {
        try { obj = JSON.parse(raw); } catch { return []; }
    }
    if (!obj || typeof obj !== 'object') return [];
    return Object.entries(obj)
        .map(([k, v]) => ({ key: String(k).toLowerCase(), url: String(v || '').trim() }))
        .filter((e) => e.url);
}

export default function PublicProfilePage() {
    const { username } = useParams();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const orderNow = useCallback(() => {
        const token = localStorage.getItem('sellchase_access_token');
        navigate(token ? '/orders' : `/login?redirect=${encodeURIComponent('/orders')}`);
    }, [navigate]);
    const [data, setData] = useState(null);
    const [products, setProducts] = useState([]);
    const [tab, setTab] = useState('products');
    const [loading, setLoading] = useState(true);
    const [productsLoading, setProductsLoading] = useState(true);
    const [productsLoaded, setProductsLoaded] = useState(false);
    const [notFound, setNotFound] = useState(false);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    const loadProducts = useCallback(async (p = 1) => {
        setProductsLoading(true);
        try {
            const { data: resp } = await api.get(`/public/profile/${encodeURIComponent(username)}/products`, {
                params: { per_page: 12, page: p },
            });
            setProducts(resp.data ?? []);
            setPage(resp.meta?.current_page ?? 1);
            setLastPage(resp.meta?.last_page ?? 1);
        } catch {
            setProducts([]);
        } finally {
            setProductsLoading(false);
            setProductsLoaded(true);
        }
    }, [username]);

    const load = useCallback(async () => {
        setLoading(true);
        setNotFound(false);
        try {
            const { data: resp } = await api.get(`/public/profile/${encodeURIComponent(username)}`);
            setData(resp);
            // Suppliers default to the Products tab; fetch products in parallel
            // so the catalog is ready the moment the page paints (fast + smooth).
            if (resp?.user?.role === 'supplier') {
                setTab('products');
                loadProducts(1);
            } else {
                setTab('about');
                setProductsLoading(false);
            }
        } catch (e) {
            if (e.response?.status === 404) setNotFound(true);
        } finally {
            setLoading(false);
        }
    }, [username, loadProducts]);

    useEffect(() => { load(); }, [load]);

    const socials = useMemo(() => parseSocial(data?.profile?.social_media), [data]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            </div>
        );
    }
    if (notFound || !data) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
                <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-xs">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        <HiOutlineGlobeAlt className="h-8 w-8" />
                    </div>
                    <h1 className="text-2xl font-semibold text-slate-900">{t('public_profile_not_found_title')}</h1>
                    <p className="mt-2 text-sm text-slate-500">{t('public_profile_not_found_subtitle')}</p>
                    <Link to="/" className="mt-6 inline-flex rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-brand/90">{t('back_home')}</Link>
                </div>
            </div>
        );
    }

    const { user, profile, stats } = data;
    const displayName = user.name;
    const roleLabel = t('role_' + user.role);
    const description = profile.tagline || profile.biography || `${displayName} — ${roleLabel}`;
    const canonical = typeof window !== 'undefined' ? `${window.location.origin}/u/${profile.username}` : `/u/${profile.username}`;
    const initials = (displayName || '?').trim().split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join('');
    const locationStr = [profile.city, profile.country].filter(Boolean).join(', ');

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({ title: displayName, text: description, url: canonical });
            } else {
                await navigator.clipboard.writeText(canonical);
                toast.success(t('link_copied') || 'Link copied');
            }
        } catch { /* cancelled */ }
    };

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: displayName,
        url: canonical,
        description,
        image: profile.photo || undefined,
        address: profile.country || profile.city ? {
            '@type': 'PostalAddress',
            addressLocality: profile.city || undefined,
            addressCountry: profile.country || undefined,
        } : undefined,
    };

    return (
        <>
            <SEO
                title={`${displayName} (@${profile.username}) — ${roleLabel}`}
                description={description}
                canonical={canonical}
                ogImage={profile.cover_photo || profile.photo}
                jsonLd={jsonLd}
            />
            <div className="min-h-screen bg-slate-50">
                {/* Cover */}
                <div className="relative h-48 w-full overflow-hidden md:h-60 lg:h-64">
                    {profile.cover_photo ? (
                        <img src={profile.cover_photo} alt="" fetchpriority="high" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
                    ) : profile.cover_color ? (
                        <div className="absolute inset-0" style={{ background: profile.cover_color }} />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-brand to-brand-dark" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
                </div>

                {/* Identity card */}
                <div className="mx-auto -mt-16 max-w-5xl px-4">
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card md:p-8">
                        <div className="flex flex-col items-start gap-5 md:flex-row md:items-end md:gap-6">
                            {/* Avatar */}
                            <div className="relative -mt-16 md:-mt-20">
                                <div className="relative h-28 w-28 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-lg ring-1 ring-slate-200 md:h-32 md:w-32">
                                    {profile.photo ? (
                                        <img src={profile.photo} alt={displayName} decoding="async" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-brand/10 text-4xl font-bold text-brand">
                                            {initials || '?'}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Heading */}
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{displayName}</h1>
                                    {user.is_verified ? (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600 ring-1 ring-blue-200">
                                            <HiCheckBadge className="h-4 w-4" aria-hidden />
                                            {t('verified_account')}
                                        </span>
                                    ) : null}
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                                        user.role === 'supplier'
                                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                                            : user.role === 'merchant'
                                                ? 'bg-amber-50 text-amber-700 ring-amber-200'
                                                : 'bg-slate-50 text-slate-700 ring-slate-200'
                                    }`}>
                                        {roleLabel}
                                    </span>
                                </div>
                                <p className="mt-1 text-sm text-slate-500">@{profile.username}</p>
                                {profile.tagline ? (
                                    <p className="mt-3 max-w-2xl text-slate-700">{profile.tagline}</p>
                                ) : null}
                                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                    {profile.company ? (
                                        <span className="inline-flex items-center gap-1.5"><HiOutlineBuildingOffice2 className="h-4 w-4" aria-hidden />{profile.company}</span>
                                    ) : null}
                                    {locationStr ? (
                                        <span className="inline-flex items-center gap-1.5"><HiOutlineMapPin className="h-4 w-4" aria-hidden />{locationStr}</span>
                                    ) : null}
                                    {profile.website ? (
                                        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-brand hover:underline">
                                            <HiOutlineGlobeAlt className="h-4 w-4" aria-hidden />
                                            {profile.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                        </a>
                                    ) : null}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex shrink-0 items-center gap-2">
                                {CHAT_ENABLED && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const token = localStorage.getItem('sellchase_access_token');
                                            const dest = `/chat?u=${user.id}`;
                                            navigate(token ? dest : `/login?redirect=${encodeURIComponent(dest)}`);
                                        }}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-brand/90"
                                    >
                                        <HiOutlineChatBubbleLeftRight className="h-4 w-4" aria-hidden />
                                        {t('chat_button', 'Chat')}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={handleShare}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs transition hover:border-brand hover:text-brand"
                                >
                                    <HiOutlineShare className="h-4 w-4" aria-hidden />
                                    {t('share') || 'Share'}
                                </button>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="mt-6 grid gap-3 sm:grid-cols-3">
                            <StatCard
                                Icon={HiOutlineCalendarDays}
                                label={t('public_profile_years_active')}
                                value={stats.years_active}
                            />
                            <StatCard
                                Icon={HiOutlineUsers}
                                label={t('public_profile_partners')}
                                value={stats.partners_count}
                            />
                            {user.role === 'supplier' ? (
                                <StatCard
                                    Icon={HiOutlineShoppingBag}
                                    label={t('public_profile_products')}
                                    value={stats.products_count}
                                />
                            ) : (
                                <StatCard
                                    Icon={HiOutlineEnvelope}
                                    label={t('public_profile_role') || 'Role'}
                                    value={roleLabel}
                                />
                            )}
                        </div>

                        {/* Socials */}
                        {socials.length > 0 ? (
                            <div className="mt-6 flex flex-wrap items-center gap-2">
                                {socials.map(({ key, url }) => {
                                    const meta = SOCIAL_META[key] || { Icon: FaGlobe };
                                    const Icon = meta.Icon;
                                    return (
                                        <a
                                            key={key}
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title={key}
                                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-xs transition hover:border-brand hover:bg-brand/5 hover:text-brand"
                                        >
                                            <Icon className="h-4 w-4" aria-hidden />
                                        </a>
                                    );
                                })}
                            </div>
                        ) : null}
                    </div>

                    {/* Tabs */}
                    <div className="sticky top-0 z-10 mt-6 -mx-4 border-b border-slate-200 bg-slate-50/80 px-4 backdrop-blur-sm">
                        <div className="flex gap-1">
                            {user.role === 'supplier' ? (
                                <TabButton active={tab === 'products'} onClick={() => setTab('products')}>{t('public_profile_tab_products')}</TabButton>
                            ) : null}
                            <TabButton active={tab === 'about'} onClick={() => setTab('about')}>{t('public_profile_tab_about')}</TabButton>
                        </div>
                    </div>

                    <div className="py-8">
                        {tab === 'about' ? (
                            <div className="grid gap-5 lg:grid-cols-3">
                                <div className="lg:col-span-2">
                                    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
                                        <h2 className="text-lg font-semibold text-slate-900">{t('public_profile_about') || 'About'}</h2>
                                        <div className="mt-3">
                                            {profile.biography ? (
                                                <p className="whitespace-pre-line leading-relaxed text-slate-700">{profile.biography}</p>
                                            ) : (
                                                <p className="text-slate-400">{t('public_profile_no_bio')}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {profile.company ? <InfoRow icon={HiOutlineBuildingOffice2} label={t('public_profile_company')} value={profile.company} /> : null}
                                    {locationStr ? <InfoRow icon={HiOutlineMapPin} label={t('public_profile_location')} value={locationStr} /> : null}
                                    {profile.website ? <InfoRow icon={HiOutlineGlobeAlt} label={t('public_profile_website')} value={profile.website.replace(/^https?:\/\//, '').replace(/\/$/, '')} href={profile.website} /> : null}
                                </div>
                            </div>
                        ) : (
                            <div>
                                {productsLoading && !productsLoaded ? (
                                    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                                        {Array.from({ length: 8 }).map((_, i) => (
                                            <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                                                <div className="aspect-square animate-pulse bg-slate-100" />
                                                <div className="space-y-2 p-3">
                                                    <div className="h-3.5 w-3/4 animate-pulse rounded-sm bg-slate-100" />
                                                    <div className="h-3 w-1/2 animate-pulse rounded-sm bg-slate-100" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : products.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
                                        <HiOutlineShoppingBag className="mx-auto h-10 w-10 text-slate-300" aria-hidden />
                                        <p className="mt-3 text-slate-400">{t('public_profile_no_products')}</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                                            {products.map((p) => (
                                                <div key={p.id} className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card transition hover:-translate-y-1 hover:shadow-lg">
                                                    <div className="aspect-square overflow-hidden bg-slate-100">
                                                        {p.image ? (
                                                            <img src={p.image} alt={p.name} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center text-slate-300">
                                                                <HiOutlineShoppingBag className="h-10 w-10" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-1 flex-col p-3">
                                                        <p className="line-clamp-2 text-sm font-semibold text-slate-900">{p.name}</p>
                                                        {p.description ? (
                                                            <p className="mt-1 line-clamp-2 text-xs text-slate-500">{p.description}</p>
                                                        ) : null}
                                                        <button
                                                            type="button"
                                                            onClick={() => orderNow()}
                                                            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-brand/90 active:scale-[0.98]"
                                                        >
                                                            <HiOutlineShoppingBag className="h-4 w-4" aria-hidden />
                                                            {t('order_now', 'Order now')}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {lastPage > 1 ? (
                                            <div className="mt-8 flex items-center justify-center gap-2">
                                                <button disabled={page <= 1} onClick={() => loadProducts(page - 1)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm disabled:opacity-40">«</button>
                                                <span className="text-sm text-slate-500">{page} / {lastPage}</span>
                                                <button disabled={page >= lastPage} onClick={() => loadProducts(page + 1)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm disabled:opacity-40">»</button>
                                            </div>
                                        ) : null}
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Internal linking: same-sector suppliers (SEO + discovery). */}
                    <SimilarSuppliers username={username} />

                    <div className="pb-10 text-center text-xs text-slate-400">
                        <Link to="/" className="hover:text-brand">B2B-Sellchaze</Link>
                    </div>
                </div>
            </div>
        </>
    );
}

function StatCard({ Icon, label, value }) {
    return (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <Icon className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
                    <p className="truncate text-lg font-bold text-slate-900">{value}</p>
                </div>
            </div>
        </div>
    );
}

function TabButton({ active, onClick, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`relative px-4 py-3 text-sm font-semibold transition ${
                active ? 'text-brand' : 'text-slate-500 hover:text-slate-800'
            }`}
        >
            {children}
            {active ? <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-brand" /> : null}
        </button>
    );
}

function InfoRow({ icon: Icon, label, value, href }) {
    const content = (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs transition hover:border-brand hover:shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <Icon className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
                <p className="truncate text-sm font-medium text-slate-800">{value}</p>
            </div>
        </div>
    );
    return href ? <a href={href} target="_blank" rel="noreferrer noopener" className="block">{content}</a> : content;
}
