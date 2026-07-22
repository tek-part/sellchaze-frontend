import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../api/client';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { loginErrorMessage } from '../utils/apiError';

export default function ResetPasswordPage() {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
    const emailParam = useMemo(() => searchParams.get('email') || '', [searchParams]);

    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [loading, setLoading] = useState(false);

    async function onSubmit(e) {
        e.preventDefault();
        if (!token || !emailParam) {
            toast.error(t('auth_reset_invalid_link'));
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.post('/auth/reset-password', {
                token,
                email: emailParam,
                password,
                password_confirmation: passwordConfirmation,
            });
            toast.success(data.message || t('auth_reset_success'));
            setPassword('');
            setPasswordConfirmation('');
        } catch (err) {
            toast.error(loginErrorMessage(err, t));
        } finally {
            setLoading(false);
        }
    }

    const invalidLink = !token || !emailParam;

    return (
        <div className="relative flex min-h-screen flex-col overflow-hidden bg-linear-to-br from-surface via-white to-brand-light/40">
            <header className="relative flex justify-end p-4">
                <LanguageSwitcher />
            </header>
            <div className="relative flex flex-1 items-center justify-center px-4 pb-16">
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
                    <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-8 shadow-soft backdrop-blur-xs">
                        <h1 className="text-xl font-semibold text-slate-900">{t('auth_reset_title')}</h1>
                        <p className="mt-1 text-sm text-slate-500">{t('auth_reset_subtitle')}</p>
                        {invalidLink ? (
                            <p className="mt-6 text-sm text-red-600">{t('auth_reset_invalid_link')}</p>
                        ) : (
                            <form onSubmit={onSubmit} className="mt-6 space-y-4">
                                <div>
                                    <label className="mb-1 block text-sm font-semibold text-slate-900">{t('email')}</label>
                                    <input
                                        type="email"
                                        value={emailParam}
                                        readOnly
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="rp-pass" className="mb-1 block text-sm font-semibold text-slate-900">
                                        {t('auth_reset_new_password')}
                                    </label>
                                    <input
                                        id="rp-pass"
                                        type="password"
                                        autoComplete="new-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                                        required
                                        minLength={8}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="rp-pass2" className="mb-1 block text-sm font-semibold text-slate-900">
                                        {t('auth_password_confirm')}
                                    </label>
                                    <input
                                        id="rp-pass2"
                                        type="password"
                                        autoComplete="new-password"
                                        value={passwordConfirmation}
                                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                                        required
                                        minLength={8}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white disabled:opacity-60"
                                >
                                    {loading ? '…' : t('auth_reset_submit')}
                                </button>
                            </form>
                        )}
                        <p className="mt-4 text-center text-sm">
                            <Link to="/login" className="font-medium text-brand hover:underline">
                                {t('auth_back_login')}
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
