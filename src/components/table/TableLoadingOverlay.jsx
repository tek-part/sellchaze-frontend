import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Absolute overlay inside a parent with `position: relative`.
 *
 * The spinner is intentionally DELAYED: fast loads (the common case) finish before
 * `delay` elapses and never flash a spinner — the page's container cascade reveals the
 * table and the data is simply there. Only genuinely slow loads surface feedback, and it
 * fades in softly (via `.sc-anim-fade`) rather than popping. This removes the "spinner
 * flicker that breaks the layout" without leaving slow requests without any feedback.
 */
export default function TableLoadingOverlay({ show, className = '', delay = 400 }) {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!show) {
            setVisible(false);
            return undefined;
        }
        const id = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(id);
    }, [show, delay]);

    if (!show || !visible) {
        return null;
    }

    return (
        <div
            className={`sc-anim-fade absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/75 backdrop-blur-[2px] ${className}`}
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            <div
                className="h-10 w-10 animate-spin rounded-full border-2 border-brand border-t-transparent"
                aria-hidden
            />
            <span className="text-sm font-medium text-slate-600">{t('table_loading')}</span>
        </div>
    );
}
