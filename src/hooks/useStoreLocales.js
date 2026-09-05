import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/client';
import useStoreScope from './useStoreScope';

export const FALLBACK_LOCALES = ['ar', 'en'];
export const FALLBACK_DEFAULT_LOCALE = 'ar';

/**
 * Module-level cache so the many editors that need the store's language list (products,
 * categories, menus, theme settings, content pages) share ONE `GET {apiBase}` per session.
 * Keyed by apiBase; holds the in-flight promise so concurrent mounts also dedupe.
 */
const cache = new Map();

function normalise(store) {
    const supported = Array.isArray(store?.supported_locales)
        ? store.supported_locales.map((l) => String(l).toLowerCase()).filter(Boolean)
        : [];
    const def = typeof store?.default_locale === 'string' && store.default_locale
        ? store.default_locale.toLowerCase()
        : null;
    const locales = [...new Set([...(def ? [def] : []), ...supported])];
    if (locales.length === 0) return { locales: FALLBACK_LOCALES, defaultLocale: FALLBACK_DEFAULT_LOCALE };
    return { locales, defaultLocale: def && locales.includes(def) ? def : locales[0] };
}

function fetchLocales(apiBase) {
    if (!cache.has(apiBase)) {
        const promise = api
            .get(apiBase)
            .then(({ data }) => normalise(data?.data ?? data))
            .catch(() => {
                cache.delete(apiBase); // let a later mount retry after a transient failure
                return { locales: FALLBACK_LOCALES, defaultLocale: FALLBACK_DEFAULT_LOCALE };
            })
            .then((value) => {
                if (cache.has(apiBase)) cache.set(apiBase, value);
                return value;
            });
        cache.set(apiBase, promise);
    }
    return cache.get(apiBase);
}

/** Invalidate the cache (e.g. after the localization settings page saves). */
export function clearStoreLocalesCache(apiBase) {
    if (apiBase) cache.delete(apiBase);
    else cache.clear();
}

/**
 * The store's content languages: `{ locales, defaultLocale, loading }`.
 *
 * Source order:
 *   1. `useOutletContext().store` — provided by `StoreLayout` on every `/store/*` page
 *      (`default_locale`, `supported_locales`), so no extra request there.
 *   2. `GET {apiBase}` (cached per session) — for pages outside the layout such as the product
 *      and category forms, which pass `apiBase: '/my-store'` explicitly because their own
 *      `:id` param would otherwise be mistaken for an admin store id by `useStoreScope`.
 *   3. `['ar', 'en']` / `'ar'` — when the user has no store (e.g. an admin without one) or the
 *      request fails.
 */
export default function useStoreLocales(options = {}) {
    const outlet = useOutletContext();
    const scope = useStoreScope();
    const apiBase = options.apiBase || scope.apiBase;

    const fromLayout = useMemo(() => {
        const store = outlet?.store;
        if (!store || typeof store !== 'object') return null;
        if (!store.default_locale && !Array.isArray(store.supported_locales)) return null;
        return normalise(store);
    }, [outlet?.store]);

    // Owner scope with a user who is not a store owner (admin without a store): skip the request.
    const roles = Array.isArray(outlet?.me?.roles) ? outlet.me.roles : null;
    const ownerScope = apiBase === '/my-store';
    const isOwnerUser = roles ? roles.some((r) => r === 'Merchant' || r === 'Supplier') : true;
    const shouldFetch = !fromLayout && options.enabled !== false && (!ownerScope || isOwnerUser);

    const cached = shouldFetch ? cache.get(apiBase) : undefined;
    const [fetched, setFetched] = useState(cached && typeof cached.then !== 'function' ? cached : null);
    const [loading, setLoading] = useState(shouldFetch && !(cached && typeof cached.then !== 'function'));

    useEffect(() => {
        if (!shouldFetch) {
            setLoading(false);
            return undefined;
        }
        let active = true;
        setLoading(true);
        Promise.resolve(fetchLocales(apiBase)).then((value) => {
            if (!active) return;
            setFetched(value);
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [apiBase, shouldFetch]);

    if (fromLayout) return { locales: fromLayout.locales, defaultLocale: fromLayout.defaultLocale, loading: false };
    if (fetched) return { locales: fetched.locales, defaultLocale: fetched.defaultLocale, loading: false };
    return { locales: FALLBACK_LOCALES, defaultLocale: FALLBACK_DEFAULT_LOCALE, loading };
}
