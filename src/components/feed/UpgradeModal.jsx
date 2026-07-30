import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { HiOutlineSparkles, HiOutlineCheck } from 'react-icons/hi2';
import api from '../../api/client';

/**
 * Shown when POST /posts is rejected with HTTP 402 (free monthly limit reached).
 * Explains the limit, contrasts free vs paid briefly, and lets the user upgrade
 * inline (POST /me/subscription {plan:'paid'} — no billing yet) or jump to /pricing.
 * On a successful inline activate it calls onUpgraded() so the caller can refresh
 * quota and let the user retry publishing.
 */
export default function UpgradeModal({ open, onClose, onUpgraded }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [activating, setActivating] = useState(false);
    const [err, setErr] = useState('');

    const upgrade = async () => {
        if (activating) return;
        setErr('');
        setActivating(true);
        try {
            await api.post('/me/subscription', { plan: 'paid' });
            onUpgraded?.();
            onClose?.();
        } catch (e) {
            setErr(e.response?.data?.message || e.message);
        } finally {
            setActivating(false);
        }
    };

    return (
        <Dialog open={open} onClose={activating ? () => {} : onClose} className="relative z-100">
            <DialogBackdrop className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand">
                            <HiOutlineSparkles className="h-5 w-5" aria-hidden />
                        </span>
                        <DialogTitle className="text-lg font-bold text-slate-900">
                            {t('sub_limit_title', 'Monthly limit reached')}
                        </DialogTitle>
                    </div>

                    <p className="mt-3 text-sm text-slate-600">
                        {t('sub_limit_body', 'You have used all your free posts for this month. Upgrade to Pro to publish without limits.')}
                    </p>

                    {/* Brief free vs paid comparison */}
                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                            <p className="text-[12px] font-semibold text-slate-500">{t('sub_free', 'Free')}</p>
                            <p className="mt-1 text-sm font-medium text-slate-700">{t('sub_free_limit', '3 posts / month')}</p>
                        </div>
                        <div className="rounded-xl border border-brand/30 bg-brand-light/50 p-3">
                            <p className="text-[12px] font-semibold text-brand-dark">{t('sub_pro_pill', 'Pro · unlimited')}</p>
                            <p className="mt-1 flex items-center gap-1 text-sm font-medium text-slate-700">
                                <HiOutlineCheck className="h-4 w-4 text-brand" aria-hidden />
                                {t('sub_unlimited', 'Unlimited')}
                            </p>
                        </div>
                    </div>

                    {err ? <p className="mt-3 text-sm text-red-600">{err}</p> : null}

                    <div className="mt-6 flex flex-wrap justify-end gap-2">
                        <button
                            type="button"
                            disabled={activating}
                            onClick={onClose}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                            {t('sub_later', 'Later')}
                        </button>
                        <button
                            type="button"
                            disabled={activating}
                            onClick={() => void upgrade()}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-brand-dark disabled:opacity-50"
                        >
                            {activating ? '…' : t('sub_upgrade_now', 'Upgrade now')}
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            onClose?.();
                            navigate('/pricing');
                        }}
                        className="mt-3 w-full text-center text-[13px] font-medium text-brand hover:text-brand-dark"
                    >
                        {t('sub_view_plans', 'View all plans')}
                    </button>
                </DialogPanel>
            </div>
        </Dialog>
    );
}
