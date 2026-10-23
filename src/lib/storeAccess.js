/**
 * Type-based store access. A Merchant OWNS exactly one store and
 * sees its full dashboard by virtue of their account type — no per-feature
 * permission needed. Granular store.* permissions still apply to their
 * employees and to admin-internal users (who are not owners themselves).
 *
 * Shared by the global SidebarNav (which decides whether to show the store
 * section at all) and StoreLayout / StoreSidebar (which gate each item).
 */
export function storeAccess(roles = [], permissions = []) {
    const can = (p) => permissions.includes(p);
    const manager = roles.includes('StoreManager');
    const isStoreOwner = Array.isArray(roles) && roles.includes('Merchant');
    const canStoreView = isStoreOwner || can('store.view');
    const canStoreProducts = isStoreOwner || can('store.products.manage');
    const canStoreCategories = isStoreOwner || can('store.categories.manage');
    const canStoreOrders = isStoreOwner || can('store.orders.manage');
    const canStoreCoupons = isStoreOwner || can('store.coupons.manage');
    const canStoreReviews = isStoreOwner || can('store.reviews.manage');
    const canStoreAnalytics = isStoreOwner || can('store.analytics.view');
    const canStoreThemes = isStoreOwner || can('store.themes.manage');
    const canStorePages = isStoreOwner || can('store.pages.manage');
    const canStoreMenus = isStoreOwner || can('store.menus.manage') || (manager && can('store.themes.manage'));
    const canStoreSettings = isStoreOwner || can('store.settings.manage');
    const canStorePayments = isStoreOwner || can('store.settings.manage');
    const storeMyGroup = canStoreSettings || canStorePayments || canStoreThemes || canStorePages || canStoreMenus;
    const storeCatalogGroup = canStoreProducts || canStoreCategories;
    const storeSalesGroup = canStoreOrders || canStoreCoupons;
    const hasStoreAccess = canStoreView || storeMyGroup || storeCatalogGroup
        || storeSalesGroup || canStoreReviews || canStoreAnalytics;

    return {
        isStoreOwner,
        canStoreManagers: isStoreOwner,
        canStoreView,
        canStoreProducts,
        canStoreInventory: can('products-list') || (manager && can('store.products.manage')),
        canStoreCategories,
        canStoreOrders,
        canStoreCoupons,
        canStoreReviews,
        canStoreAnalytics,
        canStoreThemes,
        canStorePages,
        canStoreMenus,
        canStoreSettings,
        canStoreHeadCode: isStoreOwner || can('stores-edit'),
        canStoreWebhooks: isStoreOwner || can('stores-edit'),
        canStorePublicApi: isStoreOwner || can('stores-edit'),
        canStorePayments,
        storeMyGroup,
        storeCatalogGroup,
        storeSalesGroup,
        hasStoreAccess,
    };
}

/**
 * Every flag switched on — the admin console (`/stores/:id/*`, gated by
 * `stores-edit`) manages any store in full, regardless of store.* grants.
 */
export function fullStoreAccess() {
    const all = storeAccess(['Merchant'], []);
    return { ...all, canStoreInventory: true, canStoreManagers: false, isStoreOwner: false };
}

export default storeAccess;

/** UI aliases stay inside store layouts; account/API permissions are never expanded. */
export function storeUiPermissions(permissions = [], roles = []) {
    if (!roles.includes('StoreManager')) return [...permissions];
    const result = new Set(permissions);
    if (result.has('store.products.manage')) {
        for (const action of ['list', 'create', 'edit', 'delete']) result.add(`products-${action}`);
        result.add('categories-list');
    }
    if (result.has('store.categories.manage')) {
        for (const action of ['list', 'create', 'edit', 'delete']) result.add(`categories-${action}`);
    }
    if (result.has('store.themes.manage')) result.add('store.menus.manage');
    return [...result];
}
