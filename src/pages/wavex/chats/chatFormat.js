/** Display helpers for the WhatsApp (Wavex) inbox: initials, previews, times and media kinds. */
export function initials(name) {
    if (!name || name === '—') {
        return '?';
    }
    const parts = String(name)
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((s) => s[0])
        .filter(Boolean);
    return parts.join('').toUpperCase().slice(0, 2) || '?';
}

export function previewFromChat(c) {
    const lm = c?.lastMessage ?? c?.last_message ?? c?.conversation;
    if (!lm) {
        return '';
    }
    const t = lm.body ?? lm.text ?? lm.message ?? (typeof lm === 'string' ? lm : '');
    return String(t).slice(0, 80);
}

export function formatMsgTime(iso) {
    if (!iso) {
        return '';
    }
    try {
        return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } catch {
        return '';
    }
}

export function normalizeMediaKind(msg) {
    const type = String(msg?.type || '').toLowerCase();
    const mime = String(msg?.mime || '').toLowerCase();
    const thumb = String(msg?.media_thumb || '');
    if (type.includes('image') || mime.startsWith('image/')) return 'image';
    if (type.includes('video') || mime.startsWith('video/')) return 'video';
    if (type.includes('audio') || type.includes('voice') || mime.startsWith('audio/')) return 'audio';
    if (type.includes('document') || type.includes('file') || mime !== '') return 'file';
    if (thumb.startsWith('data:image')) return 'image';
    return '';
}
