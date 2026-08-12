import api from '../../../api/client';

let queue = [];
let timer;
const sessionId = sessionStorage.getItem('sellchaze:community-session') || crypto.randomUUID();
sessionStorage.setItem('sellchaze:community-session', sessionId);

export function trackFeedEvent(postId, eventType, extra = {}) {
    queue.push({ event_uuid: crypto.randomUUID(), post_id: Number(postId), event_type: eventType, session_id: sessionId, occurred_at: new Date().toISOString(), ...extra });
    clearTimeout(timer);
    timer = setTimeout(flushFeedEvents, queue.length >= 20 ? 10 : 4000);
}

export async function flushFeedEvents() {
    if (!queue.length) return;
    const events = queue.splice(0, 100);
    try { await api.post('/feed/events', { events }); }
    catch { queue = [...events, ...queue].slice(-300); }
}

