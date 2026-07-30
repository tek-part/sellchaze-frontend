import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineSparkles, HiOutlineCheck, HiOutlineCheckBadge } from 'react-icons/hi2';
import api from '../api/client';
import { langParam } from '../api/lang';

/**
 * Subscription plans page (Phase 3). Lists the available plans, marks the user's
 * current plan, and lets them activate another plan inline via POST /me/subscription
 * (no billing yet — a manual toggle). Plan names come from the API.
 */
export default function PricingPage() {
    const { t, i18n } = useTranslation();
    const { lang } = langParam(i18n);

    const [plans, setPlans] = useState([]);
    const [current, setCurrent] = useState(null); // { plan: { slug, ... }, ... }
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');
    const [activating, setActivating] = useState(''); // slug being activated
    const [success, setSuccess] = useState('');

    const load = () => {
        setLoading(true);
        setErr('');
        Promise.all([
            api.get('/plans', { params: { lang } }),
            api.get('/me/subscription', { params: { lang } }),
        ])
            .then(([plansRes, subRes]) => {
                setPlans(plansRes.data.data ?? []);
                setCurrent(subRes.data ?? null);
            })
            .catch((e) => setErr(e.response?.data?.message || e.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        let alive = true;
        setLoading(true);
        setErr('');
        Promise.all([
            api.get('/plans', { params: { lang } }),
            api.get('/me/subscription', { params: { lang } }),
        ])
            .then(([plansRes, subRes]) => {
                if (!alive) return;
                setPlans(plansRes.data.data ?? []);
                setCurrent(subRes.data ?? null);
            })
            .catch((e) => {
                if (alive) setErr(e.response?.data?.message || e.message);
            })
            .finally(() => {
                if (alive) setLoading(false);
            });
        return () => {
            alive = false;
        };
    }, [lang]);

    const currentSlug = current?.plan?.slug ?? null;

    const activate = async (slug) => {
        if (activating) return;
        setActivating(slug);
        setErr('');
        setSuccess('');
        try {
            const { data } = await api.post('/me/subscription', { plan: slug });
            setSuccess(data.message || t('sub_activate_success', 'Plan activated'));
            load();
        } catch (e) {
            setErr(e.response?.data?.message || e.message);
        } finally {
            setActivating('');
        }
    };

    const formatPrice = (p) => {
        const price = Number(p.price ?? 0);
        if (!price) return t('sub_free', 'Free');
        return `${price} ${p.currency ?? ''}`.trim();
    };

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <div className="flex items-center gap-3 border-s-4 border-brand ps-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-900">
                        <HiOutlineSparkles className="h-6 w-6 text-brand" aria-hidden />
                        {t('sub_plans_title', 'Plans')}
                    </h1>
                </div>
            </div>

            {success ? (
                <p className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    {success}
                </p>
            ) : null}
            {err ? (
                <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>
            ) : null}

            {loading ? (
                <p className="py-10 text-center text-sm text-slate-400">{t('loading', 'Loading…')}</p>
            ) : plans.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-6 py-16 text-center">
                    <p className="text-sm font-medium text-slate-500">{t('no_results', 'No results')}</p>
                </div>
            ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                    {plans.map((p) => {
                        const isCurrent = currentSlug === p.slug;
                        return (
                            <div
                                key={p.slug}
                                className={`flex flex-col rounded-2xl bg-white p-6 shadow-xs ring-1 transition ${
                                    isCurrent ? 'ring-2 ring-brand' : 'ring-slate-200'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <h2 className="text-lg font-bold text-slate-900">{p.name}</h2>
                                    {isCurrent ? (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-light px-2.5 py-1 text-[11px] font-semibold text-brand-dark">
                                            <HiOutlineCheckBadge className="h-3.5 w-3.5" aria-hidden />
                                            {t('sub_current_plan', 'Current plan')}
                                        </span>
                                    ) : null}
                                </div>

                                <div className="mt-3 flex items-baseline gap-1">
                                    <span className="text-2xl font-bold text-slate-900">{formatPrice(p)}</span>
                                    {Number(p.price ?? 0) ? (
                                        <span className="text-sm text-slate-500">{t('sub_per_month', '/ month')}</span>
                                    ) : null}
                                </div>

                                <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-600">
                                    <li className="flex items-center gap-2">
                                        <HiOutlineCheck className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                                        {p.unlimited
                                            ? t('sub_unlimited_posts', 'Unlimited monthly posts')
                                            : t('sub_monthly_posts', '{{num}} posts / month', {
                                                  num: p.post_limit_monthly ?? 0,
                                              })}
                                    </li>
                                    {p.trial_days ? (
                                        <li className="flex items-center gap-2">
                                            <HiOutlineCheck className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                                            {t('sub_trial_days', '{{days}} days free trial', { days: p.trial_days })}
                                        </li>
                                    ) : null}
                                </ul>

                                <div className="mt-6">
                                    {isCurrent ? (
                                        <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-brand/30 bg-brand-light/50 px-4 py-2.5 text-sm font-semibold text-brand-dark">
                                            <HiOutlineCheckBadge className="h-4 w-4" aria-hidden />
                                            {t('sub_current_plan', 'Current plan')}
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            disabled={!!activating}
                                            onClick={() => void activate(p.slug)}
                                            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-brand-dark disabled:opacity-50"
                                        >
                                            {activating === p.slug ? '…' : t('sub_activate', 'Activate')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
