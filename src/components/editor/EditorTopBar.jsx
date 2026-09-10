import { useState } from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import {
    HiOutlineArrowLeft,
    HiOutlineArrowPath,
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
    HiOutlineExclamationTriangle,
    HiOutlineHome,
    HiOutlinePlus,
    HiOutlineRocketLaunch,
    HiOutlineSwatch,
} from 'react-icons/hi2';
import { localeLabel } from '../store/LocaleTabs';
import { VIEWPORTS } from '../customizer/customizerUtils';

const VIEWPORT_ICON = { desktop: HiOutlineComputerDesktop, tablet: HiOutlineDeviceTablet, mobile: HiOutlineDevicePhoneMobile };

const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40';
const ICON_BTN = `rounded-lg p-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent ${FOCUS}`;

/** Page selector: Home + custom pages + inline "New page" form. */
function PageSelector({ pages, value, onChange, onCreate, creating }) {
    const { t } = useTranslation();
    const [title, setTitle] = useState('');
    const [showNew, setShowNew] = useState(false);
    const current = value === 'home'
        ? { title: t('customizer_home_page', 'Home page'), Icon: HiOutlineHome }
        : { title: pages.find((p) => String(p.id) === String(value))?.title || t('customizer_page', 'Page'), Icon: HiOutlineDocumentText };

    const submit = async (e) => {
        e.preventDefault();
        if (!title.trim() || creating) return;
        const ok = await onCreate(title.trim());
        if (ok) { setTitle(''); setShowNew(false); }
    };

    return (
        <Menu as="div" className="relative">
            <MenuButton className={`flex h-9 max-w-[14rem] items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] font-medium text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 ${FOCUS}`}>
                <current.Icon className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
                <span className="truncate">{current.title}</span>
                <HiOutlineChevronUpDown className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            </MenuButton>
            <MenuItems anchor="bottom start" className="z-50 mt-1 w-72 rounded-xl border border-slate-200 bg-white p-1 shadow-lg ring-1 ring-black/5 outline-none [--anchor-gap:4px]">
                <MenuItem>
                    {({ focus }) => (
                        <button type="button" onClick={() => onChange('home')} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-[13px] ${focus ? 'bg-brand-light/60' : ''} ${value === 'home' ? 'font-semibold text-brand-dark' : 'text-slate-700'}`}>
                            <HiOutlineHome className="h-4 w-4 shrink-0" aria-hidden />
                            {t('customizer_home_page', 'Home page')}
                        </button>
                    )}
                </MenuItem>
                {pages.length ? <p className="mt-1 px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{t('customizer_custom_pages', 'Custom pages')}</p> : null}
                {pages.map((p) => (
                    <MenuItem key={p.id}>
                        {({ focus }) => (
                            <button type="button" onClick={() => onChange(String(p.id))} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-[13px] ${focus ? 'bg-brand-light/60' : ''} ${String(value) === String(p.id) ? 'font-semibold text-brand-dark' : 'text-slate-700'}`}>
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
                            <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('customizer_new_page_title', 'Page title')} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[13px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
                            <button type="submit" disabled={creating || !title.trim()} className="rounded-lg bg-brand px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark disabled:opacity-50">{creating ? '…' : t('customizer_create', 'Create')}</button>
                        </form>
                    ) : (
                        <button type="button" onClick={(e) => { e.preventDefault(); setShowNew(true); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-[13px] font-medium text-brand hover:bg-brand-light/60">
                            <HiOutlinePlus className="h-4 w-4" aria-hidden />
                            {t('customizer_new_page', 'New page')}
                        </button>
                    )}
                </div>
            </MenuItems>
        </Menu>
    );
}

/** Autosave / publish state pill. */
function StatusPill({ saveStatus, dirty }) {
    const { t } = useTranslation();
    if (saveStatus === 'error') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700 ring-1 ring-red-200">
                <HiOutlineExclamationTriangle className="h-3.5 w-3.5" aria-hidden />
                {t('customizer_save_failed', 'Autosave failed')}
            </span>
        );
    }
    if (saveStatus === 'saving' || saveStatus === 'pending') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
                <HiOutlineArrowPath className={`h-3.5 w-3.5 ${saveStatus === 'saving' ? 'animate-spin' : ''}`} aria-hidden />
                {saveStatus === 'saving' ? t('customizer_saving', 'Saving…') : t('customizer_unsaved', 'Unsaved changes')}
            </span>
        );
    }
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${dirty ? 'bg-amber-50 text-amber-800 ring-1 ring-amber-200' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'}`}>
            {dirty ? <HiOutlineCloudArrowUp className="h-3.5 w-3.5" aria-hidden /> : <HiOutlineCheckCircle className="h-3.5 w-3.5" aria-hidden />}
            {dirty ? t('customizer_status_draft', 'Draft changes') : t('customizer_status_published', 'Published')}
        </span>
    );
}

/**
 * Editor top bar (Shopify-style): Exit + store/theme identity on the start side, page / device /
 * language controls in the middle, undo-redo / status / revisions / Save / Publish on the end side.
 */
export default function EditorTopBar({
    onExit, storeName, theme,
    pages, pageKey, onPageChange, onCreatePage, creatingPage,
    viewport, onViewportChange,
    locales, locale, onLocaleChange,
    canUndo, canRedo, onUndo, onRedo,
    dirty, saveStatus, onSave, saving, onPublish, publishing, canPublish,
    storefrontHref, onOpenRevisions,
}) {
    const { t } = useTranslation();

    return (
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3">
            {/* Start: exit + identity */}
            <div className="flex min-w-0 items-center gap-2 lg:w-80 lg:shrink-0">
                <button type="button" onClick={onExit} className={`inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] font-medium text-slate-700 transition hover:bg-slate-50 ${FOCUS}`} title={t('editor_exit', 'Exit')}>
                    <HiOutlineArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
                    <span className="hidden sm:inline">{t('editor_exit', 'Exit')}</span>
                </button>
                <span className="hidden h-6 w-px bg-slate-200 sm:block" aria-hidden />
                <div className="hidden min-w-0 flex-col sm:flex">
                    <span className="truncate text-[13px] font-semibold leading-tight text-slate-900">{storeName || t('store_nav_untitled', 'My store')}</span>
                    {theme?.name ? (
                        <span className="mt-0.5 inline-flex max-w-full items-center gap-1 self-start rounded-full bg-slate-100 px-2 py-px text-[10px] font-semibold text-slate-600" title={t('editor_editing_theme', 'Editing theme')}>
                            <HiOutlineSwatch className="h-3 w-3 shrink-0 text-brand" aria-hidden />
                            <span className="truncate">{theme.name}</span>
                            {theme.isActive === false ? <span className="shrink-0 text-amber-700">· {t('editor_theme_inactive', 'Not active')}</span> : null}
                        </span>
                    ) : null}
                </div>
            </div>

            {/* Middle: page / device / language */}
            <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
                <PageSelector pages={pages} value={pageKey} onChange={onPageChange} onCreate={onCreatePage} creating={creatingPage} />

                <div className="hidden h-9 items-center rounded-lg border border-slate-200 bg-white p-0.5 md:inline-flex" role="group" aria-label={t('customizer_viewport', 'Preview size')}>
                    {VIEWPORTS.map((vp) => {
                        const Icon = VIEWPORT_ICON[vp];
                        const active = vp === viewport;
                        return (
                            <button key={vp} type="button" onClick={() => onViewportChange(vp)} title={t(`customizer_viewport_${vp}`, vp)} aria-pressed={active} className={`rounded-md p-1.5 transition ${FOCUS} ${active ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}>
                                <Icon className="h-4 w-4" aria-hidden />
                            </button>
                        );
                    })}
                </div>

                {locales.length > 1 ? (
                    <div className="hidden h-9 items-center rounded-lg border border-slate-200 bg-white p-0.5 md:inline-flex" role="group" aria-label={t('locale_tabs_label', 'Content language')}>
                        {locales.map((code) => (
                            <button key={code} type="button" onClick={() => onLocaleChange(code)} lang={code} aria-pressed={code === locale} className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${FOCUS} ${code === locale ? 'bg-brand-light text-brand-dark' : 'text-slate-600 hover:bg-slate-100'}`}>
                                {localeLabel(code, t)}
                            </button>
                        ))}
                    </div>
                ) : null}
            </div>

            {/* End: history / status / actions */}
            <div className="flex shrink-0 items-center gap-2">
                <div className="hidden h-9 items-center rounded-lg border border-slate-200 bg-white p-0.5 sm:inline-flex">
                    <button type="button" onClick={onUndo} disabled={!canUndo} title={`${t('customizer_undo', 'Undo')} (Ctrl+Z)`} className={ICON_BTN} aria-label={t('customizer_undo', 'Undo')}><HiOutlineArrowUturnLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden /></button>
                    <button type="button" onClick={onRedo} disabled={!canRedo} title={`${t('customizer_redo', 'Redo')} (Ctrl+Shift+Z)`} className={ICON_BTN} aria-label={t('customizer_redo', 'Redo')}><HiOutlineArrowUturnRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden /></button>
                </div>
                <span className="hidden md:inline-flex"><StatusPill saveStatus={saveStatus} dirty={dirty} /></span>
                {onOpenRevisions ? (
                    <button type="button" onClick={onOpenRevisions} className={`hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 sm:inline-flex ${FOCUS}`} title={t('customizer_revisions', 'Revisions')} aria-label={t('customizer_revisions', 'Revisions')}>
                        <HiOutlineClock className="h-4 w-4" aria-hidden />
                    </button>
                ) : null}
                {storefrontHref ? (
                    <a href={storefrontHref} target="_blank" rel="noreferrer" className={`hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 lg:inline-flex ${FOCUS}`} title={t('customizer_open_storefront', 'Open storefront')} aria-label={t('customizer_open_storefront', 'Open storefront')}>
                        <HiOutlineArrowTopRightOnSquare className="h-4 w-4" aria-hidden />
                    </a>
                ) : null}
                <button type="button" onClick={onSave} disabled={saving || saveStatus === 'saved'} className={`h-9 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 ${FOCUS}`}>
                    {t('editor_save', 'Save')}
                </button>
                <button type="button" onClick={onPublish} disabled={publishing || saving || !canPublish} className={`inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3.5 text-[13px] font-semibold text-white shadow-xs transition hover:bg-brand-dark disabled:opacity-50 ${FOCUS}`}>
                    <HiOutlineRocketLaunch className="h-4 w-4" aria-hidden />
                    {publishing ? t('theme_publishing', 'Publishing…') : t('customizer_publish', 'Publish')}
                </button>
            </div>
        </header>
    );
}
