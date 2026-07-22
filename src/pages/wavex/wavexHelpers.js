/** Normalize Wawp list payloads (chats, groups, etc.) */
export function extractApiList(payload) {
    const d = payload?.data;
    if (Array.isArray(d)) {
        return d;
    }
    if (d?.data && Array.isArray(d.data)) {
        return d.data;
    }
    if (d?.chats && Array.isArray(d.chats)) {
        return d.chats;
    }
    if (d?.groups && Array.isArray(d.groups)) {
        return d.groups;
    }
    if (d?.items && Array.isArray(d.items)) {
        return d.items;
    }
    return [];
}

export function chatIdFrom(item) {
    return String(item?.id ?? item?.chat_id ?? item?.jid ?? item?.chatId ?? '').trim();
}

/** Wawp file URLs require JWT; browser img/video cannot send it — use Laravel proxy. */
export function wavexMediaNeedsProxy(url) {
    if (!url || typeof url !== 'string') {
        return false;
    }
    const u = url.toLowerCase();
    // Proxy all external media: Wawp files, WhatsApp CDN, and any non-local URL
    if (u.includes('wawp') || u.includes('/api/files/')) return true;
    if (u.includes('whatsapp.net') || u.includes('whatsapp.com')) return true;
    if (u.includes('mmg-fna') || u.includes('mmg.whatsapp')) return true;
    // Any absolute URL that's not our own domain needs proxy
    if (u.startsWith('http') && !u.includes('localhost') && !u.includes('127.0.0.1')) return true;
    return false;
}

/** Show human-friendly id without WhatsApp domain suffix. */
export function presentChatId(rawId) {
    const id = String(rawId ?? '').trim();
    if (!id) {
        return '';
    }
    const at = id.indexOf('@');
    return at > 0 ? id.slice(0, at) : id;
}

export function chatLabel(item) {
    const id = chatIdFrom(item);
    const label =
        item?.name ??
        item?.subject ??
        item?.pushName ??
        item?.notify ??
        item?.verifiedName ??
        (id ? id : null);
    return label ?? '—';
}

export function groupIdFrom(item) {
    const raw =
        item?.JID ??
        item?.id?._serialized ??
        item?._serialized ??
        item?._data?.id?._serialized ??
        item?._data?.id ??
        item?.chatId ??
        item?.groupId ??
        item?.group_id ??
        item?.jid ??
        item?.id;
    return String(raw ?? '').trim();
}

export function groupLabel(item) {
    const gid = groupIdFrom(item);
    const label =
        item?.Name ??
        item?.name ??
        item?.subject ??
        item?.formattedTitle ??
        item?.Topic ??
        item?.groupMetadata?.subject ??
        item?._data?.name ??
        item?._data?.formattedTitle ??
        (gid ? gid : null);
    return label ?? '—';
}

/** Milliseconds for sorting chats by last activity (best-effort across Wawp shapes). */
export function chatLastActivityMs(c) {
    const lm = c?.lastMessage ?? c?.last_message ?? c?.conversation ?? c?.lastMsg;
    let t =
        lm?.t ??
        lm?.timestamp ??
        c?.conversationTimestamp ??
        c?.t ??
        c?.timestamp ??
        c?.lastMessageTimestamp ??
        c?.updatedAt ??
        c?.updated_at;
    if (t == null && lm && typeof lm === 'object') {
        t = lm.messageTimestamp ?? lm.time;
    }
    if (typeof t === 'string' && /^\d+(\.\d+)?$/.test(t)) {
        t = Number(t);
    }
    if (typeof t !== 'number' || Number.isNaN(t)) {
        return 0;
    }
    return t < 1e12 ? Math.round(t * 1000) : Math.round(t);
}

/** Unread badge only when Wawp includes a count; no local fallback yet. */
export function unreadCountFromChat(c) {
    const raw =
        c?.unreadCount ??
        c?.unread_count ??
        c?.unread ??
        c?.unreadMessages ??
        c?.unread_messages ??
        c?.conversationUnreadCount;
    const n = typeof raw === 'string' ? parseInt(raw, 10) : Number(raw);
    if (!Number.isFinite(n) || n <= 0) {
        return 0;
    }
    return Math.min(99, Math.floor(n));
}

export function mergeChatsById(existing, incoming) {
    const map = new Map();
    for (const x of existing) {
        const id = chatIdFrom(x);
        if (id) {
            map.set(id, x);
        }
    }
    for (const x of incoming) {
        const id = chatIdFrom(x);
        if (id) {
            map.set(id, x);
        }
    }
    return [...map.values()];
}

export function sortChatsByActivity(list) {
    return [...list].sort((a, b) => chatLastActivityMs(b) - chatLastActivityMs(a));
}
