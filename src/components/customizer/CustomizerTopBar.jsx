import { useState } from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import {
    HiOutlineArrowTopRightOnSquare,
    HiOutlineArrowUturnLeft,
    HiOutlineArrowUturnRight,
    HiOutlineCheckCircle,
    HiOutlineChevronUpDown,
    HiOutlineClock,
    HiOutlineCloudArrowUp,
    HiOutlineComputerDesktop,
    HiOutlineDevicePhoneMobile,
    HiOutlineDeviceTablet,
    HiOutlineDocumentText,
    HiOutlineHome,
    HiOutlinePlus,
    HiOutlineRocketLaunch,
} from 'react-icons/hi2';
import { localeLabel } from '../store/LocaleTabs';
import { VIEWPORTS } from './customizerUtils';

const VIEWPORT_ICON = { desktop: HiOutlineComputerDesktop, tablet: HiOutlineDeviceTablet, mobile: HiOutlineDevicePhoneMobile };

/** Page selector: Home + custom pages + inline "New page" form. */
function PageSelector({ pages, value, onChange, onCreate, creating }) {
    const { t } = useTranslation();
    const [title, setTitle] = useState('');
    const [showNew, setShowNew] = useState(false);
    const current = value === 'home' ? { title: t('customizer_home_page', 'Home page'), Icon: HiOutlineHome } : { title: pages.find((p) => String(p.id) === String(value))?.title || t('customizer_page', 'Page'), Icon: HiOutlineDocumentText };

    const submit = async (e) => {
        e.preventDefault();
        if (!title.trim() || creating) return;
        const ok = await onCreate(title.trim());
        if (ok) { setTitle(''); setShowNew(false); }
    };

    return (
        <Menu as="div" className="relative">
            <MenuButton className="flex max-w-[16rem] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 shadow-xs hover:border-slate-300">
                <current.Icon className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                <span className="truncate">{current.title}</span>
                <HiOutlineChevronUpDown className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            </MenuButton>
            <MenuItems anchor="bottom start" className="z-50 mt-1 w-72 rounded-xl border border-slate-200 bg-white p-1 shadow-lg ring-1 ring-black/5 outline-none [--anchor-gap:4px]">
                <MenuItem>
                    {({ focus }) => (
                        <button type="button" onClick={() => onChange('home')} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm ${focus ? 'bg-brand-light/60' : ''} ${value === 'home' ? 'font-semibold text-brand-dark' : 'text-slate-700'}`}>
                            <HiOutlineHome className="h-4 w-4 shrink-0" aria-hidden />
                            {t('customizer_home_page', 'Home page')}
                        </button>
                    )}
                </MenuItem>
                {pages.length ? <p className="mt-1 px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{t('customizer_custom_pages', 'Custom pages')}</p> : null}
                {pages.map((p) => (
                    <MenuItem key={p.id}>
                        {({ focus }) => (
                            <button type="button" onClick={() => onChange(String(p.id))} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm ${focus ? 'bg-brand-light/60' : ''} ${String(value) === String(p.id) ? 'font-semibold text-brand-dark' : 'text-slate-700'}`}>
                                <HiOutlineDocumentText className="h-4 w-4 shrink-0" aria-hidden />
                                <span className="min-w-0 flex-1 truncate">{p.title}</span>
                                <span className="shrink-0 font-mono text-[10px] text-slate-400" dir="ltr">/{p.slug}</span>
                            </button>
                        )}
                    </MenuItem>
                ))}
                <div className="mt-1 border-t border-slate-100 pt-1">
                    {showNew ? (
                        <form onSubmit={submit} onKeyDown={(e) => e.stopPropagation()} className="flex items-center gap-1.5 px-2 py-1.5">
                            <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('customizer_new_page_title', 'Page title')} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
                            <button type="submit" disabled={creating || !title.trim()} className="rounded-lg bg-brand px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark disabled:opacity-50">{creating ? '…' : t('customizer_create', 'Create')}</button>
                        </form>
                    ) : (
                        <button type="button" onClick={(e) => { e.preventDefault(); setShowNew(true); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm font-medium text-brand hover:bg-brand-light/60">
                            <HiOutlinePlus className="h-4 w-4" aria-hidden />
                            {t('customizer_new_page', 'New page')}
                        </button>
                    )}
                </div>
            </MenuItems>
        </Menu>
    );
}

/**
 * Customizer top bar: page selector, viewport toggle, locale switch, undo/redo, status pill and the
 * Save / Publish / Open storefront actions.
 */
export default function CustomizerTopBar({
    pages, pageKey, onPageChange, onCreatePage, creatingPage,
    viewport, onViewportChange,
    locales, locale, onLocaleChange,
    canUndo, canRedo, onUndo, onRedo,
    dirty, saveStatus, onSave, saving, onPublish, publishing, canPublish,
    storefrontHref, onOpenRevisions,
}) {
    const { t } = useTranslation();
    const statusText = saveStatus === 'saving' ? t('customizer_saving', 'Saving…') : saveStatus === 'pending' ? t('customizer_unsaved', 'Unsaved changes') : saveStatus === 'error' ? t('customizer_save_failed', 'Autosave failed') : t('customizer_all_saved', 'All changes saved');

    return (
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 bg-white px-3 py-2">
            <PageSelector pages={pages} value={pageKey} onChange={onPageChange} onCreate={onCreatePage} creating={creatingPage} />

            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5 shadow-xs" role="group" aria-label={t('customizer_viewport', 'Preview size')}>
                {VIEWPORTS.map((vp) => {
                    const Icon = VIEWPORT_ICON[vp];
                    const active = vp === viewport;
                    return (
                        <button key={vp} type="button" onClick={() => onViewportChange(vp)} title={t(`customizer_viewport_${vp}`, vp)} aria-pressed={active} className={`rounded-lg p-1.5 transition ${active ? 'bg-brand text-white shadow-xs' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}>
                            <Icon className="h-4 w-4" aria-hidden />
                        </button>
                    );
                })}
            </div>

            {locales.length > 1 ? (
                <div className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5 shadow-xs" role="group" aria-label={t('locale_tabs_label', 'Content language')}>
                    {locales.map((code) => (
                        <button key={code} type="button" onClick={() => onLocaleChange(code)} lang={code} aria-pressed={code === locale} className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${code === locale ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                            {localeLabel(code, t)}
                        </button>
                    ))}
                </div>
            ) : null}

            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5 shadow-xs">
                <button type="button" onClick={onUndo} disabled={!canUndo} title={`${t('customizer_undo', 'Undo')} (Ctrl+Z)`} className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30" aria-label={t('customizer_undo', 'Undo')}><HiOutlineArrowUturnLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden /></button>
                <button type="button" onClick={onRedo} disabled={!canRedo} title={`${t('customizer_redo', 'Redo')} (Ctrl+Shift+Z)`} className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30" aria-label={t('customizer_redo', 'Redo')}><HiOutlineArrowUturnRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden /></button>
            </div>

            <div className="ms-auto flex flex-wrap items-center gap-2">
                <span className={`hidden text-[11px] font-medium sm:inline ${saveStatus === 'error' ? 'text-red-600' : saveStatus === 'saved' ? 'text-slate-400' : 'text-amber-600'}`}>{statusText}</span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${dirty ? 'bg-amber-50 text-amber-800 ring-1 ring-amber-200' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'}`}>
                    {dirty ? <HiOutlineCloudArrowUp className="h-3.5 w-3.5" aria-hidden /> : <HiOutlineCheckCircle className="h-3.5 w-3.5" aria-hidden />}
                    {dirty ? t('customizer_status_draft', 'Draft changes') : t('customizer_status_published', 'Published')}
                </span>
                {onOpenRevisions ? (
                    <button type="button" onClick={onOpenRevisions} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-xs hover:bg-slate-50" title={t('customizer_revisions', 'Revisions')} aria-label={t('customizer_revisions', 'Revisions')}>
                        <HiOutlineClock className="h-4 w-4" aria-hidden />
                    </button>
                ) : null}
                <button type="button" onClick={onSave} disabled={saving || saveStatus === 'saved'} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50">
                    {t('customizer_save_draft', 'Save draft')}
                </button>
                <button type="button" onClick={onPublish} disabled={publishing || saving || !canPublish} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50">
                    <HiOutlineRocketLaunch className="h-4 w-4" aria-hidden />
                    {publishing ? t('theme_publishing', 'Publishing…') : t('customizer_publish', 'Publish')}
                </button>
                {storefrontHref ? (
                    <a href={storefrontHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-xs hover:bg-slate-50" title={t('customizer_open_storefront', 'Open storefront')}>
                        <HiOutlineArrowTopRightOnSquare className="h-4 w-4" aria-hidden />
                        <span className="hidden lg:inline">{t('customizer_open_storefront', 'Open storefront')}</span>
                    </a>
                ) : null}
            </div>
        </div>
    );
}
