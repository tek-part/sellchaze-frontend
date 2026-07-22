import { useCallback, useState } from 'react';

export function useBrowserNotificationPermission() {
    const [permission, setPermission] = useState(() => {
        if (typeof window === 'undefined' || !('Notification' in window)) {
            return 'unsupported';
        }
        return Notification.permission;
    });

    const supported = typeof window !== 'undefined' && 'Notification' in window;

    const requestPermission = useCallback(async () => {
        if (!supported) {
            return 'unsupported';
        }
        try {
            const p = await Notification.requestPermission();
            setPermission(p);
            return p;
        } catch {
            setPermission('denied');
            return 'denied';
        }
    }, [supported]);

    const notify = useCallback(
        (title, options = {}) => {
            if (!supported || permission !== 'granted') {
                return;
            }
            try {
                new Notification(title, { icon: '/icon.png', ...options });
            } catch {
                /* ignore */
            }
        },
        [supported, permission],
    );

    return { permission, supported, requestPermission, notify };
}
