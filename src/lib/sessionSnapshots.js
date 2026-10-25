/**
 * Last-known account (`/auth/me`) and owner store (`/my-store`) snapshots, so a reload paints the
 * workspace at once while fresh copies load in the background (stale-while-revalidate) instead of
 * a full-screen loader per request. Interface only — the API still authorizes every call.
 *
 * Cleared whenever the signed-in identity changes (`setTokens` on login/impersonation and
 * `clearTokens` on logout/expiry), so one account's snapshot never paints for another.
 */
const ME_KEY = 'sellchase_me_snapshot';
const STORE_KEY = 'sellchase_store_snapshot';

function storage() {
    try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
}

function read(key) {
    try {
        const raw = storage()?.getItem(key);
        const value = raw ? JSON.parse(raw) : null;
        return value && typeof value === 'object' ? value : null;
    } catch {
        return null;
    }
}

function write(key, value) {
    try { storage()?.setItem(key, JSON.stringify(value)); } catch { /* storage full or disabled */ }
}

export function readMeSnapshot() {
    const me = read(ME_KEY);
    return me && me.id != null ? me : null;
}

export function writeMeSnapshot(me) {
    if (me && me.id != null) write(ME_KEY, me);
}

export function readStoreSnapshot(userId) {
    const entry = read(STORE_KEY);
    return userId != null && entry && String(entry.userId) === String(userId) && entry.store && typeof entry.store === 'object' ? entry.store : null;
}

export function writeStoreSnapshot(userId, store) {
    if (userId != null && store && typeof store === 'object') write(STORE_KEY, { userId, store });
}

export function clearSessionSnapshots() {
    try {
        storage()?.removeItem(ME_KEY);
        storage()?.removeItem(STORE_KEY);
    } catch { /* storage disabled */ }
}
