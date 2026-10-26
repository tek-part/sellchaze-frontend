import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { notify } from '../components/ui/notify';
import useStoreContext from './useStoreContext';

/** Structural equality on plain settings objects (arrays compared by value). */
function stableStringify(value) {
    return JSON.stringify(value, (_, v) => (v && typeof v === 'object' && !Array.isArray(v)
        ? Object.keys(v).sort().reduce((acc, k) => { acc[k] = v[k]; return acc; }, {})
        : v));
}

/** True when `current` differs from `initial`. */
export function useDirty(initial, current) {
    return useMemo(() => stableStringify(initial) !== stableStringify(current), [initial, current]);
}

const failureMessage = (failure) => Object.values(failure.response?.data?.errors || {}).flat().join(' ') || failure.response?.data?.message || failure.message;

/**
 * Multipart body for a partial store update: `_method=PUT` so file fields (logo/banner) ride
 * along; arrays go out as `key[]`, booleans as `1`/`0`, null as an empty string (Laravel's
 * ConvertEmptyStringsToNull turns it back into null).
 */
function storeFormData(values, files) {
    const fd = new FormData();
    fd.append('_method', 'PUT');
    Object.entries(values).forEach(([key, value]) => {
        if (value === undefined) return;
        if (Array.isArray(value)) {
            value.forEach((entry) => fd.append(`${key}[]`, String(entry)));
        } else if (typeof value === 'boolean') {
            fd.append(key, value ? '1' : '0');
        } else if (value === null) {
            fd.append(key, '');
        } else {
            fd.append(key, String(value));
        }
    });
    Object.entries(files).forEach(([key, file]) => {
        if (file instanceof Blob) fd.append(key, file);
    });
    return fd;
}

/**
 * Store settings for the current store scope (`apiBase` from the StoreLayout outlet context).
 *
 * Without `endpoint` it saves a partial set of fields on the store record itself:
 * `save(values, files, { silent })` PUTs only the given keys (the backend request uses
 * `sometimes` rules), updates the layout's store, toasts the outcome, fills `errors` with field
 * errors and rethrows on failure.
 *
 * With `endpoint` (e.g. `'seo-settings'`) it manages a settings resource under the store:
 * it loads `${apiBase}/${endpoint}` (when `enabled`) into `initial` / `draft`, `change(next)`
 * edits the draft and `save(body)` sends a JSON object (PUT) or a FormData (POST) and resolves
 * to `true`/`false`, reporting failures through `error` and success through `saved` instead of
 * toasts. A second save while one is running is ignored.
 *
 * @param {{ endpoint?: string, enabled?: boolean }} [options]
 */
export default function useStoreSettings({ endpoint, enabled = true } = {}) {
    const { t, i18n } = useTranslation();
    const ar = (i18n.language || '').startsWith('ar');
    const text = useCallback((arabic, english) => (ar ? arabic : english), [ar]);
    const { apiBase, setStore } = useStoreContext();
    const url = endpoint ? `${apiBase}/${endpoint}` : apiBase;

    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);
    const [initial, setInitial] = useState(null);
    const [draft, setDraft] = useState(null);
    const [loading, setLoading] = useState(Boolean(endpoint));
    const [reloadKey, setReloadKey] = useState(0);
    const working = useRef(false);

    useEffect(() => {
        if (!endpoint || !enabled) return undefined;
        let active = true;
        setLoading(true); setError(''); setSaved(false);
        api.get(url).then(({ data }) => {
            if (active) { setInitial(data.data); setDraft(data.data); }
        }).catch((failure) => { if (active) setError(failureMessage(failure)); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [url, endpoint, enabled, reloadKey]);

    const saveStore = useCallback(async (values = {}, files = {}, { silent = false } = {}) => {
        const fd = storeFormData(values, files);
        setSaving(true);
        setErrors({});
        try {
            const { data } = await api.post(url, fd);
            const next = data?.data ?? data;
            if (next && typeof setStore === 'function') setStore(next);
            if (!silent) notify.success(t('ui_changes_saved', 'Changes saved'));
            return next;
        } catch (e) {
            const fieldErrors = e.response?.data?.errors;
            if (fieldErrors && typeof fieldErrors === 'object') setErrors(fieldErrors);
            const first = fieldErrors ? Object.values(fieldErrors)?.[0]?.[0] : null;
            notify.error(t('ui_save_failed', 'Could not save changes'), first || e.response?.data?.message || e.message);
            throw e;
        } finally {
            setSaving(false);
        }
    }, [url, setStore, t]);

    const saveResource = useCallback(async (body) => {
        if (working.current) return false;
        working.current = true; setSaving(true); setError(''); setSaved(false);
        try {
            const { data } = body instanceof FormData ? await api.post(url, body) : await api.put(url, body);
            setInitial(data.data); setDraft(data.data); setSaved(true);
            if (data.store) setStore(data.store);
            return true;
        } catch (failure) { setError(failureMessage(failure)); return false; }
        finally { working.current = false; setSaving(false); }
    }, [url, setStore]);

    const change = useCallback((next) => { setSaved(false); setDraft(next); }, []);
    const reload = useCallback(() => setReloadKey((value) => value + 1), []);
    const clearErrors = useCallback(() => setErrors({}), []);

    return {
        save: endpoint ? saveResource : saveStore, saving, busy: saving, errors, clearErrors,
        initial, draft, change, loading, error, saved, reload, ar, text,
    };
}
