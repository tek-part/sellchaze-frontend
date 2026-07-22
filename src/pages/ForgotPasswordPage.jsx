import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { loginErrorMessage } from '../utils/apiError';

function BackgroundDecor() {
    return (
        <>
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.35]"
                style={{
                    backgroundImage:
                        'radial-gradient(circle at 1px 1px, rgba(15,23,42,0.08) 1px, transparent 0)',
                    backgroundSize: '28px 28px',
                }}
            />
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

export default function ForgotPasswordPage() {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    async function onSubmit(e) {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post('/auth/forgot-password', { email });
            toast.success(data.message || t('auth_forgot_sent'));
            setSent(true);
        } catch (err) {
            toast.error(loginErrorMessage(err, t));
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
                <div className="sc-anim-fade-up w-full max-w-md">
                    <div className="rounded-3xl border border-slate-200/70 bg-white/95 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.10)] backdrop-blur-sm md:p-8">
                        <div className="text-center">
                            <p className="inline-block rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand">
                                {t('auth_forgot_title')}
                            </p>
                            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900">
                                {t('auth_forgot_title')}
                            </h1>
                            <p className="mt-2 text-sm text-slate-500">{t('auth_forgot_subtitle')}</p>
                        </div>

                        {sent ? (
                            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-800">
                                {t('auth_forgot_check_email')}
                            </div>
                        ) : (
                            <form onSubmit={onSubmit} className="mt-6 space-y-4">
                                <div>
                                    <label htmlFor="fp-email" className="mb-1 block text-sm font-semibold text-slate-900">
                                        {t('email')}
                                    </label>
                                    <input
                                        id="fp-email"
                                        type="email"
                                        autoComplete="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-hidden transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="mt-2 w-full rounded-full bg-brand py-3 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition hover:brightness-110 disabled:opacity-60"
                                >
                                    {loading ? '…' : t('auth_forgot_submit')}
                                </button>
                            </form>
                        )}

                        <p className="mt-5 text-center text-sm text-slate-600">
                            <Link to="/login" className="font-medium text-brand hover:underline">
                                {t('auth_back_login')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
