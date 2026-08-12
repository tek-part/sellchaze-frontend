import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineArrowTopRightOnSquare, HiOutlineShieldCheck } from 'react-icons/hi2';
import SidebarNav from '../SidebarNav';

export default function AdminSidebar({ me, permissions }) {
    const { t } = useTranslation();

    return (
        <aside className="hidden h-full w-72 shrink-0 flex-col border-e border-white/10 bg-[#071f45] text-white shadow-[12px_0_36px_rgba(15,55,105,0.08)] lg:flex">
            <div className="flex h-[76px] shrink-0 items-center border-b border-white/10 px-5">
                <Link
                    to="/admin/dashboard"
                    className="flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-300"
                    aria-label={t('app_name')}
                >
                    <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-white shadow-lg shadow-black/10">
                        <img src="/icon.png" alt="" className="h-8 w-8 object-contain" />
                    </span>
                    <span className="min-w-0">
                        <span className="block text-lg font-extrabold tracking-tight text-white">Sellchaze</span>
                        <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-200/80">
                            {t('admin_control_center', 'Control center')}
                        </span>
                    </span>
                </Link>
            </div>

            <div className="mx-4 mt-4 flex items-center gap-3 rounded-2xl border border-blue-300/15 bg-white/7 px-3 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-400/15 text-blue-200">
                    <HiOutlineShieldCheck className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-white">{me?.name}</span>
                    <span className="block text-xs text-blue-200/75">{t('administrator', 'Administrator')}</span>
                </span>
            </div>

            <div className="admin-sidebar-nav min-h-0 flex-1 overflow-y-auto px-3 py-5 [scrollbar-color:rgba(147,197,253,.35)_transparent] [scrollbar-width:thin]">
                <SidebarNav
                    isAdmin
                    roles={me?.roles ?? []}
                    permissions={permissions}
                />
            </div>

            <div className="shrink-0 border-t border-white/10 p-4">
                <Link
                    to="/"
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/6 px-3 py-2.5 text-sm font-medium text-blue-100 transition hover:border-blue-300/30 hover:bg-white/10 hover:text-white"
                >
                    {t('nav_visit_website', 'Visit website')}
                    <HiOutlineArrowTopRightOnSquare className="h-4 w-4" aria-hidden />
                </Link>
            </div>
        </aside>
    );
}
