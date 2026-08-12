import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../../api/client';
import { initials } from '../../../components/feed/helpers';
import {
    HiBookmark,
    HiFire,
    HiHome,
    HiOutlineBookmark,
    HiOutlineFire,
    HiOutlineHome,
    HiOutlinePlayCircle,
    HiOutlinePlus,
    HiOutlineUserGroup,
    HiOutlineUsers,
    HiPlayCircle,
    HiUserGroup,
    HiUsers,
} from 'react-icons/hi2';
import FollowSuggestions from '../../../components/feed/FollowSuggestions';

/**
 * Community navigation — the Instagram grammar: a quiet list of bare icons,
 * where the active place is told by weight alone (solid icon + bold label),
 * not by boxes, chips or colour. Hover is a soft rounded wash and nothing
 * else moves.
 */
const NAV_ITEMS = [
    { to: '/community', end: true, labelKey: 'community_nav_home', Icon: HiOutlineHome, ActiveIcon: HiHome },
    { to: '/community/trending', labelKey: 'community_nav_trending', Icon: HiOutlineFire, ActiveIcon: HiFire },
    { to: '/reels', labelKey: 'community_nav_reels', Icon: HiOutlinePlayCircle, ActiveIcon: HiPlayCircle },
    { to: '/community/following', labelKey: 'community_nav_following', Icon: HiOutlineUsers, ActiveIcon: HiUsers },
    { to: '/community/groups', labelKey: 'community_nav_groups', Icon: HiOutlineUserGroup, ActiveIcon: HiUserGroup },
    { to: '/community/saved', labelKey: 'community_nav_saved', Icon: HiOutlineBookmark, ActiveIcon: HiBookmark },
];

/** The five destinations that fit a phone tab bar, in browse-first order. */
const MOBILE_ITEMS = [NAV_ITEMS[0], NAV_ITEMS[1], NAV_ITEMS[2], NAV_ITEMS[4], NAV_ITEMS[5]];

function SidebarLink({ to, end, labelKey, Icon, ActiveIcon }) {
    const { t } = useTranslation();
    return (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
                `sc-press flex items-center gap-4 rounded-xl px-3 py-3 text-[15px] transition hover:bg-slate-100/80 ${
                    isActive ? 'font-bold text-slate-900' : 'font-medium text-slate-700'
                }`
            }
        >
            {({ isActive }) => (
                <>
                    {isActive
                        ? <ActiveIcon className="h-6 w-6 shrink-0 text-slate-900" aria-hidden />
                        : <Icon className="h-6 w-6 shrink-0" aria-hidden />}
                    <span className="truncate">{t(labelKey)}</span>
                </>
            )}
        </NavLink>
    );
}

function MobileLink({ to, end, labelKey, Icon, ActiveIcon }) {
    const { t } = useTranslation();
    return (
        <NavLink
            to={to}
            end={end}
            aria-label={t(labelKey)}
            className="sc-press flex flex-col items-center justify-center gap-0.5 py-2.5"
        >
            {({ isActive }) => (
                <>
                    {isActive
                        ? <ActiveIcon className="h-6.5 w-6.5 text-slate-900" aria-hidden />
                        : <Icon className="h-6.5 w-6.5 text-slate-500" aria-hidden />}
                    <span className={`text-[10px] ${isActive ? 'font-bold text-slate-900' : 'font-medium text-slate-500'}`}>{t(labelKey)}</span>
                </>
            )}
        </NavLink>
    );
}

/** The recurring promo card at the top of the right rail. */
function OpportunitiesPromo() {
    const { t } = useTranslation();
    return (
        <section className="group relative isolate min-h-48 overflow-hidden rounded-2xl text-white shadow-[0_14px_40px_-26px_rgba(15,23,42,.6)]">
            <img
                src="/media/community/b2b-opportunity-cover-v1.png"
                alt=""
                loading="lazy"
                decoding="async"
                className="absolute inset-0 -z-10 h-full w-full object-cover transition duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
            <div className="flex h-full min-h-48 flex-col justify-end p-5">
                <p className="text-[11px] font-bold uppercase tracking-widest text-blue-200">{t('community_promo_eyebrow')}</p>
                <h2 className="mt-1 text-lg font-bold leading-snug">{t('community_promo_title')}</h2>
                <p className="mt-1.5 text-xs leading-5 text-white/80">{t('community_promo_body')}</p>
            </div>
        </section>
    );
}

/**
 * Three-column frame shared by every community surface. The middle column is
 * capped at a comfortable reading width; the rails hold context, never the
 * primary content, so the shell degrades cleanly to a single column on a phone.
 */
export default function CommunityShell({ children, rightRail = true }) {
    const { t } = useTranslation();
    const [me, setMe] = useState(null);

    useEffect(() => {
        let alive = true;
        api.get('/auth/me')
            .then(({ data }) => {
                if (alive) setMe(data.user || data);
            })
            .catch(() => {});
        return () => {
            alive = false;
        };
    }, []);

    const myUsername = me?.profile?.username;
    const myPhoto = me?.profile?.photo_url || me?.avatar;
    const myName = me?.profile?.company || me?.name;

    return (
        <div className="mx-auto w-full max-w-[1400px] pb-24 lg:pb-0">
            <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,720px)_320px] xl:justify-center">
                <aside className="sticky top-1 hidden lg:block">
                    <div className="px-3 pb-4 pt-2">
                        <p className="text-lg font-bold tracking-tight text-slate-900">{t('community_brand_title')}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{t('community_brand_subtitle')}</p>
                    </div>

                    <nav aria-label={t('community_brand_title')} className="space-y-0.5">
                        {NAV_ITEMS.map((item) => (
                            <SidebarLink key={item.to} {...item} />
                        ))}

                        {/* My profile — an Instagram-style row with the real avatar. */}
                        {myUsername ? (
                            <NavLink
                                to={`/community/u/${myUsername}`}
                                className={({ isActive }) =>
                                    `sc-press flex items-center gap-4 rounded-xl px-3 py-3 text-[15px] transition hover:bg-slate-100/80 ${
                                        isActive ? 'font-bold text-slate-900' : 'font-medium text-slate-700'
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        {myPhoto ? (
                                            <img
                                                src={myPhoto}
                                                alt=""
                                                className={`h-6 w-6 shrink-0 rounded-full object-cover ${isActive ? 'ring-2 ring-slate-900' : 'ring-1 ring-slate-200'}`}
                                            />
                                        ) : (
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-dark to-brand text-[10px] font-bold text-white">
                                                {initials(myName)}
                                            </span>
                                        )}
                                        <span className="truncate">{t('community_nav_profile', 'Profile')}</span>
                                    </>
                                )}
                            </NavLink>
                        ) : null}
                    </nav>

                    <NavLink
                        to="/community/create"
                        className="sc-press mt-4 flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-[15px] font-bold text-white shadow-md shadow-brand/20 transition hover:bg-brand-dark"
                    >
                        <HiOutlinePlus className="h-5 w-5" aria-hidden />
                        {t('community_create_cta')}
                    </NavLink>
                </aside>

                <main className="min-w-0">{children}</main>

                {rightRail ? (
                    <aside className="sticky top-1 hidden space-y-4 xl:block">
                        <OpportunitiesPromo />
                        <FollowSuggestions />
                    </aside>
                ) : null}
            </div>

            <nav
                aria-label={t('community_brand_title')}
                className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-200/80 bg-white/95 backdrop-blur-xl lg:hidden"
            >
                {MOBILE_ITEMS.map((item) => (
                    <MobileLink key={item.to} {...item} />
                ))}
            </nav>
        </div>
    );
}
