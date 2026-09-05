import { useTranslation } from 'react-i18next';
import { HiOutlineArrowLeft, HiOutlineDocumentDuplicate, HiOutlineEye, HiOutlineEyeSlash, HiOutlineTrash } from 'react-icons/hi2';
import { sectionIcon } from './sectionIcons';
import SettingsForm from './SettingsForm';

/** Settings view for the selected section: header with actions + the schema-driven form. */
export default function SectionSettingsPanel({ section, schema, onBack, onChange, onDuplicate, onRemove, onToggleVisible, locales, defaultLocale, editLocale, viewport, apiBase }) {
    const { t } = useTranslation();
    if (!section) return null;
    const Icon = sectionIcon(schema);
    const hidden = section.is_visible === false;
    const readOnly = !!section.reusable_section_id;

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2.5">
                <button type="button" onClick={onBack} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800" aria-label={t('customizer_back', 'Back')}>
                    <HiOutlineArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
                </button>
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand text-white"><Icon className="h-4 w-4" aria-hidden /></span>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{schema?.label || section.type}</p>
                    {schema?.description ? <p className="truncate text-[11px] text-slate-400">{schema.description}</p> : null}
                </div>
                <div className="flex shrink-0 items-center text-slate-400">
                    <button type="button" onClick={onToggleVisible} className="rounded-md p-1.5 hover:bg-slate-100 hover:text-slate-700" title={hidden ? t('customizer_show_section', 'Show section') : t('customizer_hide_section', 'Hide section')} aria-label={hidden ? t('customizer_show_section', 'Show section') : t('customizer_hide_section', 'Hide section')}>
                        {hidden ? <HiOutlineEyeSlash className="h-4 w-4" aria-hidden /> : <HiOutlineEye className="h-4 w-4" aria-hidden />}
                    </button>
                    <button type="button" onClick={onDuplicate} className="rounded-md p-1.5 hover:bg-slate-100 hover:text-slate-700" title={t('customizer_duplicate', 'Duplicate')} aria-label={t('customizer_duplicate', 'Duplicate')}><HiOutlineDocumentDuplicate className="h-4 w-4" aria-hidden /></button>
                    <button type="button" onClick={onRemove} className="rounded-md p-1.5 hover:bg-red-50 hover:text-red-600" title={t('customizer_remove', 'Remove')} aria-label={t('customizer_remove', 'Remove')}><HiOutlineTrash className="h-4 w-4" aria-hidden /></button>
                </div>
            </div>
            {hidden ? <p className="mx-3 mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-800">{t('customizer_hidden_hint', 'This section is hidden from visitors.')}</p> : null}
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                {readOnly ? (
                    <p className="rounded-xl bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">{t('customizer_reusable_hint', 'This is a reusable section; edit it from the Pages area.')}</p>
                ) : (
                    <SettingsForm
                        fields={schema?.settings || []}
                        values={section.settings || {}}
                        onChange={onChange}
                        locales={locales}
                        defaultLocale={defaultLocale}
                        editLocale={editLocale}
                        viewport={viewport}
                        apiBase={apiBase}
                    />
                )}
            </div>
        </div>
    );
}
