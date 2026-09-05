import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineArrowPath } from 'react-icons/hi2';
import api from '../api/client';
import { notify } from '../components/ui/notify';
import useStoreContext from '../hooks/useStoreContext';

/**
 * `/customize` → the active theme's settings editor. With no active theme the
 * user is sent to the themes list with a hint instead.
 */
export default function StoreCustomizeRedirect() {
    const { t } = useTranslation();
    const { apiBase, uiBase } = useStoreContext();
    const [target, setTarget] = useState(null);

    useEffect(() => {
        let cancelled = false;
        api.get(`${apiBase}/themes`)
            .then(({ data }) => {
                if (cancelled) return;
                const activeId = data?.active_theme_id ?? null;
                if (activeId) {
                    setTarget(`${uiBase}/themes/${activeId}/settings`);
                    return;
                }
                notify.info(t('store_customize_no_theme', 'Activate a theme first'), t('store_customize_no_theme_hint', 'Customize opens the editor for your active theme.'));
                setTarget(`${uiBase}/themes`);
            })
            .catch((e) => {
                if (cancelled) return;
                notify.error(t('store_customize_failed', 'Could not open the theme editor'), e.response?.data?.message || e.message);
                setTarget(`${uiBase}/themes`);
            });
        return () => { cancelled = true; };
    }, [apiBase, uiBase, t]);

    if (target) return <Navigate to={target} replace />;

    return (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200/80 bg-white py-20 shadow-card">
            <HiOutlineArrowPath className="h-7 w-7 animate-spin text-brand" aria-hidden />
        </div>
    );
}
