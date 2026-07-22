import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api, { setTokens } from '../api/client';
import LanguageSwitcher from '../components/LanguageSwitcher';

const POLL_MS = 10000;

export default function PendingApprovalPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const redirected = useRef(false);

    useEffect(() => {
        const token = localStorage.getItem('sellchase_access_token');
        if (!token) {
            return undefined;
        }

        let cancelled = false;

        async function check() {
            if (cancelled || redirected.current) {
                return;
            }
            try {
                const { data } = await api.get('/auth/me');
                const user = data?.user ?? data;
                if (user && user.pending_approval === false) {
                    redirected.current = true;
                    toast.success(t('auth_pending_approved_toast'));
                    window.dispatchEvent(new Event('sellchase:me-updated'));
                    navigate('/dashboard', { replace: true });
                }
            } catch (err) {
                if (err?.response?.status === 401) {
                    const refresh = localStorage.getItem('sellchase_refresh_token');
                    if (refresh) {
                        try {
                            const { data: ref } = await api.post('/auth/refresh', { refresh_token: refresh });
                            setTokens({
                                access_token: ref.access_token,
                                refresh_token: ref.refresh_token,
                            });
                            await check();
                        } catch {
                            /* session ended */
                        }
                    }
                }
            }
        }

        check();
        const id = window.setInterval(check, POLL_MS);
        return () => {
            cancelled = true;
            window.clearInterval(id);
        };
    }, [navigate, t]);

    const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('sellchase_access_token');

    return (
        <div className="relative flex min-h-screen flex-col overflow-hidden bg-linear-to-br from-surface via-white to-brand-light/40">
            <header className="relative flex justify-end p-4">
                <LanguageSwitcher />
            </header>
            <div className="relative flex flex-1 items-center justify-center px-4 pb-16">
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg text-center">
                    <div className="rounded-2xl border border-amber-200/80 bg-amber-50/90 p-8 shadow-soft">
                        <h1 className="text-xl font-semibold text-amber-950">{t('auth_pending_title')}</h1>
                        <p className="mt-3 text-sm leading-relaxed text-amber-900/90">{t('auth_pending_body')}</p>
                        <p className="mt-4 text-sm text-amber-800/80">{t('auth_pending_hint')}</p>
                        {hasToken ? (
                            <p className="mt-2 text-xs text-amber-800/70">{t('auth_pending_polling_note')}</p>
                        ) : (
                            <p className="mt-2 text-xs text-amber-800/70">{t('auth_pending_no_session')}</p>
                        )}
                        <Link
                            to="/login"
                            className="mt-6 inline-flex rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
                        >
                            {t('auth_back_login')}
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
