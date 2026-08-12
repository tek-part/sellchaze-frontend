import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import ReactCountryFlag from 'react-country-flag';

const SUPPORT_EMAIL = 'sellchaze@wigpleasure.com';

function Logo({ className = 'h-8 w-8' }) {
    return (
        <img src="/logo.png" alt="Sellchaze" className={className + ' object-contain'} />
    );
}

/* Country flags via react-country-flag (SVG mode for crisp rendering) */
function FlagSA({ className = '' }) {
    return (
        <ReactCountryFlag
            countryCode="SA"
            svg
            className={className + ' rounded-xs ring-1 ring-black/5 shadow-xs'}
            style={{ width: '1.5rem', height: '1rem' }}
            aria-label="Saudi Arabia"
            // The library renders an <img> without an alt attribute; supply one
            // explicitly so every image on the site carries ALT text.
            alt="Saudi Arabia"
            loading="lazy"
        />
    );
}

function FlagGB({ className = '' }) {
    return (
        <ReactCountryFlag
            countryCode="GB"
            svg
            className={className + ' rounded-xs ring-1 ring-black/5 shadow-xs'}
            style={{ width: '1.5rem', height: '1rem' }}
            aria-label="United Kingdom"
            alt="United Kingdom"
            loading="lazy"
        />
    );
}

function LanguageSwitch({ compact = false }) {
    const { i18n } = useTranslation();
    const current = i18n.resolvedLanguage || i18n.language || 'en';
    const toggle = () => {
        const next = current === 'ar' ? 'en' : 'ar';
        localStorage.setItem('sellchase_locale', next);
        i18n.changeLanguage(next);
        document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
    };
    const nextIsAr = current !== 'ar';
    return (
        <button
            onClick={toggle}
            className={
                (compact ? 'p-1.5' : 'p-2') +
                ' rounded-full text-slate-600 hover:bg-slate-100 transition inline-flex items-center justify-center'
            }
            aria-label={nextIsAr ? 'التبديل إلى العربية' : 'Switch to English'}
            title={nextIsAr ? 'العربية' : 'English'}
        >
            {nextIsAr ? <FlagSA /> : <FlagGB />}
        </button>
    );
}

function NavItem({ to, children }) {
    return (
        <NavLink
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
                'rounded-full px-3 py-1.5 text-sm font-medium transition ' +
                (isActive
                    ? 'text-brand'
                    : 'text-slate-600 hover:text-slate-900')
            }
        >
            {children}
        </NavLink>
    );
}

export default function PublicLayout() {
    const { t } = useTranslation();
    const [authed, setAuthed] = useState(false);
    const [open, setOpen] = useState(false);
    const { pathname } = useLocation();

    useEffect(() => {
        setAuthed(!!localStorage.getItem('sellchase_access_token'));
    }, []);

    useEffect(() => {
        setOpen(false);
    }, [pathname]);

    return (
        <div className="relative flex min-h-screen flex-col bg-[#F5F7FC] text-slate-900">
            {/* Subtle dotted grid background */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.35]"
                style={{
                    backgroundImage:
                        'radial-gradient(circle at 1px 1px, rgba(15,23,42,0.08) 1px, transparent 0)',
                    backgroundSize: '28px 28px',
                }}
            />
            {/* Top glow */}
            <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[1100px] -translate-x-1/2 rounded-full blur-3xl"
                style={{
                    background:
                        'radial-gradient(ellipse at center, rgba(0,75,180,0.12), rgba(0,192,169,0.06) 40%, transparent 70%)',
                }}
            />

            {/* Floating pill navbar */}
            <header className="sticky top-4 z-40 px-4 pt-2 md:top-6 md:pt-4">
                <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 rounded-full border border-slate-200/70 bg-white/90 px-3 py-2 shadow-[0_8px_30px_rgba(15,23,42,0.08)] backdrop-blur-md">
                    <Link to="/" className="flex items-center pl-1" aria-label="Sellchaze">
                        <Logo className="h-14 w-auto md:h-16" />
                    </Link>

                    <nav className="hidden items-center gap-1 md:flex">
                        <NavItem to="/">{t('nav_home')}</NavItem>
                        <NavItem to="/features">{t('nav_features')}</NavItem>
                        <NavItem to="/suppliers">{t('nav_suppliers', 'Suppliers')}</NavItem>
                        <NavItem to="/directory">{t('nav_directory', 'Directory')}</NavItem>
                        <NavItem to="/about">{t('nav_about')}</NavItem>
                        <NavItem to="/blog">{t('nav_blog', 'Blog')}</NavItem>
                        <NavItem to="/contact">{t('nav_contact')}</NavItem>
                    </nav>

                    <div className="hidden items-center gap-1 md:flex">
                        <LanguageSwitch compact />
                        {authed ? (
                            <Link
                                to="/dashboard"
                                className="rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-white shadow-xs hover:brightness-110"
                            >
                                {t('nav_dashboard')}
                            </Link>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="rounded-full bg-slate-100 px-4 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-200"
                                >
                                    {t('nav_login')}
                                </Link>
                                <Link
                                    to="/register"
                                    className="rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-white shadow-xs hover:brightness-110"
                                >
                                    {t('nav_get_started')}
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile trigger */}
                    <button
                        className="md:hidden rounded-full p-2 text-slate-700 hover:bg-slate-100"
                        onClick={() => setOpen((s) => !s)}
                        aria-label="Open menu"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {open ? (
                                <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
                            ) : (
                                <>
                                    <path d="M4 6h16" strokeLinecap="round" />
                                    <path d="M4 12h16" strokeLinecap="round" />
                                    <path d="M4 18h16" strokeLinecap="round" />
                                </>
                            )}
                        </svg>
                    </button>
                </div>

                {/* Mobile menu */}
                {open && (
                    <div className="mx-auto mt-2 max-w-5xl rounded-2xl border border-slate-200/70 bg-white/95 p-3 shadow-lg backdrop-blur-sm md:hidden">
                        <div className="flex flex-col gap-1">
                            <NavItem to="/">{t('nav_home')}</NavItem>
                            <NavItem to="/features">{t('nav_features')}</NavItem>
                            <NavItem to="/suppliers">{t('nav_suppliers', 'Suppliers')}</NavItem>
                            <NavItem to="/directory">{t('nav_directory', 'Directory')}</NavItem>
                            <NavItem to="/about">{t('nav_about')}</NavItem>
                            <NavItem to="/blog">{t('nav_blog', 'Blog')}</NavItem>
                            <NavItem to="/contact">{t('nav_contact')}</NavItem>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                            <LanguageSwitch compact />
                            {authed ? (
                                <Link to="/dashboard" className="flex-1 rounded-full bg-brand px-4 py-2 text-center text-sm font-semibold text-white">
                                    {t('nav_dashboard')}
                                </Link>
                            ) : (
                                <div className="flex flex-1 gap-2">
                                    <Link to="/login" className="flex-1 rounded-full bg-slate-100 px-4 py-2 text-center text-sm font-semibold text-slate-800">
                                        {t('nav_login')}
                                    </Link>
                                    <Link to="/register" className="flex-1 rounded-full bg-brand px-4 py-2 text-center text-sm font-semibold text-white">
                                        {t('nav_get_started')}
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </header>

            <main className="relative flex-1">
                <Outlet />
            </main>

            <footer className="relative mt-16 border-t border-slate-200/70 bg-white/60 backdrop-blur-sm">
                <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-5">
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-2">
                            <Logo className="h-8 w-8" />
                            <span className="text-lg font-bold text-slate-900">Sellchaze</span>
                        </div>
                        <p className="mt-3 max-w-sm text-sm text-slate-500">{t('landing_tagline')}</p>
                        <a
                            href={`mailto:${SUPPORT_EMAIL}`}
                            className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 hover:border-brand hover:text-brand"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="5" width="18" height="14" rx="2" />
                                <path d="M3 7l9 6 9-6" />
                            </svg>
                            {SUPPORT_EMAIL}
                        </a>
                    </div>
                    <FooterCol title={t('footer_product')}>
                        <Link to="/features" className="hover:text-slate-900">{t('nav_features')}</Link>
                    </FooterCol>
                    <FooterCol title={t('footer_company')}>
                        <Link to="/about" className="hover:text-slate-900">{t('nav_about')}</Link>
                        <Link to="/blog" className="hover:text-slate-900">{t('nav_blog', 'Blog')}</Link>
                        <Link to="/contact" className="hover:text-slate-900">{t('nav_contact')}</Link>
                    </FooterCol>
                    <FooterCol title={t('footer_legal')}>
                        <Link to="/legal/terms" className="hover:text-slate-900">{t('legal_terms')}</Link>
                        <Link to="/legal/privacy" className="hover:text-slate-900">{t('legal_privacy')}</Link>
                    </FooterCol>
                </div>
                <div className="border-t border-slate-200/70 px-4 py-4 text-center text-xs text-slate-400">
                    © {new Date().getFullYear()}{' '}
                    <a
                        href="https://tarawud.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-slate-500 hover:text-brand"
                    >
                        Tarawud
                    </a>
                    {' '}— {t('landing_rights')}
                </div>
            </footer>
        </div>
    );
}

function FooterCol({ title, children }) {
    return (
        <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {Array.isArray(children) ? children.map((c, i) => <li key={i}>{c}</li>) : <li>{children}</li>}
            </ul>
        </div>
    );
}
