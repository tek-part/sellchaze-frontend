import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate, useOutletContext } from 'react-router-dom';
import useStoreScope from '../hooks/useStoreScope';
import { useTranslation } from 'react-i18next';
import api from '../api/client';

const badgeCls = 'inline-block rounded-full border px-2 py-0.5 text-xs font-medium';
const thCls = 'px-4 py-3.5 text-start';
const tdCls = 'px-4 py-3 align-middle';
const rowCls = 'border-t border-slate-100 hover:bg-slate-50/60';
const btnPrimary = 'rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark';

export default function StorePagesPage() {
    const { id, apiBase, uiBase } = useStoreScope();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { permissions } = useOutletContext();
    const can = (p) => permissions.includes(p);

    const [contentPages, setContentPages] = useState([]);
    const [err, setErr] = useState('');

    const load = useCallback(() => {
        api.get(`${apiBase}/content`)
            .then(({ data }) => setContentPages(data.data ?? []))
            .catch((e) => setErr(e.response?.data?.message || e.message));
    }, [id]);

    useEffect(() => { load(); }, [load]);

    if (id && !can('stores-edit')) return <Navigate to="/stores" replace />;

    return (
        <div className="mx-auto max-w-5xl space-y-5">
            <div className="flex items-center justify-between">
                <div className="border-s-4 border-brand ps-4">
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('pages_title', 'Pages')}</h1>
                    <p className="mt-1 text-sm text-slate-500">{t('standard_pages_subtitle', 'Edit the built-in storefront pages. Unset fields keep the theme default.')}</p>
                </div>
                <button type="button" onClick={() => navigate(`${uiBase}/menus`)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    {t('menus_title', 'Menus')}
                </button>
            </div>

            {err && <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}

            {/* Standard pages — fixed system pages editable with structured fields. */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
                <div className="border-b border-slate-100 px-4 py-3">
                    <h2 className="text-sm font-semibold text-slate-900">{t('standard_pages_title', 'Standard pages')}</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-start text-sm">
                        <thead className="bg-surface-muted/90 text-xs font-semibold uppercase tracking-wide text-slate-600">
                            <tr>
                                <th className={thCls}>{t('col_page', 'Page')}</th>
                                <th className={thCls}>{t('col_path', 'Path')}</th>
                                <th className={thCls}>{t('col_status', 'Status')}</th>
                                <th className={`${thCls} text-end`}>{t('col_actions', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contentPages.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-12 text-center text-sm text-slate-500">{t('empty', 'Nothing here yet.')}</td>
                                </tr>
                            ) : null}
                            {contentPages.map((c) => (
                                <tr key={c.key} className={rowCls}>
                                    <td className={`${tdCls} font-medium text-slate-800`}>{t(c.label, c.label)}</td>
                                    <td className={`${tdCls} text-slate-500`}>{c.path}</td>
                                    <td className={tdCls}>
                                        <span className={`${badgeCls} ${c.customized ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-500'}`}>
                                            {c.customized ? t('customized', 'Customized') : t('theme_default_label', 'Theme default')}
                                        </span>
                                    </td>
                                    <td className={`${tdCls} text-end`}>
                                        <button type="button" onClick={() => navigate(`${uiBase}/content/${c.key}`)} className={btnPrimary}>
                                            {t('page_edit', 'Edit')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {id ? <button type="button" onClick={() => navigate('/stores')} className="text-sm text-slate-500 hover:underline">← {t('stores_title', 'Stores')}</button> : null}
        </div>
    );
}
