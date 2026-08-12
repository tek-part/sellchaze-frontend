import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import SEO from '../../components/SEO';
import { FeatureIcons, featureIconTone } from '../../components/FeatureIcons';

/* ------------------------------------------------------------------ */
/*  Hero title — types in word by word                                */
/* ------------------------------------------------------------------ */

function TypedHeadline({ text }) {
    const words = text.split(' ');
    // start simultaneous reveal per word, each with an incremental delay
    return (
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-900 md:text-6xl">
            {words.map((w, i) => (
                <span
                    key={i}
                    className="sc-anim-fade-up inline-block"
                    style={{ animationDelay: 80 + i * 120 + 'ms' }}
                >
                    {w}
                    {i < words.length - 1 ? '\u00A0' : ''}
                </span>
            ))}
        </h1>
    );
}

/* ------------------------------------------------------------------ */
/*  Subtitle — types character sequence using progressive reveal      */
/* ------------------------------------------------------------------ */

function TypedParagraph({ text, startDelay = 0 }) {
    const [shown, setShown] = useState('');
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setShown(text);
            setDone(true);
            return;
        }
        let i = 0;
        const start = setTimeout(function step() {
            i += 1;
            setShown(text.slice(0, i));
            if (i < text.length) {
                setTimeout(step, 14);
            } else {
                setDone(true);
            }
        }, startDelay);
        return () => clearTimeout(start);
    }, [text, startDelay]);

    return (
        <p
            className={
                'mx-auto mt-6 max-w-2xl text-base text-slate-600 md:text-lg ' +
                (!done ? 'sc-caret' : '')
            }
        >
            {shown}
        </p>
    );
}

/* ------------------------------------------------------------------ */
/*  Floating decorative cards (shown around the hero)                 */
/* ------------------------------------------------------------------ */

function Toggle({ on }) {
    return (
        <span
            className={
                'relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition ' +
                (on ? 'bg-accent' : 'bg-slate-300')
            }
        >
            <span
                className={
                    'inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition ' +
                    (on ? 'translate-x-3.5' : 'translate-x-0.5')
                }
            />
        </span>
    );
}

function StatsCard() {
    const { t } = useTranslation();
    return (
        <div className="w-[190px] rounded-2xl border border-slate-200/70 bg-white p-3 shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-slate-900">8</span>
                    <span className="text-xs text-slate-500">%</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">{t('landing_card_without')}</span>
                    <Toggle on={false} />
                </div>
            </div>
            <div className="mt-2 flex items-center justify-between rounded-xl bg-accent/10 px-3 py-2 ring-1 ring-accent/20">
                <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-slate-900">75</span>
                    <span className="text-xs text-slate-500">%</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-slate-700">{t('landing_card_with')}</span>
                    <Toggle on />
                </div>
            </div>
        </div>
    );
}

function ShieldCard() {
    const { t } = useTranslation();
    return (
        <div className="w-[200px] rounded-2xl border border-slate-200/70 bg-white p-3 shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-700">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                    <path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z" />
                </svg>
                {t('landing_card_secure')}
            </div>
            <div
                className="relative mt-2 flex h-24 items-center justify-center overflow-hidden rounded-xl"
                style={{
                    background:
                        'radial-gradient(circle at 50% 50%, rgba(0,192,169,0.18), rgba(0,192,169,0.04) 60%, transparent 70%)',
                }}
            >
                <div
                    aria-hidden
                    className="absolute inset-0 opacity-60"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 1px 1px, rgba(0,192,169,0.35) 1px, transparent 0)',
                        backgroundSize: '10px 10px',
                    }}
                />
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white shadow-lg">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z" />
                        <path d="M9 12l2 2 4-4" />
                    </svg>
                </div>
            </div>
        </div>
    );
}

function CustomersCard() {
    const { t } = useTranslation();
    const slots = [
        { filled: false },
        { filled: true, bg: '#A7A28F' },
        { filled: false },
        { filled: true, bg: '#517F74' },
        { filled: false },
        { filled: true, bg: '#4F83B8' },
        { filled: false },
        { filled: true, bg: '#C9BBA9' },
        { filled: false },
    ];
    return (
        <div className="w-[220px] rounded-2xl border border-slate-200/70 bg-white p-3 shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
            <p className="text-[11px] font-medium text-slate-500">{t('landing_card_customers')}</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
                {slots.map((s, i) => (
                    <div
                        key={i}
                        className={
                            'aspect-square rounded-lg ' +
                            (s.filled ? 'ring-1 ring-slate-200' : 'border border-slate-100 bg-slate-50/60')
                        }
                        style={s.filled ? { background: s.bg } : {}}
                    />
                ))}
            </div>
        </div>
    );
}

function TeamCard() {
    const { t } = useTranslation();
    return (
        <div className="w-[240px] rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-100">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                {t('landing_card_team')}
            </div>
            <div className="grid grid-cols-3 gap-3">
                {['T1', 'AI', 'T3', 'UI', 'OP', 'BR'].map((lbl, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                        <div
                            className={
                                'flex h-9 w-9 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm ' +
                                ['bg-slate-700', 'bg-amber-500', 'bg-slate-500', 'bg-brand', 'bg-rose-400', 'bg-sky-500'][i]
                            }
                        >
                            {lbl}
                        </div>
                        <span className="text-[10px] text-slate-500">
                            {['Team 1', 'AI', 'Team 3', 'UX', 'Ops', 'Brain'][i]}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function CenterLogoChip() {
    return (
        <div className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white shadow-lg ring-4 ring-white">
            <img src="/icon.png" alt="" className="h-3.5 w-3.5 rounded-xs object-contain" />
            Sellchaze
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
    const { t } = useTranslation();
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Sellchaze',
        url: typeof window !== 'undefined' ? window.location.origin : '',
        logo: typeof window !== 'undefined' ? window.location.origin + '/logo.png' : '',
        description: t('landing_meta_description'),
        email: 'sellchaze@wigpleasure.com',
    };

    const features = [
        { k: 'landing_feature_orders', d: 'landing_feature_orders_desc' },
        { k: 'landing_feature_quotations', d: 'landing_feature_quotations_desc' },
        { k: 'landing_feature_partners', d: 'landing_feature_partners_desc' },
        { k: 'landing_feature_ledger', d: 'landing_feature_ledger_desc' },
        { k: 'landing_feature_verification', d: 'landing_feature_verification_desc' },
        { k: 'landing_feature_catalog', d: 'landing_feature_catalog_desc' },
    ];

    return (
        <>
            <SEO
                title={t('landing_meta_title')}
                description={t('landing_meta_description')}
                jsonLd={jsonLd}
            />

            {/* ------------ HERO ------------ */}
            <section className="relative overflow-hidden">
                {/* dashed guide lines (decorative, draw-in) */}
                <svg
                    aria-hidden
                    className="pointer-events-none absolute inset-0 h-full w-full sc-anim-draw"
                    viewBox="0 0 1200 900"
                    preserveAspectRatio="none"
                    style={{ animationDelay: '900ms' }}
                >
                    <g stroke="rgba(0,75,180,0.18)" strokeDasharray="4 6" fill="none">
                        <path d="M150,0 L150,420 Q150,460 190,460 L520,460" />
                        <path d="M1050,0 L1050,420 Q1050,460 1010,460 L680,460" />
                        <path d="M600,500 L600,900" />
                    </g>
                </svg>

                <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-10 text-center md:pt-24 md:pb-16">
                    <TypedHeadline text={t('landing_hero_title')} />

                    <div className="sc-anim-fade-up" style={{ animationDelay: '1100ms' }}>
                        <TypedParagraph text={t('landing_hero_subtitle')} startDelay={1100} />
                    </div>

                    <div
                        className="sc-anim-fade-up mt-8 flex flex-wrap items-center justify-center gap-3"
                        style={{ animationDelay: '1700ms' }}
                    >
                        <Link
                            to="/register"
                            className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition hover:brightness-110"
                        >
                            {t('landing_cta_primary')}
                        </Link>
                        <Link
                            to="/features"
                            className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-800 shadow-xs transition hover:border-slate-300"
                        >
                            {t('landing_cta_secondary')}
                        </Link>
                    </div>
                </div>

                {/* Visual stage with floating cards */}
                <div className="relative mx-auto mt-2 hidden max-w-6xl px-4 pb-24 lg:block">
                    <div className="relative mx-auto h-[420px] max-w-5xl">
                        {/* Left absolute card */}
                        <div
                            className="sc-anim-fade-left absolute left-0 top-0"
                            style={{ animationDelay: '2000ms' }}
                        >
                            <StatsCard />
                        </div>
                        {/* Right absolute card */}
                        <div
                            className="sc-anim-fade-right absolute right-0 top-0"
                            style={{ animationDelay: '2200ms' }}
                        >
                            <ShieldCard />
                        </div>

                        {/* Bottom row: customers + center network + team */}
                        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between">
                            <div
                                className="sc-anim-fade-up"
                                style={{ animationDelay: '2400ms' }}
                            >
                                <CustomersCard />
                            </div>

                            {/* Center: connecting network (SVG + chip) */}
                            <div className="relative flex flex-1 items-center justify-center">
                                <svg
                                    className="sc-anim-draw absolute left-0 right-0 top-1/2 h-40 w-full -translate-y-1/2"
                                    viewBox="0 0 500 160"
                                    fill="none"
                                    stroke="rgba(0,75,180,0.35)"
                                    strokeDasharray="3 5"
                                    style={{ animationDelay: '2800ms' }}
                                >
                                    <path d="M20,80 C120,80 140,30 220,80" />
                                    <path d="M20,80 C120,80 140,130 220,80" />
                                    <path d="M480,80 C380,80 360,30 280,80" />
                                    <path d="M480,80 C380,80 360,130 280,80" />
                                </svg>
                                {/* Left integration dots */}
                                <div className="absolute left-0 flex flex-col gap-3">
                                    {['bg-slate-100 ring-slate-200', 'bg-sky-50 ring-sky-200', 'bg-amber-50 ring-amber-200'].map((c, i) => (
                                        <span
                                            key={i}
                                            className={'sc-anim-pop h-6 w-6 rounded-full ring-1 ' + c}
                                            style={{ animationDelay: 3000 + i * 150 + 'ms' }}
                                        />
                                    ))}
                                </div>
                                {/* Right integration dots */}
                                <div className="absolute right-0 flex flex-col gap-3">
                                    {['bg-violet-50 ring-violet-200', 'bg-rose-50 ring-rose-200', 'bg-emerald-50 ring-emerald-200'].map((c, i) => (
                                        <span
                                            key={i}
                                            className={'sc-anim-pop h-6 w-6 rounded-full ring-1 ' + c}
                                            style={{ animationDelay: 3050 + i * 150 + 'ms' }}
                                        />
                                    ))}
                                </div>
                                <div className="sc-anim-pop relative" style={{ animationDelay: '2600ms' }}>
                                    <CenterLogoChip />
                                </div>
                            </div>

                            <div
                                className="sc-anim-fade-up"
                                style={{ animationDelay: '2500ms' }}
                            >
                                <TeamCard />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile: simplified single stat card */}
                <div className="mx-auto block max-w-sm px-4 pb-16 lg:hidden">
                    <div className="flex flex-col items-center gap-4">
                        <div className="sc-anim-fade-up" style={{ animationDelay: '1900ms' }}>
                            <StatsCard />
                        </div>
                        <div className="sc-anim-pop" style={{ animationDelay: '2100ms' }}>
                            <CenterLogoChip />
                        </div>
                        <div className="sc-anim-fade-up" style={{ animationDelay: '2300ms' }}>
                            <CustomersCard />
                        </div>
                    </div>
                </div>
            </section>

            {/* ------------ FEATURES GRID ------------ */}
            <section className="relative mx-auto max-w-6xl px-4 pb-24">
                <div className="text-center">
                    <p className="inline-block rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand">
                        {t('landing_eyebrow')}
                    </p>
                    <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                        {t('landing_features_title')}
                    </h2>
                    <p className="mx-auto mt-3 max-w-2xl text-slate-600">
                        {t('landing_features_subtitle')}
                    </p>
                </div>

                <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {features.map((f, i) => (
                        <div
                            key={f.k}
                            className="sc-anim-fade-up group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-6 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md"
                            style={{ animationDelay: 200 + i * 120 + 'ms' }}
                        >
                            <div
                                className={
                                    'flex h-11 w-11 items-center justify-center rounded-xl ' +
                                    featureIconTone[i % featureIconTone.length]
                                }
                            >
                                {FeatureIcons[f.k]}
                            </div>
                            <h3 className="mt-4 text-lg font-semibold text-slate-900">{t(f.k)}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-slate-600">{t(f.d)}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ------------ CTA BANNER ------------ */}
            <section className="relative mx-auto max-w-6xl px-4 pb-24">
                <div className="sc-anim-fade-up relative overflow-hidden rounded-3xl bg-slate-900 px-8 py-14 text-white md:px-16" style={{ animationDelay: '150ms' }}>
                    <div
                        aria-hidden
                        className="absolute inset-0 opacity-30"
                        style={{
                            backgroundImage:
                                'radial-gradient(circle at 20% 30%, rgba(0,192,169,0.4), transparent 40%), radial-gradient(circle at 80% 70%, rgba(0,75,180,0.5), transparent 45%)',
                        }}
                    />
                    <div className="relative text-center">
                        <h2 className="text-3xl font-bold md:text-4xl">{t('landing_cta_title')}</h2>
                        <p className="mx-auto mt-3 max-w-2xl text-slate-300">{t('landing_cta_subtitle')}</p>
                        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                            <Link
                                to="/register"
                                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-100"
                            >
                                {t('landing_cta_primary')}
                            </Link>
                            <Link
                                to="/contact"
                                className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
                            >
                                {t('nav_contact')}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
