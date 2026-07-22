import { useEffect, useState } from 'react';
import api from '../api/client';

/** Client ID for Google Sign-In: VITE_GOOGLE_CLIENT_ID or GET /auth/google-config (Laravel DB or .env). */
export function useGoogleOAuthClientId() {
    const envId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
    const [clientId, setClientId] = useState(envId);
    const [resolved, setResolved] = useState(Boolean(envId));

    useEffect(() => {
        let cancelled = false;
        api.get('/auth/google-config')
            .then(({ data }) => {
                if (cancelled) {
                    return;
                }
                const fromApi = typeof data?.client_id === 'string' ? data.client_id.trim() : '';
                if (fromApi) {
                    setClientId(fromApi);
                } else if (!envId) {
                    setClientId('');
                }
            })
            .catch(() => {
                if (cancelled) {
                    return;
                }
                if (!envId) {
                    setClientId('');
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setResolved(true);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [envId]);

    return { clientId, resolved };
}
