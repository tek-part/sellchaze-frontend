import { useCallback, useEffect, useState } from 'react';
import api from '../../api/client';

/** Keep the short-lived owner capability in memory, scoped to this store and theme. */
export default function useCustomizerPreview(apiBase, themeId, localBase = '', storeId = '') {
    const [attempt, setAttempt] = useState(0);
    const [result, setResult] = useState(null);
    const scope = `${apiBase}:${storeId}:${themeId}:${attempt}`;
    const reload = useCallback(() => setAttempt((value) => value + 1), []);

    useEffect(() => {
        if (localBase || !apiBase || !themeId) return undefined;
        let active = true;
        let timer;
        api.post(`${apiBase}/themes/preview`, { theme_id: themeId }).then(({ data }) => {
            if (!active) return;
            const url = new URL(data?.preview_url);
            if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || !url.searchParams.get('__preview')) {
                throw new Error('Invalid preview URL');
            }
            setResult({ scope, url: url.toString(), error: false });
            const ttl = Number(data?.expires_in);
            // Renew before expiry so a long editing session can keep changing locale/page.
            const refreshSeconds = Number.isFinite(ttl) && ttl > 0 ? Math.max(1, ttl - 30) : 1770;
            timer = window.setTimeout(reload, Math.min(refreshSeconds, 1770) * 1000);
        }).catch(() => {
            // Do not render server errors: an exception can contain the signed URL.
            if (active) setResult({ scope, url: '', error: true });
        });
        return () => { active = false; window.clearTimeout(timer); };
    }, [apiBase, themeId, localBase, scope, reload]);

    const current = result?.scope === scope ? result : null;
    return {
        url: localBase || current?.url || '',
        loading: !localBase && !current,
        error: !localBase && !!current?.error,
        reload,
    };
}
