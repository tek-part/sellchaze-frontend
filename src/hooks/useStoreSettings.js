import { useCallback, useMemo, useState } from 'react';
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

/**
 * Saves a partial set of store settings. Builds multipart FormData with
 * `_method=PUT` so file fields (logo/banner) ride along; arrays go out as
 * `key[]`, booleans as `1`/`0`, null as an empty string (Laravel's
 * ConvertEmptyStringsToNull turns it back into null). The backend request
 * uses `sometimes` rules and StoreService::update touches only present keys,
 * so each settings page can save just its own slice.
 */
export default function useStoreSettings() {
    const { t } = useTranslation();
    const { apiBase, setStore } = useStoreContext();
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const save = useCallback(async (values = {}, files = {}, { silent = false } = {}) => {
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

        setSaving(true);
        setErrors({});
        try {
            const { data } = await api.post(apiBase, fd);
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
    }, [apiBase, setStore, t]);

    const clearErrors = useCallback(() => setErrors({}), []);

    return { save, saving, errors, clearErrors };
}
