import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    HiBookmark,
    HiFire,
    HiHome,
    HiOutlineBookmark,
    HiOutlineFire,
    HiOutlineHome,
    HiOutlinePlayCircle,
    HiOutlineSquares2X2,
    HiOutlineUserGroup,
    HiOutlineUsers,
    HiOutlineVideoCamera,
    HiPlayCircle,
    HiUserGroup,
    HiUsers,
} from 'react-icons/hi2';
import FollowSuggestions from '../../../components/feed/FollowSuggestions';

/**
 * Community navigation, grouped the way members actually think about the
 * network: what they browse, and what is theirs. Each destination carries an
 * outline icon that swaps to its solid twin while active, so the current place
 * is readable from the icon alone (the pattern every social app trained users
 * on).
 */
const NAV_GROUPS = [
    {
        id: 'browse',
        labelKey: 'community_nav_group_browse',
        items: [
            { to: '/feed', end: true, labelKey: 'community_nav_home', Icon: HiOutlineHome, ActiveIcon: HiHome },
            { to: '/community/trending', labelKey: 'community_nav_trending', Icon: HiOutlineFire, ActiveIcon: HiFire },
            { to: '/reels', labelKey: 'community_nav_reels', Icon: HiOutlinePlayCircle, ActiveIcon: HiPlayCircle },
        ],
    },
    {
        id: 'you',
        labelKey: 'community_nav_group_you',
        items: [
            { to: '/community/following', labelKey: 'community_nav_following', Icon: HiOutlineUsers, ActiveIcon: HiUsers },
            { to: '/community/groups', labelKey: 'community_nav_groups', Icon: HiOutlineUserGroup, ActiveIcon: HiUserGroup },
            { to: '/community/saved', labelKey: 'community_nav_saved', Icon: HiOutlineBookmark, ActiveIcon: HiBookmark },
        ],
    },
];

/** The five destinations that fit a phone tab bar, in browse-first order. */
const MOBILE_ITEMS = [
    NAV_GROUPS[0].items[0],
    NAV_GROUPS[0].items[1],
    NAV_GROUPS[0].items[2],
    NAV_GROUPS[1].items[1],
    NAV_GROUPS[1].items[2],
];

function SidebarLink({ to, end, labelKey, Icon, ActiveIcon }) {
    const { t } = useTranslation();
    return (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
                `sc-press relative flex items-center gap-3 rounded-xl py-2.5 pe-3 ps-4 text-sm font-semibold transition ${
                    isActive ? 'bg-brand-light text-brand-dark' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
            }
        >
            {({ isActive }) => (
                <>
                    <span
                        className={`absolute inset-y-2 start-0 w-1 origin-center rounded-full bg-brand transition-transform duration-300 ${
                            isActive ? 'scale-y-100' : 'scale-y-0'
                        }`}
                        aria-hidden
                    />
                    {isActive ? <ActiveIcon className="h-5 w-5 shrink-0 text-brand" aria-hidden /> : <Icon className="h-5 w-5 shrink-0" aria-hidden />}
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
            className={({ isActive }) =>
                `sc-press flex flex-col items-center gap-1 rounded-lg px-1 pb-1.5 pt-2 text-[10px] font-bold transition ${
                    isActive ? 'text-brand' : 'text-slate-500'
                }`
            }
        >
            {({ isActive }) => (
                <>
                    {isActive ? <ActiveIcon className="h-6 w-6" aria-hidden /> : <Icon className="h-6 w-6" aria-hidden />}
                    <span className="truncate">{t(labelKey)}</span>
                    <span
                        className={`h-0.5 w-6 rounded-full bg-brand transition-transform duration-300 ${isActive ? 'scale-x-100' : 'scale-x-0'}`}
                        aria-hidden
                    />
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
                src="/community/b2b-opportunity-cover-v1.png"
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
 *
 * Sticky offsets are small on purpose: the app's scroll container is the padded
 * <main> under a fixed 72px header, so the rails only need to clear their own
 * gutter — not the header.
 */
export default function CommunityShell({ children, rightRail = true }) {
    const { t } = useTranslation();

    return (
        <div className="mx-auto w-full max-w-[1400px] pb-24 lg:pb-0">
            <div className="grid items-start gap-6 lg:grid-cols-[248px_minmax(0,1fr)] xl:grid-cols-[248px_minmax(0,720px)_320px] xl:justify-center">
                <aside className="sticky top-1 hidden rounded-2xl bg-white p-3 shadow-[0_12px_40px_-28px_rgba(15,23,42,.55)] ring-1 ring-slate-200/80 lg:block">
                    <div className="flex items-center gap-3 px-1 pb-3 pt-1">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-dark to-brand text-white shadow-lg shadow-brand/25">
                            <HiOutlineSquares2X2 className="h-6 w-6" aria-hidden />
                        </span>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-900">{t('community_brand_title')}</p>
                            <p className="truncate text-xs text-slate-500">{t('community_brand_subtitle')}</p>
                        </div>
                    </div>

                    <nav aria-label={t('community_brand_title')} className="space-y-4 border-t border-slate-100 pt-3">
                        {NAV_GROUPS.map((group) => (
                            <div key={group.id} className="space-y-1">
                                <p className="px-4 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">{t(group.labelKey)}</p>
                                {group.items.map((item) => (
                                    <SidebarLink key={item.to} {...item} />
                                ))}
                            </div>
                        ))}
                    </nav>

                    <NavLink
                        to="/community/create"
                        className="sc-lift sc-press mt-4 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-dark to-brand px-4 py-3 text-sm font-bold text-white shadow-lg shadow-brand/25"
                    >
                        <HiOutlineVideoCamera className="h-5 w-5" aria-hidden />
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
                className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white/95 px-1 backdrop-blur-xl lg:hidden"
            >
                {MOBILE_ITEMS.map((item) => (
                    <MobileLink key={item.to} {...item} />
                ))}
            </nav>
        </div>
    );
}
