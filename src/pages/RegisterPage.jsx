import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api, { setTokens } from '../api/client';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { loginErrorMessage } from '../utils/apiError';

function BackgroundDecor() {
    return (
        <>
            {/* dotted grid */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.35]"
                style={{
                    backgroundImage:
                        'radial-gradient(circle at 1px 1px, rgba(15,23,42,0.08) 1px, transparent 0)',
                    backgroundSize: '28px 28px',
                }}
            />
            {/* animated blobs */}
            <div
                aria-hidden
                className="pointer-events-none absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full blur-3xl sc-float"
                style={{
                    background: 'radial-gradient(closest-side, rgba(0,75,180,0.25), transparent 70%)',
                    animationDuration: '7s',
                }}
            />
            <div
                aria-hidden
                className="pointer-events-none absolute -right-32 bottom-0 h-[380px] w-[380px] rounded-full blur-3xl sc-float"
                style={{
                    background: 'radial-gradient(closest-side, rgba(0,192,169,0.2), transparent 70%)',
                    animationDuration: '9s',
                    animationDelay: '1s',
                }}
            />
            {/* dashed SVG guides */}
            <svg
                aria-hidden
                className="pointer-events-none absolute inset-0 h-full w-full sc-anim-draw"
                viewBox="0 0 1200 900"
                preserveAspectRatio="none"
            >
                <g stroke="rgba(0,75,180,0.18)" strokeDasharray="4 6" fill="none">
                    <path d="M80,0 L80,360 Q80,400 120,400 L560,400" />
                    <path d="M1120,0 L1120,360 Q1120,400 1080,400 L640,400" />
                </g>
            </svg>
        </>
    );
}

function RoleCard({ active, onClick, icon, title, subtitle, tone = 'brand', delay = 0 }) {
    const ring = active
        ? 'ring-2 ring-brand border-brand shadow-lg shadow-brand/10'
        : 'border-slate-200 hover:border-brand/50';
    const iconTone = active
        ? tone === 'accent'
            ? 'bg-accent text-white'
            : 'bg-brand text-white'
        : tone === 'accent'
            ? 'bg-accent/10 text-accent'
            : 'bg-brand/10 text-brand';
    return (
        <button
            type="button"
            onClick={onClick}
            className={
                'sc-anim-fade-up group w-full rounded-2xl border bg-white p-4 text-start transition ' + ring
            }
            style={{ animationDelay: delay + 'ms' }}
        >
            <div className="flex items-start gap-3">
                <div className={'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ' + iconTone}>
                    {icon}
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{subtitle}</p>
                </div>
                <div
                    className={
                        'mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ' +
                        (active ? 'border-brand bg-brand' : 'border-slate-300 bg-white')
                    }
                >
                    {active && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="h-3 w-3">
                            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    )}
                </div>
            </div>
        </button>
    );
}

const IconSupplier = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M3 9l9-6 9 6v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" />
        <path d="M9 21V10h6v11" />
    </svg>
);

const IconMerchant = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M3 7l2-4h14l2 4" />
        <path d="M3 7v13a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7" />
        <path d="M9 21v-7h6v7" />
        <path d="M3 7h18" />
    </svg>
);

export default function RegisterPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirectTo = searchParams.get('redirect') || '/dashboard';
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [registrationRole, setRegistrationRole] = useState('Supplier');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function onSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data } = await api.post('/auth/register', {
                name,
                email,
                password,
                password_confirmation: passwordConfirmation,
                registration_role: registrationRole,
            });
            if (data.pending_approval) {
                if (data.access_token && data.refresh_token) {
                    setTokens({ access_token: data.access_token, refresh_token: data.refresh_token });
                }
                toast.success(data.message || t('auth_register_pending_toast'));
                navigate('/pending-approval', { replace: true });
            } else if (data.access_token && data.refresh_token) {
                // Auto-activated account → sign in and continue to the intended page.
                setTokens({ access_token: data.access_token, refresh_token: data.refresh_token });
                toast.success(t('toast_welcome'));
                navigate(redirectTo, { replace: true });
            }
        } catch (err) {
            const msg = loginErrorMessage(err, t);
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#F5F7FC] text-slate-900">
            <BackgroundDecor />

            <header className="relative flex items-center justify-between px-4 py-4 md:px-8">
                <Link to="/" className="flex items-center" aria-label="Sellchase">
                    <img src="/logo.png" alt="Sellchase" className="h-12 w-auto object-contain md:h-14" />
                </Link>
                <LanguageSwitcher />
            </header>

            <div className="relative flex flex-1 items-center justify-center px-4 pb-16">
                <div className="sc-anim-fade-up w-full max-w-xl">
                    <div className="rounded-3xl border border-slate-200/70 bg-white/95 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.10)] backdrop-blur-sm md:p-8">
                        <div className="text-center">
                            <p className="inline-block rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand">
                                {t('auth_register_as')}
                            </p>
                            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900">
                                {t('auth_register_title')}
                            </h1>
                            <p className="mt-2 text-sm text-slate-500">{t('auth_register_subtitle')}</p>
                        </div>

                        <div className="mt-6 grid gap-3 md:grid-cols-2">
                            <RoleCard
                                active={registrationRole === 'Supplier'}
                                onClick={() => setRegistrationRole('Supplier')}
                                icon={IconSupplier}
                                title={t('auth_role_supplier')}
                                subtitle={t('auth_role_supplier_hint')}
                                tone="brand"
                                delay={100}
                            />
                            <RoleCard
                                active={registrationRole === 'Merchant'}
                                onClick={() => setRegistrationRole('Merchant')}
                                icon={IconMerchant}
                                title={t('auth_role_merchant')}
                                subtitle={t('auth_role_merchant_hint')}
                                tone="accent"
                                delay={220}
                            />
                        </div>

                        <form onSubmit={onSubmit} className="mt-6 space-y-4">
                            {error ? (
                                <div className="rounded-xl border border-red-200 bg-red-50/90 p-3 text-sm text-red-800">{error}</div>
                            ) : null}
                            <div>
                                <label htmlFor="reg-name" className="mb-1 block text-sm font-semibold text-slate-900">
                                    {t('name')}
                                </label>
                                <input
                                    id="reg-name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-hidden transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="reg-email" className="mb-1 block text-sm font-semibold text-slate-900">
                                    {t('email')}
                                </label>
                                <input
                                    id="reg-email"
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-hidden transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
                                    required
                                />
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label htmlFor="reg-password" className="mb-1 block text-sm font-semibold text-slate-900">
                                        {t('password')}
                                    </label>
                                    <input
                                        id="reg-password"
                                        type="password"
                                        autoComplete="new-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-hidden transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
                                        required
                                        minLength={8}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="reg-password2" className="mb-1 block text-sm font-semibold text-slate-900">
                                        {t('auth_password_confirm')}
                                    </label>
                                    <input
                                        id="reg-password2"
                                        type="password"
                                        autoComplete="new-password"
                                        value={passwordConfirmation}
                                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-hidden transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
                                        required
                                        minLength={8}
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-2 w-full rounded-full bg-brand py-3 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition hover:brightness-110 disabled:opacity-60"
                            >
                                {loading ? '…' : t('auth_register_submit')}
                            </button>
                        </form>
                        <p className="mt-5 text-center text-sm text-slate-600">
                            <Link to="/login" className="font-medium text-brand hover:underline">
                                {t('auth_have_account')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
