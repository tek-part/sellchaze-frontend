import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import SEO from '../../components/SEO';
import { FeatureIcons, featureIconTone } from '../../components/FeatureIcons';

export default function FeaturesPage() {
    const { t } = useTranslation();
    const items = [
        'landing_feature_orders',
        'landing_feature_quotations',
        'landing_feature_partners',
        'landing_feature_ledger',
        'landing_feature_verification',
        'landing_feature_catalog',
    ];
    return (
        <>
            <SEO title={t('features_meta_title')} description={t('features_meta_description')} />
            <section className="mx-auto max-w-6xl px-4 pt-16 pb-10 text-center md:pt-20">
                <p className="sc-anim-fade-up inline-block rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand" style={{ animationDelay: '80ms' }}>
                    {t('nav_features')}
                </p>
                <h1 className="sc-anim-fade-up mt-4 text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl" style={{ animationDelay: '200ms' }}>
                    {t('features_title')}
                </h1>
                <p className="sc-anim-fade-up mx-auto mt-4 max-w-2xl text-slate-600" style={{ animationDelay: '360ms' }}>{t('features_subtitle')}</p>
            </section>

            <section className="mx-auto max-w-6xl px-4 pb-24">
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {items.map((k, i) => (
                        <div
                            key={k}
                            className="sc-anim-fade-up rounded-2xl border border-slate-200/70 bg-white p-6 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md"
                            style={{ animationDelay: 500 + i * 120 + 'ms' }}
                        >
                            <div
                                className={
                                    'flex h-11 w-11 items-center justify-center rounded-xl ' +
                                    featureIconTone[i % featureIconTone.length]
                                }
                            >
                                {FeatureIcons[k]}
                            </div>
                            <h3 className="mt-4 text-lg font-semibold text-slate-900">{t(k)}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-slate-600">{t(k + '_desc')}</p>
                        </div>
                    ))}
                </div>

                <div className="sc-anim-fade-up mt-12 text-center" style={{ animationDelay: '1400ms' }}>
                    <Link
                        to="/register"
                        className="inline-block rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/20 hover:brightness-110"
                    >
                        {t('landing_cta_primary')}
                    </Link>
                </div>
            </section>
        </>
    );
}
