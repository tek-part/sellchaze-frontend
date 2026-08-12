import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineDocumentText, HiOutlinePhoto, HiOutlinePlayCircle, HiOutlineShoppingBag } from 'react-icons/hi2';
import api from '../../../api/client';
import { initials } from '../../../components/feed/helpers';

/**
 * The composer entry point: an avatar, a prompt, and the four things a member
 * can publish. Every control routes to the full editor — this card only has to
 * make starting feel like one tap.
 */
const ACTIONS = [
    { labelKey: 'community_composer_post', to: '/community/create', Icon: HiOutlineDocumentText, tone: 'text-brand', hover: 'hover:bg-brand-light' },
    { labelKey: 'community_composer_photo', to: '/community/create?media=image', Icon: HiOutlinePhoto, tone: 'text-emerald-500', hover: 'hover:bg-emerald-50' },
    { labelKey: 'community_composer_video', to: '/community/create?format=reel', Icon: HiOutlinePlayCircle, tone: 'text-fuchsia-500', hover: 'hover:bg-fuchsia-50' },
    { labelKey: 'community_composer_rfq', to: '/community/create?type=rfq', Icon: HiOutlineShoppingBag, tone: 'text-amber-500', hover: 'hover:bg-amber-50' },
];

export default function QuickComposer() {
    const { t } = useTranslation();
    const [me, setMe] = useState(null);

    useEffect(() => {
        let active = true;
        api.get('/auth/me')
            .then(({ data }) => {
                if (active) setMe(data.user || data);
            })
            .catch(() => {
                /* the composer still works signed-out-of-profile */
            });
        return () => {
            active = false;
        };
    }, []);

    const avatar = me?.profile?.photo_url || me?.avatar;

    return (
        <section className="rounded-2xl bg-white p-4 shadow-[0_8px_30px_-22px_rgba(15,23,42,.4)] ring-1 ring-slate-200/80">
            <div className="flex items-center gap-3">
                {avatar ? (
                    <img src={avatar} alt="" loading="lazy" decoding="async" className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-brand-light" />
                ) : (
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-dark to-brand text-sm font-bold text-white">
                        {initials(me?.profile?.company || me?.name)}
                    </span>
                )}
                <Link
                    to="/community/create"
                    className="flex-1 truncate rounded-full bg-slate-100 px-5 py-3 text-start text-sm text-slate-500 transition hover:bg-slate-200/80"
                >
                    {t('community_composer_prompt')}
                </Link>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-1 border-t border-slate-100 pt-2">
                {ACTIONS.map(({ labelKey, to, Icon, tone, hover }) => (
                    <Link
                        key={labelKey}
                        to={to}
                        // Stacked on a phone so "Supply request" is never clipped;
                        // side by side once there is room for it.
                        className={`sc-press flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[11px] font-bold text-slate-600 transition sm:flex-row sm:gap-2 sm:text-xs ${hover}`}
                    >
                        <Icon className={`h-5 w-5 shrink-0 ${tone}`} aria-hidden />
                        <span className="text-center leading-tight">{t(labelKey)}</span>
                    </Link>
                ))}
            </div>
        </section>
    );
}
