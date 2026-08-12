import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiArrowLongRight, HiOutlineShieldCheck, HiOutlineUsers } from 'react-icons/hi2';

/**
 * The identity banner at the top of the feed — one block, one message. It is
 * deliberately shorter than a marketing hero: members come here to read posts,
 * so the banner introduces the network and gets out of the way.
 */
export default function CommunityHero() {
    const { t } = useTranslation();

    return (
        <section className="relative isolate overflow-hidden rounded-2xl bg-slate-950 shadow-[0_18px_55px_-30px_rgba(10,61,124,.7)]">
            <img
                src="/media/community/sellchaze-community-hero-v1.png"
                alt=""
                fetchPriority="high"
                decoding="async"
                className="absolute inset-0 -z-10 h-full w-full object-cover"
            />
            {/* Readable side first, photo side last — mirrored for RTL. */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#071b3f]/95 via-[#0b3b7c]/70 to-transparent rtl:bg-gradient-to-l" />

            <div className="flex min-h-[200px] max-w-lg flex-col justify-center gap-3 p-6 text-white sm:p-7">
                <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-blue-100">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
                        <HiOutlineUsers className="h-4 w-4" aria-hidden />
                    </span>
                    {t('community_hero_eyebrow')}
                </p>

                <h1 className="text-xl font-bold leading-snug sm:text-2xl">{t('community_hero_title')}</h1>
                <p className="max-w-md text-sm leading-6 text-blue-50/90">{t('community_hero_body')}</p>

                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <Link
                        to="/community/create"
                        className="sc-lift sc-press inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-brand-dark shadow-lg shadow-black/15"
                    >
                        {t('community_hero_cta')}
                        <HiArrowLongRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
                    </Link>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-100">
                        <HiOutlineShieldCheck className="h-4 w-4" aria-hidden />
                        {t('community_hero_trust')}
                    </span>
                </div>
            </div>
        </section>
    );
}
