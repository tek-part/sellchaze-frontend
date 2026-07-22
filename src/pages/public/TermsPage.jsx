import { useTranslation } from 'react-i18next';
import SEO from '../../components/SEO';

export default function TermsPage() {
    const { t } = useTranslation();
    return (
        <>
            <SEO title={t('legal_terms_meta_title')} description={t('legal_terms_meta_description')} />
            <section className="mx-auto max-w-3xl px-4 pt-16 pb-24 md:pt-20">
                <p className="sc-anim-fade-up inline-block rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand" style={{ animationDelay: '80ms' }}>
                    {t('footer_legal')}
                </p>
                <h1 className="sc-anim-fade-up mt-4 text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl" style={{ animationDelay: '200ms' }}>
                    {t('legal_terms')}
                </h1>
                <div className="sc-anim-fade-up prose prose-slate mt-8 max-w-none rounded-3xl border border-slate-200/70 bg-white p-8 text-slate-600 shadow-xs" style={{ animationDelay: '360ms' }}>
                    <p>{t('legal_terms_body')}</p>
                </div>
            </section>
        </>
    );
}
