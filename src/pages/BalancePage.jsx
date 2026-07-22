import { Navigate, NavLink, useLocation, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineArrowDownTray, HiOutlineArrowUpTray, HiOutlineBanknotes } from 'react-icons/hi2';

function subNavClass({ isActive }) {
    return [
        'inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all',
        isActive
            ? 'border-brand bg-brand text-white shadow-xs'
            : 'border-slate-200/80 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
    ].join(' ');
}

function SectionCard({ title, subtitle, children }) {
    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
            <div className="border-b border-slate-100 px-4 py-3">
                <h2 className="font-semibold text-slate-900">{title}</h2>
                {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
            </div>
            <div className="p-4">{children}</div>
        </section>
    );
}

export default function BalancePage() {
    const { t } = useTranslation();
    const { pathname } = useLocation();
    const { permissions, isAdmin } = useOutletContext();
    const can = (p) => isAdmin || permissions.includes(p);
    const canView = isAdmin || permissions.includes('balance-in') || permissions.includes('balance-out');
    const canIn = can('balance-in');
    const canOut = can('balance-out');

    if (!canView) {
        return <Navigate to="/dashboard" replace />;
    }

    const tab = /^\/balance\/in\/?$/.test(pathname)
        ? 'in'
        : /^\/balance\/out\/?$/.test(pathname)
          ? 'out'
          : 'overview';

    const statCard = (label, value, hint, Icon, accent) => (
        <div
            className={`flex flex-col gap-2 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card ${accent}`}
        >
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
                <span className={`rounded-lg p-2 ${accent}`}>
                    <Icon className="h-5 w-5" aria-hidden />
                </span>
            </div>
            <p className="text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
            {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="border-s-4 border-brand ps-4">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('perm_group_balance')}</h1>
                <p className="mt-1 text-sm text-slate-500">{t('balance_page_subtitle')}</p>
            </div>

            <div className="flex flex-wrap gap-2">
                <NavLink to="/balance" end className={subNavClass}>
                    <HiOutlineBanknotes className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                    {t('balance_nav_overview')}
                </NavLink>
                {canIn ? (
                    <NavLink to="/balance/in" className={subNavClass}>
                        <HiOutlineArrowDownTray className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                        {t('balance_nav_in')}
                    </NavLink>
                ) : null}
                {canOut ? (
                    <NavLink to="/balance/out" className={subNavClass}>
                        <HiOutlineArrowUpTray className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                        {t('balance_nav_out')}
                    </NavLink>
                ) : null}
            </div>

            {tab === 'overview' ? (
                <>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {canIn
                            ? statCard(
                                  t('balance_stat_incoming'),
                                  '—',
                                  t('balance_stat_placeholder_hint'),
                                  HiOutlineArrowDownTray,
                                  'bg-teal-50 text-teal-700',
                              )
                            : null}
                        {canOut
                            ? statCard(
                                  t('balance_stat_outgoing'),
                                  '—',
                                  t('balance_stat_placeholder_hint'),
                                  HiOutlineArrowUpTray,
                                  'bg-amber-50 text-amber-800',
                              )
                            : null}
                        {canIn || canOut
                            ? statCard(
                                  t('balance_stat_net'),
                                  '—',
                                  t('balance_stat_net_hint'),
                                  HiOutlineBanknotes,
                                  'bg-brand-light text-brand-dark',
                              )
                            : null}
                    </div>

                    <SectionCard title={t('balance_section_recent')} subtitle={t('balance_section_recent_sub')}>
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-12 text-center text-sm text-slate-500">
                            {t('balance_empty_table')}
                        </div>
                    </SectionCard>

                    <SectionCard title={t('balance_section_exports')} subtitle={t('balance_section_exports_sub')}>
                        <p className="text-sm text-slate-600">{t('balance_exports_placeholder')}</p>
                    </SectionCard>
                </>
            ) : null}

            {tab === 'in' && canIn ? (
                <>
                    <SectionCard title={t('balance_section_filters')} subtitle={t('balance_section_filters_in_sub')}>
                        <div className="flex flex-wrap gap-3">
                            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                                {t('balance_filter_date_from')}
                                <input
                                    type="date"
                                    disabled
                                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                                />
                            </label>
                            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                                {t('balance_filter_date_to')}
                                <input
                                    type="date"
                                    disabled
                                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                                />
                            </label>
                            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                                {t('balance_filter_reference')}
                                <input
                                    type="search"
                                    disabled
                                    placeholder="—"
                                    className="min-w-[200px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                                />
                            </label>
                        </div>
                    </SectionCard>

                    <SectionCard title={t('balance_section_movements_in')} subtitle={t('balance_movements_in_sub')}>
                        <div className="overflow-x-auto rounded-xl border border-slate-100">
                            <table className="min-w-full text-start text-sm">
                                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="px-3 py-2.5">{t('balance_col_date')}</th>
                                        <th className="px-3 py-2.5">{t('balance_col_reference')}</th>
                                        <th className="px-3 py-2.5">{t('balance_col_party')}</th>
                                        <th className="px-3 py-2.5 text-end">{t('balance_col_amount')}</th>
                                        <th className="px-3 py-2.5">{t('balance_col_status')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="px-3 py-10 text-center text-slate-500" colSpan={5}>
                                            {t('balance_empty_table')}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </SectionCard>
                </>
            ) : null}

            {tab === 'in' && !canIn ? <Navigate to="/balance" replace /> : null}

            {tab === 'out' && canOut ? (
                <>
                    <SectionCard title={t('balance_section_filters')} subtitle={t('balance_section_filters_out_sub')}>
                        <div className="flex flex-wrap gap-3">
                            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                                {t('balance_filter_date_from')}
                                <input
                                    type="date"
                                    disabled
                                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                                />
                            </label>
                            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                                {t('balance_filter_date_to')}
                                <input
                                    type="date"
                                    disabled
                                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                                />
                            </label>
                            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                                {t('balance_filter_reference')}
                                <input
                                    type="search"
                                    disabled
                                    placeholder="—"
                                    className="min-w-[200px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                                />
                            </label>
                        </div>
                    </SectionCard>

                    <SectionCard title={t('balance_section_movements_out')} subtitle={t('balance_movements_out_sub')}>
                        <div className="overflow-x-auto rounded-xl border border-slate-100">
                            <table className="min-w-full text-start text-sm">
                                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="px-3 py-2.5">{t('balance_col_date')}</th>
                                        <th className="px-3 py-2.5">{t('balance_col_reference')}</th>
                                        <th className="px-3 py-2.5">{t('balance_col_party')}</th>
                                        <th className="px-3 py-2.5 text-end">{t('balance_col_amount')}</th>
                                        <th className="px-3 py-2.5">{t('balance_col_status')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="px-3 py-10 text-center text-slate-500" colSpan={5}>
                                            {t('balance_empty_table')}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </SectionCard>
                </>
            ) : null}

            {tab === 'out' && !canOut ? <Navigate to="/balance" replace /> : null}
        </div>
    );
}
