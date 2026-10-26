/** Pure helpers for the WhatsApp (Wavex) connect page: session payload parsing and error copy. */
export const QR_REFRESH_SEC = 30;

export function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

export function wavexErrorMessage(data, t) {
    if (!data || data.ok !== false) {
        return '';
    }
    const d = data.data;
    if (typeof d === 'object' && d !== null && d.code === 'qr_not_available') {
        return d.message ? String(d.message) : t('wavex_qr_not_ready');
    }
    const msg =
        (typeof d === 'object' && d !== null && (d.message || d.error)) ||
        (typeof d === 'string' ? d : null);
    const rec =
        typeof d === 'object' && d !== null && d.details && typeof d.details.recommendation === 'string'
            ? d.details.recommendation
            : '';
    const primary = msg
        ? String(msg)
        : data.upstream_status === 404
          ? t('wavex_session_upstream_404')
          : data.upstream_status === 401
            ? t('wavex_session_upstream_401')
            : t('wavex_session_upstream_generic', { code: data.upstream_status ?? '—' });
    return rec ? `${primary}\n\n${rec}` : primary;
}

export function normalizeProfileImageUrl(raw) {
    if (typeof raw !== 'string') {
        return null;
    }
    const u = raw.trim();
    if (!u) {
        return null;
    }
    if (u.startsWith('data:')) {
        return u;
    }
    if (u.startsWith('//')) {
        return `https:${u}`;
    }
    if (u.startsWith('http://') || u.startsWith('https://')) {
        return u;
    }
    return null;
}

export function pickWaDisplay(info, profile) {
    const p = profile && typeof profile === 'object' ? profile : null;
    const inner = p?.me && typeof p.me === 'object' ? p.me : null;
    const im = info?.me && typeof info.me === 'object' ? info.me : null;
    const pushName = String(p?.pushName || inner?.name || im?.pushName || im?.name || '').trim();
    const waId = String(p?.id || inner?.id || im?.id || '').trim();
    const rawPic =
        p?.profilePictureUrl ||
        p?.profilePicUrl ||
        p?.picture ||
        p?.avatar ||
        p?.photo ||
        p?.url ||
        inner?.profilePictureUrl ||
        inner?.url ||
        im?.profilePictureUrl ||
        im?.url ||
        null;
    const pic = normalizeProfileImageUrl(rawPic);
    return { pushName, waId, pic };
}

export function isSessionWorkingPayload(data) {
    if (!data || typeof data !== 'object') {
        return false;
    }
    return Boolean(data.ok && String(data.info?.status ?? '').toUpperCase() === 'WORKING');
}

export function parseSessionBundle(data) {
    if (!data || typeof data !== 'object') {
        return null;
    }
    return {
        info: data.info ?? null,
        profile: data.profile ?? null,
        instance_id: data.instance_id ?? null,
        base_url: data.base_url ?? null,
    };
}
