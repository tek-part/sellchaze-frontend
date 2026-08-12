import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineCheckCircle, HiOutlineArrowRight, HiOutlineBolt, HiOutlineFlag, HiXMark } from 'react-icons/hi2';
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
    const activeStep = data.steps.find((step) => !step.done) ?? data.steps[data.steps.length - 1];
    const activeLabel = labels[activeStep?.key] || activeStep?.key;

    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] md:p-6">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                    <HiOutlineBolt className="h-5 w-5 text-brand" aria-hidden />
                    <h2 className="text-base font-bold text-[#0a2540]">{t('onb_success_path', 'Your success path')}</h2>
                </div>
                <button
                    type="button"
                    onClick={dismiss}
                    aria-label={t('dismiss', 'Dismiss')}
                    className="rounded-full border border-blue-200 p-1.5 text-brand transition hover:bg-brand-light"
                >
                    <HiXMark className="h-5 w-5" aria-hidden />
                </button>
            </div>

            <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(18rem,0.75fr)]">
                <div>
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm font-bold text-[#0a2540]">
                            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#5cc8b2] text-white">
                                <HiOutlineFlag className="h-4.5 w-4.5" aria-hidden />
                            </span>
                            {t('onb_title', 'Set up your business essentials')}
                        </div>
                        <span className="text-xs font-semibold text-slate-500">{data.done_count}/{data.total}</span>
                    </div>

                    <div className="mt-5 flex items-center">
                        {data.steps.map((step, index) => (
                            <div key={step.key} className={`flex items-center ${index < data.steps.length - 1 ? 'flex-1' : ''}`}>
                                <span
                                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 text-xs font-bold transition ${
                                        step.done
                                            ? 'border-brand bg-brand text-white'
                                            : step.key === activeStep?.key
                                              ? 'border-blue-400 bg-brand-light text-brand-dark'
                                              : 'border-dashed border-slate-300 bg-white text-slate-400'
                                    }`}
                                    title={labels[step.key] || step.key}
                                >
                                    {step.done ? <HiOutlineCheckCircle className="h-5 w-5" aria-hidden /> : index + 1}
                                </span>
                                {index < data.steps.length - 1 ? (
                                    <span className={`mx-2 h-px flex-1 border-t ${step.done ? 'border-brand' : 'border-dashed border-slate-300'}`} aria-hidden />
                                ) : null}
                            </div>
                        ))}
                    </div>

                    <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-medium text-brand">{t('onb_next_task', 'Complete this task to keep growing')}</p>
                                <h3 className="mt-1 text-base font-bold text-[#0a2540]">{activeLabel}</h3>
                                <p className="mt-1 text-sm text-slate-500">{t('onb_subtitle', 'A few quick steps to get your business live and discoverable.')}</p>
                            </div>
                            {activeStep?.href ? (
                                <Link
                                    to={activeStep.href}
                                    className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark"
                                >
                                    {t('onb_go', 'Start task')}
                                    <HiOutlineArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
                                </Link>
                            ) : null}
                        </div>
                    </div>
                </div>

                <aside className="relative overflow-hidden rounded-2xl border border-[#b7eef0] bg-linear-to-br from-white via-[#eefcfc] to-[#d8f8f4] p-5">
                    <p className="text-3xl font-black tabular-nums text-[#0a2540]">{data.percent}%</p>
                    <p className="mt-2 max-w-xs text-sm font-semibold leading-6 text-brand-dark">
                        {t('onb_success_hint', 'Complete your setup to unlock stronger visibility and better business opportunities.')}
                    </p>
                    <div className="mt-6 h-2.5 w-full overflow-hidden rounded-full bg-white/80 ring-1 ring-[#b7eef0]">
                        <div
                            className="h-full rounded-full bg-accent transition-all duration-500"
                            style={{ width: `${data.percent}%` }}
                            role="progressbar"
                            aria-valuenow={data.percent}
                            aria-valuemin={0}
                            aria-valuemax={100}
                        />
                    </div>
                    <div className="pointer-events-none absolute -bottom-12 -end-8 h-36 w-36 rounded-full border-[18px] border-accent/15" aria-hidden />
                </aside>
            </div>
        </section>
    );
}
