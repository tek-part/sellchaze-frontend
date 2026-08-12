import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiArrowLongRight, HiOutlineBolt, HiOutlineBuildingStorefront, HiOutlinePlayCircle, HiOutlineUserGroup } from 'react-icons/hi2';

/**
 * Four entry points into the network, shown once under the composer.
 *
 * These used to be four full-bleed gradient tiles in four unrelated hues, which
 * competed with the posts for attention. Colour now lives only in the icon chip:
 * enough to tell the shortcuts apart at a glance, quiet enough that the feed
 * below stays the loudest thing on the page.
 */
const ITEMS = [
    { titleKey: 'community_hl_rfq', subtitleKey: 'community_hl_rfq_sub', Icon: HiOutlineBolt, to: '/community/trending', tone: 'bg-amber-50 text-amber-600 ring-amber-100' },
    { titleKey: 'community_hl_factories', subtitleKey: 'community_hl_factories_sub', Icon: HiOutlineBuildingStorefront, to: '/directory', tone: 'bg-brand-light text-brand ring-brand/10' },
    { titleKey: 'community_hl_reels', subtitleKey: 'community_hl_reels_sub', Icon: HiOutlinePlayCircle, to: '/reels', tone: 'bg-fuchsia-50 text-fuchsia-600 ring-fuchsia-100' },
    { titleKey: 'community_hl_sector', subtitleKey: 'community_hl_sector_sub', Icon: HiOutlineUserGroup, to: '/community/groups', tone: 'bg-emerald-50 text-emerald-600 ring-emerald-100' },
];

export default function BusinessHighlights() {
    const { t } = useTranslation();

    return (
        <section aria-labelledby="community-highlights">
            <div className="mb-3 flex items-center justify-between gap-3">
                <h2 id="community-highlights" className="text-sm font-bold text-slate-900">
                    {t('community_highlights_title')}
                </h2>
                <Link
                    to="/community/trending"
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand transition hover:text-brand-dark"
                >
                    {t('community_view_all')}
                    <HiArrowLongRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
                </Link>
            </div>

            {/* A scroll rail on a phone, an even grid from `sm` up. */}
            <div className="sc-rail -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0">
                {ITEMS.map(({ titleKey, subtitleKey, Icon, to, tone }) => (
                    <Link
                        key={titleKey}
                        to={to}
                        className="sc-lift sc-press w-40 shrink-0 snap-start rounded-2xl bg-white p-4 shadow-[0_8px_30px_-24px_rgba(15,23,42,.45)] ring-1 ring-slate-200/80 hover:shadow-[0_14px_38px_-24px_rgba(15,23,42,.5)] sm:w-auto"
                    >
                        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${tone}`}>
                            <Icon className="h-5 w-5" aria-hidden />
                        </span>
                        {/* Two lines, not an ellipsis: these labels are the only
                            thing telling a member where the shortcut goes. */}
                        <p className="mt-3 line-clamp-2 text-sm font-bold leading-snug text-slate-900">{t(titleKey)}</p>
                        <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-500">{t(subtitleKey)}</p>
                    </Link>
                ))}
            </div>
        </section>
    );
}
