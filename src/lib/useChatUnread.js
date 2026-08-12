import { useCallback, useEffect, useState } from 'react';
import api from '../api/client';
import { getEcho } from './echo';
import { CHAT_ENABLED } from './features';

/**
 * Live total of unread chat messages, for the badge on the chat button.
 * Refreshes on mount, on a real-time message notification (user channel),
 * and whenever the chat marks something read (window 'chat:unread-changed').
 */
export function useChatUnread() {
    const [unread, setUnread] = useState(0);

    const refresh = useCallback(async () => {
        try {
            const { data } = await api.get('/chat/unread-count');
            setUnread(data.unread || 0);
        } catch { /* noop */ }
    }, []);

    useEffect(() => {
        // Chat backend not implemented yet — don't poll (avoids console 404 spam).
        if (!CHAT_ENABLED) return undefined;

        let alive = true;
        refresh();

        const onEvt = () => { if (alive) refresh(); };
        window.addEventListener('chat:unread-changed', onEvt);

        (async () => {
            try {
                const { data } = await api.get('/auth/me');
                const id = (data.data || data.user || data)?.id;
                const echo = getEcho();
                if (echo && id) {
                    echo.private(`App.Models.User.${id}`).notification(() => { if (alive) refresh(); });
                }
            } catch { /* noop */ }
        })();

        return () => {
            alive = false;
            window.removeEventListener('chat:unread-changed', onEvt);
        };
    }, [refresh]);

    return unread;
}
