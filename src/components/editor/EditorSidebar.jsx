import { useTranslation } from 'react-i18next';
import { HiOutlineArrowPath, HiOutlineExclamationTriangle, HiOutlinePlus, HiOutlineSquares2X2, HiOutlineSwatch } from 'react-icons/hi2';
import { SectionList, SectionPicker } from '../customizer/SectionsPanel';
import ThemeSettingsPanel from '../customizer/ThemeSettingsPanel';

const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40';

/**
 * Left panel of the editor: "Sections" | "Theme settings" tabs (sticky), then either the ordered
 * section tree (blocks nested under their section, + Add section) / the add-section picker, or the
 * theme settings group list.
 */
export default function EditorSidebar({
    tab, onTabChange,
    pageStatus, pageError, onRetryPage, schemaError,
    sections, schema, selectedId, selectedBlockId, expanded, onToggleExpanded, locale, defaultLocale,
    onSelect, onMove, onReorder, onDuplicate, onRemove, onToggleVisible,
    onSelectBlock, onAddBlock, onMoveBlock, onReorderBlock, onDuplicateBlock, onRemoveBlock, onToggleBlockHidden,
    addOpen, onOpenAdd, onCloseAdd, onAdd,
    themeGroups, themeStatus, themeError, onRetryTheme, theme, selectedGroupId, onSelectGroup,
}) {
    const { t } = useTranslation();

    const tabBtn = (key, Icon, label) => (
        <button
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => onTabChange(key)}
            className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-semibold transition ${FOCUS} ${tab === key ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
        </button>
    );

    let body;
    if (tab === 'theme') {
        body = (
            <div className="min-h-0 flex-1 overflow-y-auto">
                <ThemeSettingsPanel
                    groups={themeGroups}
                    status={themeStatus}
                    error={themeError}
                    onRetry={onRetryTheme}
                    theme={theme}
                    selectedGroupId={selectedGroupId}
                    onSelectGroup={onSelectGroup}
                />
            </div>
        );
    } else if (pageStatus === 'loading') {
        body = <div className="space-y-1 p-2">{[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-11 animate-pulse rounded-lg bg-slate-100" />)}</div>;
    } else if (pageStatus === 'error') {
        body = (
            <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-600"><HiOutlineExclamationTriangle className="h-6 w-6" aria-hidden /></span>
                <p className="text-[13px] font-semibold text-slate-800">{t('customizer_page_unavailable', 'This page could not be loaded')}</p>
                <p className="text-xs leading-relaxed text-slate-500">{pageError}</p>
                <button type="button" onClick={onRetryPage} className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 ${FOCUS}`}><HiOutlineArrowPath className="h-4 w-4" aria-hidden />{t('action_retry', 'Retry')}</button>
            </div>
        );
    } else if (addOpen) {
        body = <SectionPicker schema={schema} onPick={onAdd} onBack={onCloseAdd} />;
    } else {
        body = (
            <>
                {schemaError ? <p className="mx-2 mt-2 rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-800">{schemaError}</p> : null}
                <div className="min-h-0 flex-1 overflow-y-auto">
                    <SectionList
                        sections={sections}
                        schema={schema}
                        selectedId={selectedId}
                        selectedBlockId={selectedBlockId}
                        expanded={expanded}
                        onToggleExpanded={onToggleExpanded}
                        locale={locale}
                        defaultLocale={defaultLocale}
                        onSelect={onSelect}
                        onMove={onMove}
                        onReorder={onReorder}
                        onDuplicate={onDuplicate}
                        onRemove={onRemove}
                        onToggleVisible={onToggleVisible}
                        onSelectBlock={onSelectBlock}
                        onAddBlock={onAddBlock}
                        onMoveBlock={onMoveBlock}
                        onReorderBlock={onReorderBlock}
                        onDuplicateBlock={onDuplicateBlock}
                        onRemoveBlock={onRemoveBlock}
                        onToggleBlockHidden={onToggleBlockHidden}
                        onAdd={onOpenAdd}
                    />
                </div>
                <div className="shrink-0 border-t border-slate-200 p-2">
                    <button type="button" onClick={onOpenAdd} className={`flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-brand/40 bg-brand-light/30 px-3 py-2 text-[13px] font-semibold text-brand transition hover:border-brand hover:bg-brand-light/60 ${FOCUS}`}>
                        <HiOutlinePlus className="h-4 w-4" aria-hidden />
                        {t('customizer_add_section', 'Add section')}
                    </button>
                </div>
            </>
        );
    }

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="flex shrink-0 border-b border-slate-200 bg-white" role="tablist">
                {tabBtn('sections', HiOutlineSquares2X2, t('customizer_tab_sections', 'Sections'))}
                {tabBtn('theme', HiOutlineSwatch, t('customizer_tab_theme', 'Theme settings'))}
            </div>
            {body}
        </div>
    );
}
