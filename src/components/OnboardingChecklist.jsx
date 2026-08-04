import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineCheckCircle, HiOutlineArrowRight, HiXMark } from 'react-icons/hi2';
import api from '../api/client';

const DISMISS_KEY = 'sellchase_onboarding_dismissed';

/**
 * The 5-step onboarding checklist a merchant/supplier sees right after signing
 * up. Progress is computed server-side from real state (logo, products, theme,
 * invites), so it can never drift from reality. Hidden once complete, and
 * dismissible in the meantime.
 */
export default function OnboardingChecklist() {
    const { t } = useTranslation();
    const [data, setData] = useState(null);
    const [dismissed, setDismissed] = useState(() => {
        try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
    });

    useEffect(() => {
        let active = true;
        api.get('/me/onboarding')
            .then((res) => { if (active) setData(res.data); })
            .catch(() => { if (active) setData(null); });
        return () => { active = false; };
    }, []);

    const dismiss = () => {
        setDismissed(true);
        try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
    };

    // Nothing to show: not loaded, already finished, or dismissed by the user.
    if (!data || data.complete || dismissed) return null;

    const labels = {
        account: t('onb_account', 'Create your account'),
        logo: t('onb_logo', 'Add your company logo'),
        products: t('onb_products', 'Add your first 5 products'),
        template: t('onb_template', 'Choose your site template'),
        invite: t('onb_invite', 'Invite your first client'),
    };

    return (
        <section className="mb-6 overflow-hidden rounded-2xl bg-white shadow-xs ring-1 ring-slate-200">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">{t('onb_title', 'Finish setting up your account')}</h2>
                    <p className="mt-0.5 text-sm text-slate-500">
                        {t('onb_subtitle', 'A few quick steps to get your site live and discoverable.')}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={dismiss}
                    aria-label={t('dismiss', 'Dismiss')}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                    <HiXMark className="h-5 w-5" aria-hidden />
                </button>
            </div>

            <div className="px-5 pt-4">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>{t('onb_progress', 'Progress')}</span>
                    <span>
                        {data.done_count}/{data.total}
                    </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                        className="h-full rounded-full bg-brand transition-all duration-500"
                        style={{ width: `${data.percent}%` }}
                        role="progressbar"
                        aria-valuenow={data.percent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                    />
                </div>
            </div>

            <ul className="divide-y divide-slate-100 p-2">
                {data.steps.map((step) => {
                    const label = labels[step.key] || step.key;
                    const showCount = step.key === 'products' && step.progress && !step.done;
                    return (
                        <li key={step.key} className="flex items-center gap-3 px-3 py-3">
                            {step.done ? (
                                <HiOutlineCheckCircle className="h-6 w-6 shrink-0 text-emerald-500" aria-hidden />
                            ) : (
                                <span className="h-5 w-5 shrink-0 rounded-full border-2 border-slate-200" aria-hidden />
                            )}
                            <span className={`flex-1 text-sm ${step.done ? 'text-slate-400 line-through' : 'font-medium text-slate-700'}`}>
                                {label}
                                {showCount ? (
                                    <span className="ms-2 text-xs text-slate-400">
                                        ({step.progress.current}/{step.progress.target})
                                    </span>
                                ) : null}
                            </span>
                            {!step.done && step.href ? (
                                <Link
                                    to={step.href}
                                    className="inline-flex items-center gap-1 rounded-lg bg-brand-light px-3 py-1.5 text-xs font-semibold text-brand-dark transition hover:bg-brand hover:text-white"
                                >
                                    {t('onb_go', 'Go')}
                                    <HiOutlineArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
                                </Link>
                            ) : null}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
