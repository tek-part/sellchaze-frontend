import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineBars3, HiOutlineArrowTopRightOnSquare } from 'react-icons/hi2';
import SidebarNav from './SidebarNav';

/** Reuses permission-aware navigation; desktop and mobile expose the same routes. */
export default function MerchantSidebar({ me, permissions, storeUrl, onCollapse }) {
    const { t } = useTranslation();
    return (
        <aside className="merchant-sidebar hidden w-[272px] shrink-0 flex-col border-e border-slate-200/70 bg-[#f6f7f9] lg:flex" aria-label={t('primary_navigation', 'Primary navigation')}>
            <div className="flex h-[72px] shrink-0 items-center justify-between gap-3 border-b border-slate-200/70 px-5">
                <Link to="/dashboard" className="flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-brand">
                    <img src="/icon.png" alt="" className="h-9 w-9 object-contain" />
                    <span className="text-lg font-extrabold tracking-tight text-slate-900">Sellchaze</span>
                </Link>
                <button type="button" onClick={onCollapse} aria-label={t('sidebar_collapse', 'Collapse sidebar')} className="rounded-lg p-2 text-slate-500 hover:bg-slate-200/60 focus-visible:outline-2 focus-visible:outline-brand">
                    <HiOutlineBars3 className="h-5 w-5" aria-hidden />
                </button>
            </div>
            {storeUrl ? (
                <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="mx-4 mt-4 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:border-brand hover:text-brand">
                    {t('view_store', 'View store')}
                    <HiOutlineArrowTopRightOnSquare className="h-4 w-4" aria-hidden />
                </a>
            ) : null}
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5 [scrollbar-width:thin]">
                <SidebarNav isAdmin={me.roles?.includes('Admin')} isSupplier={me.roles?.includes('Supplier')} roles={me.roles ?? []} permissions={permissions} />
            </div>
        </aside>
    );
}
