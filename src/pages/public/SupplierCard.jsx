import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    HiOutlineCube,
    HiOutlineMapPin,
    HiOutlineCheckBadge,
    HiOutlineArrowRight,
} from 'react-icons/hi2';

function initials(name) { return (name || '?').trim().charAt(0).toUpperCase(); }

/**
 * Public supplier card — mirrors DirectoryPage's card visual.
 * Links to /u/{username} ONLY when username is non-null; otherwise renders a
 * non-clickable card (some suppliers aren't public).
 */
export default function SupplierCard({ card }) {
    const { t } = useTranslation();
    const clickable = Boolean(card.username);

    const inner = (
        <>
            <div className="h-24 bg-linear-to-br from-brand via-blue-500 to-accent" style={card.photo ? { backgroundImage: `url('${card.photo}')`, backgroundSize: 'cover' } : undefined} />
            <div className="px-5 pb-5">
                <div className="-mt-8 mb-3 flex items-end justify-between">
                    {card.photo
                        ? <div className="h-16 w-16 rounded-2xl border-[3px] border-white bg-cover bg-center" style={{ backgroundImage: `url('${card.photo}')` }} />
                        : <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-[3px] border-white bg-brand/10 text-2xl font-bold text-brand">{initials(card.name)}</div>}
                    {card.primary_sector ? (
                        <span className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            <HiOutlineCube className="h-3.5 w-3.5" />
                            {card.primary_sector.name}
                        </span>
                    ) : null}
                </div>
                <div className="flex items-center gap-1.5 text-lg font-semibold text-slate-900">
                    {card.name}
                    {card.is_verified && <HiOutlineCheckBadge className="h-5 w-5 text-brand" />}
                </div>
                {card.company && <div className="mt-0.5 text-sm text-slate-500">{card.company}</div>}
                {card.tagline && <div className="mt-1 line-clamp-2 text-sm text-slate-400">{card.tagline}</div>}
                {(card.country || card.city) && (
                    <div className="mt-2 flex items-center gap-1 text-sm text-slate-400">
                        <HiOutlineMapPin className="h-4 w-4" /> {[card.city, card.country].filter(Boolean).join(', ')}
                    </div>
                )}
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                    <span className="text-slate-500">
                        <span className="font-bold text-slate-900">{card.products_count ?? 0}</span> {t('sup_dir_products', 'products')}
                    </span>
                    {clickable ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-brand">
                            {t('sup_dir_view_profile', 'View profile')} <HiOutlineArrowRight className="h-4 w-4" />
                        </span>
                    ) : null}
                </div>
            </div>
        </>
    );

    const shell = 'flex flex-col overflow-hidden rounded-2xl bg-white shadow-xs ring-1 ring-slate-100';

    if (clickable) {
        return (
            <Link to={`/u/${card.username}`} className={`group ${shell} transition hover:-translate-y-1 hover:ring-brand/40`}>
                {inner}
            </Link>
        );
    }

    return <div className={shell}>{inner}</div>;
}
