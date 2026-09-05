import { useOutletContext } from 'react-router-dom';

/**
 * @typedef {Object} StoreOutletContext
 * @property {object|null} me                 Authenticated user (from AppLayout).
 * @property {boolean} isAdmin
 * @property {boolean} isSupplier
 * @property {string[]} permissions
 * @property {object|null} store              StoreResource payload, loaded by StoreLayout.
 * @property {(store: object) => void} setStore
 * @property {() => Promise<object>} refreshStore
 * @property {ReturnType<import('../lib/storeAccess').storeAccess>} access
 * @property {string} apiBase                 `/my-store` or `/stores/:id`.
 * @property {string} uiBase                  `/store` or `/stores/:id`.
 * @property {string|null} storeId
 * @property {boolean} isAdminScope
 * @property {{ supported: string[], default: string }} locales
 */

/**
 * Typed access to the StoreLayout outlet context. Pages rendered outside the
 * layout get an empty object so destructuring never throws.
 *
 * @returns {StoreOutletContext}
 */
export default function useStoreContext() {
    return useOutletContext() ?? {};
}
