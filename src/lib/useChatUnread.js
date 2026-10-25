import { useEffect, useState } from 'react';
import api from '../api/client';
import { getEcho } from './echo';
import { CHAT_ENABLED } from './features';

/** Fallback refresh when real-time (Pusher) is not configured, and only while the tab is visible. */
const POLL_MS = 60_000;

/**
 * One shared unread counter for every chat badge (header, sidebar): a single request per refresh,
 * however many components show the count.
 */
const store = { count: 0, listeners: new Set(), subscribers: 0, stop: null, userId: null };

function publish(count) {
    store.count = count;
    store.listeners.forEach((listener) => listener(count));
}

async function refresh() {
    try {
        const { data } = await api.get('/chat/unread-count');
        publish(data.unread || 0);
    } catch { /* keep the last known count */ }
}

function start(userId) {
    store.userId = userId ?? null;
    void refresh();
    const onChanged = () => { void refresh(); };
    window.addEventListener('chat:unread-changed', onChanged);
    const echo = getEcho();
    let channel = null;
    let timer = null;
    if (echo && store.userId) {
        channel = `App.Models.User.${store.userId}`;
        echo.private(channel).notification(onChanged);
    } else {
        timer = window.setInterval(() => { if (document.visibilityState === 'visible') void refresh(); }, POLL_MS);
    }
    return () => {
        window.removeEventListener('chat:unread-changed', onChanged);
        if (timer) window.clearInterval(timer);
        if (channel) { try { echo.leave(channel); } catch { /* noop */ } }
    };
}

/**
 * Live total of unread chat messages for the chat badge. Only subscribed components with `enabled`
 * (the chat link is visible) trigger requests; pass the signed-in user's id so the real-time
 * channel can be joined without another /auth/me request.
 */
export function useChatUnread({ userId = null, enabled = true } = {}) {
    const [unread, setUnread] = useState(store.count);
    const active = CHAT_ENABLED && enabled;

    useEffect(() => {
        if (!active) return undefined;
        store.listeners.add(setUnread);
        store.subscribers += 1;
        if (store.subscribers === 1) store.stop = start(userId);
        else if (userId && !store.userId) store.userId = userId;
        setUnread(store.count);
        return () => {
            store.listeners.delete(setUnread);
            store.subscribers -= 1;
            if (store.subscribers === 0 && store.stop) { store.stop(); store.stop = null; }
        };
    }, [active, userId]);

    return active ? unread : 0;
}
