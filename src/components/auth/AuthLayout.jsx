import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../LanguageSwitcher';
import { marketingUrl } from '../../config/marketing';

const CheckIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
        <path d="M20 6 9 17l-5-5" />
    </svg>
);

/**
 * Shared shell for sign-in, sign-up and password pages: the form on one side and, from large
 * screens up, a brand panel showing what merchants get.
 */
export default function AuthLayout({ title, subtitle, children, footer }) {
    const { t } = useTranslation();
    const points = ['auth_aside_point_themes', 'auth_aside_point_payments', 'auth_aside_point_fraud', 'auth_aside_point_languages'];

    return (
        <div className="grid min-h-dvh bg-white text-slate-900 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
            <div className="flex min-h-dvh flex-col">
                <header className="flex items-center justify-between px-5 py-5 sm:px-8">
                    <a href={marketingUrl()} className="flex items-center" aria-label="Sellchaze">
                        <img src="/brand/sellchaze-logo.svg" alt="Sellchaze" width="164" height="38" className="h-9 w-auto" />
                    </a>
                    <LanguageSwitcher />
                </header>

                <main className="flex flex-1 items-center justify-center px-5 py-8 sm:px-8">
                    <div className="sc-anim-fade-up w-full max-w-[420px]">
                        <h1 className="text-[1.75rem] font-extrabold leading-tight tracking-tight text-slate-900">{title}</h1>
                        {subtitle ? <p className="mt-2 text-[0.95rem] leading-relaxed text-slate-500">{subtitle}</p> : null}
                        <div className="mt-7">{children}</div>
                        {footer ? <div className="mt-7 text-center text-sm text-slate-600">{footer}</div> : null}
                    </div>
                </main>

                <footer className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 px-5 py-5 text-xs text-slate-500">
                    <a href={marketingUrl('/legal/privacy')} className="hover:text-slate-800">{t('auth_footer_privacy')}</a>
                    <a href={marketingUrl('/legal/terms')} className="hover:text-slate-800">{t('auth_footer_terms')}</a>
                    <a href={marketingUrl('/contact')} className="hover:text-slate-800">{t('auth_footer_help')}</a>
                </footer>
            </div>

            <aside className="relative hidden overflow-hidden bg-[radial-gradient(900px_480px_at_85%_-10%,rgba(50,213,131,0.4),transparent_60%),linear-gradient(160deg,#027a48_0%,#054f31_75%)] text-white lg:flex lg:flex-col lg:justify-center lg:px-14 xl:px-20">
                <div className="relative z-10 max-w-lg">
                    <p className="text-sm font-semibold text-emerald-100/90">{t('auth_aside_kicker')}</p>
                    <h2 className="mt-3 text-[2rem] font-extrabold leading-tight tracking-tight">{t('auth_aside_title')}</h2>
                    <ul className="mt-7 grid gap-3.5">
                        {points.map((key) => (
                            <li key={key} className="flex items-start gap-3 text-[0.95rem] text-emerald-50">
                                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/15 text-white">{CheckIcon}</span>
                                <span>{t(key)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="relative z-10 mt-12 max-w-xl overflow-hidden rounded-2xl bg-white shadow-[0_40px_90px_-30px_rgba(5,51,33,0.7)] ring-1 ring-white/10">
                    <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-4 py-2.5" aria-hidden>
                        <i className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                        <i className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                        <i className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                        <span className="ms-3 rounded-md border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] text-slate-500" dir="ltr">yourstore.sellchaze.com</span>
                    </div>
                    <img src="/brand/preview-store.webp" alt="" width="960" height="487" loading="lazy" className="block h-auto w-full" />
                </div>
            </aside>
        </div>
    );
}
