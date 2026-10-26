import { useTranslation } from 'react-i18next';

/** Drag handle that is also keyboard operable: arrow keys, Home and End move the item. */
export default function SortHandle({ label, hintId, disabled, ...handle }) {
    const { i18n } = useTranslation();
    const ar = i18n.language.startsWith('ar');
    return <button type="button" disabled={disabled} className="cursor-grab rounded-lg border border-slate-200 px-2 py-2 text-sm leading-none text-slate-600 active:cursor-grabbing disabled:opacity-40" aria-label={`${ar ? 'إعادة ترتيب' : 'Reorder'} ${label}`} aria-describedby={hintId} {...(disabled ? {} : handle)}>
        <span aria-hidden="true">⋮⋮</span>
    </button>;
}

export function SortHint({ id, message }) {
    const { i18n } = useTranslation();
    const ar = i18n.language.startsWith('ar');
    return <>
        <p id={id} className="sr-only">{ar ? 'اسحب المقبض، أو ركّز عليه واستخدم الأسهم لأعلى ولأسفل وHome وEnd لتغيير الترتيب.' : 'Drag the handle, or focus it and use the Up and Down arrows, Home and End to change the order.'}</p>
        <p className="sr-only" role="status" aria-live="polite">{message}</p>
    </>;
}
