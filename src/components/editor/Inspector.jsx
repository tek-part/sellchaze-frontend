import { useTranslation } from 'react-i18next';
import { HiOutlineCursorArrowRays, HiOutlineSwatch } from 'react-icons/hi2';
import SectionSettingsPanel from '../customizer/SectionSettingsPanel';
import SettingsForm from '../customizer/SettingsForm';
import { groupIcon } from '../customizer/ThemeSettingsPanel';

function EmptyState({ Icon, title, body }) {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400"><Icon className="h-7 w-7" aria-hidden /></span>
            <p className="text-[13px] font-semibold text-slate-800">{title}</p>
            <p className="text-xs leading-relaxed text-slate-500">{body}</p>
        </div>
    );
}

/**
 * Right panel of the editor. Shows the selected section's settings — or the selected block's
 * (Sections tab) — or the selected theme settings group (Theme settings tab); otherwise an
 * empty-state hint.
 */
export default function Inspector({
    tab,
    section, sectionSchema, onCloseSection, onSectionChange, onDuplicate, onRemove, onToggleVisible,
    selectedBlockId, onSelectBlock, onBlockChange, onBlockToggleHidden, onBlockRemove,
    group, themeValues, onThemeChange,
    locales, defaultLocale, editLocale, viewport, apiBase,
}) {
    const { t } = useTranslation();

    if (tab === 'theme') {
        if (!group) {
            return <EmptyState Icon={HiOutlineSwatch} title={t('editor_theme_empty_title', 'Select a settings group')} body={t('editor_theme_empty_body', 'Choose a group from the Theme settings tab to edit colours, typography and more.')} />;
        }
        const Icon = groupIcon(group);
        const fields = group.fields || [];
        return (
            <div className="flex h-full min-h-0 flex-col">
                <div className="flex h-11 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-brand text-white"><Icon className="h-4 w-4" aria-hidden /></span>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-slate-900">{group.label || group.id}</p>
                        <p className="truncate text-[11px] text-slate-400">{t('editor_settings_count', { count: fields.length, defaultValue: '{{count}} settings' })}</p>
                    </div>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                    <SettingsForm
                        fields={fields}
                        values={themeValues || {}}
                        onChange={onThemeChange}
                        locales={locales}
                        defaultLocale={defaultLocale}
                        editLocale={editLocale}
                        viewport={viewport}
                        apiBase={apiBase}
                    />
                </div>
            </div>
        );
    }

    if (!section) {
        return <EmptyState Icon={HiOutlineCursorArrowRays} title={t('editor_empty_title', 'Select a section to edit')} body={t('editor_empty_body', 'Pick a section from the list or click one in the preview. Its settings will show up here.')} />;
    }

    return (
        <SectionSettingsPanel
            section={section}
            schema={sectionSchema}
            onClose={onCloseSection}
            onChange={onSectionChange}
            onDuplicate={onDuplicate}
            onRemove={onRemove}
            onToggleVisible={onToggleVisible}
            selectedBlockId={selectedBlockId}
            onSelectBlock={onSelectBlock}
            onBlockChange={onBlockChange}
            onBlockToggleHidden={onBlockToggleHidden}
            onBlockRemove={onBlockRemove}
            locales={locales}
            defaultLocale={defaultLocale}
            editLocale={editLocale}
            viewport={viewport}
            apiBase={apiBase}
        />
    );
}
