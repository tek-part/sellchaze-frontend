import { setTokens } from '../api/client';

export const IMPERSONATION_BACKUP_ACCESS = 'sellchase_impersonation_backup_access_token';
export const IMPERSONATION_BACKUP_REFRESH = 'sellchase_impersonation_backup_refresh_token';

export function isImpersonating() {
    return Boolean(localStorage.getItem(IMPERSONATION_BACKUP_ACCESS));
}

/**
 * @param {{ access_token?: string; refresh_token?: string }} payload
 */
export function beginImpersonation(payload) {
    const access_token = payload?.access_token;
    const refresh_token = payload?.refresh_token;
    if (!access_token || !refresh_token) {
        return;
    }
    if (!isImpersonating()) {
        const curA = localStorage.getItem('sellchase_access_token');
        const curR = localStorage.getItem('sellchase_refresh_token');
        if (curA) {
            localStorage.setItem(IMPERSONATION_BACKUP_ACCESS, curA);
        }
        if (curR) {
            localStorage.setItem(IMPERSONATION_BACKUP_REFRESH, curR);
        }
    }
    setTokens({ access_token, refresh_token });
}

/**
 * Restore admin tokens. Returns false if no backup was stored.
 */
export function endImpersonation() {
    const a = localStorage.getItem(IMPERSONATION_BACKUP_ACCESS);
    const r = localStorage.getItem(IMPERSONATION_BACKUP_REFRESH);
    localStorage.removeItem(IMPERSONATION_BACKUP_ACCESS);
    localStorage.removeItem(IMPERSONATION_BACKUP_REFRESH);
    if (!a || !r) {
        localStorage.removeItem('sellchase_access_token');
        localStorage.removeItem('sellchase_refresh_token');
        return false;
    }
    setTokens({ access_token: a, refresh_token: r });
    return true;
}
