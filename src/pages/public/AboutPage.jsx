import { useTranslation } from 'react-i18next';
import SEO from '../../components/SEO';

export default function AboutPage() {
    const { t } = useTranslation();
    const IconTarget = (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="5" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
    );
    const IconEye = (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
    const IconShield = (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z" />
            <path d="M9 12l2 2 4-4" />
        </svg>
    );

    const pillars = [
        { title: 'about_mission_title', body: 'about_mission_body', color: 'bg-brand/10 text-brand', icon: IconTarget },
        { title: 'about_vision_title', body: 'about_vision_body', color: 'bg-accent/10 text-accent', icon: IconEye },
        { title: 'about_values_title', body: 'about_values_body', color: 'bg-slate-800/10 text-slate-800', icon: IconShield },
    ];
    return (
        <>
            <SEO title={t('about_meta_title')} description={t('about_meta_description')} />
            <section className="mx-auto max-w-4xl px-4 pt-16 pb-10 text-center md:pt-20">
                <p className="sc-anim-fade-up inline-block rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand" style={{ animationDelay: '80ms' }}>
                    {t('nav_about')}
                </p>
                <h1 className="sc-anim-fade-up mt-4 text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl" style={{ animationDelay: '200ms' }}>
                    {t('about_title')}
                </h1>
                <p className="sc-anim-fade-up mx-auto mt-5 max-w-2xl text-lg text-slate-600" style={{ animationDelay: '360ms' }}>{t('about_body_1')}</p>
                <p className="sc-anim-fade-up mx-auto mt-3 max-w-2xl text-slate-600" style={{ animationDelay: '520ms' }}>{t('about_body_2')}</p>
            </section>

            <section className="mx-auto max-w-6xl px-4 pb-24">
                <div className="grid gap-5 md:grid-cols-3">
                    {pillars.map((p, i) => (
                        <div
                            key={p.title}
                            className="sc-anim-fade-up rounded-2xl border border-slate-200/70 bg-white p-6 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md"
                            style={{ animationDelay: 680 + i * 140 + 'ms' }}
                        >
                            <div className={'flex h-11 w-11 items-center justify-center rounded-xl ' + p.color}>
                                {p.icon}
                            </div>
                            <h3 className="mt-4 text-lg font-semibold text-slate-900">{t(p.title)}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-slate-600">{t(p.body)}</p>
                        </div>
                    ))}
                </div>
            </section>
        </>
    );
}
